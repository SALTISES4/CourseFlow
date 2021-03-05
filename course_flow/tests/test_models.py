from django.test import TestCase
from django.conf import settings
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support.expected_conditions import (
    presence_of_element_located,
)
from django.test.client import RequestFactory
from django.urls import reverse
from django.contrib.auth.models import Group, User
from course_flow.models import (
    Project,
    Strategy,
    Column,
    Node,
    NodeStrategy,
    StrategyWorkflow,
    ColumnWorkflow,
    WorkflowProject,
    NodeLink,
    Activity,
    Outcome,
    OutcomeProject,
    OutcomeNode,
    OutcomeOutcome
)

from course_flow.utils import (
    get_model_from_str,
    get_parent_model_str,
    get_parent_model,
)

from course_flow.serializers import serializer_lookups
from rest_framework.renderers import JSONRenderer

from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver

import time

timeout = 10

"""

class BulkTestCase(StaticLiveServerTestCase):
    def setUp(self):
        self.selenium = webdriver.Chrome()
        super(BulkTestCase, self).setUp()

    def tearDown(self):
        self.selenium.quit()
        super(BulkTestCase, self).tearDown()

    def test_register_create_activity(self):
        selenium = self.selenium

        selenium.get(self.live_server_url + "/register/")

        first_name = selenium.find_element_by_id("id_first_name")
        last_name = selenium.find_element_by_id("id_last_name")
        username = selenium.find_element_by_id("id_username")
        email = selenium.find_element_by_id("id_email")
        password1 = selenium.find_element_by_id("id_password1")
        password2 = selenium.find_element_by_id("id_password2")

        username_text = "test_user1"
        password_text = "testpass123"

        first_name.send_keys("test")
        last_name.send_keys("user")
        username.send_keys(username_text)
        email.send_keys("testuser@test.com")
        password1.send_keys(password_text)
        password2.send_keys(password_text)

        selenium.find_element_by_id("register-button").click()

        assert "Homepage" in selenium.find_element_by_id("header").text

        selenium.find_elements_by_class_name("create-button")[2].click()

        title = selenium.find_element_by_id("id_title")
        description = selenium.find_element_by_id("id_description")

        activity_title = "test activity title"
        activity_description = "test activity description"

        title.send_keys(activity_title)
        description.send_keys(activity_description)

        selenium.find_element_by_id("save-button").click()

        WebDriverWait(selenium, timeout).until(
            presence_of_element_located((By.CLASS_NAME, "activity"))
        )

        assert (
            activity_title
            in selenium.find_element_by_id("activity-title").text
        )

        assert (
            activity_description
            in selenium.find_element_by_id("activity-description").text
        )

        assert (
            username_text
            in selenium.find_element_by_id("activity-author").text
        )

        selenium.find_element_by_id("update-activity").click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        activity_title = "test activity title updated"
        activity_description = "test activity description updated"

        title.send_keys(" updated")
        description.send_keys(" updated")

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert (
            activity_title
            in selenium.find_element_by_id("activity-title").text
        )

        assert (
            activity_description
            in selenium.find_element_by_id("activity-description").text
        )

        assert (
            username_text
            in selenium.find_element_by_id("activity-author").text
        )

        selenium.find_element_by_id("add-strategy").click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        strategy_title = "test strategy title"
        strategy_description = "test strategy description"

        title.send_keys(strategy_title)
        description.send_keys(strategy_description)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        selenium.find_elements_by_class_name("strategy")

        assert (
            strategy_title
            in selenium.find_elements_by_class_name("strategy-title")[0].text
        )

        assert (
            strategy_description
            in selenium.find_elements_by_class_name("strategy-description")[
                0
            ].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("strategy-author")[0].text
        )

        selenium.find_elements_by_class_name("update-strategy")[0].click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        strategy_title = "test strategy title updated"
        strategy_description = "test strategy description updated"

        title.send_keys(" updated")
        description.send_keys(" updated")

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert (
            strategy_title
            in selenium.find_elements_by_class_name("strategy-title")[0].text
        )

        assert (
            strategy_description
            in selenium.find_elements_by_class_name("strategy-description")[
                0
            ].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("strategy-author")[0].text
        )

        selenium.find_elements_by_class_name("add-node")[0].click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        node_title = "test node title"
        node_description = "test node description"

        title.send_keys(node_title)
        description.send_keys(node_description)
        Select(
            selenium.find_elements_by_class_name("mdc-select__native-control")[
                0
            ]
        ).select_by_value("1")
        Select(
            selenium.find_elements_by_class_name("mdc-select__native-control")[
                1
            ]
        ).select_by_value("1")

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        selenium.find_elements_by_class_name("node")

        assert (
            node_title
            in selenium.find_elements_by_class_name("node-title")[0].text
        )

        assert (
            node_description
            in selenium.find_elements_by_class_name("node-description")[0].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("node-author")[0].text
        )

        selenium.find_elements_by_class_name("update-node")[0].click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        node_title = "test node title updated"
        node_description = "test node description updated"

        title.send_keys(" updated")
        description.send_keys(" updated")

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        selenium.find_elements_by_class_name("node")

        assert (
            node_title
            in selenium.find_elements_by_class_name("node-title")[0].text
        )

        assert (
            node_description
            in selenium.find_elements_by_class_name("node-description")[0].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("node-author")[0].text
        )

        selenium.find_elements_by_class_name("delete-node")[0].click()

        time.sleep(2)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert not selenium.find_elements_by_class_name("node")

        selenium.find_elements_by_class_name("delete-strategy")[0].click()

        time.sleep(2)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert not selenium.find_elements_by_class_name("strategy")

        selenium.find_element_by_id("delete-activity").click()

        time.sleep(2)

        selenium.find_element_by_id("submit-button").click()

        selenium.get(self.live_server_url + "/home/")

        selenium.find_elements_by_class_name("create-button")[1].click()

        title = selenium.find_element_by_id("id_title")
        description = selenium.find_element_by_id("id_description")

        course_title = "test course title"
        course_description = "test course description"

        title.send_keys(course_title)
        description.send_keys(course_description)

        selenium.find_element_by_id("save-button").click()

        WebDriverWait(selenium, timeout).until(
            presence_of_element_located((By.CLASS_NAME, "course"))
        )

        assert course_title in selenium.find_element_by_id("course-title").text

        assert (
            course_description
            in selenium.find_element_by_id("course-description").text
        )

        assert (
            username_text in selenium.find_element_by_id("course-author").text
        )

        selenium.find_element_by_id("update-course").click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        course_title = "test course title updated"
        course_description = "test course description updated"

        title.send_keys(" updated")
        description.send_keys(" updated")

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert course_title in selenium.find_element_by_id("course-title").text

        assert (
            course_description
            in selenium.find_element_by_id("course-description").text
        )

        assert (
            username_text in selenium.find_element_by_id("course-author").text
        )

        selenium.find_element_by_id("add-week").click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")

        week_title = "test week title"

        title.send_keys(week_title)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        selenium.find_elements_by_class_name("week")[0]

        assert (
            week_title
            in selenium.find_elements_by_class_name("week-title")[0].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("week-author")[0].text
        )

        selenium.find_elements_by_class_name("update-week")[0].click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")

        strategy_title = "test strategy title updated"

        title.send_keys(" updated")

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert (
            week_title
            in selenium.find_elements_by_class_name("week-title")[0].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("week-author")[0].text
        )

        selenium.find_elements_by_class_name("add-component")[0].click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        component_title = "test component title"
        component_description = "test component description"

        Select(
            selenium.find_elements_by_class_name("mdc-select__native-control")[
                0
            ]
        ).select_by_value("assessment")
        title.send_keys(component_title)
        description.send_keys(component_description)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        selenium.find_elements_by_class_name("component")[0]

        assert (
            component_title
            in selenium.find_elements_by_class_name("component-title")[0].text
        )

        assert (
            component_description
            in selenium.find_elements_by_class_name("component-description")[
                0
            ].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("component-author")[0].text
        )

        selenium.find_elements_by_class_name("update-component")[0].click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        component_title = "test component title updated"
        component_description = "test component description updated"

        title.send_keys(" updated")
        description.send_keys(" updated")

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        selenium.find_elements_by_class_name("component")[0]

        assert (
            component_title
            in selenium.find_elements_by_class_name("component-title")[0].text
        )

        assert (
            component_description
            in selenium.find_elements_by_class_name("component-description")[
                0
            ].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("component-author")[0].text
        )

        selenium.find_elements_by_class_name("delete-component")[0].click()

        time.sleep(2)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert not selenium.find_elements_by_class_name("component")

        selenium.find_elements_by_class_name("delete-week")[0].click()

        time.sleep(2)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert not selenium.find_elements_by_class_name("week")

        selenium.find_element_by_id("delete-course").click()

        time.sleep(2)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        selenium.get(self.live_server_url + "/home/")

        assert "Homepage" in selenium.find_element_by_id("header").text

        selenium.find_elements_by_class_name("create-button")[0].click()

        title = selenium.find_element_by_id("id_title")
        description = selenium.find_element_by_id("id_description")

        program_title = "test program title"
        program_description = "test program description"

        title.send_keys(program_title)
        description.send_keys(program_description)

        selenium.find_element_by_id("save-button").click()

        WebDriverWait(selenium, timeout).until(
            presence_of_element_located((By.CLASS_NAME, "program"))
        )

        assert (
            program_title in selenium.find_element_by_id("program-title").text
        )

        assert (
            program_description
            in selenium.find_element_by_id("program-description").text
        )

        assert (
            username_text in selenium.find_element_by_id("program-author").text
        )

        selenium.find_element_by_id("update-program").click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        program_title = "test program title updated"
        program_description = "test program description updated"

        title.send_keys(" updated")
        description.send_keys(" updated")

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert (
            program_title in selenium.find_element_by_id("program-title").text
        )

        assert (
            program_description
            in selenium.find_element_by_id("program-description").text
        )

        assert (
            username_text in selenium.find_element_by_id("program-author").text
        )

        selenium.find_element_by_id("add-component").click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        Select(
            selenium.find_elements_by_class_name("mdc-select__native-control")[
                0
            ]
        ).select_by_value("assessment")
        component_title = "test component title"
        component_description = "test component description"

        title.send_keys(component_title)
        description.send_keys(component_description)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        selenium.find_elements_by_class_name("component")[0]

        assert (
            component_title
            in selenium.find_elements_by_class_name("component-title")[0].text
        )

        assert (
            component_description
            in selenium.find_elements_by_class_name("component-description")[
                0
            ].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("component-author")[0].text
        )

        selenium.find_elements_by_class_name("update-component")[0].click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        component_title = "test component title updated"
        component_description = "test component description updated"

        title.send_keys(" updated")
        description.send_keys(" updated")

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert (
            component_title
            in selenium.find_elements_by_class_name("component-title")[0].text
        )

        assert (
            component_description
            in selenium.find_elements_by_class_name("component-description")[
                0
            ].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("component-author")[0].text
        )

        selenium.find_elements_by_class_name("delete-component")[0].click()

        time.sleep(2)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert not selenium.find_elements_by_class_name("component")

        selenium.find_element_by_id("delete-program").click()

        time.sleep(2)

        selenium.find_element_by_id("submit-button").click()

"""


def make_object(model_key, author=None):
    if model_key == "column":
        return get_model_from_str(model_key).objects.create(
            title="test" + model_key + "title", author=author
        )
    else:
        return get_model_from_str(model_key).objects.create(
            title="test" + model_key + "title",
            description="test" + model_key + "description",
            author=author,
        )


def login(test_case):
    user = User.objects.create(username="testuser1")
    user.set_password("testpass1")
    user.save()
    teacher_group, _ = Group.objects.get_or_create(name=settings.TEACHER_GROUP)
    user.groups.add(teacher_group)
    logged_in = test_case.client.login(
        username="testuser1", password="testpass1"
    )
    test_case.assertTrue(logged_in)
    return user


def get_author():
    author = User.objects.create(username="testuser2")
    author.set_password("testpass2")
    author.save()
    teacher_group, _ = Group.objects.get_or_create(name=settings.TEACHER_GROUP)
    author.groups.add(teacher_group)
    return author


def check_order(test_case, object_links):
    sorted_links = object_links.order_by("rank")
    for i, link in enumerate(sorted_links):
        test_case.assertEqual(link.rank, i)


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
        outcome= make_object("outcome", user)
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
            # Get the base strategy and the first column
            base_strategy = StrategyWorkflow.objects.get(
                workflow=workflow, rank=0
            ).strategy
            first_column = ColumnWorkflow.objects.get(
                workflow=workflow, rank=0
            ).column
            # Add a node to the base strategy that adds a new column
            response = self.client.post(
                reverse("course_flow:new-node"),
                {
                    "strategyPk": str(base_strategy.id),
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
            Strategy.objects.all().delete()
            Column.objects.all().delete()

    def test_outcome_views(self):
        user = login(self)
        base_outcome = make_object("outcome",user)
        self.assertEqual(base_outcome.depth,0)
        response = self.client.post(
            reverse("course_flow:insert-child"),
            {
                "objectID":str(base_outcome.id),
                "objectType":JSONRenderer()
                    .render("outcome")
                    .decode("utf-8"),
            },
        )
        #check that child has been added and has correct depth
        self.assertEqual(Outcome.objects.all().count(),2)
        child1 = Outcome.objects.last()
        self.assertEqual(child1.depth,1)
        #Add sub-children
        response = self.client.post(
            reverse("course_flow:insert-child"),
            {
                "objectID":str(child1.id),
                "objectType":JSONRenderer()
                    .render("outcome")
                    .decode("utf-8"),
            },
        )
        response = self.client.post(
            reverse("course_flow:insert-child"),
            {
                "objectID":str(child1.id),
                "objectType":JSONRenderer()
                    .render("outcome")
                    .decode("utf-8"),
            },
        )
        check_order(self,child1.child_outcome_links)
        subchildlink1 = child1.child_outcome_links.first()
        subchildlink2 = child1.child_outcome_links.last()
        self.assertEqual(subchildlink1.child.depth,2)
        self.assertEqual(subchildlink1.rank,0)
        self.assertEqual(subchildlink2.rank,1)
        #swap the children
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID":str(subchildlink2.id),
                "objectType":JSONRenderer()
                    .render("outcomeoutcome")
                    .decode("utf-8"),
                "parentID":str(child1.id),
                "newPosition":str(0)
            },
        )
        subchildlink1 = OutcomeOutcome.objects.get(id=subchildlink1.id)
        subchildlink2 = OutcomeOutcome.objects.get(id=subchildlink2.id)
        self.assertEqual(subchildlink2.rank,0)
        self.assertEqual(subchildlink1.rank,1)
        self.assertEqual(subchildlink2.child.depth,2)
        check_order(self,child1.child_outcome_links)
        #swap a child into the base outcome
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID":str(subchildlink2.id),
                "objectType":JSONRenderer()
                    .render("outcomeoutcome")
                    .decode("utf-8"),
                "parentID":str(base_outcome.id),
                "newPosition":str(0)
            },
        )
        subchildlink1 = OutcomeOutcome.objects.get(id=subchildlink1.id)
        subchildlink2 = OutcomeOutcome.objects.get(id=subchildlink2.id)
        self.assertEqual(subchildlink1.rank,0)
        self.assertEqual(subchildlink2.rank,0)
        self.assertEqual(subchildlink2.parent.id,base_outcome.id)
        check_order(self,child1.child_outcome_links)
        check_order(self,base_outcome.child_outcome_links)
        self.assertEqual(subchildlink2.child.depth,1)
        
        
        
    def test_add_strategy_column_node(self):
        user = login(self)
        for i, object_type in enumerate(["activity", "course", "program"]):
            workflow = make_object(object_type, user)
            # Check for the default strategy
            self.assertEqual(workflow.strategies.all().count(), 1)
            # Check for the default columns
            self.assertEqual(
                workflow.columns.all().count(), len(workflow.DEFAULT_COLUMNS)
            )
            # Get the base strategy and the first column
            base_strategy = StrategyWorkflow.objects.get(
                workflow=workflow, rank=0
            ).strategy
            first_column = ColumnWorkflow.objects.get(
                workflow=workflow, rank=0
            ).column
            # Add a custom column to the base strategy
            response = self.client.post(
                reverse("course_flow:new-column"),
                {"workflowPk": str(workflow.id), "column_type": i * 10},
            )
            self.assertEqual(response.status_code, 200)
            # Add a node to the base strategy
            response = self.client.post(
                reverse("course_flow:new-node"),
                {
                    "strategyPk": str(base_strategy.id),
                    "columnPk": str(first_column.id),
                    "columnType": str(first_column.column_type),
                    "position": 0,
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(Node.objects.all().count(), 1)
            first_node = base_strategy.nodes.all().first()
            # Insert a node below the node
            response = self.client.post(
                reverse("course_flow:insert-sibling"),
                {
                    "objectID": str(first_node.id),
                    "objectType": JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                    "parentID": str(base_strategy.id),
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(Node.objects.all().count(), 2)
            # Insert a strategy below the strategy
            response = self.client.post(
                reverse("course_flow:insert-sibling"),
                {
                    "objectID": base_strategy.id,
                    "objectType": JSONRenderer()
                    .render("strategy")
                    .decode("utf-8"),
                    "parentID": workflow.id,
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(Strategy.objects.all().count(), 2)

            # Update the titles
            new_values = {"title": "test title 1"}
            response = self.client.post(
                reverse("course_flow:update-value"),
                {
                    "objectID": base_strategy.id,
                    "objectType": JSONRenderer()
                    .render("strategy")
                    .decode("utf-8"),
                    "data": JSONRenderer().render(new_values).decode("utf-8"),
                },
            )
            base_strategy = StrategyWorkflow.objects.get(
                workflow=workflow, rank=0
            ).strategy
            self.assertEqual(response.status_code, 200)
            self.assertEqual(base_strategy.title, "test title 1")
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
            first_node = NodeStrategy.objects.get(
                strategy=base_strategy, rank=0
            ).node
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
            # Add more nodes to the base strategy
            for column in workflow.columns.all():
                self.client.post(
                    reverse("course_flow:new-node"),
                    {
                        "strategyPk": str(base_strategy.id),
                        "columnPk": str(column.id),
                        "columnType": str(column.column_type),
                        "position": 0,
                    },
                )
            second_column = ColumnWorkflow.objects.get(
                workflow=workflow, rank=1
            ).column
            second_strategy = StrategyWorkflow.objects.get(
                workflow=workflow, rank=1
            ).strategy
            # reorder the nodes
            # Move rank 1 up a rank, down a rank, and not at all
            for change in [0, 1, -1, 99, -99]:
                to_move = NodeStrategy.objects.get(
                    strategy=base_strategy, rank=1
                )
                response = self.client.post(
                    reverse("course_flow:inserted-at"),
                    {
                        "objectID": to_move.id,
                        "parentID": base_strategy.id,
                        "objectType": JSONRenderer()
                        .render("nodestrategy")
                        .decode("utf-8"),
                        "newPosition": 1 + change,
                    },
                )
                self.assertEqual(response.status_code, 200)
                to_move = NodeStrategy.objects.get(id=to_move.id)
                self.assertEqual(
                    to_move.rank,
                    max(min(1 + change, base_strategy.nodes.count() - 1), 0),
                )
                check_order(self, base_strategy.nodestrategy_set)
            # move some nodes into the second week
            for position in [0, 1, -1]:
                to_move = NodeStrategy.objects.get(
                    strategy=base_strategy, rank=0
                )
                response = self.client.post(
                    reverse("course_flow:inserted-at"),
                    {
                        "objectID": to_move.id,
                        "parentID": second_strategy.id,
                        "objectType": JSONRenderer()
                        .render("nodestrategy")
                        .decode("utf-8"),
                        "newPosition": position,
                    },
                )
                self.assertEqual(response.status_code, 200)
                to_move = NodeStrategy.objects.get(id=to_move.id)
                self.assertEqual(
                    to_move.rank,
                    max(min(position, second_strategy.nodes.count() - 1), 0),
                )
                self.assertEqual(to_move.strategy.id, second_strategy.id)
                check_order(self, base_strategy.nodestrategy_set)
                check_order(self, second_strategy.nodestrategy_set)
            # swap two strategies
            to_move = StrategyWorkflow.objects.get(strategy=base_strategy)
            response = self.client.post(
                reverse("course_flow:inserted-at"),
                {
                    "objectID": to_move.id,
                    "parentID": workflow.id,
                    "objectType": JSONRenderer()
                    .render("strategyworkflow")
                    .decode("utf-8"),
                    "newPosition": 1,
                },
            )
            self.assertEqual(response.status_code, 200)
            to_move = StrategyWorkflow.objects.get(id=to_move.id)
            self.assertEqual(to_move.rank, 1)
            check_order(self, workflow.strategyworkflow_set)
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
            base_strategy = StrategyWorkflow.objects.get(
                workflow=workflow, rank=0
            ).strategy
            number_of_nodes = base_strategy.nodes.count()
            node = base_strategy.nodes.all().first()
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
            self.assertEqual(base_strategy.nodes.count(), number_of_nodes - 1)
            check_order(self, base_strategy.nodestrategy_set)
            number_of_strategies = workflow.strategies.count()
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {
                    "objectID": base_strategy.id,
                    "objectType": JSONRenderer()
                    .render("strategy")
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                workflow.strategies.count(), number_of_strategies - 1
            )
            check_order(self, workflow.strategyworkflow_set)

            Node.objects.all().delete()
            Strategy.objects.all().delete()
            Column.objects.all().delete()

    def test_linked_wf_no_login_no_authorship(self):
        author = get_author()
        project = make_object("project", author)
        activity = make_object("activity", author)
        course = make_object("course", author)
        WorkflowProject.objects.create(workflow=activity, project=project)
        strategy = course.strategies.create(author=author)
        node = strategy.nodes.create(author=author)
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
        self.assertEqual(response.status_code, 401)

    # Test for linking a workflow. Nothing should change except for the node
    def test_linked_wf_same_project(self):
        author = login(self)
        project = make_object("project", author)
        activity = make_object("activity", author)
        course = make_object("course", author)
        WorkflowProject.objects.create(workflow=activity, project=project)
        WorkflowProject.objects.create(workflow=course, project=project)
        strategy = course.strategies.create(author=author)
        node = strategy.nodes.create(author=author)
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
        activity.strategies.create(author=author)
        strategy = course.strategies.create(author=author)
        node = strategy.nodes.create(author=author)
        response = self.client.post(
            reverse("course_flow:set-linked-workflow"),
            {"nodePk": node.id, "workflowPk": activity.id},
        )
        self.assertEqual(response.status_code, 200)
        new_activity = Node.objects.get(id=node.id).linked_workflow
        self.assertNotEqual(new_activity.id, activity.id)
        self.assertEqual(new_activity.id, project.workflows.last().id)
        self.assertEqual(Activity.objects.all().count(), 2)
        self.assertEqual(Strategy.objects.all().count(), 6)
        self.assertEqual(new_activity.parent_workflow.id, activity.id)

    # Test for linking a workflow from another project. The workflow should be duplicated into the project.
    # We try first for an unpublished, then a published project
    def test_linked_wf_same_author(self):
        author = get_author()
        user = login(self)
        project = make_object("project", user)
        project2 = make_object("project", author)
        activity = make_object("activity", author)
        course = make_object("course", user)
        WorkflowProject.objects.create(workflow=activity, project=project2)
        WorkflowProject.objects.create(workflow=course, project=project)
        activity.strategies.create(author=author)
        strategy = course.strategies.create(author=user)
        node = strategy.nodes.create(author=user)
        response = self.client.post(
            reverse("course_flow:set-linked-workflow"),
            {"nodePk": node.id, "workflowPk": activity.id},
        )
        self.assertEqual(Node.objects.get(id=node.id).linked_workflow, None)
        project2.published = True
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
        self.assertEqual(Strategy.objects.all().count(), 6)
        self.assertEqual(new_activity.parent_workflow.id, activity.id)

    def test_delete_self_no_login_no_authorship(self):
        author = get_author()
        type_list = [
            "project",
            "program",
            "course",
            "activity",
            "strategy",
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
            self.assertEqual(response.status_code, 401)

    def test_update_value_no_login_no_authorship(self):
        author = get_author()
        type_list = [
            "program",
            "course",
            "activity",
            "strategy",
            "node",
            "column",
            "outcome"
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
            self.assertEqual(response.status_code, 401)

    def test_reorder_no_login_no_authorship(self):
        author = get_author()
        strategy1 = make_object("strategy", author)
        node0 = strategy1.nodes.create(author=author)
        node1 = strategy1.nodes.create(
            author=author, through_defaults={"rank": 1}
        )
        workflow1 = make_object("activity", author)
        column1 = make_object("column", author)
        columnworkflow1 = ColumnWorkflow.objects.create(
            column=column1, workflow=workflow1
        )
        node0.column = column1
        node1.column = column1
        node0.save()
        node1.save()
        to_move = NodeStrategy.objects.get(strategy=strategy1, rank=0)
        # Try to move within the same strategy
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.id,
                "objectType": JSONRenderer()
                .render("nodestrategy")
                .decode("utf-8"),
                "parentID": strategy1.id,
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
                .render("nodestrategy")
                .decode("utf-8"),
                "parentID": strategy1.id,
                "newPosition": 1,
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:change-column"),
            {"nodePk": to_move.node.id, "columnID": columnworkflow1.id},
        )
        self.assertEqual(response.status_code, 401)
        # Try to move from their stuff to your own
        strategy2 = make_object("strategy", user)
        node2 = strategy2.nodes.create(author=user)
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
                .render("nodestrategy")
                .decode("utf-8"),
                "parentID": strategy2.id,
                "newPosition": 1,
            },
        )
        self.assertEqual(
            NodeStrategy.objects.get(id=to_move.id).strategy.id, strategy2.id
        )
        response = self.client.post(
            reverse("course_flow:change-column"),
            {"nodePk": to_move.id, "columnID": columnworkflow2.id},
        )
        self.assertEqual(
            Node.objects.get(id=to_move.node.id).column.id, column1.id
        )
        # Try to move from your stuff to theirs
        to_move = NodeStrategy.objects.get(strategy=strategy2, rank=0)
        response = self.client.post(
            reverse("course_flow:change-column"),
            {"nodePk": to_move.node.id, "columnID": columnworkflow1.id},
        )
        self.assertEqual(
            Node.objects.get(id=to_move.node.id).column.id, column2.id
        )
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.id,
                "objectType": JSONRenderer()
                .render("nodestrategy")
                .decode("utf-8"),
                "parentID": strategy1.id,
                "newPosition": 1,
            },
        )
        self.assertEqual(response.status_code, 401)
        # Finally, check to make sure these work when you own both
        strategy2b = make_object("strategy", user)
        column2b = make_object("column", user)
        columnworkflow2b = ColumnWorkflow.objects.create(
            column=column2b, workflow=workflow2
        )
        response = self.client.post(
            reverse("course_flow:change-column"),
            {"nodePk": to_move.node.id, "columnID": columnworkflow2b.id},
        )
        self.assertEqual(
            Node.objects.get(id=to_move.node.id).column.id, column2b.id
        )
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {
                "objectID": to_move.id,
                "objectType": JSONRenderer()
                .render("nodestrategy")
                .decode("utf-8"),
                "parentID": strategy2b.id,
                "newPosition": 0,
            },
        )
        self.assertEqual(
            NodeStrategy.objects.get(id=to_move.id).strategy.id, strategy2b.id
        )

    def test_insert_sibling_no_login_no_authorship(self):
        author = get_author()
        activity1 = make_object("activity", author)
        strategy1 = activity1.strategies.create(author=author)
        node1 = strategy1.nodes.create(author=author)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": NodeStrategy.objects.get(node=node1).id,
                "parentID": strategy1.id,
                "objectType": JSONRenderer()
                .render("nodestrategy")
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": StrategyWorkflow.objects.get(
                    strategy=strategy1
                ).id,
                "parentID": activity1.id,
                "objectType": JSONRenderer()
                .render("strategyworkflow")
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        login(self)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": NodeStrategy.objects.get(node=node1).id,
                "parentID": strategy1.id,
                "objectType": JSONRenderer()
                .render("nodestrategy")
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {
                "objectID": StrategyWorkflow.objects.get(
                    strategy=strategy1
                ).id,
                "parentID": activity1.id,
                "objectType": JSONRenderer()
                .render("strategyworkflow")
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)

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
                "targetID": node2.id,
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
                "targetID": node2.id,
                "sourcePort": 2,
                "targetPort": 0,
            },
        )
        self.assertEqual(response.status_code, 401)
        
    def test_add_remove_outcome_to_node_permissions_no_authorship(self):
        myself = login(self)
        author = get_author()
        node = make_object("node", author)
        outcome = make_object("outcome", author)
        response = self.client.post(
            reverse("course_flow:add-outcome-to-node"),
            {
                "nodePk": node.id,
                "outcomePk": outcome.id,
            },
        )
        self.assertEqual(response.status_code, 401)
        outcomenode = OutcomeNode.objects.create(node=node,outcome=outcome)
        response = self.client.post(
            reverse("course_flow:unlink-outcome-from-node"),
            {
                "objectID":outcomenode.id
            },
        )
        self.assertEqual(response.status_code, 401)
        myoutcome = make_object("outcome",myself)
        mynode = make_object("node",myself)
        response = self.client.post(
            reverse("course_flow:add-outcome-to-node"),
            {
                "nodePk": mynode.id,
                "outcomePk": outcome.id,
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:add-outcome-to-node"),
            {
                "nodePk": node.id,
                "outcomePk": myoutcome.id,
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:add-outcome-to-node"),
            {
                "nodePk": mynode.id,
                "outcomePk": myoutcome.id,
            },
        )
        self.assertEqual(response.status_code, 200)

    def test_duplicate_self_permissions_no_login_no_authorship(self):
        author = get_author()
        activity = make_object("activity", author)
        strategy = StrategyWorkflow.objects.get(workflow=activity).strategy
        node = strategy.nodes.create(author=author, title="test_title")
        node.column = activity.columnworkflow_set.first().column
        node.save()
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "parentID": strategy.id,
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": strategy.id,
                "objectType": JSONRenderer()
                .render("strategy")
                .decode("utf-8"),
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
        strategy = StrategyWorkflow.objects.get(workflow=activity).strategy
        node = strategy.nodes.create(author=author, title="test_title")
        node.column = activity.columnworkflow_set.first().column
        node.save()
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": node.id,
                "objectType": JSONRenderer().render("node").decode("utf-8"),
                "parentID": strategy.id,
            },
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": strategy.id,
                "objectType": JSONRenderer()
                .render("strategy")
                .decode("utf-8"),
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

    def test_duplicate_self(self):
        author = login(self)
        activity = make_object("activity", author)
        strategy = StrategyWorkflow.objects.get(workflow=activity).strategy
        node = strategy.nodes.create(author=author, title="test_title")
        node.column = activity.columnworkflow_set.first().column
        node.save()
        node2 = strategy.nodes.create(author=author, title="test_title")
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
                "parentID": strategy.id,
            },
        )
        self.assertEqual(response.status_code, 200)
        response = self.client.post(
            reverse("course_flow:duplicate-self"),
            {
                "objectID": strategy.id,
                "objectType": JSONRenderer()
                .render("strategy")
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
                "parentID": activity.id,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Node.objects.all().count(), 6)
        self.assertEqual(NodeLink.objects.all().count(), 1)

    def test_duplicate_activity(self):
        author = login(self)
        activity = make_object("activity", author)
        strategy = StrategyWorkflow.objects.get(workflow=activity).strategy
        node = strategy.nodes.create(author=author, title="test_title")
        node.column = activity.columnworkflow_set.first().column
        node.save()
        node2 = strategy.nodes.create(author=author, title="test_title")
        node2.column = activity.columnworkflow_set.first().column
        node2.save()
        nodelink = NodeLink.objects.create(
            source_node=node, target_node=node2, source_port=2, target_port=0
        )
        response = self.client.post(
            reverse("course_flow:duplicate-workflow"),
            {"workflowPk": activity.id},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Node.objects.all().count(), 4)
        self.assertEqual(NodeLink.objects.all().count(), 2)
        second_nodelink = NodeLink.objects.get(is_original=False)
        self.assertEqual(second_nodelink.source_node.is_original, False)
        self.assertEqual(second_nodelink.target_node.is_original, False)

    def test_duplicate_activity_no_login(self):
        author = get_author()
        activity = make_object("activity", author)
        strategy = StrategyWorkflow.objects.get(workflow=activity).strategy
        node = strategy.nodes.create(author=author, title="test_title")
        node.column = activity.columnworkflow_set.first().column
        node.save()
        node2 = strategy.nodes.create(author=author, title="test_title")
        node2.column = activity.columnworkflow_set.first().column
        node2.save()
        nodelink = NodeLink.objects.create(
            source_node=node, target_node=node2, source_port=2, target_port=0
        )
        response = self.client.post(
            reverse("course_flow:duplicate-workflow"),
            {"workflowPk": activity.id},
        )
        self.assertEqual(response.status_code, 401)

    def test_publish_permissions_no_login_no_authorship(self):
        author = get_author()
        project = make_object("project", author)
        response = self.client.post(
            reverse("course_flow:project-toggle-published"),
            {"projectPk": project.id},
        )
        self.assertEqual(response.status_code, 401)

    def test_publish_permissions_no_authorship(self):
        login(self)
        author = get_author()
        project = make_object("project", author)
        response = self.client.post(
            reverse("course_flow:project-toggle-published"),
            {"projectPk": project.id},
        )
        self.assertEqual(response.status_code, 401)
