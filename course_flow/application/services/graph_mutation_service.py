"""
Graph-affecting mutations: cascades, revision bump, delta envelope (graph aggregate root).
"""

from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from django.db import transaction
from django.db.models import F, Q

from course_flow.application.graph_mutation_delta import (
    GraphMutationDeltaBuilder,
)
from course_flow.core.models import (
    Channel,
    Edge,
    Graph,
    Node,
    Section,
    Workflow,
)

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


def _node_payload(n: Node) -> dict:
    return {
        "uuid": n.uuid,
        "section_uuid": n.section.uuid if n.section_id else None,
        "channel_uuid": n.channel.uuid if n.channel_id else None,
        "section_row": n.section_row,
        "workflow_uuid": n.workflow.uuid if n.workflow_id else None,
        "thread_uuid": n.thread.uuid if n.thread_id else None,
        "outcome_uuids": [o.uuid for o in n.outcomes.all()],
    }


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

        n = Node.objects.create(
            section=section,
            channel=channel,
            section_row=section_row,
            workflow=workflow_row,
        )
        n = (
            Node.objects.select_related("section", "channel", "workflow", "thread")
            .prefetch_related("outcomes")
            .get(pk=n.pk)
        )

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
