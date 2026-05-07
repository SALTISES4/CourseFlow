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
