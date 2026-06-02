"""Orchestrate deterministic dev seed generation (one project tree per call workflow)."""

from __future__ import annotations

from dataclasses import dataclass

from django.contrib.auth import get_user_model
from django.db import transaction
from faker import Faker

from course_flow.core.enum import WorkflowType
from course_flow.core.models import Edge, Graph
from course_flow.dev_seed import clear
from course_flow.dev_seed.graph_shape import GraphShapeParams
from course_flow.dev_seed.graph_view import (
    add_light_comments,
    attach_node_tags,
    build_nodes_from_layout,
    build_outcomes,
    build_sections_and_channels,
    build_workflow_with_graph,
    generate_graph_shape,
    make_project_tags,
    persist_edges_from_pairs,
)
from course_flow.dev_seed.project_builder import (
    attach_disciplines,
    create_project,
    ensure_dev_seed_accounts,
    ensure_team,
    get_or_create_disciplines,
)
from course_flow.dev_seed.rng import SeededRNG

User = get_user_model()

# Each seeded project includes at least one root workflow of each type.
MANDATORY_WORKFLOW_TYPES: tuple[WorkflowType, ...] = (
    WorkflowType.PROGRAM,
    WorkflowType.COURSE,
    WorkflowType.ACTIVITY,
)


@dataclass(frozen=True)
class SeedConfig:
    """Bounded defaults for visualization-friendly graphs."""

    seed: int = 42
    graphs_per_project: int = 3
    section_count: int = 3
    channel_count: int = 3
    tag_count: int = 3


def _shape_params(cfg: SeedConfig, rng: SeededRNG) -> GraphShapeParams:
    return GraphShapeParams(
        section_count=max(1, min(5, cfg.section_count)),
        channel_count=max(2, min(5, cfg.channel_count)),
        outcome_count=rng.randint(0, 3),
        max_cross_section_edges=rng.randint(2, 5),
    )


def _workflow_type_for_index(index: int, rng: SeededRNG) -> WorkflowType:
    if index < len(MANDATORY_WORKFLOW_TYPES):
        return MANDATORY_WORKFLOW_TYPES[index]
    return rng.choice(list(MANDATORY_WORKFLOW_TYPES))


def _generate_one_project(cfg: SeedConfig, project_index: int, owner: User) -> dict:
    """Single project owned by ``owner`` with graphs_per_project workflows."""
    rng = SeededRNG.from_seed(cfg.seed + project_index * 10_007)
    fake = Faker()
    fake.seed_instance(cfg.seed + project_index * 10_007)

    discipline_pool = get_or_create_disciplines()

    project = create_project(owner, fake=fake, rng=rng)
    attach_disciplines(project, discipline_pool, rng=rng, max_n=3)
    ensure_team(project, owner)

    tags = make_project_tags(
        project,
        fake,
        rng,
        count=max(0, min(3, cfg.tag_count)),
    )

    graphs_meta: list[dict] = []
    graph_count = max(cfg.graphs_per_project, len(MANDATORY_WORKFLOW_TYPES))

    for w in range(graph_count):
        wf_rng = SeededRNG.from_seed(cfg.seed + project_index * 10_007 + w * 97)
        wf_fake = Faker()
        wf_fake.seed_instance(cfg.seed + project_index * 10_007 + w * 97)

        graph = Graph.objects.create()
        build_workflow_with_graph(
            graph,
            author=owner,
            project=project,
            fake=wf_fake,
            rng=wf_rng,
            workflow_type=_workflow_type_for_index(w, wf_rng),
        )

        shape = _shape_params(cfg, wf_rng)
        layout, edge_pairs = generate_graph_shape(wf_rng, shape)
        sections, channels = build_sections_and_channels(
            graph,
            fake=wf_fake,
            rng=wf_rng,
            section_count=len(layout.sections),
            channel_count=shape.channel_count,
        )
        nodes = build_nodes_from_layout(graph, sections, channels, layout)
        build_outcomes(
            graph,
            nodes,
            rng=wf_rng,
            outcome_count=shape.outcome_count,
        )
        persist_edges_from_pairs(nodes, edge_pairs)
        attach_node_tags(nodes, tags, rng=wf_rng)
        add_light_comments(owner=owner, sections=sections, rng=wf_rng)

        edge_rows = Edge.objects.filter(
            source_node__section__graph=graph,
            target_node__section__graph=graph,
        ).select_related("source_node", "target_node")
        same_section = 0
        total = 0
        for e in edge_rows:
            total += 1
            if e.source_node.section_id == e.target_node.section_id:
                same_section += 1

        graphs_meta.append(
            {
                "graph_uuid": str(graph.uuid),
                "node_count": len(nodes),
                "edge_count": total,
                "same_section_edge_count": same_section,
            }
        )

    return {
        "owner_email": owner.email,
        "project_uuid": str(project.uuid),
        "project_title": project.title,
        "graphs": graphs_meta,
    }


def generate_dev_seed(cfg: SeedConfig) -> dict:
    """Create one DEV SEED project per canonical dev account (admin, teacher, student)."""
    owners = ensure_dev_seed_accounts()
    results: list[dict] = []
    with transaction.atomic():
        for i, owner in enumerate(owners):
            results.append(_generate_one_project(cfg, i, owner))
    return {"seed": cfg.seed, "projects": results}


def clear_then_seed(
    cfg: SeedConfig,
    *,
    clear_all_projects: bool = False,
) -> dict:
    clear.clear_dev_seed_projects(clear_all_projects=clear_all_projects)
    return generate_dev_seed(cfg)
