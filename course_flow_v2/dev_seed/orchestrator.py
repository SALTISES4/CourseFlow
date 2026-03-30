"""Orchestrate deterministic dev seed generation (one project tree per call unit)."""

from __future__ import annotations

from dataclasses import dataclass

from django.db import transaction
from faker import Faker

from course_flow_v2.core.models import Edge, Workflow
from course_flow_v2.dev_seed import clear
from course_flow_v2.dev_seed.project_builder import (
    attach_disciplines,
    create_project,
    ensure_seed_users,
    ensure_team,
    get_or_create_disciplines,
)
from course_flow_v2.dev_seed.rng import SeededRNG
from course_flow_v2.dev_seed.workflow_graph import (
    add_light_comments,
    attach_node_tags,
    build_nodes_from_layout,
    build_outcomes,
    build_sections_and_channels,
    build_unit_for_workflow,
    generate_workflow_shape,
    make_project_tags,
    persist_edges_from_pairs,
)
from course_flow_v2.dev_seed.workflow_shape import WorkflowShapeParams


@dataclass(frozen=True)
class SeedConfig:
    """Bounded defaults for visualization-friendly graphs."""

    seed: int = 42
    project_count: int = 1
    workflows_per_project: int = 1
    section_count: int = 3
    channel_count: int = 3
    team_size: int = 3
    tag_count: int = 3


def _shape_params(cfg: SeedConfig, rng: SeededRNG) -> WorkflowShapeParams:
    return WorkflowShapeParams(
        section_count=max(1, min(5, cfg.section_count)),
        channel_count=max(2, min(5, cfg.channel_count)),
        outcome_count=rng.randint(0, 3),
        max_cross_section_edges=rng.randint(2, 5),
    )


def _generate_one_project(cfg: SeedConfig, project_index: int) -> dict:
    """Single project with ``workflows_per_project`` workflows."""
    rng = SeededRNG.from_seed(cfg.seed + project_index * 10_007)
    fake = Faker()
    fake.seed_instance(cfg.seed + project_index * 10_007)

    owner, members = ensure_seed_users(rng=rng, seed=cfg.seed + project_index, team_size=cfg.team_size)
    discipline_pool = get_or_create_disciplines()

    project = create_project(owner, fake=fake, rng=rng)
    attach_disciplines(project, discipline_pool, rng=rng, max_n=3)
    ensure_team(project, members, rng=rng)

    tags = make_project_tags(
        project,
        fake,
        rng,
        count=max(0, min(3, cfg.tag_count)),
    )

    workflows_meta: list[dict] = []

    for w in range(cfg.workflows_per_project):
        wf_rng = SeededRNG.from_seed(cfg.seed + project_index * 10_007 + w * 97)
        wf_fake = Faker()
        wf_fake.seed_instance(cfg.seed + project_index * 10_007 + w * 97)

        workflow = Workflow.objects.create(
            owner=owner,
            project=project,
            title=wf_fake.sentence(nb_words=4).rstrip("."),
        )
        build_unit_for_workflow(workflow, fake=wf_fake, rng=wf_rng)

        shape = _shape_params(cfg, wf_rng)
        layout, edge_pairs = generate_workflow_shape(wf_rng, shape)
        sections, channels = build_sections_and_channels(
            workflow,
            fake=wf_fake,
            rng=wf_rng,
            section_count=len(layout.sections),
            channel_count=shape.channel_count,
        )
        nodes = build_nodes_from_layout(sections, channels, layout)
        build_outcomes(
            workflow,
            nodes,
            rng=wf_rng,
            outcome_count=shape.outcome_count,
        )
        persist_edges_from_pairs(nodes, edge_pairs)
        attach_node_tags(nodes, tags, rng=wf_rng)
        add_light_comments(owner=owner, sections=sections, rng=wf_rng)

        edge_rows = Edge.objects.filter(
            source_node__section__workflow=workflow,
            target_node__section__workflow=workflow,
        ).select_related("source_node", "target_node")
        same_section = 0
        total = 0
        for e in edge_rows:
            total += 1
            if e.source_node.section_id == e.target_node.section_id:
                same_section += 1

        workflows_meta.append(
            {
                "workflow_uuid": str(workflow.uuid),
                "node_count": len(nodes),
                "edge_count": total,
                "same_section_edge_count": same_section,
            }
        )

    return {
        "project_uuid": str(project.uuid),
        "project_title": project.title,
        "workflows": workflows_meta,
    }


def generate_dev_seed(cfg: SeedConfig) -> dict:
    """Create ``project_count`` seed projects in one atomic transaction."""
    results: list[dict] = []
    with transaction.atomic():
        for i in range(cfg.project_count):
            results.append(_generate_one_project(cfg, i))
    return {"seed": cfg.seed, "projects": results}


def clear_then_seed(
    cfg: SeedConfig,
    *,
    clear_all_projects: bool = False,
) -> dict:
    clear.clear_dev_seed_projects(clear_all_projects=clear_all_projects)
    return generate_dev_seed(cfg)
