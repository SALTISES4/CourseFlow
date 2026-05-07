"""Persist graph graph: sections, channels, nodes, edges, light metadata."""

from __future__ import annotations

from course_flow.core.models import (
    Channel,
    Comment,
    Edge,
    Graph,
    Node,
    Outcome,
    Section,
    Thread,
    Workflow,
)
from course_flow.dev_seed.constants import DEV_SEED_TAG_LABEL_PREFIX
from course_flow.dev_seed.graph_shape import (
    GraphLayoutPlan,
    GraphShapeParams,
    generate_edge_pairs,
    generate_graph_layout,
)
from course_flow.dev_seed.rng import SeededRNG


def _thread() -> Thread:
    return Thread.objects.create()


def build_workflow_for_graph(
    graph: Graph,
    *,
    fake,
    rng: SeededRNG,
) -> Workflow:
    root_type = rng.choice(
        [Workflow.WorkflowType.PROGRAM, Workflow.WorkflowType.COURSE],
    )
    return Workflow.objects.create(
        graph=graph,
        title=fake.sentence(nb_words=4).rstrip("."),
        description=fake.text(max_nb_chars=200),
        workflow_type=root_type,
    )


def build_sections_and_channels(
    graph: Graph,
    *,
    fake,
    rng: SeededRNG,
    section_count: int,
    channel_count: int,
) -> tuple[list[Section], list[Channel]]:
    sections: list[Section] = []
    for i in range(section_count):
        th = _thread()
        sections.append(
            Section.objects.create(
                graph=graph,
                title=fake.sentence(nb_words=3).rstrip("."),
                position=i,
                thread=th,
            )
        )

    channels: list[Channel] = []
    for j in range(channel_count):
        th = _thread()
        channels.append(
            Channel.objects.create(
                graph=graph,
                title=fake.word().title() + " lane",
                position=j,
                thread=th,
            )
        )
    return sections, channels


def build_nodes_from_layout(
    sections: list[Section],
    channels: list[Channel],
    layout: GraphLayoutPlan,
) -> list[Node]:
    """Create nodes in the same global order as ``iter_layout_node_meta``."""
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
        )
        for s, t in pairs
    ]
    Edge.objects.bulk_create(edges)
    return edges


def build_outcomes(
    graph: Graph,
    nodes: list[Node],
    *,
    rng: SeededRNG,
    outcome_count: int,
) -> list[Outcome]:
    if outcome_count <= 0 or not nodes:
        return []

    outcomes: list[Outcome] = []
    take = min(outcome_count, len(nodes))
    chosen = nodes[:take]
    for _ in chosen:
        th = _thread()
        o = Outcome.objects.create(graph=graph, thread=th)
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


def add_light_comments(
    *,
    owner,
    sections: list[Section],
    rng: SeededRNG,
) -> int:
    if not sections:
        return 0
    n = min(2, len(sections))
    picked = rng.sample(sections, n) if len(sections) > n else sections
    count = 0
    for sec in picked:
        if sec.thread_id is None:
            continue
        Comment.objects.create(
            thread=sec.thread,
            owner=owner,
            body="Dev seed comment for thread testing.",
        )
        count += 1
    return count


def attach_node_tags(
    nodes: list[Node],
    tags: list,
    *,
    rng: SeededRNG,
) -> None:
    if not tags or not nodes:
        return
    k = min(3, len(tags))
    for n in nodes:
        if rng.random() < 0.4:
            for t in rng.sample(tags, min(k, len(tags))):
                n.tags.add(t)


def make_project_tags(project, fake, rng: SeededRNG, count: int):
    from course_flow.core.models import Tag

    tags = []
    for i in range(count):
        tags.append(
            Tag.objects.create(
                project=project,
                label=f"{DEV_SEED_TAG_LABEL_PREFIX}{fake.word()}-{i}",
                translation_plural="",
            )
        )
    return tags
