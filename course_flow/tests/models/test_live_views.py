import json
import time

from django.contrib.auth.models import Group
from django.test import TestCase
from django.test.client import RequestFactory
from django.urls import reverse
from rest_framework.renderers import JSONRenderer

from course_flow import settings
from course_flow.models import (
    Activity,
    Course,
    LiveAssignment,
    LiveProject,
    LiveProjectUser,
    ObjectPermission,
    Project,
    User,
    UserAssignment,
    WorkflowProject,
)
from course_flow.serializers import LiveProjectSerializer

from .utils import get_author, login, login_student


class ModelViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_home_view_student(self):
        response = self.client.get(reverse("course_flow:home"))
        self.assertEqual(response.status_code, 302)
        login_student(self)
        response = self.client.get(reverse("course_flow:home"))
        self.assertEqual(response.status_code, 200)

    def test_myclassrooms_view(self):
        response = self.client.get(reverse("course_flow:my-live-projects"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("course_flow:my-live-projects"))
        self.assertEqual(response.status_code, 200)

    def test_myclassrooms_view_student(self):
        Group.objects.create(name=settings.TEACHER_GROUP)
        response = self.client.get(reverse("course_flow:my-live-projects"))
        self.assertEqual(response.status_code, 302)
        login_student(self)
        response = self.client.get(reverse("course_flow:my-live-projects"))
        self.assertEqual(response.status_code, 200)

    def test_liveproject_update_view_owned(self):
        author = login(self)
        project = Project.objects.create(author=author)
        response = self.client.get(
            reverse("course_flow:live-project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 403)
        LiveProject.objects.create(project=project)
        response = self.client.get(
            reverse("course_flow:live-project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=author, role_type=LiveProjectUser.ROLE_TEACHER
            ).count(),
            1,
        )

    def test_liveproject_update_view_teacher(self):
        author = get_author()
        project = Project.objects.create(author=author)
        LiveProject.objects.create(project=project)
        response = self.client.get(
            reverse("course_flow:live-project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 302)
        user = login(self)
        response = self.client.get(
            reverse("course_flow:live-project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(
            liveproject=project.liveproject,
            user=user,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        response = self.client.get(
            reverse("course_flow:live-project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 200)

    def test_liveproject_update_view_student(self):
        author = get_author()
        project = Project.objects.create(author=author)
        LiveProject.objects.create(project=project)
        response = self.client.get(
            reverse("course_flow:live-project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 302)
        user = login_student(self)
        response = self.client.get(
            reverse("course_flow:live-project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(
            liveproject=project.liveproject,
            user=user,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        response = self.client.get(
            reverse("course_flow:live-project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 200)

    def test_liveproject_create_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        response = self.client.post(
            reverse("course_flow:make-project-live"),
            {
                "projectPk": project.id,
            },
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:make-project-live"),
            {
                "projectPk": project.id,
            },
        )
        self.assertEqual(response.status_code, 403)
        ObjectPermission.objects.create(
            user=user,
            content_object=project,
            permission_type=ObjectPermission.PERMISSION_EDIT,
        )
        response = self.client.post(
            reverse("course_flow:make-project-live"),
            {
                "projectPk": project.id,
            },
        )
        self.assertEqual(response.status_code, 403)
        project2 = Project.objects.create(author=user)
        response = self.client.post(
            reverse("course_flow:make-project-live"),
            {
                "projectPk": project2.id,
            },
        )
        self.assertEqual(response.status_code, 200)

    def test_liveproject_role_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        user = login(self)
        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        # As a student, try to change your own role
        response = self.client.post(
            reverse("course_flow:set-liveproject-role"),
            {
                "liveprojectPk": project.id,
                "role_type": LiveProjectUser.ROLE_TEACHER,
                "permission_user": user.id,
            },
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=user,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_TEACHER,
            ).count(),
            0,
        )
        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        # As a teacher, try to set your own role
        response = self.client.post(
            reverse("course_flow:set-liveproject-role"),
            {
                "liveprojectPk": project.id,
                "role_type": LiveProjectUser.ROLE_TEACHER,
                "permission_user": user.id,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=user,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_TEACHER,
            ).count(),
            1,
        )
        user2 = User.objects.create()
        # As a teacher, try to change another user who has a student account's role to teacher
        response = self.client.post(
            reverse("course_flow:set-liveproject-role"),
            {
                "liveprojectPk": project.id,
                "role_type": LiveProjectUser.ROLE_TEACHER,
                "permission_user": user2.id,
            },
        )
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=user2,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_TEACHER,
            ).count(),
            0,
        )
        self.assertEqual(json.loads(response.content).get("action"), "error")
        # Try to change the author's permission
        response = self.client.post(
            reverse("course_flow:set-liveproject-role"),
            {
                "liveprojectPk": project.id,
                "role_type": str(LiveProjectUser.ROLE_TEACHER),
                "permission_user": author.id,
            },
        )
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=author,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_STUDENT,
            ).count(),
            0,
        )
        self.assertEqual(json.loads(response.content).get("action"), "error")

    def test_get_live_project_data(self):
        author = get_author()
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        response = self.client.post(
            reverse("course_flow:get-live-project-data"),
            {
                "liveprojectPk": liveproject.pk,
                "data_type": JSONRenderer().render("overview").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:get-live-project-data"),
            {
                "liveprojectPk": liveproject.pk,
                "data_type": JSONRenderer().render("overview").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        response = self.client.post(
            reverse("course_flow:get-live-project-data"),
            {
                "liveprojectPk": liveproject.pk,
                "data_type": JSONRenderer().render("overview").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        response = self.client.post(
            reverse("course_flow:get-live-project-data"),
            {
                "liveprojectPk": liveproject.pk,
                "data_type": JSONRenderer().render("overview").decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)

    def test_get_users_for_liveproject(self):
        author = get_author()
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        response = self.client.post(
            reverse("course_flow:get-users-for-liveproject"),
            {
                "liveprojectPk": liveproject.pk,
            },
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:get-users-for-liveproject"),
            {
                "liveprojectPk": liveproject.pk,
            },
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        response = self.client.post(
            reverse("course_flow:get-users-for-liveproject"),
            {
                "liveprojectPk": liveproject.pk,
            },
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        response = self.client.post(
            reverse("course_flow:get-users-for-liveproject"),
            {
                "liveprojectPk": liveproject.pk,
            },
        )
        self.assertEqual(response.status_code, 200)

    def test_register_as_student(self):
        author = get_author()
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        response = self.client.get(
            reverse(
                "course_flow:register-as-student",
                args=[project.registration_hash()],
            ),
        )
        self.assertEqual(response.status_code, 401)
        user = login_student(self)
        response = self.client.post(
            reverse(
                "course_flow:register-as-student",
                args=[project.registration_hash()],
            ),
        )
        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=user,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_STUDENT,
            ).count(),
            1,
        )

    def test_register_as_owner(self):
        author = login(self)
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        response = self.client.post(
            reverse(
                "course_flow:register-as-student",
                args=[project.registration_hash()],
            ),
        )
        self.assertEqual(response.status_code, 302)
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=author,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_STUDENT,
            ).count(),
            0,
        )
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=author,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_TEACHER,
            ).count(),
            1,
        )

    def test_project_exposes_hash(self):
        author = get_author()
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        user = User.objects.create()
        serialized = LiveProjectSerializer(
            liveproject, context={"user": author}
        ).data
        self.assertEqual(
            serialized.get("registration_hash"), project.registration_hash()
        )
        serialized = LiveProjectSerializer(
            liveproject, context={"user": user}
        ).data
        self.assertNotEqual(
            serialized.get("registration_hash"), project.registration_hash()
        )

    def test_liveproject_workflow_visibility_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        workflow = Activity.objects.create(author=author)
        WorkflowProject.objects.create(project=project, workflow=workflow)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:set-workflow-visibility"),
            {
                "liveprojectPk": project.id,
                "workflowPk": workflow.pk,
                "visible": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(liveproject.visible_workflows.count(), 0)

        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        response = self.client.post(
            reverse("course_flow:set-workflow-visibility"),
            {
                "liveprojectPk": project.id,
                "workflowPk": workflow.pk,
                "visible": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(liveproject.visible_workflows.count(), 0)

        ObjectPermission.objects.create(
            user=user,
            content_object=workflow,
            permission_type=ObjectPermission.PERMISSION_VIEW,
        )
        response = self.client.post(
            reverse("course_flow:set-workflow-visibility"),
            {
                "liveprojectPk": project.id,
                "workflowPk": workflow.pk,
                "visible": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(liveproject.visible_workflows.count(), 0)

        ObjectPermission.objects.create(
            user=user,
            content_object=workflow,
            permission_type=ObjectPermission.PERMISSION_NONE,
        )
        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        response = self.client.post(
            reverse("course_flow:set-workflow-visibility"),
            {
                "liveprojectPk": project.id,
                "workflowPk": workflow.pk,
                "visible": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(liveproject.visible_workflows.count(), 0)

        ObjectPermission.objects.create(
            user=user,
            content_object=workflow,
            permission_type=ObjectPermission.PERMISSION_VIEW,
        )
        response = self.client.post(
            reverse("course_flow:set-workflow-visibility"),
            {
                "liveprojectPk": project.id,
                "workflowPk": workflow.pk,
                "visible": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(liveproject.visible_workflows.count(), 1)

        # try to add a workflow from a different project, just for fun
        workflow2 = Activity.objects.create(author=user)
        WorkflowProject.objects.create(
            project=Project.objects.create(author=user), workflow=workflow2
        )
        response = self.client.post(
            reverse("course_flow:set-workflow-visibility"),
            {
                "liveprojectPk": project.id,
                "workflowPk": workflow2.pk,
                "visible": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(liveproject.visible_workflows.count(), 1)

    def test_access_workflow_as_student_teacher(self):
        author = get_author()
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        workflow = Activity.objects.create(author=author)
        WorkflowProject.objects.create(project=project, workflow=workflow)
        user = login(self)

        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        response = self.client.get(
            reverse("course_flow:workflow-update", args=[workflow.pk])
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:get-workflow-data"),
            {
                "workflowPk": workflow.pk,
            },
        )
        self.assertEqual(response.status_code, 403)

        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        response = self.client.get(
            reverse("course_flow:workflow-update", args=[workflow.pk])
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:get-workflow-data"),
            {
                "workflowPk": workflow.pk,
            },
        )
        self.assertEqual(response.status_code, 403)

        liveproject.visible_workflows.add(workflow)

        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        response = self.client.get(
            reverse("course_flow:workflow-update", args=[workflow.pk])
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.post(
            reverse("course_flow:get-workflow-data"),
            {
                "workflowPk": workflow.pk,
            },
        )
        self.assertEqual(response.status_code, 200)

        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        response = self.client.get(
            reverse("course_flow:workflow-update", args=[workflow.pk])
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.post(
            reverse("course_flow:get-workflow-data"),
            {
                "workflowPk": workflow.pk,
            },
        )
        self.assertEqual(response.status_code, 200)

    def test_assignment_create_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        workflow = Course.objects.create(author=author)
        WorkflowProject.objects.create(workflow=workflow, project=project)
        column = workflow.columns.create(author=author)  # noqa F841
        week = workflow.weeks.create(author=author)
        node = week.nodes.create(author=author)

        liveproject = LiveProject.objects.create(project=project)
        response = self.client.post(
            reverse("course_flow:create-live-assignment"),
            {"liveprojectPk": liveproject.pk, "nodePk": node.pk},
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:create-live-assignment"),
            {"liveprojectPk": liveproject.pk, "nodePk": node.pk},
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        response = self.client.post(
            reverse("course_flow:create-live-assignment"),
            {"liveprojectPk": liveproject.pk, "nodePk": node.pk},
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        response = self.client.post(
            reverse("course_flow:create-live-assignment"),
            {"liveprojectPk": liveproject.pk, "nodePk": node.pk},
        )
        self.assertEqual(response.status_code, 403)
        liveproject.visible_workflows.add(workflow)
        response = self.client.post(
            reverse("course_flow:create-live-assignment"),
            {"liveprojectPk": liveproject.pk, "nodePk": node.pk},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(LiveAssignment.objects.all().count(), 1)

    def test_assignment_add_users_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        workflow = Course.objects.create(author=author)
        WorkflowProject.objects.create(workflow=workflow, project=project)
        column = workflow.columns.create(author=author)  # noqa F841
        week = workflow.weeks.create(author=author)
        node = week.nodes.create(author=author)

        liveproject = LiveProject.objects.create(project=project)
        assignment = LiveAssignment.objects.create(
            liveproject=liveproject, task=node
        )
        LiveProjectUser.objects.create(
            user=author,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        user_list = [author.pk]
        response = self.client.post(
            reverse("course_flow:add-users-to-assignment"),
            {
                "liveassignmentPk": assignment.pk,
                "user_list": JSONRenderer().render(user_list).decode("utf-8"),
                "add": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:add-users-to-assignment"),
            {
                "liveassignmentPk": assignment.pk,
                "user_list": JSONRenderer().render(user_list).decode("utf-8"),
                "add": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        response = self.client.post(
            reverse("course_flow:add-users-to-assignment"),
            {
                "liveassignmentPk": assignment.pk,
                "user_list": JSONRenderer().render(user_list).decode("utf-8"),
                "add": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        response = self.client.post(
            reverse("course_flow:add-users-to-assignment"),
            {
                "liveassignmentPk": assignment.pk,
                "user_list": JSONRenderer().render(user_list).decode("utf-8"),
                "add": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            UserAssignment.objects.filter(
                user=user_list[0], assignment=assignment
            ).count(),
            1,
        )
        response = self.client.post(
            reverse("course_flow:add-users-to-assignment"),
            {
                "liveassignmentPk": assignment.pk,
                "user_list": JSONRenderer().render(user_list).decode("utf-8"),
                "add": JSONRenderer().render(False).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            UserAssignment.objects.filter(
                user=user_list[0], assignment=assignment
            ).count(),
            0,
        )

    def test_set_assignment_completion_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        workflow = Course.objects.create(author=author)
        WorkflowProject.objects.create(workflow=workflow, project=project)
        column = workflow.columns.create(author=author)  # noqa F841
        week = workflow.weeks.create(author=author)
        node = week.nodes.create(author=author)

        liveproject = LiveProject.objects.create(
            project=project, default_assign_to_all=False
        )
        assignment = LiveAssignment.objects.create(
            liveproject=liveproject, task=node
        )
        LiveProjectUser.objects.create(
            user=author,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        userassignment = UserAssignment.objects.create(
            user=author,
            assignment=assignment,
        )
        response = self.client.post(
            reverse("course_flow:set-assignment-completion"),
            {
                "userassignmentPk": userassignment.pk,
                "completed": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:set-assignment-completion"),
            {
                "userassignmentPk": userassignment.pk,
                "completed": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        lpu = LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        response = self.client.post(
            reverse("course_flow:set-assignment-completion"),
            {
                "userassignmentPk": userassignment.pk,
                "completed": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(
            UserAssignment.objects.get(user=author).completed, False
        )
        self.assertEqual(response.status_code, 403)
        userassignment2 = UserAssignment.objects.create(
            user=user,
            assignment=assignment,
        )
        response = self.client.post(
            reverse("course_flow:set-assignment-completion"),
            {
                "userassignmentPk": userassignment2.pk,
                "completed": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(UserAssignment.objects.get(user=user).completed, True)
        assignment.self_reporting = False
        assignment.save()
        response = self.client.post(
            reverse("course_flow:set-assignment-completion"),
            {
                "userassignmentPk": userassignment2.pk,
                "completed": JSONRenderer().render(False).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 403)
        lpu.role_type = LiveProjectUser.ROLE_TEACHER
        lpu.save()
        response = self.client.post(
            reverse("course_flow:set-assignment-completion"),
            {
                "userassignmentPk": userassignment2.pk,
                "completed": JSONRenderer().render(False).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            UserAssignment.objects.get(user=user).completed, False
        )
        response = self.client.post(
            reverse("course_flow:set-assignment-completion"),
            {
                "userassignmentPk": userassignment.pk,
                "completed": JSONRenderer().render(True).decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            UserAssignment.objects.get(user=author).completed, True
        )

    def test_get_assignments_for_node(self):
        author = get_author()
        project = Project.objects.create(author=author)
        workflow = Course.objects.create(author=author)
        WorkflowProject.objects.create(workflow=workflow, project=project)
        column = workflow.columns.first()
        week = workflow.weeks.create(author=author)
        node = week.nodes.create(author=author)
        node.column = column
        node.save()

        # Create a liveproject with an assignment
        liveproject = LiveProject.objects.create(project=project)
        assignment = LiveAssignment.objects.create(
            liveproject=liveproject, task=node
        )
        # Add the author as a liveprojectuser teacher
        LiveProjectUser.objects.create(
            user=author,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        # Assign the assignment to the author
        userassignment = UserAssignment.objects.create(
            user=author,
            assignment=assignment,
        )
        response = self.client.post(
            reverse("course_flow:get-assignments-for-node"),
            {
                "nodePk": node.pk,
            },
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:get-assignments-for-node"),
            {
                "nodePk": node.pk,
            },
        )
        self.assertEqual(response.status_code, 403)
        # Add the user to the project
        lpu = LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        response = self.client.post(
            reverse("course_flow:get-assignments-for-node"),
            {
                "nodePk": node.pk,
            },
        )
        self.assertEqual(response.status_code, 403)

        liveproject.visible_workflows.add(workflow)
        # Add the user to the assignment - not needed because happens by default
        # UserAssignment.objects.create(
        #     user=user,
        #     assignment=assignment,
        # )
        response = self.client.post(
            reverse("course_flow:get-assignments-for-node"),
            {
                "nodePk": node.pk,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)["action"], "posted")
        self.assertEqual(
            len(
                json.loads(response.content)["data_package"]["my_assignments"]
            ),
            1,
        )
        self.assertEqual(
            json.loads(response.content)["data_package"]["all_assignments"],
            None,
        )

        UserAssignment.objects.filter(user=user).delete()
        response = self.client.post(
            reverse("course_flow:get-assignments-for-node"),
            {
                "nodePk": node.pk,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)["action"], "posted")
        self.assertEqual(
            len(
                json.loads(response.content)["data_package"]["my_assignments"]
            ),
            0,
        )
        self.assertEqual(
            json.loads(response.content)["data_package"]["all_assignments"],
            None,
        )

        userassignment = UserAssignment.objects.create(
            user=user,
            assignment=assignment,
        )
        lpu = LiveProjectUser.objects.create(
            user=user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
        response = self.client.post(
            reverse("course_flow:get-assignments-for-node"),
            {
                "nodePk": node.pk,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)["action"], "posted")
        self.assertEqual(
            len(
                json.loads(response.content)["data_package"]["my_assignments"]
            ),
            1,
        )
        self.assertEqual(
            len(
                json.loads(response.content)["data_package"]["all_assignments"]
            ),
            1,
        )

        UserAssignment.objects.filter(user=user).delete()
        response = self.client.post(
            reverse("course_flow:get-assignments-for-node"),
            {
                "nodePk": node.pk,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)["action"], "posted")
        self.assertEqual(
            len(
                json.loads(response.content)["data_package"]["my_assignments"]
            ),
            0,
        )
        self.assertEqual(
            len(
                json.loads(response.content)["data_package"]["all_assignments"]
            ),
            1,
        )

    def test_assignment_default_values(self):
        author = get_author()
        student = get_author("3")
        teacher = get_author("4")
        project = Project.objects.create(author=author)
        workflow = Course.objects.create(author=author)
        WorkflowProject.objects.create(workflow=workflow, project=project)
        column = workflow.columns.first()
        week = workflow.weeks.first()
        node = week.nodes.create(author=author)
        node.column = column
        node.save()
        liveproject = LiveProject.objects.create(project=project)

        LiveProjectUser.objects.create(
            user=student,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        LiveProjectUser.objects.create(
            user=teacher,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )

        assignment = LiveAssignment.objects.create(
            liveproject=liveproject, task=node
        )

        self.assertEqual(
            assignment.self_reporting, liveproject.default_self_reporting
        )
        self.assertEqual(
            assignment.single_completion, liveproject.default_single_completion
        )
        self.assertEqual(
            UserAssignment.objects.filter(
                user=student, assignment=assignment
            ).count(),
            1,
        )
        self.assertEqual(
            UserAssignment.objects.filter(
                user=teacher, assignment=assignment
            ).count(),
            0,
        )

        liveproject.default_single_completion = True
        liveproject.default_self_reporting = False
        liveproject.default_assign_to_all = False

        liveproject.save()

        assignment = LiveAssignment.objects.create(
            liveproject=liveproject, task=node
        )

        self.assertEqual(
            assignment.self_reporting, liveproject.default_self_reporting
        )
        self.assertEqual(
            assignment.single_completion, liveproject.default_single_completion
        )
        self.assertEqual(
            UserAssignment.objects.filter(
                user=student, assignment=assignment
            ).count(),
            0,
        )
        self.assertEqual(
            UserAssignment.objects.filter(
                user=teacher, assignment=assignment
            ).count(),
            0,
        )
