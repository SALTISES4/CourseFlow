"""
Explicit join / through models (M2M through tables and favorites).

Domain entities live in sibling modules; this module holds only relational glue.
"""

from django.conf import settings
from django.db import models

from course_flow.core.enum import Role
from course_flow.core.models.discipline import Discipline
from course_flow.core.models.graph import Graph
from course_flow.core.models.horizontaloutcome import Horizontaloutcome
from course_flow.core.models.node import Node
from course_flow.core.models.outcome import Outcome
from course_flow.core.models.project import Project
from course_flow.core.models.tag import Tag
from course_flow.core.models.team import Team

ROLE_CHOICES = [(e.value, e.name.title()) for e in Role]


class ProjectDiscipline(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE)

    class Meta:
        db_table = "cf_project_discipline"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "discipline"],
                name="cf_project_discipline_unique",
            )
        ]


class TeamUser(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_users",
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="users",
    )
    role = models.CharField(
        max_length=32,
        choices=ROLE_CHOICES,
    )

    class Meta:
        db_table = "cf_team_user"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "team"],
                name="cf_team_user_unique",
            )
        ]


class NodeTag(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = "cf_node_tag"
        constraints = [
            models.UniqueConstraint(
                fields=["node", "tag"],
                name="cf_node_tag_unique",
            )
        ]


class OutcomeTag(models.Model):
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = "cf_outcome_tag"
        constraints = [
            models.UniqueConstraint(
                fields=["outcome", "tag"],
                name="cf_outcome_tag_unique",
            )
        ]


class NodeOutcome(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)

    class Meta:
        db_table = "cf_node_outcome"
        constraints = [
            models.UniqueConstraint(
                fields=["node", "outcome"],
                name="cf_node_outcome_unique",
            )
        ]


class HorizontaloutcomeOutcome(models.Model):
    horizontal_outcome = models.ForeignKey(
        Horizontaloutcome,
        on_delete=models.CASCADE,
        related_name="horizontal_links",
    )
    outcome = models.ForeignKey(
        Outcome,
        on_delete=models.CASCADE,
        related_name="horizontal_link_rows",
    )

    class Meta:
        db_table = "cf_horizontaloutcome_outcome"
        constraints = [
            models.UniqueConstraint(
                fields=["horizontal_outcome", "outcome"],
                name="cf_horizontaloutcome_outcome_unique",
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
        db_table = "cf_favorite_project"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "project"],
                name="cf_favorite_project_unique",
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
        db_table = "cf_favorite_graph"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "graph"],
                name="cf_favorite_graph_unique",
            )
        ]
