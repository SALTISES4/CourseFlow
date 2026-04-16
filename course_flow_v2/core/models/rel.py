"""
Explicit join / through models (M2M through tables and favorites).

Domain entities live in sibling modules; this module holds only relational glue.
"""

from django.conf import settings
from django.db import models

from course_flow_v2.core.models.discipline import Discipline
from course_flow_v2.core.models.graph import Graph
from course_flow_v2.core.models.horizontal_outcome import HorizontalOutcome
from course_flow_v2.core.models.node import Node
from course_flow_v2.core.models.outcome import Outcome
from course_flow_v2.core.models.project import Project
from course_flow_v2.core.models.project_team import ProjectTeam
from course_flow_v2.core.models.tag import Tag


class ProjectDiscipline(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE)

    class Meta:
        db_table = "cf2_project_discipline"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "discipline"],
                name="cf2_project_discipline_unique",
            )
        ]


class ProjectTeamMember(models.Model):
    class Role(models.TextChoices):
        EDITOR = "editor", "Editor"
        COMMENTER = "commenter", "Commenter"
        VIEWER = "viewer", "Viewer"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projectteam_memberships",
    )
    projectteam = models.ForeignKey(
        ProjectTeam,
        on_delete=models.CASCADE,
        related_name="members",
    )
    role = models.CharField(
        max_length=32,
        choices=Role.choices,
        default=Role.VIEWER,
    )

    class Meta:
        db_table = "cf2_project_team_member"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "projectteam"],
                name="cf2_project_team_member_unique",
            )
        ]


class OutcomeOutcome(models.Model):
    from_outcome = models.ForeignKey(
        Outcome,
        on_delete=models.CASCADE,
        related_name="outcome_links_from",
    )
    to_outcome = models.ForeignKey(
        Outcome,
        on_delete=models.CASCADE,
        related_name="outcome_links_to",
    )

    class Meta:
        db_table = "cf2_outcome_outcome"
        constraints = [
            models.UniqueConstraint(
                fields=["from_outcome", "to_outcome"],
                name="cf2_outcome_outcome_unique_pair",
            )
        ]


class NodeTag(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = "cf2_node_tag"
        constraints = [
            models.UniqueConstraint(
                fields=["node", "tag"],
                name="cf2_node_tag_unique",
            )
        ]


class OutcomeTag(models.Model):
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = "cf2_outcome_tag"
        constraints = [
            models.UniqueConstraint(
                fields=["outcome", "tag"],
                name="cf2_outcome_tag_unique",
            )
        ]


class NodeOutcome(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)

    class Meta:
        db_table = "cf2_node_outcome"
        constraints = [
            models.UniqueConstraint(
                fields=["node", "outcome"],
                name="cf2_node_outcome_unique",
            )
        ]


class HorizontalOutcomeOutcome(models.Model):
    horizontal_outcome = models.ForeignKey(
        HorizontalOutcome,
        on_delete=models.CASCADE,
        related_name="horizontal_links",
    )
    outcome = models.ForeignKey(
        Outcome,
        on_delete=models.CASCADE,
        related_name="horizontal_link_rows",
    )

    class Meta:
        db_table = "cf2_horizontal_outcome_outcome"
        constraints = [
            models.UniqueConstraint(
                fields=["horizontal_outcome", "outcome"],
                name="cf2_horizontal_outcome_outcome_unique",
            )
        ]


class FavoriteProject(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorite_projects",
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="favorite_links",
    )

    class Meta:
        db_table = "cf2_favorite_project"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "project"],
                name="cf2_favorite_project_unique",
            )
        ]


class FavoriteGraph(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorite_graphs",
    )
    graph = models.ForeignKey(
        Graph,
        on_delete=models.CASCADE,
        related_name="favorite_links",
    )

    class Meta:
        db_table = "cf2_favorite_graph"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "graph"],
                name="cf2_favorite_graph_unique",
            )
        ]
