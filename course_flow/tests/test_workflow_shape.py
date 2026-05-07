"""Structural invariants for ``graph_shape`` layout + edge generation."""

from __future__ import annotations

import pytest
from django.db.models import Count

from course_flow.core.models import Edge, Node, Project
from course_flow.dev_seed.constants import DEV_SEED_PROJECT_TITLE_PREFIX
from course_flow.dev_seed.graph_shape import (
    GraphShapeParams,
    generate_edge_pairs,
    generate_graph_layout,
    iter_layout_node_meta,
)
from course_flow.dev_seed.orchestrator import SeedConfig, generate_dev_seed
from course_flow.dev_seed.rng import SeededRNG


def test_pure_layout_and_edges_deterministic():
    p = GraphShapeParams(
        section_count=3,
        channel_count=3,
        min_nodes_per_section=4,
        max_nodes_per_section=10,
        outcome_count=0,
        max_cross_section_edges=3,
    )
    rng_a = SeededRNG.from_seed(9001)
    rng_b = SeededRNG.from_seed(9001)
    la = generate_graph_layout(rng_a, p)
    lb = generate_graph_layout(rng_b, p)
    assert len(la.sections) == len(lb.sections)
    for sa, sb in zip(la.sections, lb.sections, strict=True):
        assert sa.placements == sb.placements

    r1 = SeededRNG.from_seed(9001)
    r2 = SeededRNG.from_seed(9001)
    la = generate_graph_layout(r1, p)
    lb = generate_graph_layout(r2, p)
    ea = generate_edge_pairs(r1, la, max_cross_section_edges=3)
    eb = generate_edge_pairs(r2, lb, max_cross_section_edges=3)
    assert ea == eb


def test_edge_invariants_pure():
    p = GraphShapeParams(
        section_count=4,
        channel_count=3,
        max_cross_section_edges=4,
    )
    rng = SeededRNG.from_seed(404)
    layout = generate_graph_layout(rng, p)
    meta = iter_layout_node_meta(layout)
    n = len(meta)
    pairs = generate_edge_pairs(rng, layout, max_cross_section_edges=p.max_cross_section_edges)

    seen: set[tuple[int, int]] = set()
    out_deg: dict[int, int] = {i: 0 for i in range(n)}
    for s, t in pairs:
        assert s != t
        assert (s, t) not in seen
        seen.add((s, t))
        out_deg[s] += 1
        assert out_deg[s] <= 4

    same = 0
    for s, t in pairs:
        if meta[s][0] == meta[t][0]:
            same += 1
    total = len(pairs)
    if total > 0:
        assert same / total >= 0.55


@pytest.mark.django_db
def test_db_nodes_one_per_cell_and_compact_rows():
    cfg = SeedConfig(seed=2020, section_count=3, channel_count=3)
    generate_dev_seed(cfg)
    p = Project.objects.get(title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX)
    g = p.workflows.select_related("graph").first().graph
    for sec in g.sections.all():
        dups = (
            Node.objects.filter(section=sec)
            .values("channel_id", "section_row")
            .annotate(c=Count("id"))
            .filter(c__gt=1)
        )
        assert not dups.exists()
        rows = list(Node.objects.filter(section=sec).values_list("section_row", flat=True))
        if not rows:
            continue
        u = sorted(set(rows))
        assert u[0] == 0
        assert len(u) == u[-1] - u[0] + 1


@pytest.mark.django_db
def test_db_edge_out_degrees_and_no_self_loop():
    generate_dev_seed(SeedConfig(seed=77, section_count=3, channel_count=3))
    p = Project.objects.get(title__startswith=DEV_SEED_PROJECT_TITLE_PREFIX)
    g = p.workflows.select_related("graph").first().graph
    edges = Edge.objects.filter(source_node__section__graph=g)
    assert edges.exists()
    for e in edges:
        assert e.source_node_id != e.target_node_id
    out_counts = (
        edges.values("source_node_id").annotate(c=Count("id")).values_list("c", flat=True)
    )
    assert max(out_counts) <= 4
