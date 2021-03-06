import json
import os

from django.test import TestCase
from django.test.client import RequestFactory
from django.urls import reverse
from rest_framework.renderers import JSONRenderer

from course_flow.models import (
    Activity,
    Column,
    ColumnWorkflow,
    Course,
    Node,
    NodeLink,
    NodeWeek,
    Outcome,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeProject,
    Program,
    Project,
    Week,
    WeekWorkflow,
    Workflow,
    WorkflowProject,
)

from .utils import check_order, get_author, login, make_object

TESTJSON_FILENAME = os.path.join(os.path.dirname(__file__), "test_json.json")


class ModelViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_project_detail_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        response = self.client.get(
            reverse("course_flow:project-detail-view", args=str(project.pk))
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(
            reverse("course_flow:project-detail-view", args=str(project.pk))
        )
        self.assertEqual(response.status_code, 403)
        project.published = True
        project.save()
        response = self.client.get(
            reverse("course_flow:project-detail-view", args=str(project.pk))
        )
        self.assertEqual(response.status_code, 200)

    def test_project_update_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        response = self.client.get(
            reverse("course_flow:project-update", args=str(project.pk))
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(
            reverse("course_flow:project-update", args=str(project.pk))
        )
        self.assertEqual(response.status_code, 403)
        project.published = True
        project.save()
        response = self.client.get(
            reverse("course_flow:project-update", args=str(project.pk))
        )
        self.assertEqual(response.status_code, 403)

    def test_outcome_detail_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        outcome = make_object("outcome", author)
        OutcomeProject.objects.create(outcome=outcome, project=project)
        response = self.client.get(
            reverse("course_flow:outcome-detail-view", args=str(outcome.pk))
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        project = Project.objects.create(author=author)
        outcome = make_object("outcome", author)
        OutcomeProject.objects.create(outcome=outcome, project=project)
        response = self.client.get(
            reverse("course_flow:outcome-detail-view", args=str(outcome.pk))
        )
        self.assertEqual(response.status_code, 403)
        outcome.published = True
        outcome.save()
        response = self.client.get(
            reverse("course_flow:outcome-detail-view", args=str(outcome.pk))
        )
        self.assertEqual(response.status_code, 200)

    def test_outcome_update_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        outcome = make_object("outcome", author)
        OutcomeProject.objects.create(outcome=outcome, project=project)
        response = self.client.get(
            reverse("course_flow:outcome-update", args=str(outcome.pk))
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        project = Project.objects.create(author=author)
        outcome = make_object("outcome", author)
        OutcomeProject.objects.create(outcome=outcome, project=project)
        response = self.client.get(
            reverse("course_flow:outcome-update", args=str(outcome.pk))
        )
        self.assertEqual(response.status_code, 403)

    def test_outcome_update_view_is_owner(self):
        user = login(self)
        project = Project.objects.create(author=user)
        outcome = make_object("outcome", user)
        OutcomeProject.objects.create(outcome=outcome, project=project)
        response = self.client.get(
            reverse("course_flow:outcome-update", args=str(outcome.pk))
        )
        self.assertEqual(response.status_code, 200)

    def test_workflow_detail_view(self):
        author = get_author()
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=author)
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-detail", args=str(workflow.pk))
            )
            self.assertEqual(response.status_code, 302)
        login(self)
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=author)
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-detail", args=str(workflow.pk))
            )
            self.assertEqual(response.status_code, 403)
            workflow.published = True
            workflow.save()
            response = self.client.get(
                reverse("course_flow:workflow-detail", args=str(workflow.pk))
            )
            self.assertEqual(response.status_code, 200)

    def test_workflow_update_view(self):
        author = get_author()
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=author)
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=str(workflow.pk))
            )
            self.assertEqual(response.status_code, 302)
        login(self)
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=author)
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=str(workflow.pk))
            )
            self.assertEqual(response.status_code, 403)

    def test_workflow_update_view_is_owner(self):
        user = login(self)
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=user)
            workflow = make_object(workflow_type, user)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=str(workflow.pk))
            )
            self.assertEqual(response.status_code, 200)

    def test_project_create_view(self):
        response = self.client.get(reverse("course_flow:project-create"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("course_flow:project-create"))
        self.assertEqual(response.status_code, 200)

    def test_outcomecreate_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        response = self.client.get(
            reverse("course_flow:outcome-create", args=[project.id])
        )
        self.assertEqual(response.status_code, 302)
        user = login(self)
        response = self.client.get(
            reverse("course_flow:outcome-create", args=[project.id])
        )
        self.assertEqual(response.status_code, 403)
        project2 = Project.objects.create(author=user)
        response = self.client.get(
            reverse("course_flow:outcome-create", args=[project2.id])
        )
        self.assertEqual(response.status_code, 200)

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
        subchildlink1 = child1.child_outcome_links.first()
        subchildlink2 = child1.child_outcome_links.last()
        self.assertEqual(subchildlink1.child.depth, 2)
        self.assertEqual(subchildlink1.rank, 0)
        self.assertEqual(subchildlink2.rank, 1)
        # swap the children
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": str(subchildlink2.id),
                "objectType": JSONRenderer()
                .render("outcomeoutcome")
                .decode("utf-8"),
                "parentID": str(child1.id),
                "newPosition": str(0),
            },
        )
        subchildlink1 = OutcomeOutcome.objects.get(id=subchildlink1.id)
        subchildlink2 = OutcomeOutcome.objects.get(id=subchildlink2.id)
        self.assertEqual(subchildlink2.rank, 0)
        self.assertEqual(subchildlink1.rank, 1)
        self.assertEqual(subchildlink2.child.depth, 2)
        check_order(self, child1.child_outcome_links)
        # swap a child into the base outcome
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": str(subchildlink2.id),
                "objectType": JSONRenderer()
                .render("outcomeoutcome")
                .decode("utf-8"),
                "parentID": str(base_outcome.id),
                "newPosition": str(0),
            },
        )
        subchildlink1 = OutcomeOutcome.objects.get(id=subchildlink1.id)
        subchildlink2 = OutcomeOutcome.objects.get(id=subchildlink2.id)
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
                reverse("course_flow:new-column"),
                {"workflowPk": str(workflow.id), "column_type": i * 10},
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
            # reorder the nodes
            # Move rank 1 up a rank, down a rank, and not at all
            for change in [0, 1, -1, 99, -99]:
                to_move = NodeWeek.objects.get(week=base_week, rank=1)
                response = self.client.post(
                    reverse("course_flow:inserted-at"),
                    {
                        "objectID": to_move.id,
                        "parentID": base_week.id,
                        "objectType": JSONRenderer()
                        .render("nodeweek")
                        .decode("utf-8"),
                        "newPosition": 1 + change,
                    },
                )
                self.assertEqual(response.status_code, 200)
                to_move = NodeWeek.objects.get(id=to_move.id)
                self.assertEqual(
                    to_move.rank,
                    max(min(1 + change, base_week.nodes.count() - 1), 0),
                )
                check_order(self, base_week.nodeweek_set)
            # move some nodes into the second week
            for position in [0, 1, -1]:
                to_move = NodeWeek.objects.get(week=base_week, rank=0)
                response = self.client.post(
                    reverse("course_flow:inserted-at"),
                    {
                        "objectID": to_move.id,
                        "parentID": second_week.id,
                        "objectType": JSONRenderer()
                        .render("nodeweek")
                        .decode("utf-8"),
                        "newPosition": position,
                    },
                )
                self.assertEqual(response.status_code, 200)
                to_move = NodeWeek.objects.get(id=to_move.id)
                self.assertEqual(
                    to_move.rank,
                    max(min(position, second_week.nodes.count() - 1), 0),
                )
                self.assertEqual(to_move.week.id, second_week.id)
                check_order(self, base_week.nodeweek_set)
                check_order(self, second_week.nodeweek_set)
            # swap two weeks
            to_move = WeekWorkflow.objects.get(week=base_week)
            response = self.client.post(
                reverse("course_flow:inserted-at"),
                {
                    "objectID": to_move.id,
                    "parentID": workflow.id,
                    "objectType": JSONRenderer()
                    .render("weekworkflow")
                    .decode("utf-8"),
                    "newPosition": 1,
                },
            )
            self.assertEqual(response.status_code, 200)
            to_move = WeekWorkflow.objects.get(id=to_move.id)
            self.assertEqual(to_move.rank, 1)
            check_order(self, workflow.weekworkflow_set)
            # swap two columns
            to_move = ColumnWorkflow.objects.get(column=first_column)
            response = self.client.post(
                reverse("course_flow:inserted-at"),
                {
                    "objectID": to_move.id,
                    "parentID": workflow.id,
                    "objectType": JSONRenderer()
                    .render("columnworkflow")
                    .decode("utf-8"),
                    "newPosition": 1,
                },
            )
            self.assertEqual(response.status_code, 200)
            to_move = ColumnWorkflow.objects.get(id=to_move.id)
            self.assertEqual(to_move.rank, 1)
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
        node = week.nodes.create(author=author)
        response = self.client.post(
            reverse("course_flow:set-linked-workflow"),
            {"nodePk": node.id, "workflowPk": activity.id},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            Node.objects.get(id=node.id).linked_workflow.id, activity.id
        )
        self.assertEqual(Activity.objects.all().count(), 1)

    # Test for linking a workflow from another project.
    # The workflow should be duplicated into the project
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
                "strategyPk": strategy.id,
                "position": 1,
            },
        )
        self.assertEqual(response.status_code, 401)
        login(self)
        response = self.client.post(
            reverse("course_flow:add-strategy"),
            {
                "workflowPk": workflow.id,
                "strategyPk": strategy.id,
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
                "strategyPk": strategy.id,
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
        self.client.post(
            reverse("course_flow:new-column"),
            {"workflowPk": strategy.id, "column_type": 0},
        )
        self.client.post(
            reverse("course_flow:new-column"),
            {"workflowPk": strategy.id, "column_type": 0},
        )
        # add some nodes to simulate a real strategy
        for column in strategy.columns.all():
            strategy.weeks.first().nodes.create(author=user, column=column)
        workflow = Activity.objects.create(author=user)
        response = self.client.post(
            reverse("course_flow:add-strategy"),
            {
                "workflowPk": workflow.id,
                "strategyPk": strategy.id,
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
        # check to make sure all nodes have different columns. This acts as a
        # check that a) they have been assigned to the new columns in the
        # workflow and b) the two nodes that were in different custom columns
        # did not get placed into the same custom column
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
                "strategyPk": strategy.id,
                "position": 1,
            },
        )
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
        node0.column = column1
        node1.column = column1
        node0.save()
        node1.save()
        to_move = NodeWeek.objects.get(week=week1, rank=0)
        # Try to move within the same week
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.id,
                "objectType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentID": week1.id,
                "newPosition": 1,
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:change-column"),
            {"nodePk": to_move.node.id, "columnID": columnworkflow1.id},
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.id,
                "objectType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentID": week1.id,
                "newPosition": 1,
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:change-column"),
            {"nodePk": to_move.node.id, "columnID": columnworkflow1.id},
        )
        self.assertEqual(response.status_code, 403)
        # Try to move from their stuff to your own
        week2 = make_object("week", user)
        node2 = week2.nodes.create(author=user)
        workflow2 = make_object("activity", user)
        column2 = make_object("column", user)
        columnworkflow2 = ColumnWorkflow.objects.create(
            column=column2, workflow=workflow2
        )
        node2.column = column2
        node2.save()
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.id,
                "objectType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentID": week2.id,
                "newPosition": 1,
            },
        )
        self.assertEqual(NodeWeek.objects.get(id=to_move.id).week.id, week2.id)
        response = self.client.post(
            reverse("course_flow:change-column"),
            {"nodePk": to_move.id, "columnID": columnworkflow2.id},
        )
        self.assertEqual(
            Node.objects.get(id=to_move.node.id).column.id, column1.id
        )
        # Try to move from your stuff to theirs
        to_move = NodeWeek.objects.get(week=week2, rank=0)
        response = self.client.post(
            reverse("course_flow:change-column"),
            {"nodePk": to_move.node.id, "columnPk": columnworkflow1.column.id},
        )
        self.assertEqual(
            Node.objects.get(id=to_move.node.id).column.id, column2.id
        )
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.id,
                "objectType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentID": week1.id,
                "newPosition": 1,
            },
        )
        self.assertEqual(response.status_code, 403)
        # Finally, check to make sure these work when you own both
        week2b = make_object("week", user)
        column2b = make_object("column", user)
        columnworkflow2b = ColumnWorkflow.objects.create(
            column=column2b, workflow=workflow2
        )
        response = self.client.post(
            reverse("course_flow:change-column"),
            {
                "nodePk": to_move.node.id,
                "columnPk": columnworkflow2b.column.id,
            },
        )
        self.assertEqual(
            Node.objects.get(id=to_move.node.id).column.id, column2b.id
        )
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.id,
                "objectType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
                "parentID": week2b.id,
                "newPosition": 0,
            },
        )
        self.assertEqual(
            NodeWeek.objects.get(id=to_move.id).week.id, week2b.id
        )

    def test_insert_sibling_no_login_no_authorship(self):
        author = get_author()
        activity1 = make_object("activity", author)
        week1 = activity1.weeks.create(author=author)
        node1 = week1.nodes.create(author=author)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": NodeWeek.objects.get(node=node1).id,
                "parentID": week1.id,
                "objectType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": WeekWorkflow.objects.get(week=week1).id,
                "parentID": activity1.id,
                "objectType": JSONRenderer()
                .render("weekworkflow")
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        login(self)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": NodeWeek.objects.get(node=node1).id,
                "parentID": week1.id,
                "objectType": JSONRenderer()
                .render("nodeweek")
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": WeekWorkflow.objects.get(week=week1).id,
                "parentID": activity1.id,
                "objectType": JSONRenderer()
                .render("weekworkflow")
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)

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
        node = make_object("node", author)
        outcome = make_object("outcome", author)
        response = self.client.post(
            reverse("course_flow:add-outcome-to-node"),
            {"nodePk": node.id, "outcomePk": outcome.id},
        )
        self.assertEqual(response.status_code, 403)
        outcomenode = OutcomeNode.objects.create(node=node, outcome=outcome)
        response = self.client.post(
            reverse("course_flow:unlink-outcome-from-node"),
            {"nodePk": node.id, "outcomePk": outcome.id},
        )
        self.assertEqual(response.status_code, 403)
        myoutcome = make_object("outcome", myself)
        mynode = make_object("node", myself)
        response = self.client.post(
            reverse("course_flow:add-outcome-to-node"),
            {"nodePk": mynode.id, "outcomePk": outcome.id},
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:add-outcome-to-node"),
            {"nodePk": node.id, "outcomePk": myoutcome.id},
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:add-outcome-to-node"),
            {"nodePk": mynode.id, "outcomePk": myoutcome.id},
        )
        self.assertEqual(response.status_code, 200)

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
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": activity.columnworkflow_set.first().column.id,
                "objectType": JSONRenderer().render("column").decode("utf-8"),
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
                "parentID": week.id,
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": week.id,
                "objectType": JSONRenderer().render("week").decode("utf-8"),
                "parentID": activity.id,
            },
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": activity.columnworkflow_set.first().column.id,
                "objectType": JSONRenderer().render("column").decode("utf-8"),
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
        nodelink = NodeLink.objects.create(
            source_node=node, target_node=node2, source_port=2, target_port=0
        )
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "parentID": week.id,
            },
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": week.id,
                "objectType": JSONRenderer().render("week").decode("utf-8"),
                "parentID": activity.id,
            },
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": activity.columnworkflow_set.first().column.id,
                "objectType": JSONRenderer().render("column").decode("utf-8"),
                "parentID": activity.id,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Node.objects.all().count(), 6)
        self.assertEqual(NodeLink.objects.all().count(), 1)

    def test_publish_permissions_no_login_no_authorship(self):
        author = get_author()
        project = make_object("project", author)
        response = self.client.post(
            reverse("course_flow:update-value"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
                "data": JSONRenderer()
                .render('{"published":"true"}')
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
                .render('{"published":"true"}')
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
        OutcomeProject.objects.create(
            outcome=Outcome.objects.create(author=user), project=project
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
        self.assertEqual(Outcome.objects.filter(published=True).count(), 1)

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
        base_outcome = Outcome.objects.create(
            title="new outcome", author=author
        )
        OutcomeProject.objects.create(project=project, outcome=base_outcome)
        child_outcome = base_outcome.children.create(
            title="child outcome", author=author
        )
        for type in ["activity", "course", "program"]:
            workflow = make_object(type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
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
                second_nodelink.source_node.outcomes.first(), child_outcome
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
        base_outcome = Outcome.objects.create(
            title="new outcome", author=author
        )
        OutcomeProject.objects.create(project=project, outcome=base_outcome)
        child_outcome = base_outcome.children.create(
            title="child outcome", author=author
        )
        for type in ["activity", "course", "program"]:
            workflow = make_object(type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
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
            # Check that nodes have no outcomes
            new_node = Node.objects.get(week__workflow=new_workflow)
            self.assertEqual(new_node.outcomes.count(), 0)
            # copy again, but this time we first copy the outcomes
            response = self.client.post(
                reverse("course_flow:duplicate-outcome"),
                {"outcomePk": base_outcome.id, "projectPk": my_project.id},
            )
            self.assertEqual(response.status_code, 403)
            base_outcome.published = True
            base_outcome.save()
            response = self.client.post(
                reverse("course_flow:duplicate-outcome"),
                {"outcomePk": base_outcome.id, "projectPk": my_project.id},
            )
            self.assertEqual(response.status_code, 200)
            new_child_outcome = Outcome.objects.get(
                parent_outcome=child_outcome
            )
            response = self.client.post(
                reverse("course_flow:duplicate-workflow"),
                {"workflowPk": workflow.id, "projectPk": my_project.id},
            )
            new_workflow = Workflow.objects.exclude(id=new_workflow.id).get(
                parent_workflow=workflow
            )
            # Check that outcomes have been correctly duplicated
            new_node = Node.objects.get(week__workflow=new_workflow)
            self.assertEqual(new_node.outcomes.first(), new_child_outcome)
            if type == "course" or type == "program":
                self.assertEqual(
                    new_node.linked_workflow.id,
                    Workflow.objects.get(parent_workflow=linked_wf).id,
                )
            new_workflow.delete()
            Outcome.objects.exclude(parent_outcome=None).delete()
            base_outcome.published = False
            base_outcome.save()

    def test_duplicate_project(self):
        author = get_author()
        user = login(self)
        project = make_object("project", author)
        base_outcome = Outcome.objects.create(
            title="new outcome", author=author
        )
        OutcomeProject.objects.create(project=project, outcome=base_outcome)
        child_outcome = base_outcome.children.create(
            title="child outcome", author=author
        )
        for type in ["activity", "course", "program"]:
            workflow = make_object(type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
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
        new_child_outcome = Outcome.objects.get(
            parent_outcome=child_outcome, author=user
        )
        self.assertEqual(new_node.linked_workflow.id, new_course.id)
        self.assertEqual(new_node.outcomes.first(), new_child_outcome)
        new_node = Node.objects.get(week__workflow=new_course)
        self.assertEqual(new_node.linked_workflow.id, new_activity.id)
        self.assertEqual(new_node.outcomes.first(), new_child_outcome)
        new_node = Node.objects.get(week__workflow=new_activity)
        self.assertEqual(new_node.outcomes.first(), new_child_outcome)

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
