import json
import os
import time

import pandas as pd
from celery.result import AsyncResult
from channels.routing import URLRouter
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.test.client import RequestFactory
from django.urls import re_path, reverse
from rest_framework.renderers import JSONRenderer

from course_flow import tasks
from course_flow.consumers import WorkflowUpdateConsumer
from course_flow.models import (
    Activity,
    Column,
    ColumnWorkflow,
    Comment,
    Course,
    Discipline,
    Favourite,
    Node,
    NodeLink,
    NodeWeek,
    ObjectPermission,
    Outcome,
    OutcomeHorizontalLink,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    Program,
    Project,
    Week,
    WeekWorkflow,
    Workflow,
    WorkflowProject,
)
from course_flow.utils import (
    get_model_from_str,
    get_parent_model,
    get_parent_model_str,
)

from .utils import check_order, get_author, login, make_object

TESTJSON_FILENAME = os.path.join(os.path.dirname(__file__), "test_json.json")
TESTNODESXLS_FILENAME = os.path.join(
    os.path.dirname(__file__), "test_nodes.xls"
)
TESTNODESCSV_FILENAME = os.path.join(
    os.path.dirname(__file__), "test_nodes.csv"
)
TESTOUTCOMESXLS_FILENAME = os.path.join(
    os.path.dirname(__file__), "test_outcomes.xls"
)
TESTOUTCOMESCSV_FILENAME = os.path.join(
    os.path.dirname(__file__), "test_outcomes.csv"
)


class ModelViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_home_view(self):
        response = self.client.get(reverse("course_flow:home"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("course_flow:home"))
        self.assertEqual(response.status_code, 200)

    def test_myprojects_view(self):
        response = self.client.get(reverse("course_flow:my-projects"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("course_flow:my-projects"))
        self.assertEqual(response.status_code, 200)

    def test_myfavourites_view(self):
        response = self.client.get(reverse("course_flow:my-favourites"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("course_flow:my-favourites"))
        self.assertEqual(response.status_code, 200)

    def test_mytemplates_view(self):
        response = self.client.get(reverse("course_flow:my-templates"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("course_flow:my-templates"))
        self.assertEqual(response.status_code, 200)

    def test_project_update_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        response = self.client.get(
            reverse("course_flow:project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 302)
        user = login(self)
        response = self.client.get(
            reverse("course_flow:project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 403)
        project.published = True
        project.save()
        response = self.client.get(
            reverse("course_flow:project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 200)
        project.published = False
        project.save()
        ObjectPermission.objects.create(
            user=user,
            content_object=project,
            permission_type=ObjectPermission.PERMISSION_VIEW,
        )
        response = self.client.get(
            reverse("course_flow:project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 200)
        ObjectPermission.objects.create(
            user=user,
            content_object=project,
            permission_type=ObjectPermission.PERMISSION_EDIT,
        )
        response = self.client.get(
            reverse("course_flow:project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 200)
        ObjectPermission.objects.create(
            user=user,
            content_object=project,
            permission_type=ObjectPermission.PERMISSION_NONE,
        )
        response = self.client.get(
            reverse("course_flow:project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 403)

    #    def test_outcome_detail_view(self):
    #        author = get_author()
    #        project = Project.objects.create(author=author)
    #        outcome = make_object("outcome", author)
    #        OutcomeProject.objects.create(outcome=outcome, project=project)
    #        response = self.client.get(
    #            reverse("course_flow:outcome-detail-view", args=[outcome.pk])
    #        )
    #        self.assertEqual(response.status_code, 302)
    #        login(self)
    #        project = Project.objects.create(author=author)
    #        outcome = make_object("outcome", author)
    #        OutcomeProject.objects.create(outcome=outcome, project=project)
    #        response = self.client.get(
    #            reverse("course_flow:outcome-detail-view", args=[outcome.pk])
    #        )
    #        self.assertEqual(response.status_code, 403)
    #        outcome.published = True
    #        outcome.save()
    #        response = self.client.get(
    #            reverse("course_flow:outcome-detail-view", args=[outcome.pk])
    #        )
    #        self.assertEqual(response.status_code, 200)
    #
    #    def test_outcome_update_view(self):
    #        author = get_author()
    #        project = Project.objects.create(author=author)
    #        outcome = make_object("outcome", author)
    #        OutcomeProject.objects.create(outcome=outcome, project=project)
    #        response = self.client.get(
    #            reverse("course_flow:outcome-update", args=[outcome.pk])
    #        )
    #        self.assertEqual(response.status_code, 302)
    #        login(self)
    #        project = Project.objects.create(author=author)
    #        outcome = make_object("outcome", author)
    #        OutcomeProject.objects.create(outcome=outcome, project=project)
    #        response = self.client.get(
    #            reverse("course_flow:outcome-update", args=[outcome.pk])
    #        )
    #        self.assertEqual(response.status_code, 403)
    #
    #    def test_outcome_update_view_is_owner(self):
    #        user = login(self)
    #        project = Project.objects.create(author=user)
    #        outcome = make_object("outcome", user)
    #        OutcomeProject.objects.create(outcome=outcome, project=project)
    #        response = self.client.get(
    #            reverse("course_flow:outcome-update", args=[outcome.pk])
    #        )
    #        self.assertEqual(response.status_code, 200)

    def test_workflow_update_view(self):
        author = get_author()
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=author)
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            self.assertEqual(response.status_code, 302)
        user = login(self)
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=author)
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            self.assertEqual(response.status_code, 403)
        project = Project.objects.create(author=author)

        for workflow_type in ["activity", "course", "program"]:
            workflow = make_object(workflow_type, author)
            ObjectPermission.objects.create(
                user=user,
                content_object=workflow,
                permission_type=ObjectPermission.PERMISSION_VIEW,
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            self.assertEqual(response.status_code, 200)
            ObjectPermission.objects.create(
                user=user,
                content_object=workflow,
                permission_type=ObjectPermission.PERMISSION_EDIT,
            )
            response = self.client.get(
                reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            self.assertEqual(response.status_code, 200)
            ObjectPermission.objects.create(
                user=user,
                content_object=workflow,
                permission_type=ObjectPermission.PERMISSION_NONE,
            )
            response = self.client.get(
                reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            self.assertEqual(response.status_code, 403)

    def test_workflow_update_view_is_owner(self):
        user = login(self)
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=user)
            workflow = make_object(workflow_type, user)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            self.assertEqual(response.status_code, 200)

    def test_project_create_view(self):
        response = self.client.get(reverse("course_flow:project-create"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("course_flow:project-create"))
        self.assertEqual(response.status_code, 200)

    #    def test_outcome_create_view(self):
    #        author = get_author()
    #        project = Project.objects.create(author=author)
    #        response = self.client.get(
    #            reverse("course_flow:outcome-create", args=[project.id])
    #        )
    #        self.assertEqual(response.status_code, 302)
    #        user = login(self)
    #        response = self.client.get(
    #            reverse("course_flow:outcome-create", args=[project.id])
    #        )
    #        self.assertEqual(response.status_code, 403)
    #        project2 = Project.objects.create(author=user)
    #        response = self.client.get(
    #            reverse("course_flow:outcome-create", args=[project2.id])
    #        )
    #        self.assertEqual(response.status_code, 200)

    def test_program_create_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        response = self.client.get(
            reverse("course_flow:program-create", args=[project.id])
        )
        self.assertEqual(response.status_code, 302)
        user = login(self)
        response = self.client.get(
            reverse("course_flow:program-create", args=[project.id])
        )
        self.assertEqual(response.status_code, 403)
        project2 = Project.objects.create(author=user)
        response = self.client.get(
            reverse("course_flow:program-create", args=[project2.id])
        )
        self.assertEqual(response.status_code, 200)

    def test_course_create_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        response = self.client.get(
            reverse("course_flow:course-create", args=[project.id])
        )
        self.assertEqual(response.status_code, 302)
        user = login(self)
        response = self.client.get(
            reverse("course_flow:course-create", args=[project.id])
        )
        self.assertEqual(response.status_code, 403)
        project2 = Project.objects.create(author=user)
        response = self.client.get(
            reverse("course_flow:course-create", args=[project2.id])
        )
        self.assertEqual(response.status_code, 200)

    def test_activity_create_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        response = self.client.get(
            reverse("course_flow:activity-create", args=[project.id])
        )
        self.assertEqual(response.status_code, 302)
        user = login(self)
        response = self.client.get(
            reverse("course_flow:activity-create", args=[project.id])
        )
        self.assertEqual(response.status_code, 403)
        project2 = Project.objects.create(author=user)
        response = self.client.get(
            reverse("course_flow:activity-create", args=[project2.id])
        )
        self.assertEqual(response.status_code, 200)

    def test_add_node_new_column(self):
        user = login(self)
        for i, object_type in enumerate(["activity", "course", "program"]):
            workflow = make_object(object_type, user)
            # Check for the default columns
            self.assertEqual(
                workflow.columns.all().count(), len(workflow.DEFAULT_COLUMNS)
            )
            # Get the base week and the first column
            base_week = WeekWorkflow.objects.get(
                workflow=workflow, rank=0
            ).week
            first_column = ColumnWorkflow.objects.get(
                workflow=workflow, rank=0
            ).column
            # Add a node to the base week that adds a new column
            response = self.client.post(
                reverse("course_flow:new-node"),
                {
                    "weekPk": str(base_week.id),
                    "columnPk": "null",
                    "columnType": str(workflow.DEFAULT_CUSTOM_COLUMN),
                    "position": 0,
                },
            )
            # Check that a new column has been added
            self.assertEqual(
                workflow.columns.all().count(),
                len(workflow.DEFAULT_COLUMNS) + 1,
            )
            check_order(self, workflow.columnworkflow_set)
            Node.objects.all().delete()
            Week.objects.all().delete()
            Column.objects.all().delete()

    def test_outcome_views(self):
        user = login(self)
        base_outcome = make_object("outcome", user)
        workflow = make_object("course", user)
        OutcomeWorkflow.objects.create(outcome=base_outcome, workflow=workflow)
        self.assertEqual(base_outcome.depth, 0)
        response = self.client.post(
            reverse("course_flow:insert-child"),
            {
                "objectID": str(base_outcome.id),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        # check that child has been added and has correct depth
        self.assertEqual(Outcome.objects.all().count(), 2)
        child1 = Outcome.objects.last()
        self.assertEqual(child1.depth, 1)
        # Add sub-children
        response = self.client.post(
            reverse("course_flow:insert-child"),
            {
                "objectID": str(child1.id),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        response = self.client.post(
            reverse("course_flow:insert-child"),
            {
                "objectID": str(child1.id),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        check_order(self, child1.child_outcome_links)
        subchild1 = child1.child_outcome_links.first().child
        subchild2 = child1.child_outcome_links.last().child
        subchildlink1 = OutcomeOutcome.objects.get(child=subchild1)
        subchildlink2 = OutcomeOutcome.objects.get(child=subchild2)
        self.assertEqual(subchildlink1.child.depth, 2)
        self.assertEqual(subchildlink1.rank, 0)
        self.assertEqual(subchildlink2.rank, 1)
        # swap the children
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": str(subchild2.id),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
                "parentID": str(child1.id),
                "newPosition": str(0),
                "inserted": "true",
                "parentType": JSONRenderer().render("outcome").decode("utf-8"),
                "throughType": JSONRenderer()
                .render("outcomeoutcome")
                .decode("utf-8"),
            },
        )
        subchildlink1 = OutcomeOutcome.objects.get(child=subchild1)
        subchildlink2 = OutcomeOutcome.objects.get(child=subchild2)
        self.assertEqual(subchildlink2.rank, 0)
        self.assertEqual(subchildlink1.rank, 1)
        self.assertEqual(subchildlink2.child.depth, 2)
        check_order(self, child1.child_outcome_links)
        # swap a child into the base outcome
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": str(subchild2.id),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
                "parentID": str(base_outcome.id),
                "newPosition": str(0),
                "inserted": "true",
                "parentType": JSONRenderer().render("outcome").decode("utf-8"),
                "throughType": JSONRenderer()
                .render("outcomeoutcome")
                .decode("utf-8"),
            },
        )
        subchildlink1 = OutcomeOutcome.objects.get(child=subchild1)
        subchildlink2 = OutcomeOutcome.objects.get(child=subchild2)
        self.assertEqual(subchildlink1.rank, 0)
        self.assertEqual(subchildlink2.rank, 0)
        self.assertEqual(subchildlink2.parent.id, base_outcome.id)
        check_order(self, child1.child_outcome_links)
        check_order(self, base_outcome.child_outcome_links)
        self.assertEqual(subchildlink2.child.depth, 1)

    def test_add_week_column_node(self):
        user = login(self)
        for i, object_type in enumerate(["activity", "course", "program"]):
            workflow = make_object(object_type, user)
            # Check for the default week
            self.assertEqual(workflow.weeks.all().count(), 1)
            # Check for the default columns
            self.assertEqual(
                workflow.columns.all().count(), len(workflow.DEFAULT_COLUMNS)
            )
            # Get the base week and the first column
            base_week = WeekWorkflow.objects.get(
                workflow=workflow, rank=0
            ).week
            first_column = ColumnWorkflow.objects.get(
                workflow=workflow, rank=0
            ).column
            # Add a custom column to the base week
            response = self.client.post(
                reverse("course_flow:insert-sibling"),
                {
                    "objectID": str(first_column.id),
                    "objectType": JSONRenderer()
                    .render("column")
                    .decode("utf-8"),
                    "parentID": str(workflow.id),
                    "parentType": JSONRenderer()
                    .render("workflow")
                    .decode("utf-8"),
                    "throughType": JSONRenderer()
                    .render("columnworkflow")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            # Add a node to the base week
            response = self.client.post(
                reverse("course_flow:new-node"),
                {
                    "weekPk": str(base_week.id),
                    "columnPk": str(first_column.id),
                    "columnType": str(first_column.column_type),
                    "position": 0,
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(Node.objects.all().count(), 1)
            first_node = base_week.nodes.all().first()
            # Insert a node below the node
            response = self.client.post(
                reverse("course_flow:insert-sibling"),
                {
                    "objectID": str(first_node.id),
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                    "parentID": str(base_week.id),
                    "parentType": JSONRenderer()
                    .render("week")
                    .decode("utf-8"),
                    "throughType": JSONRenderer()
                    .render("nodeweek")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(Node.objects.all().count(), 2)
            # Insert a week below the week
            response = self.client.post(
                reverse("course_flow:insert-sibling"),
                {
                    "objectID": base_week.id,
                    "objectType": JSONRenderer()
                    .render("week")
                    .decode("utf-8"),
                    "parentID": workflow.id,
                    "parentType": JSONRenderer()
                    .render("workflow")
                    .decode("utf-8"),
                    "throughType": JSONRenderer()
                    .render("weekworkflow")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(Week.objects.all().count(), 2)

            # Update the titles
            new_values = {"title": "test title 1"}
            response = self.client.post(
                reverse("course_flow:update-value"),
                {
                    "objectID": base_week.id,
                    "objectType": JSONRenderer()
                    .render("week")
                    .decode("utf-8"),
                    "data": JSONRenderer().render(new_values).decode("utf-8"),
                },
            )
            base_week = WeekWorkflow.objects.get(
                workflow=workflow, rank=0
            ).week
            self.assertEqual(response.status_code, 200)
            self.assertEqual(base_week.title, "test title 1")
            response = self.client.post(
                reverse("course_flow:update-value"),
                {
                    "objectID": first_node.id,
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                    "data": JSONRenderer().render(new_values).decode("utf-8"),
                },
            )
            first_node = NodeWeek.objects.get(week=base_week, rank=0).node
            self.assertEqual(response.status_code, 200)
            self.assertEqual(first_node.title, "test title 1")
            response = self.client.post(
                reverse("course_flow:update-value"),
                {
                    "objectID": first_column.id,
                    "objectType": JSONRenderer()
                    .render("column")
                    .decode("utf-8"),
                    "data": JSONRenderer().render(new_values).decode("utf-8"),
                },
            )
            first_column = ColumnWorkflow.objects.get(
                workflow=workflow, rank=0
            ).column
            self.assertEqual(response.status_code, 200)
            self.assertEqual(first_node.title, "test title 1")
            # Add more nodes to the base week
            for column in workflow.columns.all():
                self.client.post(
                    reverse("course_flow:new-node"),
                    {
                        "weekPk": str(base_week.id),
                        "columnPk": str(column.id),
                        "columnType": str(column.column_type),
                        "position": 0,
                    },
                )
            second_column = ColumnWorkflow.objects.get(
                workflow=workflow, rank=1
            ).column
            second_week = WeekWorkflow.objects.get(
                workflow=workflow, rank=1
            ).week
            check_order(self, base_week.nodeweek_set)
            # reorder the nodes
            # Move rank 1 up a rank, down a rank, and not at all
            for change in [0, 1, -1, 99, -99]:
                to_move = NodeWeek.objects.get(week=base_week, rank=1).node
                response = self.client.post(
                    reverse("course_flow:inserted-at"),
                    {
                        "objectID": to_move.id,
                        "parentID": base_week.id,
                        "objectType": JSONRenderer()
                        .render("node")
                        .decode("utf-8"),
                        "inserted": "true",
                        "newPosition": 1 + change,
                        "parentType": JSONRenderer()
                        .render("week")
                        .decode("utf-8"),
                        "throughType": JSONRenderer()
                        .render("nodeweek")
                        .decode("utf-8"),
                    },
                )
                self.assertEqual(response.status_code, 200)
                to_move_through = NodeWeek.objects.get(node=to_move)
                self.assertEqual(
                    to_move_through.rank,
                    max(min(1 + change, base_week.nodes.count() - 1), 0),
                )
                check_order(self, base_week.nodeweek_set)
            # move some nodes into the second week
            for position in [0, 1, -1]:
                to_move = NodeWeek.objects.get(week=base_week, rank=0).node
                response = self.client.post(
                    reverse("course_flow:inserted-at"),
                    {
                        "objectID": to_move.id,
                        "parentID": second_week.id,
                        "objectType": JSONRenderer()
                        .render("node")
                        .decode("utf-8"),
                        "inserted": "true",
                        "newPosition": position,
                        "parentType": JSONRenderer()
                        .render("week")
                        .decode("utf-8"),
                        "throughType": JSONRenderer()
                        .render("nodeweek")
                        .decode("utf-8"),
                    },
                )
                self.assertEqual(response.status_code, 200)
                to_move_through = NodeWeek.objects.get(node=to_move)
                self.assertEqual(
                    to_move_through.rank,
                    max(min(position, second_week.nodes.count() - 1), 0),
                )
                self.assertEqual(to_move_through.week.id, second_week.id)
                check_order(self, base_week.nodeweek_set)
                check_order(self, second_week.nodeweek_set)
            # swap two weeks
            to_move = base_week
            response = self.client.post(
                reverse("course_flow:inserted-at"),
                {
                    "objectID": to_move.id,
                    "parentID": workflow.id,
                    "objectType": JSONRenderer()
                    .render("week")
                    .decode("utf-8"),
                    "newPosition": 1,
                    "inserted": "true",
                    "parentType": JSONRenderer()
                    .render("workflow")
                    .decode("utf-8"),
                    "throughType": JSONRenderer()
                    .render("weekworkflow")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            to_move_through = WeekWorkflow.objects.get(week=to_move)
            self.assertEqual(to_move_through.rank, 1)
            check_order(self, workflow.weekworkflow_set)
            # swap two columns
            to_move = first_column
            response = self.client.post(
                reverse("course_flow:inserted-at"),
                {
                    "objectID": to_move.id,
                    "parentID": workflow.id,
                    "objectType": JSONRenderer()
                    .render("column")
                    .decode("utf-8"),
                    "newPosition": 1,
                    "inserted": "true",
                    "parentType": JSONRenderer()
                    .render("workflow")
                    .decode("utf-8"),
                    "throughType": JSONRenderer()
                    .render("columnworkflow")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            to_move_through = ColumnWorkflow.objects.get(column=to_move)
            self.assertEqual(to_move_through.rank, 1)
            check_order(self, workflow.columnworkflow_set)
            # test delete
            base_week = WeekWorkflow.objects.get(
                workflow=workflow, rank=0
            ).week
            number_of_nodes = base_week.nodes.count()
            node = base_week.nodes.all().first()
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": node.id,
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(base_week.nodes.count(), number_of_nodes - 1)
            check_order(self, base_week.nodeweek_set)
            number_of_weeks = workflow.weeks.count()
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": base_week.id,
                    "objectType": JSONRenderer()
                    .render("week")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(workflow.weeks.count(), number_of_weeks - 1)
            check_order(self, workflow.weekworkflow_set)

            Node.objects.all().delete()
            Week.objects.all().delete()
            Column.objects.all().delete()

    def test_linked_wf_no_login_no_authorship(self):
        author = get_author()
        project = make_object("project", author)
        activity = make_object("activity", author)
        course = make_object("course", author)
        WorkflowProject.objects.create(workflow=activity, project=project)
        week = course.weeks.create(author=author)
        node = week.nodes.create(author=author)
        response = self.client.post(
            reverse("course_flow:set-linked-workflow"),
            {"nodePk": node.id, "workflowPk": activity.id},
        )
        self.assertEqual(response.status_code, 401)
        login(self)
        response = self.client.post(
            reverse("course_flow:set-linked-workflow"),
            {"nodePk": node.id, "workflowPk": activity.id},
        )
        self.assertEqual(response.status_code, 403)

    # Test for linking a workflow. Nothing should change except for the node
    def test_linked_wf_same_project(self):
        author = login(self)
        project = make_object("project", author)
        activity = make_object("activity", author)
        course = make_object("course", author)
        WorkflowProject.objects.create(workflow=activity, project=project)
        WorkflowProject.objects.create(workflow=course, project=project)
        week = course.weeks.create(author=author)
        node = week.nodes.create(author=author, column=course.columns.first())
        response = self.client.post(
            reverse("course_flow:set-linked-workflow"),
            {"nodePk": node.id, "workflowPk": activity.id},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            Node.objects.get(id=node.id).linked_workflow.id, activity.id
        )
        self.assertEqual(Activity.objects.all().count(), 1)

    # Test for linking a workflow from another project. The workflow should be duplicated into the project
    def test_linked_wf_same_author(self):
        author = login(self)
        project = make_object("project", author)
        project2 = make_object("project", author)
        activity = make_object("activity", author)
        course = make_object("course", author)
        WorkflowProject.objects.create(workflow=activity, project=project2)
        WorkflowProject.objects.create(workflow=course, project=project)
        activity.weeks.create(author=author)
        week = course.weeks.create(author=author)
        node = week.nodes.create(author=author)
        response = self.client.post(
            reverse("course_flow:set-linked-workflow"),
            {"nodePk": node.id, "workflowPk": activity.id},
        )
        self.assertEqual(response.status_code, 200)
        new_activity = Node.objects.get(id=node.id).linked_workflow
        self.assertNotEqual(new_activity.id, activity.id)
        self.assertEqual(new_activity.id, project.workflows.last().id)
        self.assertEqual(Activity.objects.all().count(), 2)
        self.assertEqual(Week.objects.all().count(), 6)
        self.assertEqual(new_activity.parent_workflow.id, activity.id)

    # We try first for an unpublished, then a published project
    def test_linked_wf_different_author(self):
        author = get_author()
        user = login(self)
        project = make_object("project", user)
        project2 = make_object("project", author)
        activity = make_object("activity", author)
        course = make_object("course", user)
        WorkflowProject.objects.create(workflow=activity, project=project2)
        WorkflowProject.objects.create(workflow=course, project=project)
        activity.weeks.create(author=author)
        week = course.weeks.create(author=user)
        node = week.nodes.create(author=user)
        response = self.client.post(
            reverse("course_flow:set-linked-workflow"),
            {"nodePk": node.id, "workflowPk": activity.id},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Node.objects.get(id=node.id).linked_workflow, None)
        project2.published = True
        activity.published = True
        activity.save()
        project2.save()
        response = self.client.post(
            reverse("course_flow:set-linked-workflow"),
            {"nodePk": node.id, "workflowPk": activity.id},
        )
        self.assertEqual(response.status_code, 200)
        new_activity = Node.objects.get(id=node.id).linked_workflow
        self.assertEqual(new_activity.get_subclass().author, project.author)
        self.assertNotEqual(
            activity.author, new_activity.get_subclass().author
        )
        self.assertNotEqual(new_activity.id, activity.id)
        self.assertEqual(new_activity.id, project.workflows.last().id)
        self.assertEqual(Activity.objects.all().count(), 2)
        self.assertEqual(Week.objects.all().count(), 6)
        self.assertEqual(new_activity.parent_workflow.id, activity.id)

    def test_add_strategy_no_login_no_authorship(self):
        author = get_author()
        strategy = Activity.objects.create(author=author, is_strategy=True)
        # add some nodes to simulate a real strategy
        for column in strategy.columns.all():
            strategy.weeks.first().nodes.create(author=author, column=column)
        workflow = Activity.objects.create(author=author)
        response = self.client.post(
            reverse("course_flow:add-strategy"),
            {
                "workflowPk": workflow.id,
                "objectID": strategy.id,
                "objectType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "position": 1,
            },
        )
        self.assertEqual(response.status_code, 401)
        login(self)
        response = self.client.post(
            reverse("course_flow:add-strategy"),
            {
                "workflowPk": workflow.id,
                "objectID": strategy.id,
                "objectType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "position": 1,
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_add_strategy_same_columns(self):
        user = login(self)
        strategy = Activity.objects.create(author=user, is_strategy=True)
        # add some nodes to simulate a real strategy
        for column in strategy.columns.all():
            strategy.weeks.first().nodes.create(author=user, column=column)
        workflow = Activity.objects.create(author=user)
        response = self.client.post(
            reverse("course_flow:add-strategy"),
            {
                "workflowPk": workflow.id,
                "objectID": strategy.id,
                "objectType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "position": 1,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(workflow.weeks.count(), 2)
        self.assertEqual(
            workflow.weeks.filter(nodes__isnull=False)
            .values_list("nodes", flat=True)
            .count(),
            4,
        )
        self.assertEqual(workflow.columns.count(), 4)

    def test_add_strategy_extra_columns(self):
        user = login(self)
        strategy = Activity.objects.create(author=user, is_strategy=True)
        # add two extra columns
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": str(strategy.columns.first().id),
                "objectType": JSONRenderer().render("column").decode("utf-8"),
                "parentID": str(strategy.id),
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("columnworkflow")
                .decode("utf-8"),
            },
        )
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": str(strategy.columns.first().id),
                "objectType": JSONRenderer().render("column").decode("utf-8"),
                "parentID": str(strategy.id),
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("columnworkflow")
                .decode("utf-8"),
            },
        )
        # add some nodes to simulate a real strategy
        for column in strategy.columns.all():
            strategy.weeks.first().nodes.create(author=user, column=column)
        workflow = Activity.objects.create(author=user)
        response = self.client.post(
            reverse("course_flow:add-strategy"),
            {
                "workflowPk": workflow.id,
                "objectID": strategy.id,
                "objectType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "position": 0,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(workflow.weeks.count(), 2)
        self.assertEqual(
            workflow.weeks.filter(nodes__isnull=False)
            .values_list("nodes", flat=True)
            .count(),
            6,
        )
        self.assertEqual(workflow.columns.count(), 6)
        # check to make sure all nodes have different columns. This acts as a check that a) they have been assigned to the new columns in the workflow and b) the two nodes that were in different custom columns did not get placed into the same custom column
        column_array = []
        for node in Node.objects.all():
            self.assertEqual((node.column.id in column_array), False)
            column_array.append(node.column.id)

    def test_convert_to_strategy(self):
        user = login(self)
        workflow = Activity.objects.create(author=user)
        week = workflow.weeks.create(author=user)
        # add some nodes to simulate a real strategy
        for column in workflow.columns.all():
            week.nodes.create(author=user, column=column)
        workflow.weeks.create(author=user)
        response = self.client.post(
            reverse("course_flow:toggle-strategy"),
            {
                "weekPk": week.id,
                "is_strategy": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        # add a few more weeks
        self.assertEqual(week.is_strategy, False)
        response = self.client.post(
            reverse("course_flow:toggle-strategy"),
            {
                "weekPk": week.id,
                "is_strategy": JSONRenderer().render(False).decode("utf-8"),
            },
        )
        week = workflow.weeks.get(id=week.id)
        self.assertEqual(week.is_strategy, True)
        strategy = Workflow.objects.get(is_strategy=True)
        self.assertEqual(week.original_strategy, strategy)
        self.assertEqual(strategy.weeks.first().is_strategy, True)
        self.assertEqual(strategy.weeks.count(), 1)
        self.assertEqual(strategy.columns.count(), 4)
        self.assertEqual(
            strategy.weeks.filter(nodes__isnull=False)
            .values_list("nodes", flat=True)
            .count(),
            4,
        )

    def test_convert_from_strategy(self):
        user = login(self)
        strategy = Activity.objects.create(author=user, is_strategy=True)
        # add some nodes to simulate a real strategy
        for column in strategy.columns.all():
            strategy.weeks.first().nodes.create(author=user, column=column)
        workflow = Activity.objects.create(author=user)
        response = self.client.post(
            reverse("course_flow:add-strategy"),
            {
                "workflowPk": workflow.id,
                "objectID": strategy.id,
                "objectType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "position": 1,
            },
        )
        self.assertEqual(response.status_code, 200)
        week = workflow.weeks.get(is_strategy=True)
        response = self.client.post(
            reverse("course_flow:toggle-strategy"),
            {
                "weekPk": week.id,
                "is_strategy": JSONRenderer().render(False).decode("utf-8"),
            },
        )
        week = workflow.weeks.get(id=week.id)
        self.assertEqual(week.is_strategy, True)
        response = self.client.post(
            reverse("course_flow:toggle-strategy"),
            {
                "weekPk": week.id,
                "is_strategy": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        week = workflow.weeks.get(id=week.id)
        self.assertEqual(week.is_strategy, False)
        self.assertEqual(week.original_strategy, None)

    def test_delete_self_no_login_no_authorship(self):
        author = get_author()
        type_list = [
            "project",
            "program",
            "course",
            "activity",
            "week",
            "node",
            "column",
            "outcome",
        ]
        for object_type in type_list:
            object = make_object(object_type, author)
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": object.id,
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 401)
        login(self)
        for object_type in type_list:
            object = make_object(object_type, author)
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": object.id,
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 403)

    def test_update_value_no_login_no_authorship(self):
        author = get_author()
        type_list = [
            "program",
            "course",
            "activity",
            "week",
            "node",
            "column",
            "outcome",
        ]
        for object_type in type_list:
            object = make_object(object_type, author)
            response = self.client.post(
                reverse("course_flow:update-value"),
                {
                    "objectID": object.id,
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                    "data": JSONRenderer()
                    .render({"title": "test title 1"})
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 401)
        login(self)
        for object_type in type_list:
            object = make_object(object_type, author)
            response = self.client.post(
                reverse("course_flow:update-value"),
                {
                    "objectID": object.id,
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                    "data": JSONRenderer()
                    .render({"title": "test title 1"})
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 403)

    def test_reorder_no_login_no_authorship(self):
        author = get_author()
        week1 = make_object("week", author)
        node0 = week1.nodes.create(author=author)
        node1 = week1.nodes.create(author=author, through_defaults={"rank": 1})
        workflow1 = make_object("activity", author)
        column1 = make_object("column", author)
        columnworkflow1 = ColumnWorkflow.objects.create(
            column=column1, workflow=workflow1
        )
        WeekWorkflow.objects.create(week=week1, workflow=workflow1)
        node0.column = column1
        node1.column = column1
        node0.save()
        node1.save()
        to_move = NodeWeek.objects.get(week=week1, rank=0)
        # Try to move within the same week
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "parentID": week1.id,
                "newPosition": 1,
                "inserted": "true",
                "throughType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentType": JSONRenderer().render("week").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "columnChange": "true",
                "columnPk": str(columnworkflow1.column.id),
            },
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "parentID": week1.id,
                "newPosition": 1,
                "inserted": "true",
                "throughType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentType": JSONRenderer().render("week").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "columnChange": "true",
                "columnPk": str(columnworkflow1.column.id),
            },
        )
        self.assertEqual(response.status_code, 403)
        # Try to move from their stuff to your own
        week2 = make_object("week", user)
        node2 = week2.nodes.create(author=user)
        workflow2 = make_object("activity", user)
        weekworkflow2 = WeekWorkflow.objects.create(
            week=week2, workflow=workflow2
        )
        column2 = make_object("column", user)
        columnworkflow2 = ColumnWorkflow.objects.create(
            column=column2, workflow=workflow2
        )
        node2.column = column2
        node2.save()
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.node.id,
                "objectType": JSONRenderer().render("week").decode("utf-8"),
                "parentID": week2.id,
                "newPosition": 1,
                "inserted": "true",
                "throughType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentType": JSONRenderer().render("week").decode("utf-8"),
            },
        )
        self.assertEqual(
            NodeWeek.objects.get(node=to_move.node).week.id, week1.id
        )
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "columnChange": "true",
                "columnPk": str(columnworkflow2.column.id),
            },
        )
        self.assertEqual(
            Node.objects.get(id=to_move.node.id).column.id, column1.id
        )
        # Try to move from your stuff to theirs
        to_move = NodeWeek.objects.get(week=week2, rank=0)
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "columnChange": "true",
                "columnPk": str(columnworkflow1.column.id),
            },
        )
        self.assertEqual(
            Node.objects.get(id=to_move.node.id).column.id, column2.id
        )
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "parentID": week1.id,
                "newPosition": 1,
                "inserted": "true",
                "throughType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentType": JSONRenderer().render("week").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        # Finally, check to make sure these work when you own both
        week2b = make_object("week", user)
        weekworkflow2b = WeekWorkflow.objects.create(
            week=week2b, workflow=workflow2
        )
        column2b = make_object("column", user)
        columnworkflow2b = ColumnWorkflow.objects.create(
            column=column2b, workflow=workflow2
        )
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "columnChange": "true",
                "columnPk": str(column2b.id),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            Node.objects.get(id=to_move.node.id).column.id, column2b.id
        )
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "parentID": week2b.id,
                "newPosition": 0,
                "inserted": "true",
                "throughType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentType": JSONRenderer().render("week").decode("utf-8"),
            },
        )
        self.assertEqual(
            NodeWeek.objects.get(node=to_move.node).week.id, week2b.id
        )

    def test_insert_sibling_no_login_no_authorship(self):
        author = get_author()
        activity = make_object("activity", author)
        week = activity.weeks.create(author=author)
        node = week.nodes.create(
            author=author, column=activity.columns.first()
        )
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": node.id,
                "parentID": week.id,
                "parentType": JSONRenderer().render("week").decode("utf-8"),
                "throughType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "objectType": JSONRenderer().render("node").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": week.id,
                "parentID": activity.id,
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("weekworkflow")
                .decode("utf-8"),
                "objectType": JSONRenderer().render("week").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        login(self)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": node.id,
                "parentID": week.id,
                "parentType": JSONRenderer().render("week").decode("utf-8"),
                "throughType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "objectType": JSONRenderer().render("node").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": week.id,
                "parentID": activity.id,
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("weekworkflow")
                .decode("utf-8"),
                "objectType": JSONRenderer().render("week").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_insert_sibling(self):
        author = login(self)
        activity = make_object("activity", author)
        week = activity.weeks.create(author=author)
        node = week.nodes.create(
            author=author, column=activity.columns.first()
        )
        base_outcome = activity.outcomes.create(author=author)
        child_outcome = base_outcome.children.create(author=author)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": node.id,
                "parentID": week.id,
                "parentType": JSONRenderer().render("week").decode("utf-8"),
                "throughType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "objectType": JSONRenderer().render("node").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Node.objects.all().count(), 2)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": week.id,
                "parentID": activity.id,
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("weekworkflow")
                .decode("utf-8"),
                "objectType": JSONRenderer().render("week").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Week.objects.all().count(), 3)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": activity.columns.last().id,
                "parentID": activity.id,
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("columnworkflow")
                .decode("utf-8"),
                "objectType": JSONRenderer().render("column").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Column.objects.all().count(), 5)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": base_outcome.id,
                "parentID": activity.id,
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("outcomeworkflow")
                .decode("utf-8"),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Outcome.objects.all().count(), 3)
        self.assertEqual(OutcomeWorkflow.objects.all().count(), 2)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": child_outcome.id,
                "parentID": base_outcome.id,
                "parentType": JSONRenderer().render("outcome").decode("utf-8"),
                "throughType": JSONRenderer()
                .render("outcomeoutcome")
                .decode("utf-8"),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Outcome.objects.all().count(), 4)
        self.assertEqual(OutcomeOutcome.objects.all().count(), 2)

    def test_new_nodelink_permissions_no_login(self):
        author = get_author()
        node1 = make_object("node", author)
        node2 = make_object("node", author)
        response = self.client.post(
            reverse("course_flow:new-node-link"),
            {
                "nodePk": node1.id,
                "targetID": node2.id,
                "sourcePort": 2,
                "targetPort": 0,
            },
        )
        self.assertEqual(response.status_code, 401)

    def test_new_nodelink_permissions_no_authorship_second_node(self):
        myself = login(self)
        author = get_author()
        node1 = make_object("node", myself)
        node2 = make_object("node", author)
        response = self.client.post(
            reverse("course_flow:new-node-link"),
            {
                "nodePk": node1.id,
                "objectID": node2.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "sourcePort": 2,
                "targetPort": 0,
            },
        )
        self.assertEqual(NodeLink.objects.all().count(), 0)

    def test_new_nodelink_permissions_no_authorship(self):
        login(self)
        author = get_author()
        node1 = make_object("node", author)
        node2 = make_object("node", author)
        response = self.client.post(
            reverse("course_flow:new-node-link"),
            {
                "nodePk": node1.id,
                "objectID": node2.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "sourcePort": 2,
                "targetPort": 0,
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_add_remove_outcome_to_node_permissions_no_authorship(self):
        myself = login(self)
        author = get_author()
        activity = make_object("activity", author)
        node = make_object("node", author)
        node.column = activity.columns.first()
        node.save()
        week = make_object("week", author)
        NodeWeek.objects.create(node=node, week=week)
        WeekWorkflow.objects.create(week=week, workflow=activity)
        outcome = make_object("outcome", author)
        OutcomeWorkflow.objects.create(outcome=outcome, workflow=activity)
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": outcome.id, "degree": 1},
        )
        self.assertEqual(response.status_code, 403)
        outcomenode = OutcomeNode.objects.create(node=node, outcome=outcome)
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": outcome.id, "degree": 0},
        )
        outcomenode.delete()
        self.assertEqual(response.status_code, 403)
        myoutcome = make_object("outcome", myself)
        mynode = make_object("node", myself)
        myweek = make_object("week", myself)
        myactivity = make_object("activity", myself)
        mynode.column = myactivity.columns.first()
        mynode.save()
        OutcomeWorkflow.objects.create(outcome=myoutcome, workflow=myactivity)
        NodeWeek.objects.create(node=mynode, week=myweek)
        WeekWorkflow.objects.create(week=myweek, workflow=myactivity)
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": mynode.id, "outcomePk": outcome.id, "degree": 1},
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": myoutcome.id, "degree": 1},
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": mynode.id, "outcomePk": myoutcome.id, "degree": 1},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeNode.objects.count(), 1)
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": mynode.id, "outcomePk": myoutcome.id, "degree": 0},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeNode.objects.count(), 0)

    def test_update_outcomenode_degree_parents_children(self):
        user = login(self)
        node = make_object("node", user)
        week = make_object("week", user)
        activity = make_object("activity", user)
        node.column = activity.columns.first()
        node.save()
        NodeWeek.objects.create(node=node, week=week)
        WeekWorkflow.objects.create(week=week, workflow=activity)
        base_outcome = make_object("outcome", user)
        OutcomeWorkflow.objects.create(outcome=base_outcome, workflow=activity)
        oc1 = base_outcome.children.create(author=user)
        oc11 = oc1.children.create(author=user)
        oc12 = oc1.children.create(author=user)
        oc13 = oc1.children.create(author=user)
        oc2 = base_outcome.children.create(author=user)
        oc3 = base_outcome.children.create(author=user)
        # Add the base outcome, which should add all outcomes
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": base_outcome.id, "degree": 1},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeNode.objects.all().count(), 7)
        # Remove the base outcome, which should remove all outcomes
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": base_outcome.id, "degree": 0},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeNode.objects.all().count(), 0)
        OutcomeNode.objects.create(outcome=oc2, node=node)
        OutcomeNode.objects.create(outcome=oc3, node=node)
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": oc11.id, "degree": 1},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeNode.objects.all().count(), 3)
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": oc12.id, "degree": 1},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeNode.objects.all().count(), 4)
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": oc13.id, "degree": 1},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeNode.objects.all().count(), 7)
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": oc11.id, "degree": 0},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeNode.objects.all().count(), 4)

    def test_add_remove_horizontal_outcome_link_permissions_no_authorship(
        self,
    ):
        myself = login(self)
        author = get_author()
        program = make_object("program", author)
        course = make_object("course", author)
        program_outcome = program.outcomes.create(author=author)
        course_outcome = course.outcomes.create(author=author)
        myprogram = make_object("program", myself)
        mycourse = make_object("course", myself)
        myprogram_outcome = myprogram.outcomes.create(author=myself)
        mycourse_outcome = mycourse.outcomes.create(author=myself)
        response = self.client.post(
            reverse("course_flow:update-outcomehorizontallink-degree"),
            {
                "outcomePk": course_outcome.id,
                "objectID": program_outcome.id,
                "degree": JSONRenderer().render(1).decode("utf-8"),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:update-outcomehorizontallink-degree"),
            {
                "outcomePk": course_outcome.id,
                "objectID": myprogram_outcome.id,
                "degree": JSONRenderer().render(1).decode("utf-8"),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:update-outcomehorizontallink-degree"),
            {
                "outcomePk": mycourse_outcome.id,
                "objectID": program_outcome.id,
                "degree": JSONRenderer().render(1).decode("utf-8"),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        horizontal_link = OutcomeHorizontalLink.objects.create(
            outcome=course_outcome, parent_outcome=program_outcome
        )
        response = self.client.post(
            reverse("course_flow:update-outcomehorizontallink-degree"),
            {
                "outcomePk": mycourse_outcome.id,
                "objectID": program_outcome.id,
                "degree": JSONRenderer().render(0).decode("utf-8"),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:update-outcomehorizontallink-degree"),
            {
                "outcomePk": mycourse_outcome.id,
                "objectID": myprogram_outcome.id,
                "degree": JSONRenderer().render(1).decode("utf-8"),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.post(
            reverse("course_flow:delete-self"),
            {
                "outcomePk": mycourse_outcome.id,
                "objectID": myprogram_outcome.id,
                "degree": JSONRenderer().render(0).decode("utf-8"),
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)

    def test_update_outcomehorizontallink_degree_parents_children(self):
        user = login(self)
        activity = make_object("activity", user)
        course = make_object("course", user)
        base_outcome = make_object("outcome", user)
        OutcomeWorkflow.objects.create(outcome=base_outcome, workflow=course)
        oc1 = base_outcome.children.create(author=user)
        oc11 = oc1.children.create(author=user)
        oc12 = oc1.children.create(author=user)
        oc13 = oc1.children.create(author=user)
        oc2 = base_outcome.children.create(author=user)
        oc3 = base_outcome.children.create(author=user)
        child_outcome = make_object("outcome", user)
        OutcomeWorkflow.objects.create(
            outcome=child_outcome, workflow=activity
        )
        # Add the base outcome, which should add all outcomes
        response = self.client.post(
            reverse("course_flow:update-outcomehorizontallink-degree"),
            {
                "outcomePk": child_outcome.id,
                "objectID": base_outcome.id,
                "degree": 1,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeHorizontalLink.objects.all().count(), 7)
        # Remove the base outcome, which should remove all outcomes
        response = self.client.post(
            reverse("course_flow:update-outcomehorizontallink-degree"),
            {
                "outcomePk": child_outcome.id,
                "objectID": base_outcome.id,
                "degree": 0,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeHorizontalLink.objects.all().count(), 0)
        OutcomeHorizontalLink.objects.create(
            parent_outcome=oc2, outcome=child_outcome
        )
        OutcomeHorizontalLink.objects.create(
            parent_outcome=oc3, outcome=child_outcome
        )
        response = self.client.post(
            reverse("course_flow:update-outcomehorizontallink-degree"),
            {
                "outcomePk": child_outcome.id,
                "objectID": oc11.id,
                "degree": 1,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeHorizontalLink.objects.all().count(), 3)
        response = self.client.post(
            reverse("course_flow:update-outcomehorizontallink-degree"),
            {
                "outcomePk": child_outcome.id,
                "objectID": oc12.id,
                "degree": 1,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeHorizontalLink.objects.all().count(), 4)
        response = self.client.post(
            reverse("course_flow:update-outcomehorizontallink-degree"),
            {
                "outcomePk": child_outcome.id,
                "objectID": oc13.id,
                "degree": 1,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeHorizontalLink.objects.all().count(), 7)
        response = self.client.post(
            reverse("course_flow:update-outcomehorizontallink-degree"),
            {
                "outcomePk": child_outcome.id,
                "objectID": oc11.id,
                "degree": 0,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(OutcomeHorizontalLink.objects.all().count(), 4)

    # Previously tested the automatic removal of horizontal links. No longer really a desired feature.
    def test_horizontal_outcome_link_on_node_unlink(self):
        author = login(self)
        program = make_object("program", author)
        course = make_object("course", author)
        program_outcome = program.outcomes.create(author=author)
        course_outcome = course.outcomes.create(author=author)
        node = program.weeks.create(author=author).nodes.create(author=author)
        node.linked_workflow = course
        node.save()
        OutcomeNode.objects.create(node=node, outcome=program_outcome)

        # test basic scenario
        horizontal_link = OutcomeHorizontalLink.objects.create(
            outcome=course_outcome, parent_outcome=program_outcome
        )
        node.linked_workflow = None
        node.save()
        # self.assertEqual(OutcomeHorizontalLink.objects.count(), 0)
        node.linked_workflow = course
        node.save()

        # more complex scenario with multiple linked nodes
        node2 = program.weeks.first().nodes.create(author=author)
        node2.linked_workflow = course
        node2.save()
        OutcomeNode.objects.create(node=node2, outcome=program_outcome)
        horizontal_link = OutcomeHorizontalLink.objects.create(
            outcome=course_outcome, parent_outcome=program_outcome
        )
        node.linked_workflow = None
        node.save()
        # self.assertEqual(OutcomeHorizontalLink.objects.count(), 1)

        # deleting a node
        node2.delete()
        # self.assertEqual(OutcomeHorizontalLink.objects.count(), 0)

    # Previously tested the automatic removal of horizontal links. No longer really a desired feature.
    def test_horizontal_outcome_link_on_outcomenode_delete(self):
        author = login(self)
        program = make_object("program", author)
        course = make_object("course", author)
        program_outcome = program.outcomes.create(author=author)
        course_outcome = course.outcomes.create(author=author)
        node = program.weeks.create(author=author).nodes.create(author=author)
        node.linked_workflow = course
        node.save()
        horizontal_link = OutcomeHorizontalLink.objects.create(
            outcome=course_outcome, parent_outcome=program_outcome
        )
        outcomenode = OutcomeNode.objects.create(
            node=node, outcome=program_outcome
        )

        # test basic scenario
        outcomenode.delete()
        # self.assertEqual(OutcomeHorizontalLink.objects.count(), 0)
        outcomenode = OutcomeNode.objects.create(
            node=node, outcome=program_outcome
        )
        horizontal_link = OutcomeHorizontalLink.objects.create(
            outcome=course_outcome, parent_outcome=program_outcome
        )

        # more complex scenario with multiple linked nodes
        node2 = program.weeks.first().nodes.create(author=author)
        node2.linked_workflow = course
        node2.save()
        OutcomeNode.objects.create(node=node2, outcome=program_outcome)
        outcomenode.delete()
        # self.assertEqual(OutcomeHorizontalLink.objects.count(), 1)

    def test_horizontal_outcome_link_on_outcome_delete(self):
        author = login(self)
        program = make_object("program", author)
        course = make_object("course", author)
        program_outcome = program.outcomes.create(author=author)
        course_outcome = course.outcomes.create(author=author)
        node = program.weeks.create(author=author).nodes.create(author=author)
        node.linked_workflow = course
        node.save()
        horizontal_link = OutcomeHorizontalLink.objects.create(
            outcome=course_outcome, parent_outcome=program_outcome
        )
        outcomenode = OutcomeNode.objects.create(
            node=node, outcome=program_outcome
        )

        # test basic scenario
        course_outcome.delete()
        self.assertEqual(OutcomeHorizontalLink.objects.count(), 0)

    def test_duplicate_self_permissions_no_login_no_authorship(self):
        author = get_author()
        activity = make_object("activity", author)
        week = WeekWorkflow.objects.get(workflow=activity).week
        node = week.nodes.create(author=author, title="test_title")
        node.column = activity.columnworkflow_set.first().column
        node.save()
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "parentType": JSONRenderer().render("week").decode("utf-8"),
                "throughType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentID": week.id,
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": week.id,
                "objectType": JSONRenderer().render("week").decode("utf-8"),
                "parentID": activity.id,
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("weekworkflow")
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": activity.columnworkflow_set.first().column.id,
                "objectType": JSONRenderer().render("column").decode("utf-8"),
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("columnworkflow")
                .decode("utf-8"),
                "parentID": activity.id,
            },
        )
        self.assertEqual(response.status_code, 401)

    def test_duplicate_self_permissions_no_authorship(self):
        author = get_author()
        login(self)
        activity = make_object("activity", author)
        week = WeekWorkflow.objects.get(workflow=activity).week
        node = week.nodes.create(author=author, title="test_title")
        node.column = activity.columnworkflow_set.first().column
        node.save()
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "parentType": JSONRenderer().render("week").decode("utf-8"),
                "throughType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentID": week.id,
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": week.id,
                "objectType": JSONRenderer().render("week").decode("utf-8"),
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("weekworkflow")
                .decode("utf-8"),
                "parentID": activity.id,
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": activity.columnworkflow_set.first().column.id,
                "objectType": JSONRenderer().render("column").decode("utf-8"),
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("columnworkflow")
                .decode("utf-8"),
                "parentID": activity.id,
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_duplicate_self(self):
        author = login(self)
        activity = make_object("activity", author)
        week = WeekWorkflow.objects.get(workflow=activity).week
        node = week.nodes.create(author=author, title="test_title")
        node.column = activity.columnworkflow_set.first().column
        node.save()
        node2 = week.nodes.create(author=author, title="test_title")
        node2.column = activity.columnworkflow_set.first().column
        node2.save()
        base_outcome = Outcome.objects.create(
            author=author, title="test_title"
        )
        child_outcome = Outcome.objects.create(
            author=author, title="test_child"
        )
        OutcomeWorkflow.objects.create(workflow=activity, outcome=base_outcome)
        OutcomeOutcome.objects.create(parent=base_outcome, child=child_outcome)
        nodelink = NodeLink.objects.create(
            source_node=node, target_node=node2, source_port=2, target_port=0
        )
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "parentType": JSONRenderer().render("week").decode("utf-8"),
                "throughType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentID": week.id,
            },
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": week.id,
                "objectType": JSONRenderer().render("week").decode("utf-8"),
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("weekworkflow")
                .decode("utf-8"),
                "parentID": activity.id,
            },
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": activity.columnworkflow_set.first().column.id,
                "objectType": JSONRenderer().render("column").decode("utf-8"),
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("columnworkflow")
                .decode("utf-8"),
                "parentID": activity.id,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Node.objects.all().count(), 6)
        self.assertEqual(NodeLink.objects.all().count(), 2)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": child_outcome.id,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
                "parentType": JSONRenderer().render("outcome").decode("utf-8"),
                "throughType": JSONRenderer()
                .render("outcomeoutcome")
                .decode("utf-8"),
                "parentID": base_outcome.id,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Outcome.objects.all().count(), 3)
        self.assertEqual(OutcomeOutcome.objects.all().count(), 2)
        self.assertEqual(
            Outcome.objects.filter(depth=1).last().title, "test_child(copy)"
        )
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": base_outcome.id,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
                "parentType": JSONRenderer()
                .render("workflow")
                .decode("utf-8"),
                "throughType": JSONRenderer()
                .render("outcomeworkflow")
                .decode("utf-8"),
                "parentID": activity.id,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Outcome.objects.all().count(), 6)
        self.assertEqual(OutcomeOutcome.objects.all().count(), 4)
        self.assertEqual(OutcomeWorkflow.objects.all().count(), 2)
        self.assertEqual(
            Outcome.objects.filter(depth=0).last().title, "test_title(copy)"
        )

    def test_publish_permissions_no_login_no_authorship(self):
        author = get_author()
        project = make_object("project", author)
        response = self.client.post(
            reverse("course_flow:update-value"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
                "data": JSONRenderer()
                .render({"published": True})
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)

    def test_publish_permissions_no_authorship(self):
        login(self)
        author = get_author()
        project = make_object("project", author)
        response = self.client.post(
            reverse("course_flow:update-value"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
                "data": JSONRenderer()
                .render({"published": True})
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_publish_project(self):
        user = login(self)
        project = Project.objects.create(author=user)
        WorkflowProject.objects.create(
            workflow=Activity.objects.create(author=user), project=project
        )
        WorkflowProject.objects.create(
            workflow=Course.objects.create(author=user), project=project
        )
        WorkflowProject.objects.create(
            workflow=Program.objects.create(author=user), project=project
        )

        response = self.client.post(
            reverse("course_flow:update-value"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
                "data": JSONRenderer()
                .render({"published": True})
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Project.objects.filter(published=True).count(), 1)
        self.assertEqual(Workflow.objects.filter(published=True).count(), 3)

    def test_add_discipline_permissions_no_login_no_authorship(self):
        author = get_author()
        project = make_object("project", author)
        discipline_to_add = Discipline.objects.create(title="My Discipline")
        response = self.client.post(
            reverse("course_flow:update-value"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
                "data": JSONRenderer()
                .render({"disciplines": [discipline_to_add.id]})
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)

    def test_add_discipline_permissions_no_authorship(self):
        author = get_author()
        login(self)
        project = make_object("project", author)
        discipline_to_add = Discipline.objects.create(title="My Discipline")
        response = self.client.post(
            reverse("course_flow:update-value"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
                "data": JSONRenderer()
                .render({"disciplines": [discipline_to_add.id]})
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_add_discipline(self):
        user = login(self)
        project = Project.objects.create(author=user)
        WorkflowProject.objects.create(
            workflow=Activity.objects.create(author=user), project=project
        )
        WorkflowProject.objects.create(
            workflow=Course.objects.create(author=user), project=project
        )
        WorkflowProject.objects.create(
            workflow=Program.objects.create(author=user), project=project
        )
        discipline1 = Discipline.objects.create(title="My Discipline")
        discipline2 = Discipline.objects.create(title="My Second Discipline")
        response = self.client.post(
            reverse("course_flow:update-value"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
                "data": JSONRenderer()
                .render({"disciplines": [discipline1.id, discipline2.id]})
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Project.objects.first().disciplines.count(), 2)
        self.assertEqual(Activity.objects.first().disciplines.count(), 2)
        self.assertEqual(Course.objects.first().disciplines.count(), 2)
        self.assertEqual(Program.objects.first().disciplines.count(), 2)

    def test_add_favourite_permissions_no_login_no_authorship(self):
        author = get_author()
        for object_type in [
            "project",
            "activity",
            "course",
            "program",
        ]:
            item = get_model_from_str(object_type).objects.create(
                author=author, published=True
            )
            response = self.client.post(
                reverse("course_flow:toggle-favourite"),
                {
                    "objectID": item.id,
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                    "favourite": JSONRenderer().render(True).decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_add_favourite_permissions_no_login_not_published(self):
        author = get_author()
        user = login(self)
        for object_type in [
            "project",
            "activity",
            "course",
            "program",
        ]:
            item = get_model_from_str(object_type).objects.create(
                author=author, published=False
            )
            response = self.client.post(
                reverse("course_flow:toggle-favourite"),
                {
                    "objectID": item.id,
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                    "favourite": JSONRenderer().render(True).decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 403)

    def test_add_favourite(self):
        author = get_author()
        user = login(self)
        for object_type in [
            "project",
            "activity",
            "course",
            "program",
        ]:
            item = get_model_from_str(object_type).objects.create(
                author=author, published=True
            )
            response = self.client.post(
                reverse("course_flow:toggle-favourite"),
                {
                    "objectID": item.id,
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                    "favourite": JSONRenderer().render(True).decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                Favourite.objects.filter(
                    user=user,
                    content_type=ContentType.objects.get_for_model(
                        get_model_from_str(object_type)
                    ),
                ).count(),
                1,
            )
            response = self.client.post(
                reverse("course_flow:toggle-favourite"),
                {
                    "objectID": item.id,
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                    "favourite": JSONRenderer().render(False).decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                Favourite.objects.filter(
                    user=user,
                    content_type=ContentType.objects.get_for_model(
                        get_model_from_str(object_type)
                    ),
                ).count(),
                0,
            )

    def test_duplicate_activity_no_login_no_permissions(self):
        author = get_author()
        activity = make_object("activity", author)
        project = make_object("project", author)
        WorkflowProject.objects.create(workflow=activity, project=project)
        response = self.client.post(
            reverse("course_flow:duplicate-workflow"),
            {"workflowPk": activity.id, "projectPk": project.id},
        )
        self.assertEqual(response.status_code, 401)
        login(self)
        response = self.client.post(
            reverse("course_flow:duplicate-workflow"),
            {"workflowPk": activity.id, "projectPk": project.id},
        )
        self.assertEqual(response.status_code, 403)

    def test_duplicate_workflow(self):
        author = login(self)
        project = make_object("project", author)

        for type in ["activity", "course", "program"]:
            workflow = make_object(type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            base_outcome = Outcome.objects.create(
                title="new outcome", author=author
            )
            OutcomeWorkflow.objects.create(
                workflow=workflow, outcome=base_outcome
            )
            child_outcome = base_outcome.children.create(
                title="child outcome", author=author
            )
            week = WeekWorkflow.objects.get(workflow=workflow).week
            node = week.nodes.create(author=author, title="test_title")
            node.column = workflow.columnworkflow_set.first().column
            OutcomeNode.objects.create(node=node, outcome=child_outcome)
            if type == "course":
                linked_wf = Activity.objects.first()
                node.linked_workflow = linked_wf
            elif type == "program":
                linked_wf = Course.objects.first()
                node.linked_workflow = linked_wf
            node.save()
            node2 = week.nodes.create(author=author, title="test_title")
            node2.column = workflow.columnworkflow_set.first().column
            node2.save()
            nodelink = NodeLink.objects.create(
                source_node=node,
                target_node=node2,
                source_port=2,
                target_port=0,
            )
            response = self.client.post(
                reverse("course_flow:duplicate-workflow"),
                {"workflowPk": workflow.id, "projectPk": project.id},
            )
            new_workflow = Workflow.objects.get(parent_workflow=workflow)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                Node.objects.filter(
                    week__workflow__id=new_workflow.id
                ).count(),
                2,
            )
            second_nodelink = NodeLink.objects.get(
                source_node__week__workflow=new_workflow.id
            )
            self.assertEqual(second_nodelink.source_node.is_original, False)
            self.assertEqual(second_nodelink.target_node.is_original, False)
            # Check that outcomes have been correctly duplicated
            self.assertEqual(
                second_nodelink.source_node.outcomes.first(),
                Outcome.objects.get(parent_outcome=child_outcome),
            )
            if type == "course" or type == "program":
                self.assertEqual(
                    second_nodelink.source_node.linked_workflow.id,
                    linked_wf.id,
                )

    def test_duplicate_workflow_other_user(self):
        author = get_author()
        user = login(self)
        my_project = make_object("project", user)
        project = make_object("project", author)
        for type in ["activity", "course", "program"]:
            workflow = make_object(type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            base_outcome = Outcome.objects.create(
                title="new outcome", author=author
            )
            OutcomeWorkflow.objects.create(
                workflow=workflow, outcome=base_outcome
            )
            child_outcome = base_outcome.children.create(
                title="child outcome", author=author
            )
            week = WeekWorkflow.objects.get(workflow=workflow).week
            node = week.nodes.create(author=author, title="test_title")
            node.column = workflow.columnworkflow_set.first().column
            OutcomeNode.objects.create(node=node, outcome=child_outcome)
            if type == "course":
                linked_wf = Activity.objects.first()
                node.linked_workflow = linked_wf
            elif type == "program":
                linked_wf = Course.objects.first()
                node.linked_workflow = linked_wf
            node.save()
            response = self.client.post(
                reverse("course_flow:duplicate-workflow"),
                {"workflowPk": workflow.id, "projectPk": my_project.id},
            )
            self.assertEqual(response.status_code, 403)
            workflow.published = True
            workflow.save()
            response = self.client.post(
                reverse("course_flow:duplicate-workflow"),
                {"workflowPk": workflow.id, "projectPk": my_project.id},
            )
            self.assertEqual(response.status_code, 200)
            new_workflow = Workflow.objects.get(parent_workflow=workflow)
            # Check that nodes have outcomes
            new_node = Node.objects.get(week__workflow=new_workflow)
            self.assertEqual(new_node.outcomes.count(), 1)
            # Check that outcomes have been correctly duplicated
            new_child_outcome = Outcome.objects.get(
                parent_outcome=child_outcome
            )
            new_node = Node.objects.get(week__workflow=new_workflow)
            self.assertEqual(new_node.outcomes.first(), new_child_outcome)
            if type == "course" or type == "program":
                self.assertEqual(
                    new_node.linked_workflow.id,
                    Workflow.objects.get(parent_workflow=linked_wf).id,
                )

    def test_duplicate_project(self):
        author = get_author()
        user = login(self)
        project = make_object("project", author)
        for type in ["activity", "course", "program"]:
            workflow = make_object(type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            base_outcome = Outcome.objects.create(
                title="new outcome", author=author
            )
            OutcomeWorkflow.objects.create(
                workflow=workflow, outcome=base_outcome
            )
            child_outcome = base_outcome.children.create(
                title="child outcome", author=author
            )
            week = WeekWorkflow.objects.get(workflow=workflow).week
            node = week.nodes.create(author=author, title="test_title")
            node.column = workflow.columnworkflow_set.first().column
            OutcomeNode.objects.create(node=node, outcome=child_outcome)
            if type == "course":
                linked_wf = Activity.objects.first()
                node.linked_workflow = linked_wf
            elif type == "program":
                linked_wf = Course.objects.first()
                node.linked_workflow = linked_wf
            node.save()
        response = self.client.post(
            reverse("course_flow:duplicate-project"), {"projectPk": project.id}
        )
        self.assertEqual(response.status_code, 403)
        project.published = True
        project.save()
        response = self.client.post(
            reverse("course_flow:duplicate-project"), {"projectPk": project.id}
        )
        self.assertEqual(response.status_code, 200)
        new_project = Project.objects.get(author=user)
        new_activity = Activity.objects.get(author=user)
        new_course = Course.objects.get(author=user)
        new_program = Program.objects.get(author=user)
        new_node = Node.objects.get(week__workflow=new_program)
        self.assertEqual(new_node.linked_workflow.id, new_course.id)
        self.assertEqual(new_node.outcomes.count(), 1)
        new_node = Node.objects.get(week__workflow=new_course)
        self.assertEqual(new_node.linked_workflow.id, new_activity.id)
        self.assertEqual(new_node.outcomes.count(), 1)
        new_node = Node.objects.get(week__workflow=new_activity)
        self.assertEqual(new_node.outcomes.count(), 1)

    def test_import_json(self):
        filecontents = open(TESTJSON_FILENAME).read()
        response = self.client.post(
            reverse("course_flow:project-from-json"),
            {"jsonData": filecontents},
        )
        self.assertEqual(response.status_code, 401)
        login(self)
        response = self.client.post(
            reverse("course_flow:project-from-json"),
            {"jsonData": filecontents},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)["action"], "posted")

    def test_explore_no_login(self):
        response = self.client.get(reverse("course_flow:explore"))
        self.assertEqual(response.status_code, 302)

    def test_explore_login(self):
        user = login(self)
        response = self.client.get(reverse("course_flow:explore"))
        self.assertEqual(response.status_code, 200)

    def test_add_comment_to_node(self):
        user = login(self)
        workflow = Course.objects.create(author=user)
        week = workflow.weeks.create(author=user)
        node = week.nodes.create(author=user)
        comment_text = "A sample comment"

        # Create a comment, check that it is correctly added to the desired object
        response = self.client.post(
            reverse("course_flow:add-comment"),
            {
                "objectID": node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "text": JSONRenderer().render(comment_text).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            Node.objects.get(id=node.id).comments.first().text, comment_text
        )
        # Retrieve the comments
        response = self.client.post(
            reverse("course_flow:get-comments-for-object"),
            {
                "objectID": node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(len(content["data_package"]), 1)
        self.assertEqual(content["data_package"][0]["text"], comment_text)
        # Remove a comment
        response = self.client.post(
            reverse("course_flow:remove-comment"),
            {
                "objectID": node.id,
                "commentPk": Comment.objects.first().id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        # Retrieve the comments
        response = self.client.post(
            reverse("course_flow:get-comments-for-object"),
            {
                "objectID": node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertEqual(len(content["data_package"]), 0)

    def test_add_term_to_project(self):
        user = login(self)
        project = Project.objects.create(author=user)
        # try adding a term
        response = self.client.post(
            reverse("course_flow:add-terminology"),
            {
                "projectPk": project.id,
                "term": JSONRenderer()
                .render("program outcome")
                .decode("utf-8"),
                "title": JSONRenderer().render("competency").decode("utf-8"),
                "translation_plural": JSONRenderer()
                .render("competencies")
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(project.object_sets.all().count(), 1)

        # Add the set to a node

        WorkflowProject.objects.create(
            project=project, workflow=Course.objects.create(author=user)
        )
        node = (
            project.workflows.first().weeks.first().nodes.create(author=user)
        )
        node_pk = node.pk

        response = self.client.post(
            reverse("course_flow:update-object-set"),
            {
                "objectsetPk": project.object_sets.first().id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "objectID": node_pk,
                "add": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Node.objects.get(pk=node_pk).sets.count(), 1)

        # Add the set to a node

        outcome = project.workflows.first().outcomes.create(author=user)
        outcome_pk = outcome.pk
        child_outcome = outcome.children.create(author=user)
        child_pk = child_outcome.pk

        response = self.client.post(
            reverse("course_flow:update-object-set"),
            {
                "objectsetPk": project.object_sets.first().id,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
                "objectID": outcome_pk,
                "add": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Outcome.objects.get(pk=outcome_pk).sets.count(), 1)
        self.assertEqual(Outcome.objects.get(pk=child_pk).sets.count(), 1)

        # Remove the set

        response = self.client.post(
            reverse("course_flow:update-object-set"),
            {
                "objectsetPk": project.object_sets.first().id,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
                "objectID": outcome_pk,
                "add": JSONRenderer().render(False).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Outcome.objects.get(pk=outcome_pk).sets.count(), 0)
        self.assertEqual(Outcome.objects.get(pk=child_pk).sets.count(), 0)

        # try adding a term that already exists (should replace)
        #        response = self.client.post(
        #            reverse("course_flow:add-terminology"),
        #            {
        #                "projectPk": project.id,
        #                "term": JSONRenderer().render("programoutcome").decode("utf-8"),
        #                "title": JSONRenderer()
        #                .render("program outcome")
        #                .decode("utf-8"),
        #                "translation_plural": JSONRenderer()
        #                .render("program outcomes")
        #                .decode("utf-8"),
        #            },
        #        )
        #        self.assertEqual(response.status_code, 200)
        #        self.assertEqual(project.object_sets.all().count(), 1)
        #        self.assertEqual(
        #            project.terminology_dict.first().translation, "program outcome"
        #        )
        #        self.assertEqual(
        #            project.terminology_dict.first().translation_plural,
        #            "program outcomes",
        #        )

        # delete a term
        response = self.client.post(
            reverse("course_flow:delete-self"),
            {
                "objectID": project.object_sets.first().id,
                "objectType": JSONRenderer()
                .render("objectset")
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(project.object_sets.all().count(), 0)
        self.assertEqual(Node.objects.get(pk=node_pk).sets.count(), 0)


class PermissionsTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_permissions_delete_self_workflows(self):
        author = get_author()
        user = login(self)
        project = make_object("project", author)
        for workflow_type in ["activity", "course", "program"]:
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            week = workflow.weeks.first()
            node = week.nodes.create(author=author)
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": node.id,
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 403)
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": week.id,
                    "objectType": JSONRenderer()
                    .render("week")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 403)
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": workflow.id,
                    "objectType": JSONRenderer()
                    .render(workflow_type)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 403)
            p = ObjectPermission.objects.create(
                user=user,
                content_object=workflow.get_subclass(),
                permission_type=ObjectPermission.PERMISSION_EDIT,
            )
            p.save()
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": node.id,
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": week.id,
                    "objectType": JSONRenderer()
                    .render("week")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": workflow.id,
                    "objectType": JSONRenderer()
                    .render(workflow_type)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 403)
            project.author = user
            project.save()
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": workflow.id,
                    "objectType": JSONRenderer()
                    .render(workflow_type)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            project.author = author
            project.save()

    def test_permissions_delete_self_outcome(self):
        author = get_author()
        user = login(self)
        project = make_object("project", author)
        workflow = make_object("course", author)
        WorkflowProject.objects.create(workflow=workflow, project=project)
        outcome = workflow.outcomes.create(author=author)
        child = outcome.children.create(author=author)
        response = self.client.post(
            reverse("course_flow:delete-self"),
            {
                "objectID": child.id,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:delete-self"),
            {
                "objectID": outcome.id,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        p = ObjectPermission.objects.create(
            user=user,
            content_object=workflow,
            permission_type=ObjectPermission.PERMISSION_EDIT,
        )
        p.save()
        response = self.client.post(
            reverse("course_flow:delete-self"),
            {
                "objectID": child.id,
                "objectType": JSONRenderer().render("outcome").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)

    def test_permissions_delete_self_project(self):
        author = get_author()
        user = login(self)
        project = make_object("project", author)
        response = self.client.post(
            reverse("course_flow:delete-self"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        ObjectPermission.objects.create(
            user=user,
            content_object=project,
            permission_type=ObjectPermission.PERMISSION_EDIT,
        )
        response = self.client.post(
            reverse("course_flow:delete-self"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        project.author = user
        project.save()
        response = self.client.post(
            reverse("course_flow:delete-self"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)

    def test_add_permission(self):
        user = login(self)
        second_user = get_author()
        project = make_object("project", user)
        activity = WorkflowProject.objects.create(
            workflow=Activity.objects.create(author=user), project=project
        ).workflow.get_subclass()
        response = self.client.post(
            reverse("course_flow:set-permission"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
                "permission_user": second_user.id,
                "permission_type": JSONRenderer()
                .render(ObjectPermission.PERMISSION_EDIT)
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            ObjectPermission.objects.filter(user=second_user).count(), 2
        )

    def test_duplicate_self(self):
        author = get_author()
        user = login(self)
        project = make_object("project", author)
        for workflow_type in ["activity", "course", "program"]:
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            week = workflow.weeks.first()
            node = week.nodes.create(
                author=author, column=workflow.columns.first()
            )
            response = self.client.post(
                reverse("course_flow:duplicate-self"),
                {
                    "objectID": node.id,
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                    "parentID": week.id,
                    "parentType": JSONRenderer()
                    .render("week")
                    .decode("utf-8"),
                    "throughType": JSONRenderer()
                    .render("nodeweek")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 403)
            ObjectPermission.objects.create(
                user=user,
                content_object=workflow,
                permission_type=ObjectPermission.PERMISSION_VIEW,
            )
            response = self.client.post(
                reverse("course_flow:duplicate-self"),
                {
                    "objectID": node.id,
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                    "parentID": week.id,
                    "parentType": JSONRenderer()
                    .render("week")
                    .decode("utf-8"),
                    "throughType": JSONRenderer()
                    .render("nodeweek")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 403)
            ObjectPermission.objects.create(
                user=user,
                content_object=workflow,
                permission_type=ObjectPermission.PERMISSION_EDIT,
            )
            response = self.client.post(
                reverse("course_flow:duplicate-self"),
                {
                    "objectID": node.id,
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                    "parentID": week.id,
                    "parentType": JSONRenderer()
                    .render("week")
                    .decode("utf-8"),
                    "throughType": JSONRenderer()
                    .render("nodeweek")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)

    def test_update_value(self):
        author = get_author()
        user = login(self)
        project = make_object("project", author)
        for workflow_type in ["activity", "course", "program"]:
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            week = workflow.weeks.first()
            node = week.nodes.create(author=author)
            response = self.client.post(
                reverse("course_flow:update-value"),
                {
                    "objectID": node.id,
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                    "data": JSONRenderer()
                    .render({"title": "new title"})
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 403)
            ObjectPermission.objects.create(
                user=user,
                content_object=workflow,
                permission_type=ObjectPermission.PERMISSION_VIEW,
            )
            response = self.client.post(
                reverse("course_flow:update-value"),
                {
                    "objectID": node.id,
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                    "data": JSONRenderer()
                    .render({"title": "new title"})
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 403)
            ObjectPermission.objects.create(
                user=user,
                content_object=workflow,
                permission_type=ObjectPermission.PERMISSION_EDIT,
            )
            response = self.client.post(
                reverse("course_flow:update-value"),
                {
                    "objectID": node.id,
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                    "data": JSONRenderer()
                    .render({"title": "new title"})
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)


class ExportTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_export_outcomes(self):
        author = get_author()
        user = login(self)
        project = make_object("project", author)
        for workflow_type in ["activity", "course", "program"]:
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            week = workflow.weeks.first()
            node = week.nodes.create(author=author)
            base_outcome = workflow.outcomes.create(
                author=author, title="outcome"
            )
            base_outcome.children.create(
                author=author, title="outcome", depth=1
            )
            base_outcome.children.create(
                author=author, title="outcome", depth=1
            )
            base_outcome = workflow.outcomes.create(
                author=author, title="outcome"
            )
            base_outcome.children.create(
                author=author, title="outcome", depth=1
            )
            base_outcome.children.create(
                author=author, title="outcome", depth=1
            )

            tasks.async_send_export_email(
                author.email,
                workflow.id,
                "workflow",
                "outcome",
                "csv",
                [],
                "subject",
                "text",
            )
            tasks.async_send_export_email(
                author.email,
                workflow.id,
                "workflow",
                "outcome",
                "excel",
                [],
                "subject",
                "text",
            )

        tasks.async_send_export_email(
            author.email,
            project.id,
            "project",
            "outcome",
            "excel",
            [],
            "subject",
            "text",
        )
        tasks.async_send_export_email(
            author.email,
            project.id,
            "project",
            "outcome",
            "csv",
            [],
            "subject",
            "text",
        )

    def test_export_frameworks(self):
        author = get_author()
        user = login(self)
        project = make_object("project", author)
        program = make_object("program", author)
        WorkflowProject.objects.create(workflow=program, project=project)
        week = program.weeks.first()
        workflows = [
            make_object(workflow_type, author)
            for workflow_type in ["course", "course", "course"]
        ]
        nodes = [
            week.nodes.create(
                author=author,
                linked_workflow=workflow,
                column=program.columns.first(),
            )
            for workflow in workflows
        ]
        base_outcome = program.outcomes.create(author=author, title="outcome")
        base_outcome.children.create(author=author, title="outcome", depth=1)
        outcome2 = base_outcome.children.create(
            author=author, title="outcome", depth=1
        )
        base_outcome = program.outcomes.create(author=author, title="outcome")
        base_outcome.children.create(author=author, title="outcome", depth=1)
        base_outcome.children.create(author=author, title="outcome", depth=1)
        [
            OutcomeNode.objects.create(node=node, outcome=base_outcome)
            for node in nodes
        ]
        [
            OutcomeNode.objects.create(node=node, outcome=outcome2)
            for node in nodes
        ]
        for workflow in workflows:
            WorkflowProject.objects.create(workflow=workflow, project=project)
            week = workflow.weeks.first()
            node = week.nodes.create(
                author=author,
                column=workflow.columns.get(column_type=Column.ASSESSMENT),
            )
            base_outcome = workflow.outcomes.create(
                author=author, title="outcome"
            )
            base_outcome.children.create(
                author=author, title="outcome", depth=1
            )
            outcome2 = base_outcome.children.create(
                author=author, title="outcome", depth=1
            )
            base_outcome = workflow.outcomes.create(
                author=author, title="outcome"
            )
            base_outcome.children.create(
                author=author, title="outcome", depth=1
            )
            base_outcome.children.create(
                author=author, title="outcome", depth=1
            )
            OutcomeNode.objects.create(node=node, outcome=base_outcome)
            OutcomeNode.objects.create(node=node, outcome=outcome2)
            OutcomeHorizontalLink.objects.create(
                outcome=base_outcome,
                parent_outcome=workflow.linked_nodes.first().outcomes.first(),
            )

            tasks.async_send_export_email(
                author.email,
                workflow.id,
                "workflow",
                "framework",
                "excel",
                [],
                "subject",
                "text",
            )

        tasks.async_send_export_email(
            author.email,
            project.id,
            "project",
            "framework",
            "csv",
            [],
            "subject",
            "text",
        )
        tasks.async_send_export_email(
            author.email,
            project.id,
            "project",
            "framework",
            "excel",
            [],
            "subject",
            "text",
        )
        tasks.async_send_export_email(
            author.email,
            program.id,
            "workflow",
            "matrix",
            "excel",
            [],
            "subject",
            "text",
        )
        tasks.async_send_export_email(
            author.email,
            project.id,
            "project",
            "matrix",
            "excel",
            [],
            "subject",
            "text",
        )
        tasks.async_send_export_email(
            author.email,
            program.id,
            "workflow",
            "matrix",
            "csv",
            [],
            "subject",
            "text",
        )

    def test_export_nodes(self):
        author = get_author()
        user = login(self)
        project = make_object("project", author)
        for workflow_type in ["activity", "course", "program"]:
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            week = workflow.weeks.first()
            node = week.nodes.create(
                author=author,
                title="my title",
                description="my description",
                column=workflow.columns.first(),
            )

            tasks.async_send_export_email(
                author.email,
                workflow.id,
                "workflow",
                "node",
                "csv",
                [],
                "subject",
                "text",
            )
            tasks.async_send_export_email(
                author.email,
                workflow.id,
                "workflow",
                "node",
                "excel",
                [],
                "subject",
                "text",
            )

        tasks.async_send_export_email(
            author.email,
            project.id,
            "project",
            "node",
            "excel",
            [],
            "subject",
            "text",
        )
        tasks.async_send_export_email(
            author.email,
            project.id,
            "project",
            "node",
            "csv",
            [],
            "subject",
            "text",
        )


class ImportTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_import_nodes_xls(self):
        user = login(self)
        workflow = Course.objects.create(author=user)
        filecontents = open(TESTNODESXLS_FILENAME, mode="rb")
        file_json = pd.read_excel(
            filecontents, keep_default_na=False
        ).to_json()
        tasks.async_import_file_data(
            workflow.pk, "workflow", "nodes", file_json, user.id
        )
        self.assertEqual(
            Node.objects.filter(week__workflow=workflow).count(), 3
        )
        self.assertEqual(Column.objects.filter(workflow=workflow).count(), 4)
        self.assertEqual(Week.objects.filter(workflow=workflow).count(), 2)
        self.assertEqual(workflow.weeks.first().title, "Week 1")
        self.assertEqual(workflow.weeks.first().description, "My week")
        self.assertEqual(workflow.weeks.all()[1].title, None)
        self.assertEqual(
            Node.objects.get(pk=1).column, workflow.columns.all()[1]
        )
        self.assertEqual(
            Node.objects.get(pk=2).column, workflow.columns.all()[3]
        )
        self.assertEqual(
            Node.objects.get(pk=3).column, workflow.columns.all()[0]
        )

    def test_import_nodes_csv(self):
        user = login(self)
        workflow = Course.objects.create(author=user)
        filecontents = open(TESTNODESCSV_FILENAME, mode="rb")
        file_json = pd.read_csv(filecontents, keep_default_na=False).to_json()
        tasks.async_import_file_data(
            workflow.pk, "workflow", "nodes", file_json, user.id
        )
        self.assertEqual(
            Node.objects.filter(week__workflow=workflow).count(), 3
        )
        self.assertEqual(Column.objects.filter(workflow=workflow).count(), 4)
        self.assertEqual(Week.objects.filter(workflow=workflow).count(), 2)
        self.assertEqual(workflow.weeks.first().title, "Week 1")
        self.assertEqual(workflow.weeks.first().description, "My week")
        self.assertEqual(workflow.weeks.all()[1].title, None)
        self.assertEqual(
            Node.objects.get(pk=1).column, workflow.columns.all()[1]
        )
        self.assertEqual(
            Node.objects.get(pk=2).column, workflow.columns.all()[3]
        )
        self.assertEqual(
            Node.objects.get(pk=3).column, workflow.columns.all()[0]
        )

    def test_import_outcomes_xls(self):
        user = login(self)
        workflow = Course.objects.create(author=user)
        filecontents = open(TESTOUTCOMESXLS_FILENAME, mode="rb")
        file_json = pd.read_excel(
            filecontents, keep_default_na=False
        ).to_json()
        tasks.async_import_file_data(
            workflow.pk, "workflow", "outcomes", file_json, user.id
        )
        self.assertEqual(Outcome.objects.all().count(), 7)
        self.assertEqual(Outcome.objects.filter(depth=0).count(), 2)
        self.assertEqual(Outcome.objects.filter(depth=1).count(), 3)
        self.assertEqual(Outcome.objects.filter(depth=1, code="").count(), 3)
        self.assertEqual(Outcome.objects.filter(depth=2).count(), 2)
        self.assertEqual(Outcome.objects.filter(depth=2, code="").count(), 2)
        self.assertEqual(Outcome.objects.filter(title="Depth 1").count(), 3)
        self.assertEqual(Outcome.objects.filter(title="Depth 2").count(), 2)
        self.assertEqual(
            Outcome.objects.filter(title="Base Outcome").count(), 1
        )
        self.assertEqual(
            Outcome.objects.get(title="Base Outcome").description,
            "my description",
        )
        self.assertEqual(
            Outcome.objects.get(title="Base Outcome").code, "01XX"
        )

    def test_import_outcomes_csv(self):
        user = login(self)
        workflow = Course.objects.create(author=user)
        filecontents = open(TESTOUTCOMESCSV_FILENAME, mode="rb")
        file_json = pd.read_csv(filecontents, keep_default_na=False).to_json()
        tasks.async_import_file_data(
            workflow.pk, "workflow", "outcomes", file_json, user.id
        )
        self.assertEqual(Outcome.objects.all().count(), 7)
        self.assertEqual(Outcome.objects.filter(depth=0).count(), 2)
        self.assertEqual(Outcome.objects.filter(depth=1).count(), 3)
        self.assertEqual(Outcome.objects.filter(depth=1, code="").count(), 3)
        self.assertEqual(Outcome.objects.filter(depth=2).count(), 2)
        self.assertEqual(Outcome.objects.filter(depth=2, code="").count(), 2)
        self.assertEqual(Outcome.objects.filter(title="Depth 1").count(), 3)
        self.assertEqual(Outcome.objects.filter(title="Depth 2").count(), 2)
        self.assertEqual(
            Outcome.objects.filter(title="Base Outcome").count(), 1
        )
        self.assertEqual(
            Outcome.objects.get(title="Base Outcome").description,
            "my description",
        )
        self.assertEqual(
            Outcome.objects.get(title="Base Outcome").code, "01XX"
        )
