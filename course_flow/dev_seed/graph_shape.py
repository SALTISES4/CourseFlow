"""
Deterministic graph shape (layout + edges) for dev seed data.

Layout: section-local 2D grids — one node per (section, channel, section_row),
compact row indices, structured channel spread. Edges: weighted out-degrees,
same-section majority, forward bias, bounded cross-links.

Structural randomness uses only ``SeededRNG`` (no Faker).
"""

from __future__ import annotations

from dataclasses import dataclass, field

from course_flow.dev_seed.rng import SeededRNG


@dataclass(frozen=True)
class GraphShapeParams:
    """Bounds for one graph graph."""

    section_count: int  # 1–5
    channel_count: int  # 2–5
    min_nodes_per_section: int = 4
    max_nodes_per_section: int = 12
    outcome_count: int = 0
    max_cross_section_edges: int = 4


@dataclass
class SectionLayoutPlan:
    """Planned node positions within one section."""

    placements: list[tuple[int, int]] = field(default_factory=list)
    # (channel_index, section_row), unique; rows compact 0..R-1


@dataclass(frozen=True)
class GraphLayoutPlan:
    sections: list[SectionLayoutPlan]


def _clamp(n: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, n))


def iter_layout_node_meta(layout: GraphLayoutPlan) -> list[tuple[int, int, int]]:
    """
    Global node order: section index, then row-major within section.

    Must match the order used when persisting ``Node`` rows so edge indices align.
    """
    meta: list[tuple[int, int, int]] = []
    for si, sec in enumerate(layout.sections):
        for ch_idx, row in sorted(sec.placements, key=lambda t: (t[1], t[0])):
            meta.append((si, row, ch_idx))
    return meta


def choose_section_node_count(
    rng: SeededRNG,
    *,
    p: GraphShapeParams,
) -> int:
    """4–12 nodes per section, usually medium-sized."""
    lo = _clamp(p.min_nodes_per_section, 1, 12)
    hi = _clamp(p.max_nodes_per_section, lo, 12)
    r = rng.randint(0, 99)
    if r < 8:
        n = rng.randint(lo, min(lo + 3, hi))
    elif r < 78:
        n = rng.randint(max(lo, 5), min(hi, 10))
    else:
        n = rng.randint(max(lo, 8), hi)
    return _clamp(n, lo, hi)


def _all_slots(n_channels: int, n_rows: int) -> list[tuple[int, int]]:
    return [(ch, r) for r in range(n_rows) for ch in range(n_channels)]


def _compress_rows(placements: list[tuple[int, int]]) -> list[tuple[int, int]]:
    rows_present = sorted({r for _, r in placements})
    rank = {r: i for i, r in enumerate(rows_present)}
    return [(ch, rank[r]) for ch, r in placements]


def generate_section_placements(
    rng: SeededRNG,
    *,
    n_channels: int,
    node_count: int,
) -> list[tuple[int, int]]:
    """
    Unique (channel, row) per node; rows compact; prefer ≥2 channels when possible.
    """
    if node_count <= 0:
        return []
    n_ch = max(1, n_channels)
    n_rows = 1
    while n_rows * n_ch < node_count:
        n_rows += 1

    slots = _all_slots(n_ch, n_rows)
    chosen = rng.sample(slots, node_count)
    chosen = _compress_rows(chosen)

    if n_ch >= 2 and node_count >= 4:
        chs = {c for c, _ in chosen}
        if len(chs) < 2:
            ch0, r0 = chosen[0]
            for c in range(n_ch):
                if c != ch0:
                    chosen = [(c, r0)] + list(chosen[1:])
                    chosen = _compress_rows(chosen)
                    break

    return sorted(chosen, key=lambda t: (t[1], t[0]))


def generate_graph_layout(
    rng: SeededRNG,
    p: GraphShapeParams,
) -> GraphLayoutPlan:
    n_sec = _clamp(p.section_count, 1, 5)
    n_ch = _clamp(p.channel_count, 2, 5)
    section_plans: list[SectionLayoutPlan] = []
    for _ in range(n_sec):
        n_nodes = choose_section_node_count(rng, p=p)
        placements = generate_section_placements(
            rng,
            n_channels=n_ch,
            node_count=n_nodes,
        )
        section_plans.append(SectionLayoutPlan(placements=placements))
    return GraphLayoutPlan(sections=section_plans)


def weighted_out_degree(rng: SeededRNG) -> int:
    """Mostly 1–2; some 0; few 3–4."""
    r = rng.random()
    if r < 0.12:
        return 0
    if r < 0.47:
        return 1
    if r < 0.82:
        return 2
    if r < 0.95:
        return 3
    return 4


def _node_key(meta: list[tuple[int, int, int]], i: int) -> tuple[int, int, int]:
    si, row, ch = meta[i]
    return (si, row, ch)


def generate_edge_pairs(
    rng: SeededRNG,
    layout: GraphLayoutPlan,
    *,
    max_cross_section_edges: int,
) -> list[tuple[int, int]]:
    """
    Directed edges as (source_global_idx, target_global_idx).

    No self-loops, no duplicate pairs, out-degree ≤ 4, same-section majority,
    forward bias, bounded cross-section edges.
    """
    meta = iter_layout_node_meta(layout)
    n = len(meta)
    if n < 2:
        return []

    by_section: dict[int, list[int]] = {}
    for i in range(n):
        by_section.setdefault(meta[i][0], []).append(i)

    for sid in by_section:
        by_section[sid].sort(key=lambda i: (meta[i][1], meta[i][2], i))

    seen: set[tuple[int, int]] = set()
    out_deg: dict[int, int] = {i: 0 for i in range(n)}
    edges: list[tuple[int, int]] = []
    max_out = 4

    def add_edge(src: int, tgt: int) -> bool:
        if src == tgt or out_deg[src] >= max_out:
            return False
        if (src, tgt) in seen:
            return False
        seen.add((src, tgt))
        out_deg[src] += 1
        edges.append((src, tgt))
        return True

    def is_cross(s: int, t: int) -> bool:
        return meta[s][0] != meta[t][0]

    cross_used = 0

    # Phase 1: partial row-major chains (not always full chain — avoids trivial line)
    for _sid, idxs in sorted(by_section.items()):
        if len(idxs) < 2:
            continue
        any_added = False
        for a, b in zip(idxs, idxs[1:], strict=False):
            if _node_key(meta, b) > _node_key(meta, a) and rng.random() < 0.82:
                if add_edge(a, b):
                    any_added = True
        if not any_added:
            add_edge(idxs[0], idxs[1])

    # Phase 2: reach weighted target out-degrees; same-section first, forward bias
    order = sorted(range(n), key=lambda i: _node_key(meta, i))
    for src in order:
        want = weighted_out_degree(rng)
        need = max(0, want - out_deg[src])
        if need == 0:
            continue
        si = meta[src][0]

        same = [j for j in by_section[si] if j != src]
        forward = [j for j in same if _node_key(meta, j) > _node_key(meta, src)]
        forward.sort(
            key=lambda j: (
                meta[j][1] - meta[src][1],
                abs(meta[j][2] - meta[src][2]),
                j,
            ),
        )
        backward = [j for j in same if _node_key(meta, j) < _node_key(meta, src)]
        backward.sort(
            key=lambda j: (
                meta[src][1] - meta[j][1],
                abs(meta[j][2] - meta[src][2]),
                j,
            ),
        )

        for pool in (forward, backward):
            for tgt in pool:
                if need == 0:
                    break
                if add_edge(src, tgt):
                    need -= 1
            if need == 0:
                break

        if need > 0:
            others = [j for j in range(n) if meta[j][0] != si]
            others.sort(
                key=lambda j: (
                    abs(meta[j][0] - si),
                    abs(meta[j][1] - meta[src][1]),
                    abs(meta[j][2] - meta[src][2]),
                    j,
                ),
            )
            for tgt in others:
                if need == 0:
                    break
                if cross_used >= max_cross_section_edges:
                    break
                if add_edge(src, tgt):
                    need -= 1
                    if is_cross(src, tgt):
                        cross_used += 1

    # Phase 3: deliberate cross-section bridges up to remaining budget
    if cross_used < max_cross_section_edges and n >= 2:
        section_ids = list(by_section.keys())
        attempts = max_cross_section_edges - cross_used
        for _ in range(attempts):
            if len(section_ids) < 2:
                break
            s1, s2 = rng.sample(section_ids, 2)
            pa, pb = by_section[s1], by_section[s2]
            if not pa or not pb:
                continue
            src = rng.choice(pa)
            tgt = rng.choice(pb)
            if is_cross(src, tgt) and add_edge(src, tgt):
                cross_used += 1

    return edges
