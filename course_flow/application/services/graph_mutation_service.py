"""
Graph-affecting mutations: cascades, revision bump, delta envelope (graph aggregate root).
"""

from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from django.db import transaction
from django.db.models import F, Q

from course_flow.api.permissions import can_view_graph
from course_flow.application.graph_mutation_delta import (
    GraphMutationDeltaBuilder,
)
from course_flow.application.node_grid import (
    DropEdge,
    GridNode,
    InsertMode,
    apply_delete_collapse,
    apply_insert_reflow,
    apply_move_reflow,
    resolve_target_row,
)
from course_flow.core.hierarchy import child_node_type_value_for_workflow
from course_flow.core.models import (
    Channel,
    Edge,
    Graph,
    Node,
    Outcome,
    Section,
    Tag,
    User,
    Workflow,
)
from course_flow.core.models.thread import Thread

MutationError = Literal["not_found", "forbidden", "bad_request"]


def graph_from_node(node: Node) -> Graph | None:
    """
    Owning graph for a node placed in a section or channel grid.
    """
    if node.section_id:
        if node.section is None:
            node = Node.objects.select_related("section__graph").get(pk=node.pk)
        return node.section.graph

    if node.channel_id:
        if node.channel is None:
            node = Node.objects.select_related("channel__graph").get(pk=node.pk)
        return node.channel.graph

    return None


def _node_in_graph(node: Node, graph_pk: int) -> bool:
    if node.section_id and node.section.graph_id == graph_pk:
        return True

    if node.channel_id and node.channel.graph_id == graph_pk:
        return True

    return False


def _node_tag_ids(n: Node) -> list[int]:
    return list(n.tags.values_list("id", flat=True))


def _node_payload(n: Node) -> dict:
    time_required = n.time_required
    return {
        "uuid": n.uuid,
        "node_type": n.node_type,
        "title": n.title or "",
        "description": n.description or "",
        "context_classification": n.context_classification,
        "task_classification": n.task_classification,
        "time_required": float(time_required) if time_required is not None else None,
        "time_units": n.time_units,
        "represents_workflow": n.represents_workflow,
        "tag_ids": _node_tag_ids(n),
        "section_uuid": n.section.uuid if n.section_id else None,
        "channel_uuid": n.channel.uuid if n.channel_id else None,
        "section_row": n.section_row,
        "workflow_uuid": n.workflow.uuid if n.workflow_id else None,
        "thread_uuid": n.thread.uuid if n.thread_id else None,
        "outcome_uuids": [o.uuid for o in n.outcomes.all()],
    }


def _create_grid_node(
    *,
    section: Section,
    channel: Channel,
    section_row: int,
    workflow: Workflow,
    root_workflow_type: str,
    node_type: str | None = None,
) -> Node:
    resolved_type = node_type or child_node_type_value_for_workflow(root_workflow_type)
    return Node.objects.create(
        section=section,
        channel=channel,
        section_row=section_row,
        workflow=workflow,
        node_type=resolved_type,
        thread=Thread.objects.create(),
    )


def _edge_payload(e: Edge) -> dict:
    return {
        "id": e.id,
        "source_node_uuid": e.source_node.uuid,
        "target_node_uuid": e.target_node.uuid,
        "line_type": e.line_type,
        "source_port": e.source_port,
        "target_port": e.target_port,
    }


def _channel_payload(ch: Channel) -> dict:
    return {
        "uuid": ch.uuid,
        "graph_uuid": ch.graph.uuid,
        "title": ch.title,
        "position": ch.position,
        "thread_uuid": ch.thread.uuid if ch.thread_id else None,
    }


def _section_payload(sec: Section) -> dict:
    return {
        "uuid": sec.uuid,
        "graph_uuid": sec.graph.uuid,
        "title": sec.title,
        "position": sec.position,
        "thread_uuid": sec.thread.uuid if sec.thread_id else None,
    }


def _bump_revision(wf: Graph) -> None:
    Graph.objects.filter(pk=wf.pk).update(revision_id=F("revision_id") + 1)
    wf.refresh_from_db(fields=["revision_id", "modified_on"])


class GraphMutationService:
    def _lock_graph(
        self,
        graph_uuid: UUID,
        user_id: int,
    ) -> tuple[Graph | None, MutationError | None]:
        try:
            wf = (
                Graph.objects.select_for_update(of=("self",))
                .select_related("workflow")
                .get(uuid=graph_uuid)
            )
        except Graph.DoesNotExist:
            return None, "not_found"

        if wf.workflow.author_id != user_id:
            return None, "forbidden"

        return wf, None

    @transaction.atomic
    def delete_node(
        self,
        *,
        user_id: int,
        node_uuid: UUID,
    ) -> tuple[dict | None, MutationError | None]:
        try:
            node = Node.objects.select_related(
                "section__graph",
                "channel__graph",
                "workflow",
                "thread",
            ).get(uuid=node_uuid)
        except Node.DoesNotExist:
            return None, "not_found"

        wf = graph_from_node(node)

        if wf is None:
            return None, "bad_request"

        try:
            wf_locked = (
                Graph.objects.select_for_update(of=("self",))
                .select_related("workflow")
                .get(pk=wf.pk)
            )
        except Graph.DoesNotExist:
            return None, "not_found"

        if wf_locked.workflow.author_id != user_id:
            return None, "forbidden"
        try:
            node = (
                Node.objects.select_related("section", "channel", "workflow", "thread")
                .get(uuid=node_uuid)
            )
        except Node.DoesNotExist:
            return None, "not_found"

        if not _node_in_graph(node, wf_locked.id):
            return None, "not_found"

        builder = GraphMutationDeltaBuilder()
        deleted_grid = GridNode.from_node(node)
        section_siblings = [
            GridNode.from_node(n)
            for n in Node.objects.filter(section_id=node.section_id).exclude(
                pk=node.pk
            )
        ]
        for gn in apply_delete_collapse(deleted_grid, section_siblings):
            gn.instance.section_row = gn.section_row
            gn.instance.save(update_fields=["section_row"])
            builder.add_node_updated(_node_payload(self._reload_node(gn.instance.pk)))

        edge_ids = list(
            Edge.objects.filter(
                Q(source_node_id=node.id) | Q(target_node_id=node.id),
            ).values_list("id", flat=True),
        )

        for eid in edge_ids:
            builder.add_edge_deleted(eid)

        builder.add_node_deleted(node.uuid)
        node.delete()
        _bump_revision(wf_locked)

        env = builder.build_envelope(
            graph_uuid=wf_locked.uuid,
            revision_id=wf_locked.revision_id,
            triggered_by="delete_node",
            trigger_entity_id=str(node_uuid),
        )

        return env, None

    @transaction.atomic
    def delete_channel(
        self,
        *,
        user_id: int,
        channel_uuid: UUID,
    ) -> tuple[dict | None, MutationError | None]:
        try:
            channel = Channel.objects.select_related("graph", "thread").get(
                uuid=channel_uuid
            )
        except Channel.DoesNotExist:
            return None, "not_found"

        try:
            wf_locked = (
                Graph.objects.select_for_update(of=("self",))
                .select_related("workflow")
                .get(pk=channel.graph_id)
            )
        except Graph.DoesNotExist:
            return None, "not_found"

        if wf_locked.workflow.author_id != user_id:
            return None, "forbidden"

        if channel.graph_id != wf_locked.id:
            return None, "not_found"

        node_rows = list(
            Node.objects.filter(channel_id=channel.id).values_list("id", "uuid")
        )
        node_pks = [pk for pk, _ in node_rows]
        node_uuids = [nu for _, nu in node_rows]

        edge_ids: list[int] = []
        if node_pks:
            edge_ids = list(
                Edge.objects.filter(
                    Q(source_node_id__in=node_pks) | Q(target_node_id__in=node_pks),
                ).values_list("id", flat=True)
            )

        builder = GraphMutationDeltaBuilder()
        builder.add_channel_deleted(channel.uuid)
        for node_uuid in node_uuids:
            builder.add_node_deleted(node_uuid)
        for edge_id in edge_ids:
            builder.add_edge_deleted(edge_id)

        channel.delete()
        _bump_revision(wf_locked)

        env = builder.build_envelope(
            graph_uuid=wf_locked.uuid,
            revision_id=wf_locked.revision_id,
            triggered_by="delete_channel",
            trigger_entity_id=str(channel_uuid),
        )
        return env, None

    @transaction.atomic
    def delete_section(
        self,
        *,
        user_id: int,
        section_uuid: UUID,
    ) -> tuple[dict | None, MutationError | None]:
        try:
            section = Section.objects.select_related("graph", "thread").get(
                uuid=section_uuid
            )
        except Section.DoesNotExist:
            return None, "not_found"

        try:
            wf_locked = (
                Graph.objects.select_for_update(of=("self",))
                .select_related("workflow")
                .get(pk=section.graph_id)
            )
        except Graph.DoesNotExist:
            return None, "not_found"

        if wf_locked.workflow.author_id != user_id:
            return None, "forbidden"

        if section.graph_id != wf_locked.id:
            return None, "not_found"

        node_rows = list(
            Node.objects.filter(section_id=section.id).values_list("id", "uuid")
        )
        node_pks = [pk for pk, _ in node_rows]
        node_uuids = [nu for _, nu in node_rows]

        edge_ids: list[int] = []
        if node_pks:
            edge_ids = list(
                Edge.objects.filter(
                    Q(source_node_id__in=node_pks) | Q(target_node_id__in=node_pks),
                ).values_list("id", flat=True)
            )

        builder = GraphMutationDeltaBuilder()
        builder.add_section_deleted(section.uuid)
        for node_uuid in node_uuids:
            builder.add_node_deleted(node_uuid)
        for edge_id in edge_ids:
            builder.add_edge_deleted(edge_id)

        section.delete()
        _bump_revision(wf_locked)

        env = builder.build_envelope(
            graph_uuid=wf_locked.uuid,
            revision_id=wf_locked.revision_id,
            triggered_by="delete_section",
            trigger_entity_id=str(section_uuid),
        )
        return env, None

    @transaction.atomic
    def insert_channel_below(
        self,
        *,
        graph_uuid: UUID,
        user_id: int,
        channel_uuid: UUID | None = None,
        duplicate: bool = False,
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_graph(graph_uuid, user_id)
        if err:
            return None, err

        channels = list(
            Channel.objects.filter(graph_id=wf.id)
            .select_related("graph", "thread")
            .order_by("position", "id")
        )

        anchor: Channel | None = None
        if channel_uuid is not None:
            by_uuid = {ch.uuid: ch for ch in channels}
            anchor = by_uuid.get(channel_uuid)
            if anchor is None:
                return None, "not_found"
            insert_position = anchor.position + 1
        else:
            insert_position = (
                max((ch.position for ch in channels), default=-1) + 1
            )

        builder = GraphMutationDeltaBuilder()

        for ch in channels:
            if ch.position >= insert_position:
                ch.position += 1
                ch.save(update_fields=["position", "modified_on"])
                ch = Channel.objects.select_related("graph", "thread").get(pk=ch.pk)
                builder.add_channel_updated(_channel_payload(ch))

        if duplicate:
            source = anchor if anchor is not None else (channels[0] if channels else None)
            if source is None:
                title = " (copy)"
            else:
                source_title = (source.title or "").strip()
                title = f"{source_title} (copy)" if source_title else " (copy)"
        else:
            title = ""

        new_ch = Channel.objects.create(
            graph_id=wf.id,
            title=title,
            position=insert_position,
        )
        new_ch = Channel.objects.select_related("graph", "thread").get(pk=new_ch.pk)
        builder.add_channel_created(_channel_payload(new_ch))

        _bump_revision(wf)
        env = builder.build_envelope(
            graph_uuid=wf.uuid,
            revision_id=wf.revision_id,
            triggered_by="duplicate_channel_below" if duplicate else "insert_channel_below",
            trigger_entity_id=str(new_ch.uuid),
        )
        return env, None

    @transaction.atomic
    def reorder_channels(
        self,
        *,
        graph_uuid: UUID,
        user_id: int,
        channel_uuids: list[UUID],
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_graph(graph_uuid, user_id)
        if err:
            return None, err

        channels = list(
            Channel.objects.filter(graph_id=wf.id)
            .select_related("graph", "thread")
            .order_by("position", "id")
        )
        existing = {ch.uuid for ch in channels}
        if set(channel_uuids) != existing or len(channel_uuids) != len(existing):
            return None, "bad_request"

        by_uuid = {ch.uuid: ch for ch in channels}
        builder = GraphMutationDeltaBuilder()
        for position, channel_uuid in enumerate(channel_uuids):
            ch = by_uuid[channel_uuid]
            if ch.position != position:
                ch.position = position
                ch.save(update_fields=["position", "modified_on"])
                ch = Channel.objects.select_related("graph", "thread").get(pk=ch.pk)
                builder.add_channel_updated(_channel_payload(ch))

        _bump_revision(wf)
        env = builder.build_envelope(
            graph_uuid=wf.uuid,
            revision_id=wf.revision_id,
            triggered_by="reorder_channels",
            trigger_entity_id=str(graph_uuid),
        )
        return env, None

    @transaction.atomic
    def insert_section_below(
        self,
        *,
        graph_uuid: UUID,
        user_id: int,
        section_uuid: UUID,
        duplicate: bool = False,
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_graph(graph_uuid, user_id)
        if err:
            return None, err

        try:
            anchor = Section.objects.select_related("graph", "thread").get(
                uuid=section_uuid, graph_id=wf.id
            )
        except Section.DoesNotExist:
            return None, "not_found"

        insert_position = anchor.position + 1
        builder = GraphMutationDeltaBuilder()

        sections_to_shift = list(
            Section.objects.filter(graph_id=wf.id, position__gte=insert_position)
            .select_related("graph", "thread")
            .order_by("position", "id")
        )
        for sec in sections_to_shift:
            sec.position += 1
            sec.save(update_fields=["position", "modified_on"])
            sec = Section.objects.select_related("graph", "thread").get(pk=sec.pk)
            builder.add_section_updated(_section_payload(sec))

        if duplicate:
            source_title = (anchor.title or "").strip()
            title = f"{source_title} (copy)" if source_title else " (copy)"
        else:
            title = ""

        new_sec = Section.objects.create(
            graph_id=wf.id,
            title=title,
            position=insert_position,
        )
        new_sec = Section.objects.select_related("graph", "thread").get(pk=new_sec.pk)
        builder.add_section_created(_section_payload(new_sec))

        _bump_revision(wf)
        env = builder.build_envelope(
            graph_uuid=wf.uuid,
            revision_id=wf.revision_id,
            triggered_by="duplicate_section_below" if duplicate else "insert_section_below",
            trigger_entity_id=str(new_sec.uuid),
        )
        return env, None

    @transaction.atomic
    def reorder_sections(
        self,
        *,
        graph_uuid: UUID,
        user_id: int,
        section_uuids: list[UUID],
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_graph(graph_uuid, user_id)
        if err:
            return None, err

        sections = list(
            Section.objects.filter(graph_id=wf.id)
            .select_related("graph", "thread")
            .order_by("position", "id")
        )
        existing = {sec.uuid for sec in sections}
        if set(section_uuids) != existing or len(section_uuids) != len(existing):
            return None, "bad_request"

        by_uuid = {sec.uuid: sec for sec in sections}
        builder = GraphMutationDeltaBuilder()
        for position, section_uuid in enumerate(section_uuids):
            sec = by_uuid[section_uuid]
            if sec.position != position:
                sec.position = position
                sec.save(update_fields=["position", "modified_on"])
                sec = Section.objects.select_related("graph", "thread").get(pk=sec.pk)
                builder.add_section_updated(_section_payload(sec))

        _bump_revision(wf)
        env = builder.build_envelope(
            graph_uuid=wf.uuid,
            revision_id=wf.revision_id,
            triggered_by="reorder_sections",
            trigger_entity_id=str(graph_uuid),
        )
        return env, None

    @transaction.atomic
    def create_edge(
        self,
        *,
        graph_uuid: UUID,
        user_id: int,
        source_node_uuid: UUID,
        target_node_uuid: UUID,
        line_type: str = "",
        source_port: str = "",
        target_port: str = "",
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_graph(graph_uuid, user_id)

        if err:
            return None, err

        try:
            sn = Node.objects.select_related("section", "channel").get(
                uuid=source_node_uuid
            )
        except Node.DoesNotExist:
            return None, "bad_request"

        try:
            tn = Node.objects.select_related("section", "channel").get(
                uuid=target_node_uuid
            )
        except Node.DoesNotExist:
            return None, "bad_request"

        if not _node_in_graph(sn, wf.id) or not _node_in_graph(tn, wf.id):
            return None, "bad_request"

        e = Edge.objects.create(
            source_node=sn,
            target_node=tn,
            line_type=line_type,
            source_port=source_port,
            target_port=target_port,
        )
        e = Edge.objects.select_related("source_node", "target_node").get(pk=e.pk)

        builder = GraphMutationDeltaBuilder()
        builder.add_edge_created(_edge_payload(e))

        _bump_revision(wf)

        env = builder.build_envelope(
            graph_uuid=wf.uuid,
            revision_id=wf.revision_id,
            triggered_by="create_edge",
            trigger_entity_id=str(e.id),
        )
        return env, None

    @transaction.atomic
    def delete_edge(
        self,
        *,
        user_id: int,
        edge_id: int,
    ) -> tuple[dict | None, MutationError | None]:
        try:
            e = Edge.objects.select_related(
                "source_node__section__graph",
                "source_node__channel__graph",
                "target_node__section__graph",
                "target_node__channel__graph",
            ).get(pk=edge_id)
        except Edge.DoesNotExist:
            return None, "not_found"

        wf_s = graph_from_node(e.source_node)
        wf_t = graph_from_node(e.target_node)

        if (
            wf_s is None
            or wf_t is None
            or wf_s.pk != wf_t.pk
            or not _node_in_graph(e.source_node, wf_s.id)
            or not _node_in_graph(e.target_node, wf_s.id)
        ):
            return None, "not_found"

        try:
            wf_locked = (
                Graph.objects.select_for_update(of=("self",))
                .select_related("workflow")
                .get(pk=wf_s.pk)
            )
        except Graph.DoesNotExist:
            return None, "not_found"

        if wf_locked.workflow.author_id != user_id:
            return None, "forbidden"

        try:
            e = Edge.objects.select_related(
                "source_node__section",
                "source_node__channel",
                "target_node__section",
                "target_node__channel",
            ).get(pk=edge_id)

        except Edge.DoesNotExist:
            return None, "not_found"

        if not _node_in_graph(e.source_node, wf_locked.id) or not _node_in_graph(
            e.target_node,
            wf_locked.id,
        ):
            return None, "not_found"

        builder = GraphMutationDeltaBuilder()
        builder.add_edge_deleted(e.id)

        eid_str = str(e.id)
        e.delete()

        _bump_revision(wf_locked)

        env = builder.build_envelope(
            graph_uuid=wf_locked.uuid,
            revision_id=wf_locked.revision_id,
            triggered_by="delete_edge",
            trigger_entity_id=eid_str,
        )
        return env, None

    @transaction.atomic
    def create_node(
        self,
        *,
        graph_uuid: UUID,
        user_id: int,
        section_uuid: UUID,
        channel_uuid: UUID,
        section_row: int,
        workflow_uuid: UUID | None,
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_graph(graph_uuid, user_id)
        if err:
            return None, err

        try:
            section = Section.objects.get(uuid=section_uuid, graph_id=wf.id)
        except Section.DoesNotExist:
            return None, "bad_request"

        try:
            channel = Channel.objects.get(uuid=channel_uuid, graph_id=wf.id)
        except Channel.DoesNotExist:
            return None, "bad_request"

        workflow_row = wf.workflow
        if workflow_uuid is not None:
            try:
                workflow_row = Workflow.objects.get(uuid=workflow_uuid, graph_id=wf.id)
            except Workflow.DoesNotExist:
                return None, "bad_request"

        n = _create_grid_node(
            section=section,
            channel=channel,
            section_row=section_row,
            workflow=workflow_row,
            root_workflow_type=wf.workflow.workflow_type,
        )
        n = self._reload_node(n.pk)

        builder = GraphMutationDeltaBuilder()
        builder.add_node_created(_node_payload(n))

        _bump_revision(wf)

        env = builder.build_envelope(
            graph_uuid=wf.uuid,
            revision_id=wf.revision_id,
            triggered_by="create_node",
            trigger_entity_id=str(n.uuid),
        )
        return env, None

    @transaction.atomic
    def update_node(
        self,
        *,
        user_id: int,
        node_uuid: UUID,
        patch: dict[str, Any],
    ) -> tuple[dict | None, MutationError | None]:
        try:
            n = Node.objects.select_related(
                "section__graph",
                "channel__graph",
                "workflow",
                "thread",
            ).get(uuid=node_uuid)
        except Node.DoesNotExist:
            return None, "not_found"
        wf = graph_from_node(n)
        if wf is None:
            return None, "bad_request"
        try:
            wf_locked = (
                Graph.objects.select_for_update(of=("self",))
                .select_related("workflow")
                .get(pk=wf.pk)
            )
        except Graph.DoesNotExist:
            return None, "not_found"
        if wf_locked.workflow.author_id != user_id:
            return None, "forbidden"
        try:
            n = Node.objects.select_related(
                "section", "channel", "workflow", "thread"
            ).get(uuid=node_uuid)
        except Node.DoesNotExist:
            return None, "not_found"
        if not _node_in_graph(n, wf_locked.id):
            return None, "not_found"

        if "node_type" in patch:
            return None, "bad_request"

        for fk in ("section_uuid", "channel_uuid", "workflow_uuid"):
            if fk in patch and patch[fk] is None:
                return None, "bad_request"

        if "section_uuid" in patch:
            v = patch["section_uuid"]
            if v is None:
                n.section = None
            else:
                try:
                    section = Section.objects.get(uuid=v, graph_id=wf_locked.id)
                except Section.DoesNotExist:
                    return None, "bad_request"
                n.section = section

        if "channel_uuid" in patch:
            v = patch["channel_uuid"]
            if v is None:
                n.channel = None
            else:
                try:
                    channel = Channel.objects.get(uuid=v, graph_id=wf_locked.id)
                except Channel.DoesNotExist:
                    return None, "bad_request"
                n.channel = channel

        if "workflow_uuid" in patch:
            v = patch["workflow_uuid"]
            if v is None:
                n.workflow = None
            else:
                try:
                    workflow = Workflow.objects.get(uuid=v, graph_id=wf_locked.id)
                except Workflow.DoesNotExist:
                    return None, "bad_request"
                n.workflow = workflow

        if "section_row" in patch:
            n.section_row = patch["section_row"]

        n.save()
        n = (
            Node.objects.select_related("section", "channel", "workflow", "thread")
            .prefetch_related("outcomes")
            .get(pk=n.pk)
        )
        if n.section_id is None and n.channel_id is None:
            return None, "bad_request"

        builder = GraphMutationDeltaBuilder()
        builder.add_node_updated(_node_payload(n))
        _bump_revision(wf_locked)

        env = builder.build_envelope(
            graph_uuid=wf_locked.uuid,
            revision_id=wf_locked.revision_id,
            triggered_by="update_node",
            trigger_entity_id=str(node_uuid),
        )
        return env, None

    def _reload_node(self, node_pk: int) -> Node:
        return (
            Node.objects.select_related("section", "channel", "workflow", "thread")
            .prefetch_related("outcomes", "tags")
            .get(pk=node_pk)
        )

    @transaction.atomic
    def update_node_meta(
        self,
        *,
        user_id: int,
        node_uuid: UUID,
        patch: dict[str, Any],
    ) -> tuple[dict | None, MutationError | None]:
        try:
            n = Node.objects.select_related(
                "section__graph",
                "channel__graph",
            ).get(uuid=node_uuid)
        except Node.DoesNotExist:
            return None, "not_found"

        wf = graph_from_node(n)
        if wf is None:
            return None, "bad_request"

        try:
            wf_locked = (
                Graph.objects.select_for_update(of=("self",))
                .select_related("workflow")
                .get(pk=wf.pk)
            )
        except Graph.DoesNotExist:
            return None, "not_found"
        if wf_locked.workflow.author_id != user_id:
            return None, "forbidden"

        n = self._reload_node(n.pk)
        if not _node_in_graph(n, wf_locked.id):
            return None, "not_found"

        update_fields: list[str] = []

        if "title" in patch and patch["title"] is not None:
            n.title = patch["title"]
            update_fields.append("title")
        if "description" in patch and patch["description"] is not None:
            n.description = patch["description"]
            update_fields.append("description")
        if "context_classification" in patch:
            n.context_classification = patch["context_classification"]
            update_fields.append("context_classification")
        if "task_classification" in patch:
            n.task_classification = patch["task_classification"]
            update_fields.append("task_classification")
        if "time_required" in patch:
            n.time_required = patch["time_required"]
            update_fields.append("time_required")
        if "time_units" in patch:
            n.time_units = patch["time_units"]
            update_fields.append("time_units")
        if "represents_workflow" in patch and patch["represents_workflow"] is not None:
            n.represents_workflow = patch["represents_workflow"]
            update_fields.append("represents_workflow")

        if update_fields:
            n.save(update_fields=update_fields)

        if "tag_ids" in patch and patch["tag_ids"] is not None:
            tag_ids = patch["tag_ids"]
            if tag_ids:
                tags = list(Tag.objects.filter(id__in=tag_ids))
                if len(tags) != len(set(tag_ids)):
                    return None, "bad_request"
            else:
                tags = []
            n.tags.set(tags)

        n = self._reload_node(n.pk)

        builder = GraphMutationDeltaBuilder()
        builder.add_node_updated(_node_payload(n))
        _bump_revision(wf_locked)

        return (
            builder.build_envelope(
                graph_uuid=wf_locked.uuid,
                revision_id=wf_locked.revision_id,
                triggered_by="update_node_meta",
                trigger_entity_id=str(node_uuid),
            ),
            None,
        )

    def _persist_grid_nodes(
        self,
        builder: GraphMutationDeltaBuilder,
        grid_nodes: list[GridNode],
    ) -> None:
        for gn in grid_nodes:
            gn.instance.section_row = gn.section_row
            gn.instance.section_id = gn.section_id
            gn.instance.channel_id = gn.channel_id
            gn.instance.save(
                update_fields=[
                    "section_row",
                    "section_id",
                    "channel_id",
                ]
            )
            builder.add_node_updated(_node_payload(self._reload_node(gn.instance.pk)))

    def _copy_edges_to_node(
        self,
        builder: GraphMutationDeltaBuilder,
        *,
        source: Node,
        target: Node,
    ) -> None:
        incident = Edge.objects.filter(
            Q(source_node_id=source.id) | Q(target_node_id=source.id)
        )
        for edge in incident:
            src = target if edge.source_node_id == source.id else edge.source_node
            tgt = target if edge.target_node_id == source.id else edge.target_node
            new_edge = Edge.objects.create(
                source_node=src,
                target_node=tgt,
                line_type=edge.line_type,
                source_port=edge.source_port,
                target_port=edge.target_port,
            )
            builder.add_edge_created(_edge_payload(new_edge))

    @transaction.atomic
    def insert_node_below(
        self,
        *,
        graph_uuid: UUID,
        user_id: int,
        node_uuid: UUID,
        mode: InsertMode,
        duplicate: bool = False,
        edge: DropEdge | None = None,
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_graph(graph_uuid, user_id)
        if err:
            return None, err
        try:
            anchor = Node.objects.select_related(
                "section", "channel", "workflow", "thread"
            ).get(uuid=node_uuid)
        except Node.DoesNotExist:
            return None, "not_found"
        if anchor.section.graph_id != wf.id:
            return None, "not_found"

        builder = GraphMutationDeltaBuilder()
        new_row = anchor.section_row + 1
        section_nodes = [
            GridNode.from_node(n)
            for n in Node.objects.filter(section_id=anchor.section_id)
        ]
        channel_id = anchor.channel_id if mode == "column" else None
        bumped = apply_insert_reflow(
            section_nodes,
            new_row=new_row,
            mode=mode,
            channel_id=channel_id,
        )
        self._persist_grid_nodes(builder, bumped)

        workflow_row = anchor.workflow

        new_node = _create_grid_node(
            section=anchor.section,
            channel=anchor.channel,
            section_row=new_row,
            workflow=workflow_row,
            root_workflow_type=wf.workflow.workflow_type,
            node_type=anchor.node_type,
        )
        new_node = self._reload_node(new_node.pk)
        builder.add_node_created(_node_payload(new_node))

        if duplicate:
            self._copy_edges_to_node(builder, source=anchor, target=new_node)

        _bump_revision(wf)
        triggered = "duplicate_node_below" if duplicate else "insert_node_below"
        return (
            builder.build_envelope(
                graph_uuid=wf.uuid,
                revision_id=wf.revision_id,
                triggered_by=triggered,
                trigger_entity_id=str(new_node.uuid),
            ),
            None,
        )

    @transaction.atomic
    def place_node(
        self,
        *,
        graph_uuid: UUID,
        user_id: int,
        section_uuid: UUID,
        channel_uuid: UUID,
        row_hint: int,
        mode: InsertMode,
        edge: DropEdge | None = None,
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_graph(graph_uuid, user_id)
        if err:
            return None, err
        try:
            section = Section.objects.get(uuid=section_uuid, graph_id=wf.id)
            channel = Channel.objects.get(uuid=channel_uuid, graph_id=wf.id)
        except (Section.DoesNotExist, Channel.DoesNotExist):
            return None, "bad_request"

        new_row = resolve_target_row(mode=mode, row_hint=row_hint, edge=edge)
        section_nodes = [
            GridNode.from_node(n)
            for n in Node.objects.filter(section_id=section.id)
        ]
        channel_id = channel.id if mode == "column" else None
        bumped = apply_insert_reflow(
            section_nodes,
            new_row=new_row,
            mode=mode,
            channel_id=channel_id,
        )

        builder = GraphMutationDeltaBuilder()
        self._persist_grid_nodes(builder, bumped)

        new_node = _create_grid_node(
            section=section,
            channel=channel,
            section_row=new_row,
            workflow=wf.workflow,
            root_workflow_type=wf.workflow.workflow_type,
        )
        new_node = self._reload_node(new_node.pk)
        builder.add_node_created(_node_payload(new_node))
        _bump_revision(wf)

        return (
            builder.build_envelope(
                graph_uuid=wf.uuid,
                revision_id=wf.revision_id,
                triggered_by="place_node",
                trigger_entity_id=str(new_node.uuid),
            ),
            None,
        )

    @transaction.atomic
    def move_node_grid(
        self,
        *,
        user_id: int,
        node_uuid: UUID,
        to_section_uuid: UUID,
        to_channel_uuid: UUID,
        row_hint: int,
        mode: InsertMode,
        edge: DropEdge | None = None,
    ) -> tuple[dict | None, MutationError | None]:
        try:
            moved = Node.objects.select_related(
                "section__graph",
                "channel__graph",
                "workflow",
                "thread",
            ).get(uuid=node_uuid)
        except Node.DoesNotExist:
            return None, "not_found"
        wf = graph_from_node(moved)
        if wf is None:
            return None, "bad_request"

        wf_locked, err = self._lock_graph(wf.uuid, user_id)
        if err:
            return None, err

        try:
            to_section = Section.objects.get(uuid=to_section_uuid, graph_id=wf_locked.id)
            to_channel = Channel.objects.get(uuid=to_channel_uuid, graph_id=wf_locked.id)
        except (Section.DoesNotExist, Channel.DoesNotExist):
            return None, "bad_request"

        moved = self._reload_node(moved.pk)
        if not _node_in_graph(moved, wf_locked.id):
            return None, "not_found"

        from_section_id = moved.section_id
        all_in_from = [
            GridNode.from_node(n)
            for n in Node.objects.filter(section_id=from_section_id).exclude(
                pk=moved.pk
            )
        ]
        all_in_dest = (
            all_in_from
            if to_section.id == from_section_id
            else [
                GridNode.from_node(n)
                for n in Node.objects.filter(section_id=to_section.id).exclude(
                    pk=moved.pk
                )
            ]
        )

        moved_grid = GridNode.from_node(moved)
        updated = apply_move_reflow(
            moved_grid,
            to_section_id=to_section.id,
            to_channel_id=to_channel.id,
            row_hint=row_hint,
            mode=mode,
            edge=edge,
            section_nodes_excluding_moved=all_in_from,
            dest_section_nodes_excluding_moved=all_in_dest,
        )

        builder = GraphMutationDeltaBuilder()
        self._persist_grid_nodes(builder, updated)
        _bump_revision(wf_locked)

        return (
            builder.build_envelope(
                graph_uuid=wf_locked.uuid,
                revision_id=wf_locked.revision_id,
                triggered_by="move_node_grid",
                trigger_entity_id=str(node_uuid),
            ),
            None,
        )

    @transaction.atomic
    def link_node_workflow(
        self,
        *,
        user_id: int,
        node_uuid: UUID,
        workflow_uuid: UUID | None,
    ) -> tuple[dict | None, MutationError | None]:
        try:
            node = Node.objects.select_related(
                "section__graph",
                "channel__graph",
                "workflow__graph",
                "thread",
            ).get(uuid=node_uuid)
        except Node.DoesNotExist:
            return None, "not_found"

        wf = graph_from_node(node)
        if wf is None:
            return None, "bad_request"

        wf_locked, err = self._lock_graph(wf.uuid, user_id)
        if err:
            return None, err

        if not _node_in_graph(node, wf_locked.id):
            return None, "not_found"

        if workflow_uuid is None:
            target_workflow = wf_locked.workflow
        else:
            try:
                target_workflow = Workflow.objects.select_related("graph").get(
                    uuid=workflow_uuid
                )
            except Workflow.DoesNotExist:
                return None, "not_found"
            target_graph = target_workflow.graph
            current_user = User.objects.get(pk=user_id)
            if not can_view_graph(current_user=current_user, graph=target_graph):
                return None, "forbidden"

        node.workflow = target_workflow
        node.save(update_fields=["workflow_id"])
        node = self._reload_node(node.pk)

        builder = GraphMutationDeltaBuilder()
        builder.add_node_updated(_node_payload(node))
        _bump_revision(wf_locked)

        triggered = (
            "unlink_node_workflow" if workflow_uuid is None else "link_node_workflow"
        )
        return (
            builder.build_envelope(
                graph_uuid=wf_locked.uuid,
                revision_id=wf_locked.revision_id,
                triggered_by=triggered,
                trigger_entity_id=str(node_uuid),
            ),
            None,
        )

    def _prepare_node_outcome_mutation(
        self,
        *,
        user_id: int,
        node_uuid: UUID,
        outcome_uuid: UUID,
    ) -> tuple[Node | None, Graph | None, Outcome | None, MutationError | None]:
        try:
            node = Node.objects.select_related(
                "section__graph",
                "channel__graph",
            ).get(uuid=node_uuid)
        except Node.DoesNotExist:
            return None, None, None, "not_found"

        wf = graph_from_node(node)
        if wf is None:
            return None, None, None, "bad_request"

        wf_locked, err = self._lock_graph(wf.uuid, user_id)
        if err:
            return None, None, None, err

        if not _node_in_graph(node, wf_locked.id):
            return None, None, None, "not_found"

        try:
            outcome = Outcome.objects.get(uuid=outcome_uuid, graph_id=wf_locked.id)
        except Outcome.DoesNotExist:
            return None, None, None, "not_found"

        return node, wf_locked, outcome, None

    @transaction.atomic
    def link_node_outcome(
        self,
        *,
        user_id: int,
        node_uuid: UUID,
        outcome_uuid: UUID,
    ) -> tuple[dict | None, MutationError | None]:
        node, wf_locked, outcome, err = self._prepare_node_outcome_mutation(
            user_id=user_id,
            node_uuid=node_uuid,
            outcome_uuid=outcome_uuid,
        )
        if err or node is None or wf_locked is None or outcome is None:
            return None, err or "bad_request"

        n = self._reload_node(node.pk)
        if not n.outcomes.filter(pk=outcome.pk).exists():
            n.outcomes.add(outcome)
            n = self._reload_node(n.pk)

        builder = GraphMutationDeltaBuilder()
        builder.add_node_updated(_node_payload(n))
        _bump_revision(wf_locked)

        return (
            builder.build_envelope(
                graph_uuid=wf_locked.uuid,
                revision_id=wf_locked.revision_id,
                triggered_by="link_node_outcome",
                trigger_entity_id=str(node_uuid),
            ),
            None,
        )

    @transaction.atomic
    def unlink_node_outcome(
        self,
        *,
        user_id: int,
        node_uuid: UUID,
        outcome_uuid: UUID,
    ) -> tuple[dict | None, MutationError | None]:
        node, wf_locked, outcome, err = self._prepare_node_outcome_mutation(
            user_id=user_id,
            node_uuid=node_uuid,
            outcome_uuid=outcome_uuid,
        )
        if err or node is None or wf_locked is None or outcome is None:
            return None, err or "bad_request"

        n = self._reload_node(node.pk)
        if n.outcomes.filter(pk=outcome.pk).exists():
            n.outcomes.remove(outcome)
            n = self._reload_node(n.pk)

        builder = GraphMutationDeltaBuilder()
        builder.add_node_updated(_node_payload(n))
        _bump_revision(wf_locked)

        return (
            builder.build_envelope(
                graph_uuid=wf_locked.uuid,
                revision_id=wf_locked.revision_id,
                triggered_by="unlink_node_outcome",
                trigger_entity_id=str(node_uuid),
            ),
            None,
        )
