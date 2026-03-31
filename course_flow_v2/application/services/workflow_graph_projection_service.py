from __future__ import annotations

from uuid import UUID

from django.db.models import Count, Q

from course_flow_v2.core.models import Comment, Edge, Node, Outcome, Workflow


class WorkflowGraphProjectionService:
    """
    Bounded read-model assembly for ``GET /workflows/{uuid}/graph``.

    Loads workflow metadata, channels, sections, nodes, edges, and thread comment
    summaries in separate queries (no recursive ORM trees, no mega-join).
    """

    def get_by_workflow_uuid(self, workflow_uuid: UUID) -> dict | None:
        try:
            w = Workflow.objects.select_related("unit", "project").get(
                uuid=workflow_uuid
            )
        except Workflow.DoesNotExist:
            return None

        unit = getattr(w, "unit", None)

        sections = list(w.sections.all().order_by("position", "id"))
        channels = list(w.channels.all().order_by("position", "id"))

        node_qs = (
            Node.objects.filter(
                Q(section__workflow_id=w.id) | Q(channel__workflow_id=w.id),
            )
            .select_related("section", "channel", "unit", "thread")
            .prefetch_related("outcomes")
            .order_by("section_id", "channel_id", "section_row", "id")
        )
        nodes = list(node_qs)
        node_ids = {n.id for n in nodes}

        edges_qs = Edge.objects.filter(
            source_node_id__in=node_ids,
            target_node_id__in=node_ids,
        ).select_related("source_node", "target_node")
        edges = list(edges_qs)

        thread_uuids: list[UUID] = []
        seen_thread: set[UUID] = set()

        def add_thread(t) -> None:
            if t is None:
                return
            tu = t.uuid
            if tu not in seen_thread:
                seen_thread.add(tu)
                thread_uuids.append(tu)

        for s in sections:
            add_thread(s.thread)
        for c in channels:
            add_thread(c.thread)
        for n in nodes:
            add_thread(n.thread)

        for o in Outcome.objects.filter(workflow=w).select_related("thread"):
            add_thread(o.thread)

        comment_counts = {tu: 0 for tu in thread_uuids}
        if thread_uuids:
            for row in (
                Comment.objects.filter(thread__uuid__in=thread_uuids)
                .values("thread__uuid")
                .annotate(comment_count=Count("id"))
            ):
                comment_counts[row["thread__uuid"]] = row["comment_count"]

        return {
            "workflow": {
                "uuid": w.uuid,
                "title": w.title,
                "owner_id": w.owner_id,
                "project_id": w.project_id,
                "revision_id": w.revision_id,
                "date_created": w.date_created,
                "modified_on": w.modified_on,
                "root_unit_uuid": unit.uuid if unit is not None else None,
                "root_unit_type": unit.unit_type if unit is not None else None,
                "root_unit_title": unit.title if unit is not None else "",
            },
            "sections": [
                {
                    "uuid": s.uuid,
                    "workflow_uuid": w.uuid,
                    "title": s.title,
                    "position": s.position,
                    "thread_uuid": s.thread.uuid if s.thread_id else None,
                }
                for s in sections
            ],
            "channels": [
                {
                    "uuid": c.uuid,
                    "workflow_uuid": w.uuid,
                    "title": c.title,
                    "position": c.position,
                    "thread_uuid": c.thread.uuid if c.thread_id else None,
                }
                for c in channels
            ],
            "nodes": [
                {
                    "uuid": n.uuid,
                    "section_uuid": n.section.uuid if n.section_id else None,
                    "channel_uuid": n.channel.uuid if n.channel_id else None,
                    "section_row": n.section_row,
                    "unit_uuid": n.unit.uuid if n.unit_id else None,
                    "thread_uuid": n.thread.uuid if n.thread_id else None,
                    "outcome_uuids": [o.uuid for o in n.outcomes.all()],
                }
                for n in nodes
            ],
            "edges": [
                {
                    "id": e.id,
                    "source_node_uuid": e.source_node.uuid,
                    "target_node_uuid": e.target_node.uuid,
                    "line_type": e.line_type,
                    "source_port": e.source_port,
                    "target_port": e.target_port,
                }
                for e in edges
            ],
            "thread_comment_counts": [
                {"thread_uuid": tu, "comment_count": comment_counts.get(tu, 0)}
                for tu in thread_uuids
            ],
        }
