"""Persist deterministic E2E workflow graph fixtures."""

from __future__ import annotations

from course_flow.core.enum import WorkflowType
from course_flow.core.hierarchy import child_node_type_value_for_workflow
from course_flow.core.models import (
    Channel,
    Edge,
    Graph,
    Node,
    Outcome,
    Project,
    Section,
    Thread,
    User,
    Workflow,
)
from course_flow.e2e_seed.graph_shape import (
    GraphLayoutPlan,
    GraphShapeParams,
    generate_edge_pairs,
    generate_graph_layout,
)
from course_flow.e2e_seed.rng import SeededRNG


def _thread() -> Thread:
    return Thread.objects.create()


def build_workflow_with_graph(
    graph: Graph,
    *,
    author: User,
    project: Project | None,
    workflow_type: WorkflowType,
    title: str,
    description: str,
) -> Workflow:
    return Workflow.objects.create(
        graph=graph,
        author=author,
        project=project,
        title=title,
        description=description,
        workflow_type=workflow_type,
    )


def build_sections_and_channels(
    graph: Graph,
    *,
    section_titles: list[str],
    channel_titles: list[str],
) -> tuple[list[Section], list[Channel]]:
    sections: list[Section] = []
    for i, title in enumerate(section_titles):
        th = _thread()
        sections.append(
            Section.objects.create(
                graph=graph,
                title=title,
                position=i,
                thread=th,
            )
        )

    channels: list[Channel] = []
    for j, title in enumerate(channel_titles):
        th = _thread()
        channels.append(
            Channel.objects.create(
                graph=graph,
                title=title,
                position=j,
                thread=th,
            )
        )
    return sections, channels


def build_nodes_from_layout(
    graph: Graph,
    sections: list[Section],
    channels: list[Channel],
    layout: GraphLayoutPlan,
) -> list[Node]:
    """Create nodes in the same global order as ``iter_layout_node_meta``."""
    workflow = graph.workflow
    nodes: list[Node] = []
    for si, sec in enumerate(layout.sections):
        section = sections[si]
        for ch_idx, row in sorted(sec.placements, key=lambda t: (t[1], t[0])):
            channel = channels[ch_idx]
            nodes.append(
                Node.objects.create(
                    section=section,
                    channel=channel,
                    section_row=row,
                    workflow=workflow,
                    node_type=child_node_type_value_for_workflow(workflow.workflow_type),
                    thread=Thread.objects.create(),
                )
            )
    return nodes


def persist_edges_from_pairs(
    nodes: list[Node],
    pairs: list[tuple[int, int]],
) -> list[Edge]:
    if not pairs:
        return []
    edges = [
        Edge(
            source_node=nodes[s],
            target_node=nodes[t],
            line_type="",
            source_port="1",
            target_port="1",
        )
        for s, t in pairs
    ]
    Edge.objects.bulk_create(edges)
    return edges


def build_outcomes(
    graph: Graph,
    nodes: list[Node],
    *,
    outcome_count: int,
) -> list[Outcome]:
    if outcome_count <= 0 or not nodes:
        return []

    outcomes: list[Outcome] = []
    take = min(outcome_count, len(nodes))
    chosen = nodes[:take]
    for order, _ in enumerate(chosen):
        th = _thread()
        o = Outcome.objects.create(graph=graph, thread=th, order=order)
        outcomes.append(o)

    for node, out in zip(chosen, outcomes, strict=True):
        node.outcomes.add(out)

    return outcomes


def generate_graph_shape(
    rng: SeededRNG,
    shape: GraphShapeParams,
) -> tuple[GraphLayoutPlan, list[tuple[int, int]]]:
    """
    Deterministic layout + edge list for one graph.

    Returns the layout plan and global edge index pairs (into the node list
    produced from the layout).
    """
    layout = generate_graph_layout(rng, shape)
    pairs = generate_edge_pairs(
        rng,
        layout,
        max_cross_section_edges=shape.max_cross_section_edges,
    )
    return layout, pairs
