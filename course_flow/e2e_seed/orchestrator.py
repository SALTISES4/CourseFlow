"""Deterministic Playwright E2E fixture generation."""

from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path

from django.db import transaction
from django.utils import timezone

from course_flow.core.enum import AccountRole, WorkflowType
from course_flow.core.hierarchy import child_node_type_value_for_workflow
from course_flow.core.models import (
    Channel,
    Edge,
    FavoriteGraph,
    FavoriteProject,
    Graph,
    Node,
    Project,
    Section,
    Thread,
    User,
    Workflow,
)
from course_flow.e2e_seed.catalog import require_seed_asset
from course_flow.e2e_seed.clear import clear_e2e_fixtures
from course_flow.e2e_seed.constants import (
    E2E_CHANNEL_TITLES,
    E2E_FIXTURE_ARCHIVED_HOME_PROJECT_TITLE,
    E2E_FIXTURE_COURSE_WORKFLOW_TITLE,
    E2E_FIXTURE_EDITOR_EMAIL,
    E2E_FIXTURE_FAVOURITE_PROJECT_TITLES,
    E2E_FIXTURE_GRAPH_SEED,
    E2E_FIXTURE_HOME_PROJECT_TITLES,
    E2E_FIXTURE_PASSWORD,
    E2E_FIXTURE_PROGRAM_WORKFLOW_TITLE,
    E2E_FIXTURE_PROJECT_TITLE,
    E2E_FIXTURE_RESTRICTED_PROJECT_TITLE,
    E2E_FIXTURE_RESTRICTED_WORKFLOW_TITLE,
    E2E_FIXTURE_TEMPLATE_ACTIVITY_TITLE,
    E2E_FIXTURE_TEMPLATE_COURSE_TITLE,
    E2E_FIXTURE_TEMPLATE_PROGRAM_TITLE,
    E2E_FIXTURE_TEMPLATE_PROJECT_TITLE,
    E2E_FIXTURE_WORKFLOW_TITLE,
    E2E_OUTCOME_TITLE,
    E2E_SECTION_TITLES,
)
from course_flow.e2e_seed.disciplines import ensure_e2e_disciplines
from course_flow.e2e_seed.graph_shape import GraphShapeParams
from course_flow.e2e_seed.graph_view import (
    build_nodes_from_layout,
    build_outcomes,
    build_sections_and_channels,
    build_workflow_with_graph,
    generate_graph_shape,
    persist_edges_from_pairs,
)
from course_flow.e2e_seed.project_builder import create_project, ensure_team
from course_flow.e2e_seed.rng import SeededRNG
from course_flow.e2e_seed.team import ensure_e2e_contributors, ensure_e2e_owner


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


def _seed_template_workflow(
    *,
    asset_id: str,
    owner,
    template_project,
    workflow_type: WorkflowType,
    title: str,
    section_title: str,
    channel_title: str,
) -> dict:
    require_seed_asset(asset_id, kind="workflow")
    template_graph = Graph.objects.create()
    template_workflow = build_workflow_with_graph(
        template_graph,
        author=owner,
        project=template_project,
        workflow_type=workflow_type,
        title=title,
        description=f"{workflow_type.value} template workflow for cardTemplateChip E2E tests.",
    )
    sections, channels = build_sections_and_channels(
        template_graph,
        section_titles=[section_title],
        channel_titles=[channel_title],
    )
    FavoriteGraph.objects.get_or_create(user=owner, graph=template_graph)
    return {
        "asset_id": asset_id,
        "graph_uuid": str(template_graph.uuid),
        "workflow_uuid": str(template_workflow.uuid),
        "workflow_title": template_workflow.title,
        "workflow_type": template_workflow.workflow_type,
        "workflow_path": f"/workflow/{template_workflow.uuid}/graph",
        "project_uuid": str(template_project.uuid),
        "sections": _section_manifest(sections),
        "outcomes": [],
        "node_count": 0,
        "edge_count": 0,
        "channel_count": len(channels),
        "outcome_count": 0,
    }


def _workflow_manifest(*, asset_id: str, graph: Graph, workflow, sections) -> dict:
    require_seed_asset(asset_id, kind="workflow")
    graph_uuid = str(graph.uuid)
    workflow_uuid = str(workflow.uuid)
    return {
        "asset_id": asset_id,
        "graph_uuid": graph_uuid,
        "workflow_uuid": workflow_uuid,
        "workflow_title": workflow.title,
        "workflow_type": workflow.workflow_type,
        "workflow_path": f"/workflow/{workflow_uuid}/graph",
        "project_uuid": str(workflow.project.uuid) if workflow.project else None,
        "sections": _section_manifest(sections),
    }


def _seed_minimal_workflow(
    *,
    asset_id: str,
    owner,
    project,
    workflow_type: WorkflowType,
    title: str,
    description: str,
    section_title: str,
    channel_title: str,
) -> tuple[Workflow, list[Section], list[Channel], dict]:
    graph = Graph.objects.create()
    workflow = build_workflow_with_graph(
        graph,
        author=owner,
        project=project,
        workflow_type=workflow_type,
        title=title,
        description=description,
    )
    sections, channels = build_sections_and_channels(
        graph,
        section_titles=[section_title],
        channel_titles=[channel_title],
    )
    return (
        workflow,
        sections,
        channels,
        _workflow_manifest(
            asset_id=asset_id,
            graph=graph,
            workflow=workflow,
            sections=sections,
        ),
    )


def _seed_course_workflow_linked_to_activity(
    *,
    owner,
    project,
    activity_workflow,
) -> tuple[Workflow, dict]:
    course_workflow, sections, channels, course_manifest = _seed_minimal_workflow(
        asset_id="workflow.navigation_course",
        owner=owner,
        project=project,
        workflow_type=WorkflowType.COURSE,
        title=E2E_FIXTURE_COURSE_WORKFLOW_TITLE,
        description="Course workflow for main navigation Contains/Appears in E2E tests.",
        section_title="E2E Nav Course Section",
        channel_title="E2E Nav Course Channel",
    )
    Node.objects.create(
        section=sections[0],
        channel=channels[0],
        section_row=0,
        workflow=course_workflow,
        node_type=child_node_type_value_for_workflow(course_workflow.workflow_type),
        thread=Thread.objects.create(),
        linked_workflow=activity_workflow,
    )
    course_manifest["linked_child_workflow_uuid"] = str(activity_workflow.uuid)
    return course_workflow, course_manifest


def _project_manifest(project, *, asset_id: str | None = None) -> dict:
    if asset_id is not None:
        require_seed_asset(asset_id, kind="project")
    payload = {
        "uuid": str(project.uuid),
        "title": project.title,
        "modified_on": project.modified_on.isoformat(),
        "is_archived": project.is_archived,
    }
    if asset_id is not None:
        payload["asset_id"] = asset_id
    return payload


def _seed_home_projects(*, owner) -> tuple[list[dict], dict]:
    """Seed FR-HOME-003 projects with a stable newest-first ordering."""
    # Keep these projects newer than ordinary fixture mutations during a test run.
    newest_at = timezone.now() + timedelta(days=1)
    recent_projects = []
    for index, title in enumerate(E2E_FIXTURE_HOME_PROJECT_TITLES):
        project = create_project(
            owner,
            title=title,
            description=f"Deterministic recent project {index + 1} for FR-HOME-003.",
        )
        ensure_team(project, owner)
        Project.objects.filter(pk=project.pk).update(
            modified_on=newest_at - timedelta(minutes=index),
        )
        project.refresh_from_db()
        recent_projects.append(_project_manifest(project))

    archived_project = create_project(
        owner,
        title=E2E_FIXTURE_ARCHIVED_HOME_PROJECT_TITLE,
        description="Archived project excluded from Recent projects per FR-HOME-003.",
    )
    archived_project.is_archived = True
    archived_project.save(update_fields=["is_archived"])
    ensure_team(archived_project, owner)
    ensure_e2e_contributors(archived_project, owner)
    Project.objects.filter(pk=archived_project.pk).update(
        modified_on=newest_at + timedelta(minutes=1),
    )
    archived_project.refresh_from_db()

    return recent_projects, _project_manifest(
        archived_project,
        asset_id="project.archived_home",
    )


def _seed_favourite_projects(*, owner) -> list[dict]:
    """Seed five distinct sidebar favourites without changing recency fixtures."""
    projects = []
    for index, title in enumerate(E2E_FIXTURE_FAVOURITE_PROJECT_TITLES, start=1):
        project = create_project(
            owner,
            title=title,
            description=f"Deterministic sidebar favourite {index} for FR-NAV-005-008.",
        )
        ensure_team(project, owner)
        FavoriteProject.objects.get_or_create(user=owner, project=project)
        projects.append(_project_manifest(project))
    return projects


def generate_e2e_fixtures(
    *,
    manifest_path: Path | None = None,
) -> dict:
    """
    Create deterministic E2E fixtures owned by the primary teacher account.

    Uses fixed project, workflow, section, and channel contracts so the same
    fixture set can support local development and browser tests.
    """
    owner = ensure_e2e_owner()
    rng = SeededRNG.from_seed(E2E_FIXTURE_GRAPH_SEED)

    with transaction.atomic():
        ensure_e2e_disciplines()
        project = create_project(
            owner,
            title=E2E_FIXTURE_PROJECT_TITLE,
            description="Deterministic Playwright E2E fixture project.",
        )
        ensure_team(project, owner)
        contributors = ensure_e2e_contributors(project, owner)

        restricted_owner = User.objects.get(email=E2E_FIXTURE_EDITOR_EMAIL)
        restricted_project = create_project(
            restricted_owner,
            title=E2E_FIXTURE_RESTRICTED_PROJECT_TITLE,
            description=(
                "Private project used to verify non-contributor workflow access denial."
            ),
        )
        ensure_team(restricted_project, restricted_owner)
        (
            _restricted_workflow,
            _restricted_sections,
            _restricted_channels,
            restricted_workflow_manifest,
        ) = _seed_minimal_workflow(
            asset_id="workflow.restricted_activity",
            owner=restricted_owner,
            project=restricted_project,
            workflow_type=WorkflowType.ACTIVITY,
            title=E2E_FIXTURE_RESTRICTED_WORKFLOW_TITLE,
            description="Private workflow inaccessible to the primary E2E teacher.",
            section_title="E2E Restricted Section",
            channel_title="E2E Restricted Channel",
        )

        graph = Graph.objects.create()
        workflow = build_workflow_with_graph(
            graph,
            author=owner,
            project=project,
            workflow_type=WorkflowType.ACTIVITY,
            title=E2E_FIXTURE_WORKFLOW_TITLE,
            description="Activity workflow for section editing E2E tests.",
        )

        shape = GraphShapeParams(
            section_count=len(E2E_SECTION_TITLES),
            channel_count=len(E2E_CHANNEL_TITLES),
            outcome_count=1,
            max_cross_section_edges=2,
        )
        layout, edge_pairs = generate_graph_shape(rng, shape)
        sections, channels = build_sections_and_channels(
            graph,
            section_titles=list(E2E_SECTION_TITLES),
            channel_titles=list(E2E_CHANNEL_TITLES),
        )
        nodes = build_nodes_from_layout(graph, sections, channels, layout)
        persist_edges_from_pairs(nodes, edge_pairs)
        outcomes = build_outcomes(graph, nodes, outcome_count=shape.outcome_count)
        if outcomes:
            root = outcomes[0]
            root.title = E2E_OUTCOME_TITLE
            root.save(update_fields=["title"])

        edge_count = Edge.objects.filter(
            source_node__section__graph=graph,
            target_node__section__graph=graph,
        ).count()

        workflow_manifest = _workflow_manifest(
            asset_id="workflow.standard_activity",
            graph=graph,
            workflow=workflow,
            sections=sections,
        )
        workflow_manifest["node_count"] = len(nodes)
        workflow_manifest["edge_count"] = edge_count
        workflow_manifest["channel_count"] = len(channels)
        workflow_manifest["outcome_count"] = len(outcomes)
        workflow_manifest["outcomes"] = [
            {"uuid": str(outcome.uuid), "title": outcome.title} for outcome in outcomes
        ]
        FavoriteGraph.objects.get_or_create(user=owner, graph=graph)

        course_workflow, course_workflow_manifest = (
            _seed_course_workflow_linked_to_activity(
                owner=owner,
                project=project,
                activity_workflow=workflow,
            )
        )
        (
            _program_workflow,
            _program_sections,
            _program_channels,
            program_workflow_manifest,
        ) = _seed_minimal_workflow(
            asset_id="workflow.navigation_program",
            owner=owner,
            project=project,
            workflow_type=WorkflowType.PROGRAM,
            title=E2E_FIXTURE_PROGRAM_WORKFLOW_TITLE,
            description="Program workflow for main navigation negative-path E2E tests.",
            section_title="E2E Nav Program Section",
            channel_title="E2E Nav Program Channel",
        )

        template_project = create_project(
            owner,
            title=E2E_FIXTURE_TEMPLATE_PROJECT_TITLE,
            description="Deterministic Playwright E2E template project.",
        )
        template_project.is_template = True
        template_project.is_published = True
        template_project.save(update_fields=["is_template", "is_published"])
        ensure_team(template_project, owner)
        FavoriteProject.objects.get_or_create(user=owner, project=template_project)

        template_workflows = [
            _seed_template_workflow(
                asset_id="workflow.template_activity",
                owner=owner,
                template_project=template_project,
                workflow_type=WorkflowType.ACTIVITY,
                title=E2E_FIXTURE_TEMPLATE_ACTIVITY_TITLE,
                section_title="E2E Activity Template Section",
                channel_title="E2E Activity Template Channel",
            ),
            _seed_template_workflow(
                asset_id="workflow.template_course",
                owner=owner,
                template_project=template_project,
                workflow_type=WorkflowType.COURSE,
                title=E2E_FIXTURE_TEMPLATE_COURSE_TITLE,
                section_title="E2E Course Template Section",
                channel_title="E2E Course Template Channel",
            ),
            _seed_template_workflow(
                asset_id="workflow.template_program",
                owner=owner,
                template_project=template_project,
                workflow_type=WorkflowType.PROGRAM,
                title=E2E_FIXTURE_TEMPLATE_PROGRAM_TITLE,
                section_title="E2E Program Template Section",
                channel_title="E2E Program Template Channel",
            ),
        ]

        favourite_projects = _seed_favourite_projects(owner=owner)
        recent_projects, archived_home_project = _seed_home_projects(owner=owner)

        primary_project_manifest = _project_manifest(
            project,
            asset_id="project.primary",
        )
        restricted_project_manifest = _project_manifest(
            restricted_project,
            asset_id="project.restricted",
        )
        template_project_manifest = _project_manifest(
            template_project,
            asset_id="project.templates",
        )
        actor_assets = {
            "actor.teacher": {
                "asset_id": "actor.teacher",
                "kind": "actor",
                "email": owner.email,
                "password": E2E_FIXTURE_PASSWORD,
                "account_role": AccountRole.TEACHER.value,
            },
            **{
                f"actor.{contributor['role']}": {
                    "asset_id": f"actor.{contributor['role']}",
                    "kind": "actor",
                    **contributor,
                }
                for contributor in contributors
            },
        }
        runtime_assets = {
            **actor_assets,
            "project.primary": {"kind": "project", **primary_project_manifest},
            "project.restricted": {
                "kind": "project",
                **restricted_project_manifest,
            },
            "project.templates": {
                "kind": "project",
                **template_project_manifest,
            },
            "project.recent_collection": {
                "asset_id": "project.recent_collection",
                "kind": "project-collection",
                "items": recent_projects,
            },
            "project.favourite_collection": {
                "asset_id": "project.favourite_collection",
                "kind": "project-collection",
                "items": favourite_projects,
            },
            "project.archived_home": {
                "kind": "project",
                **archived_home_project,
            },
            "workflow.standard_activity": {
                "kind": "workflow",
                **workflow_manifest,
            },
            "workflow.navigation_course": {
                "kind": "workflow",
                **course_workflow_manifest,
            },
            "workflow.navigation_program": {
                "kind": "workflow",
                **program_workflow_manifest,
            },
            "workflow.restricted_activity": {
                "kind": "workflow",
                **restricted_workflow_manifest,
            },
            **{
                template["asset_id"]: {"kind": "workflow", **template}
                for template in template_workflows
            },
        }

        manifest = {
            "fixture_version": 5,
            "asset_catalog_version": 1,
            "assets": runtime_assets,
            "primary_user": {
                "email": owner.email,
                "password": E2E_FIXTURE_PASSWORD,
                "account_role": AccountRole.TEACHER.value,
            },
            "owner_email": owner.email,
            "project_uuid": str(project.uuid),
            "project_title": project.title,
            "recent_projects": recent_projects,
            "archived_home_project": archived_home_project,
            "template_project_uuid": str(template_project.uuid),
            "template_project_title": template_project.title,
            "template_workflows": template_workflows,
            "contributors": contributors,
            "restricted_workflow": {
                "project_uuid": str(restricted_project.uuid),
                "project_title": restricted_project.title,
                **restricted_workflow_manifest,
            },
            "workflows": [
                workflow_manifest,
                course_workflow_manifest,
                program_workflow_manifest,
            ],
            "navigation_linked_workflows": {
                "activity": {
                    "workflow_uuid": workflow_manifest["workflow_uuid"],
                    "workflow_title": E2E_FIXTURE_WORKFLOW_TITLE,
                    "workflow_type": workflow_manifest["workflow_type"],
                    "workflow_path": workflow_manifest["workflow_path"],
                },
                "course": {
                    "workflow_uuid": course_workflow_manifest["workflow_uuid"],
                    "workflow_title": E2E_FIXTURE_COURSE_WORKFLOW_TITLE,
                    "workflow_type": course_workflow_manifest["workflow_type"],
                    "workflow_path": course_workflow_manifest["workflow_path"],
                    "linked_child_workflow_uuid": course_workflow_manifest[
                        "linked_child_workflow_uuid"
                    ],
                },
                "program": {
                    "workflow_uuid": program_workflow_manifest["workflow_uuid"],
                    "workflow_title": E2E_FIXTURE_PROGRAM_WORKFLOW_TITLE,
                    "workflow_type": program_workflow_manifest["workflow_type"],
                    "workflow_path": program_workflow_manifest["workflow_path"],
                },
            },
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
