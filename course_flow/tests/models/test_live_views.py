import json
import os
import time

import pandas as pd
from celery.result import AsyncResult
from channels.routing import URLRouter
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from django.test.client import RequestFactory
from django.urls import re_path, reverse
from rest_framework.renderers import JSONRenderer

from course_flow import settings, tasks
from course_flow.consumers import WorkflowUpdateConsumer
from course_flow.models import (
    Activity,
    Column,
    ColumnWorkflow,
    Comment,
    Course,
    Discipline,
    Favourite,
    LiveProject,
    LiveProjectUser,
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
    User,
    Week,
    WeekWorkflow,
    Workflow,
    WorkflowProject,
)
from course_flow.serializers import LiveProjectSerializer
from course_flow.utils import (
    get_model_from_str,
    get_parent_model,
    get_parent_model_str,
)

from .utils import check_order, get_author, login, login_student, make_object


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
        self.assertEqual(LiveProjectUser.objects.filter(user=author,role_type=LiveProjectUser.ROLE_TEACHER).count(),1)

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
        LiveProjectUser.objects.create(liveproject=project.liveproject,user=user,role_type=LiveProjectUser.ROLE_TEACHER)
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
        LiveProjectUser.objects.create(liveproject=project.liveproject,user=user,role_type=LiveProjectUser.ROLE_STUDENT)
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
            }
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:make-project-live"), 
            {
                "projectPk": project.id,
            }
        )
        self.assertEqual(response.status_code, 403)
        ObjectPermission.objects.create(user=user,content_object=project,permission_type=ObjectPermission.PERMISSION_EDIT)
        response = self.client.post(
            reverse("course_flow:make-project-live"), 
            {
                "projectPk": project.id,
            }
        )
        self.assertEqual(response.status_code, 403)
        project2 = Project.objects.create(author=user)
        response = self.client.post(
            reverse("course_flow:make-project-live"), 
            {
                "projectPk": project2.id,
            }
        )
        self.assertEqual(response.status_code, 200)

    def test_liveproject_role_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        user = login(self)
        LiveProjectUser.objects.create(user=user,liveproject=liveproject,role_type=LiveProjectUser.ROLE_STUDENT)
        response = self.client.post(
            reverse("course_flow:set-liveproject-role"), 
            {
                "liveprojectPk": project.id,
                "role_type": LiveProjectUser.ROLE_TEACHER,
                "permission_user": user.id,
            }
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(LiveProjectUser.objects.filter(user=user,liveproject=liveproject,role_type=LiveProjectUser.ROLE_TEACHER).count(),0)
        LiveProjectUser.objects.create(user=user,liveproject=liveproject,role_type=LiveProjectUser.ROLE_TEACHER)
        response = self.client.post(
            reverse("course_flow:set-liveproject-role"), 
            {
                "liveprojectPk": project.id,
                "role_type": LiveProjectUser.ROLE_TEACHER,
                "permission_user": user.id,
            }
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(LiveProjectUser.objects.filter(user=user,liveproject=liveproject,role_type=LiveProjectUser.ROLE_TEACHER).count(),1)
        user2 = User.objects.create()
        response = self.client.post(
            reverse("course_flow:set-liveproject-role"), 
            {
                "liveprojectPk": project.id,
                "role_type": LiveProjectUser.ROLE_TEACHER,
                "permission_user": user2.id,
            }
        )
        self.assertEqual(LiveProjectUser.objects.filter(user=user2,liveproject=liveproject,role_type=LiveProjectUser.ROLE_TEACHER).count(),0)
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            reverse("course_flow:set-liveproject-role"), 
            {
                "liveprojectPk": project.id,
                "role_type": str(LiveProjectUser.ROLE_TEACHER),
                "permission_user": author.id,
            }
        )
        self.assertEqual(LiveProjectUser.objects.filter(user=author,liveproject=liveproject,role_type=LiveProjectUser.ROLE_STUDENT).count(),0)
        self.assertEqual(response.status_code, 403)


    def test_get_live_project_data(self):
        author = get_author()
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        response = self.client.post(
            reverse("course_flow:get-live-project-data"), 
            {
                "liveprojectPk": liveproject.pk,
                "data_type": JSONRenderer().render("overview").decode("utf-8"),
            }
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:get-live-project-data"), 
            {
                "liveprojectPk": liveproject.pk,
                "data_type": JSONRenderer().render("overview").decode("utf-8"),
            }
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(user=user,liveproject=liveproject,role_type=LiveProjectUser.ROLE_STUDENT)
        response = self.client.post(
            reverse("course_flow:get-live-project-data"), 
            {
                "liveprojectPk": liveproject.pk,
                "data_type": JSONRenderer().render("overview").decode("utf-8"),
            }
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(user=user,liveproject=liveproject,role_type=LiveProjectUser.ROLE_TEACHER)
        response = self.client.post(
            reverse("course_flow:get-live-project-data"), 
            {
                "liveprojectPk": liveproject.pk,
                "data_type": JSONRenderer().render("overview").decode("utf-8"),
            }
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
            }
        )
        self.assertEqual(response.status_code, 401)
        user = login(self)
        response = self.client.post(
            reverse("course_flow:get-users-for-liveproject"), 
            {
                "liveprojectPk": liveproject.pk,
            }
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(user=user,liveproject=liveproject,role_type=LiveProjectUser.ROLE_STUDENT)
        response = self.client.post(
            reverse("course_flow:get-users-for-liveproject"), 
            {
                "liveprojectPk": liveproject.pk,
            }
        )
        self.assertEqual(response.status_code, 403)
        LiveProjectUser.objects.create(user=user,liveproject=liveproject,role_type=LiveProjectUser.ROLE_TEACHER)
        response = self.client.post(
            reverse("course_flow:get-users-for-liveproject"), 
            {
                "liveprojectPk": liveproject.pk,
            }
        )
        self.assertEqual(response.status_code, 200)

    def test_register_as_student(self):
        author = get_author()
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        response = self.client.get(
            reverse("course_flow:register-as-student",
                args=[project.registration_hash()]
            ),
        )
        self.assertEqual(response.status_code, 401)
        user = login_student(self)
        response = self.client.post(
            reverse("course_flow:register-as-student",
                args=[project.registration_hash()]
            ),
        )
        self.assertEqual(response.status_code, 302)
        self.assertEqual(LiveProjectUser.objects.filter(user=user,liveproject=liveproject,role_type=LiveProjectUser.ROLE_STUDENT).count(),1)


    def test_register_as_owner(self):
        author = login(self)
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        response = self.client.post(
            reverse("course_flow:register-as-student",
                args=[project.registration_hash()]
            ),
        )
        self.assertEqual(response.status_code, 302)
        self.assertEqual(LiveProjectUser.objects.filter(user=author,liveproject=liveproject,role_type=LiveProjectUser.ROLE_STUDENT).count(),0)
        self.assertEqual(LiveProjectUser.objects.filter(user=author,liveproject=liveproject,role_type=LiveProjectUser.ROLE_TEACHER).count(),1)



    def test_project_exposes_hash(self):
        author = get_author()
        project = Project.objects.create(author=author)
        liveproject = LiveProject.objects.create(project=project)
        user = User.objects.create()
        serialized = LiveProjectSerializer(liveproject,context={"user":author}).data
        self.assertEqual(serialized.get("registration_hash"),project.registration_hash())
        serialized = LiveProjectSerializer(liveproject,context={"user":user}).data
        self.assertNotEqual(serialized.get("registration_hash"),project.registration_hash())
        


