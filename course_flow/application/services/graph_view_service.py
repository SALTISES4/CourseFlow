from __future__ import annotations

from uuid import UUID

from django.db.models import Count, Q

from course_flow.core.models import Comment, Edge, Graph, Node, Outcome, Thread
from course_flow.core.node_meta import read_node_meta_fields


class GraphViewService:
    """
    Bounded read-model assembly for ``GET /graph/{uuid}/view``.

    Loads graph metadata, channels, sections, nodes, edges, and thread comment
    summaries in separate queries (no recursive ORM trees, no mega-join).
    """

    def get_by_graph_uuid(self, graph_uuid: UUID) -> dict | None:
        try:
            w = Graph.objects.select_related("workflow").get(uuid=graph_uuid)
        except Graph.DoesNotExist:
            return None

        workflow = w.workflow

        sections = list(w.sections.all().order_by("position", "id"))
        channels = list(w.channels.all().order_by("position", "id"))

        node_qs = (
            Node.objects.filter(
                Q(section__graph_id=w.id) | Q(channel__graph_id=w.id),
            )
            .select_related(
                "section",
                "channel",
                "workflow",
                "linked_workflow",
                "thread",
                "activitymeta",
                "coursemeta",
                "taskmeta",
            )
            .prefetch_related("outcomes", "tags")
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

        outcome_rows = list(
            Outcome.objects.filter(graph=w)
            .select_related("parent", "thread")
            .prefetch_related("tags")
            .order_by("parent_id", "order", "id")
        )
        for o in outcome_rows:
            add_thread(o.thread)

        comment_counts = {tu: 0 for tu in thread_uuids}
        if thread_uuids:
            uuid_to_tid = dict(
                Thread.objects.filter(uuid__in=thread_uuids).values_list("uuid", "id")
            )
            thread_ids = list(uuid_to_tid.values())
            tid_to_uuid = {tid: tu for tu, tid in uuid_to_tid.items()}
            if thread_ids:
                for row in (
                    Comment.objects.filter(thread_id__in=thread_ids)
                    .values("thread_id")
                    .annotate(comment_count=Count("id"))
                ):
                    tu = tid_to_uuid[row["thread_id"]]
                    comment_counts[tu] = row["comment_count"]

        return {
            "graph": {
                "uuid": w.uuid,
                "workflow_title": workflow.title,
                "author_id": workflow.author_id,
                "workflow_project_id": workflow.project_id,
                "revision_id": w.revision_id,
                "date_created": w.date_created,
                "modified_on": w.modified_on,
                "root_workflow_uuid": workflow.uuid,
                "root_workflow_type": workflow.workflow_type,
                "root_workflow_title": workflow.title,
            },
            "sections": [
                {
                    "uuid": s.uuid,
                    "graph_uuid": w.uuid,
                    "title": s.title,
                    "title_copy_count": s.title_copy_count,
                    "position": s.position,
                    "thread_uuid": s.thread.uuid if s.thread_id else None,
                }
                for s in sections
            ],
            "channels": [
                {
                    "uuid": c.uuid,
                    "graph_uuid": w.uuid,
                    "title": c.title,
                    "system_label_code": c.system_label_code,
                    "title_copy_count": c.title_copy_count,
                    "colour": c.colour or "",
                    "position": c.position,
                    "thread_uuid": c.thread.uuid if c.thread_id else None,
                }
                for c in channels
            ],
            "nodes": [
                {
                    "uuid": n.uuid,
                    "node_type": n.node_type,
                    "title": n.title or "",
                    "title_copy_count": n.title_copy_count,
                    "description": n.description or "",
                    **read_node_meta_fields(n),
                    "tag_ids": list(n.tags.values_list("id", flat=True)),
                    "section_uuid": n.section.uuid if n.section_id else None,
                    "channel_uuid": n.channel.uuid if n.channel_id else None,
                    "section_row": n.section_row,
                    "workflow_uuid": n.workflow.uuid if n.workflow_id else None,
                    "linked_workflow_uuid": (
                        n.linked_workflow.uuid if n.linked_workflow_id else None
                    ),
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
                    "title": e.title or "",
                    "text_position": e.text_position,
                    "line_type": e.line_type,
                    "source_port": e.source_port,
                    "target_port": e.target_port,
                }
                for e in edges
            ],
            "outcomes": [
                {
                    "uuid": o.uuid,
                    "graph_uuid": w.uuid,
                    "parent_uuid": o.parent.uuid if o.parent_id else None,
                    "order": o.order,
                    "title": o.title or "",
                    "title_copy_count": o.title_copy_count,
                    "description": o.description or "",
                    "code": o.code or "",
                    "tag_ids": list(o.tags.values_list("id", flat=True)),
                    "thread_uuid": o.thread.uuid if o.thread_id else None,
                }
                for o in outcome_rows
            ],
            "thread_comment_counts": [
                {"thread_uuid": tu, "comment_count": comment_counts.get(tu, 0)}
                for tu in thread_uuids
            ],
        }
