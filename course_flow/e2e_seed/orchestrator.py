"""Deterministic Playwright E2E fixture generation."""

from __future__ import annotations

import json
from pathlib import Path

from django.db import transaction
from faker import Faker

from course_flow.core.enum import WorkflowType
from course_flow.core.models import Edge, Graph
from course_flow.dev_seed.graph_shape import GraphShapeParams
from course_flow.dev_seed.graph_view import (
    build_nodes_from_layout,
    build_sections_and_channels,
    build_workflow_with_graph,
    generate_graph_shape,
    persist_edges_from_pairs,
)
from course_flow.dev_seed.project_builder import (
    create_project,
    ensure_team,
    get_existing_admin,
)
from course_flow.dev_seed.rng import SeededRNG
from course_flow.e2e_seed.clear import clear_e2e_fixtures
from course_flow.e2e_seed.constants import (
    E2E_CHANNEL_TITLES,
    E2E_FIXTURE_GRAPH_SEED,
    E2E_FIXTURE_PROJECT_TITLE,
    E2E_FIXTURE_WORKFLOW_TITLE,
    E2E_SECTION_TITLES,
)
from course_flow.e2e_seed.team import ensure_e2e_contributors


def _section_manifest(sections) -> list[dict]:
    ordered = sorted(sections, key=lambda section: section.position)
    return [
        {
            "uuid": str(section.uuid),
            "title": section.title,
            "position": section.position,
        }
        for section in ordered
    ]


def _workflow_manifest(*, graph: Graph, workflow, sections) -> dict:
    graph_uuid = str(graph.uuid)
    workflow_uuid = str(workflow.uuid)
    return {
        "graph_uuid": graph_uuid,
        "workflow_uuid": workflow_uuid,
        "workflow_type": workflow.workflow_type,
        "workflow_path": f"/workflow/{workflow_uuid}/graph",
        "sections": _section_manifest(sections),
    }


def generate_e2e_fixtures(
    *,
    manifest_path: Path | None = None,
) -> dict:
    """
    Create one deterministic E2E fixture project owned by the dev admin account.

    Reuses graph persistence helpers from ``dev_seed`` but supplies fixed
    project/section/channel copy instead of Faker prose.
    """
    admin = get_existing_admin()
    rng = SeededRNG.from_seed(E2E_FIXTURE_GRAPH_SEED)
    fake = Faker()
    fake.seed_instance(E2E_FIXTURE_GRAPH_SEED)

    with transaction.atomic():
        project = create_project(
            admin,
            fake=fake,
            rng=rng,
            title=E2E_FIXTURE_PROJECT_TITLE,
            description="Deterministic Playwright E2E fixture project.",
        )
        ensure_team(project, admin)
        contributors = ensure_e2e_contributors(project, admin)

        graph = Graph.objects.create()
        workflow = build_workflow_with_graph(
            graph,
            author=admin,
            project=project,
            fake=fake,
            rng=rng,
            workflow_type=WorkflowType.ACTIVITY,
            title=E2E_FIXTURE_WORKFLOW_TITLE,
            description="Activity workflow for section editing E2E tests.",
        )

        shape = GraphShapeParams(
            section_count=len(E2E_SECTION_TITLES),
            channel_count=len(E2E_CHANNEL_TITLES),
            outcome_count=0,
            max_cross_section_edges=2,
        )
        layout, edge_pairs = generate_graph_shape(rng, shape)
        sections, channels = build_sections_and_channels(
            graph,
            fake=fake,
            rng=rng,
            section_count=len(E2E_SECTION_TITLES),
            channel_count=len(E2E_CHANNEL_TITLES),
            section_titles=list(E2E_SECTION_TITLES),
            channel_titles=list(E2E_CHANNEL_TITLES),
        )
        nodes = build_nodes_from_layout(graph, sections, channels, layout)
        persist_edges_from_pairs(nodes, edge_pairs)

        edge_count = Edge.objects.filter(
            source_node__section__graph=graph,
            target_node__section__graph=graph,
        ).count()

        workflow_manifest = _workflow_manifest(
            graph=graph,
            workflow=workflow,
            sections=sections,
        )
        workflow_manifest["node_count"] = len(nodes)
        workflow_manifest["edge_count"] = edge_count
        workflow_manifest["channel_count"] = len(channels)

        manifest = {
            "fixture_version": 2,
            "owner_email": admin.email,
            "project_uuid": str(project.uuid),
            "project_title": project.title,
            "contributors": contributors,
            "workflows": [workflow_manifest],
        }

    if manifest_path is not None:
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(
            json.dumps(manifest, indent=2) + "\n",
            encoding="utf-8",
        )

    return manifest


def clear_then_seed_e2e_fixtures(
    *,
    manifest_path: Path | None = None,
) -> dict:
    clear_e2e_fixtures()
    return generate_e2e_fixtures(manifest_path=manifest_path)
