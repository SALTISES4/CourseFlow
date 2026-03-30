"""Graph-affecting mutations: cascades, revision bump, delta envelope (workflow aggregate root)."""

from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from django.db import transaction
from django.db.models import F, Q

from course_flow_v2.application.graph_mutation_delta import (
    GraphMutationDeltaBuilder,
)
from course_flow_v2.core.models import (
    Channel,
    Edge,
    Node,
    Section,
    Unit,
    Workflow,
)

MutationError = Literal["not_found", "forbidden", "bad_request"]


def _node_in_workflow(node: Node, workflow_pk: int) -> bool:
    if node.section_id and node.section.workflow_id == workflow_pk:
        return True
    if node.channel_id and node.channel.workflow_id == workflow_pk:
        return True
    return False


def _node_payload(n: Node) -> dict:
    return {
        "uuid": n.uuid,
        "section_uuid": n.section.uuid if n.section_id else None,
        "channel_uuid": n.channel.uuid if n.channel_id else None,
        "section_row": n.section_row,
        "unit_uuid": n.unit.uuid if n.unit_id else None,
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


def _bump_revision(wf: Workflow) -> None:
    Workflow.objects.filter(pk=wf.pk).update(revision_id=F("revision_id") + 1)
    wf.refresh_from_db(fields=["revision_id", "modified_on"])


class WorkflowGraphMutationService:
    def _lock_workflow(
        self,
        workflow_uuid: UUID,
        user_id: int,
    ) -> tuple[Workflow | None, MutationError | None]:
        wf = (
            Workflow.objects.select_for_update()
            .filter(uuid=workflow_uuid)
            .first()
        )
        if wf is None:
            return None, "not_found"
        if wf.owner_id != user_id:
            return None, "forbidden"
        return wf, None

    @transaction.atomic
    def delete_node(
        self,
        *,
        workflow_uuid: UUID,
        user_id: int,
        node_uuid: UUID,
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_workflow(workflow_uuid, user_id)
        if err:
            return None, err

        node = (
            Node.objects.filter(uuid=node_uuid)
            .select_related("section", "channel", "unit", "thread")
            .first()
        )
        if node is None or not _node_in_workflow(node, wf.id):
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
        _bump_revision(wf)

        env = builder.build_envelope(
            workflow_uuid=wf.uuid,
            revision_id=wf.revision_id,
            triggered_by="delete_node",
            trigger_entity_id=str(node_uuid),
        )
        return env, None

    @transaction.atomic
    def create_edge(
        self,
        *,
        workflow_uuid: UUID,
        user_id: int,
        source_node_uuid: UUID,
        target_node_uuid: UUID,
        line_type: str = "",
        source_port: str = "",
        target_port: str = "",
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_workflow(workflow_uuid, user_id)
        if err:
            return None, err

        sn = (
            Node.objects.filter(uuid=source_node_uuid)
            .select_related("section", "channel")
            .first()
        )
        tn = (
            Node.objects.filter(uuid=target_node_uuid)
            .select_related("section", "channel")
            .first()
        )
        if sn is None or tn is None:
            return None, "bad_request"
        if not _node_in_workflow(sn, wf.id) or not _node_in_workflow(tn, wf.id):
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
            workflow_uuid=wf.uuid,
            revision_id=wf.revision_id,
            triggered_by="create_edge",
            trigger_entity_id=str(e.id),
        )
        return env, None

    @transaction.atomic
    def delete_edge(
        self,
        *,
        workflow_uuid: UUID,
        user_id: int,
        edge_id: int,
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_workflow(workflow_uuid, user_id)
        if err:
            return None, err

        e = (
            Edge.objects.filter(pk=edge_id)
            .select_related("source_node__section", "source_node__channel", "target_node__section", "target_node__channel")
            .first()
        )
        if e is None:
            return None, "not_found"
        if not _node_in_workflow(e.source_node, wf.id) or not _node_in_workflow(
            e.target_node,
            wf.id,
        ):
            return None, "not_found"

        builder = GraphMutationDeltaBuilder()
        builder.add_edge_deleted(e.id)
        eid_str = str(e.id)
        e.delete()
        _bump_revision(wf)

        env = builder.build_envelope(
            workflow_uuid=wf.uuid,
            revision_id=wf.revision_id,
            triggered_by="delete_edge",
            trigger_entity_id=eid_str,
        )
        return env, None

    @transaction.atomic
    def create_node(
        self,
        *,
        workflow_uuid: UUID,
        user_id: int,
        section_uuid: UUID | None,
        channel_uuid: UUID | None,
        section_row: int | None,
        unit_uuid: UUID | None,
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_workflow(workflow_uuid, user_id)
        if err:
            return None, err

        section = None
        channel = None
        if section_uuid is not None:
            section = Section.objects.filter(
                uuid=section_uuid,
                workflow_id=wf.id,
            ).first()
            if section is None:
                return None, "bad_request"
        if channel_uuid is not None:
            channel = Channel.objects.filter(
                uuid=channel_uuid,
                workflow_id=wf.id,
            ).first()
            if channel is None:
                return None, "bad_request"

        unit = None
        if unit_uuid is not None:
            unit = Unit.objects.filter(
                uuid=unit_uuid,
                workflow_id=wf.id,
            ).first()
            if unit is None:
                return None, "bad_request"

        if section is None and channel is None:
            return None, "bad_request"

        n = Node.objects.create(
            section=section,
            channel=channel,
            section_row=section_row,
            unit=unit,
        )
        n = (
            Node.objects.filter(pk=n.pk)
            .select_related("section", "channel", "unit", "thread")
            .prefetch_related("outcomes")
            .first()
        )
        assert n is not None
        builder = GraphMutationDeltaBuilder()
        builder.add_node_created(_node_payload(n))
        _bump_revision(wf)

        env = builder.build_envelope(
            workflow_uuid=wf.uuid,
            revision_id=wf.revision_id,
            triggered_by="create_node",
            trigger_entity_id=str(n.uuid),
        )
        return env, None

    @transaction.atomic
    def update_node(
        self,
        *,
        workflow_uuid: UUID,
        user_id: int,
        node_uuid: UUID,
        patch: dict[str, Any],
    ) -> tuple[dict | None, MutationError | None]:
        wf, err = self._lock_workflow(workflow_uuid, user_id)
        if err:
            return None, err

        n = (
            Node.objects.filter(uuid=node_uuid)
            .select_related("section", "channel", "unit", "thread")
            .first()
        )
        if n is None or not _node_in_workflow(n, wf.id):
            return None, "not_found"

        if "section_uuid" in patch:
            v = patch["section_uuid"]
            if v is None:
                n.section = None
            else:
                section = Section.objects.filter(
                    uuid=v,
                    workflow_id=wf.id,
                ).first()
                if section is None:
                    return None, "bad_request"
                n.section = section

        if "channel_uuid" in patch:
            v = patch["channel_uuid"]
            if v is None:
                n.channel = None
            else:
                channel = Channel.objects.filter(
                    uuid=v,
                    workflow_id=wf.id,
                ).first()
                if channel is None:
                    return None, "bad_request"
                n.channel = channel

        if "unit_uuid" in patch:
            v = patch["unit_uuid"]
            if v is None:
                n.unit = None
            else:
                unit = Unit.objects.filter(uuid=v, workflow_id=wf.id).first()
                if unit is None:
                    return None, "bad_request"
                n.unit = unit

        if "section_row" in patch:
            n.section_row = patch["section_row"]

        n.save()
        n = (
            Node.objects.filter(pk=n.pk)
            .select_related("section", "channel", "unit", "thread")
            .prefetch_related("outcomes")
            .first()
        )
        assert n is not None
        if n.section_id is None and n.channel_id is None:
            return None, "bad_request"

        builder = GraphMutationDeltaBuilder()
        builder.add_node_updated(_node_payload(n))
        _bump_revision(wf)

        env = builder.build_envelope(
            workflow_uuid=wf.uuid,
            revision_id=wf.revision_id,
            triggered_by="update_node",
            trigger_entity_id=str(node_uuid),
        )
        return env, None
