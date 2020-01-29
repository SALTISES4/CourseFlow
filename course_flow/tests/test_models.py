from django.test import TestCase
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support.expected_conditions import (
    presence_of_element_located,
)
from django.test.client import RequestFactory
from django.urls import reverse
from course_flow.models import (
    model_lookups,
    model_keys,
    User,
    Strategy,
    Node,
    NodeStrategy,
    StrategyActivity,
    ComponentWeek,
    Component,
    ComponentProgram,
)
from course_flow.serializers import serializer_lookups
from rest_framework.renderers import JSONRenderer

from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver

import time

timeout = 200


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
        ).select_by_value("assesment")
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
        ).select_by_value("assesment")
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

        time.sleep(20)


def make_object(model_key, author=None):
    if model_key == "week":
        return model_lookups[model_key].objects.create(
            title="test" + model_key + "title", author=author
        )
    else:
        return model_lookups[model_key].objects.create(
            title="test" + model_key + "title",
            description="test" + model_key + "description",
            author=author,
        )


def make_component(model_key, author=None):
    return Component.objects.create(
        content_object=make_object(model_key, author)
    )


def login(test_case):
    user = User.objects.create(username="testuser1")
    user.set_password("testpass1")
    user.save()
    logged_in = test_case.client.login(
        username="testuser1", password="testpass1"
    )
    test_case.assertTrue(logged_in)
    return user


def get_author():
    author = User.objects.create(username="testuser2")
    author.set_password("testpass2")
    author.save()
    return author


class ModelViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_program_detail_view(self):
        author = get_author()
        program = make_object("program", author)
        response = self.client.get(
            reverse("program-detail", args=str(program.pk))
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(
            reverse("program-detail", args=str(program.pk))
        )
        self.assertEqual(response.status_code, 200)

    def test_course_detail_view(self):
        author = get_author()
        course = make_object("course", author)
        response = self.client.get(
            reverse("course-detail", args=str(course.pk))
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(
            reverse("course-detail", args=str(course.pk))
        )
        self.assertEqual(response.status_code, 200)

    def test_activity_detail_view(self):
        author = get_author()
        activity = make_object("activity", author)
        response = self.client.get(
            reverse("activity-detail", args=str(activity.pk))
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(
            reverse("activity-detail", args=str(activity.pk))
        )
        self.assertEqual(response.status_code, 200)

    def test_program_create_view(self):
        response = self.client.get(reverse("program-create"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("program-create"))
        self.assertEqual(response.status_code, 200)

    def test_course_create_view(self):
        response = self.client.get(reverse("course-create"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("course-create"))
        self.assertEqual(response.status_code, 200)

    def test_activity_create_view(self):
        response = self.client.get(reverse("activity-create"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("activity-create"))
        self.assertEqual(response.status_code, 200)

    def test_program_update_view(self):
        author = get_author()
        program = make_object("program", author)
        response = self.client.get(
            reverse("program-update", args=str(program.pk))
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(
            reverse("program-update", args=str(program.pk))
        )
        self.assertEqual(response.status_code, 403)

    def test_course_update_view(self):
        author = get_author()
        course = make_object("course", author)
        response = self.client.get(
            reverse("course-update", args=str(course.pk))
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(
            reverse("course-update", args=str(course.pk))
        )
        self.assertEqual(response.status_code, 403)

    def test_activity_update_view(self):
        author = get_author()
        activity = make_object("activity", author)
        response = self.client.get(
            reverse("activity-update", args=str(activity.pk))
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(
            reverse("activity-update", args=str(activity.pk))
        )
        self.assertEqual(response.status_code, 403)

    def test_program_update_view_is_owner(self):
        user = login(self)
        program = make_object("program", user)
        response = self.client.get(
            reverse("program-update", args=str(program.pk))
        )
        self.assertEqual(response.status_code, 200)

    def test_course_update_view_is_owner(self):
        user = login(self)
        course = make_object("course", user)
        response = self.client.get(
            reverse("course-update", args=str(course.pk))
        )
        self.assertEqual(response.status_code, 200)

    def test_activity_update_view_is_owner(self):
        user = login(self)
        activity = make_object("activity", user)
        response = self.client.get(
            reverse("activity-update", args=str(activity.pk))
        )
        self.assertEqual(response.status_code, 200)


class ModelPostTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_dialog_post_permissions_no_login(self):
        author = get_author()
        object_to_be = {
            "title": "test title 1",
            "description": "test description 1",
            "author": None,
            "work_classification": 1,
            "activity_classification": 1,
        }
        parent_id = 1
        is_program_level_component = False
        for object_type in model_keys:
            make_object(object_type, author)
        for object_type in model_keys:
            object = make_object(object_type, author)
            response = self.client.post(
                reverse("dialog-form-create"),
                {
                    "object": object_to_be,
                    "objectType": object_type,
                    "parentID": parent_id,
                    "isProgramLevelComponent": is_program_level_component,
                },
            )
            self.assertEqual(response.status_code, 401)
            serializer_data = serializer_lookups[object_type](object).data
            serializer_data["title"] = "updated test title 1"
            serializer_data["description"] = "update test description 1"
            response = self.client.post(
                reverse("dialog-form-update"),
                {
                    "object": serializer_data,
                    "objectID": serializer_data["id"],
                    "objectType": object_type,
                },
            )
            self.assertEqual(response.status_code, 401)
            response = self.client.post(
                reverse("dialog-form-delete"),
                {"objectID": object.id, "objectType": object_type},
            )
            self.assertEqual(response.status_code, 401)

    def test_dialog_post_permissions_no_authorship(self):
        login(self)
        author = get_author()
        object_to_be = {
            "title": "test title 1",
            "description": "test description 1",
            "author": None,
            "work_classification": 1,
            "activity_classification": 1,
        }
        parent_id = 1
        is_program_level_component = False
        for object_type in model_keys:
            make_object(object_type, author)
        for object_type in model_keys:
            object = make_object(object_type, author)
            response = self.client.post(
                reverse("dialog-form-create"),
                {
                    "object": JSONRenderer()
                    .render(object_to_be)
                    .decode("utf-8"),
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                    "parentID": parent_id,
                    "isProgramLevelComponent": JSONRenderer()
                    .render(is_program_level_component)
                    .decode("utf-8"),
                },
            )
            if object_type == "program":
                self.assertEqual(response.status_code, 200)
            else:
                self.assertEqual(response.status_code, 401)
            serializer_data = serializer_lookups[object_type](object).data
            serializer_data["title"] = "updated test title 1"
            serializer_data["description"] = "update test description 1"
            response = self.client.post(
                reverse("dialog-form-update"),
                {
                    "object": JSONRenderer()
                    .render(serializer_data)
                    .decode("utf-8"),
                    "objectID": serializer_data["id"],
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 401)
            response = self.client.post(
                reverse("dialog-form-delete"),
                {
                    "objectID": object.id,
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_dialog_post(self):
        user = login(self)
        object_to_be = {
            "title": "test title 1",
            "description": "test description 1",
            "author": None,
            "work_classification": 1,
            "activity_classification": 1,
        }
        object_id = 1
        parent_id = 1
        is_program_level_component = False
        for object_type in reversed(model_keys):
            if object_type == "course":
                is_program_level_component = True
            else:
                is_program_level_component = False
            response = self.client.post(
                reverse("dialog-form-create"),
                {
                    "object": JSONRenderer()
                    .render(object_to_be)
                    .decode("utf-8"),
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                    "parentID": parent_id,
                    "isProgramLevelComponent": JSONRenderer()
                    .render(is_program_level_component)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            object = model_lookups[object_type].objects.first()
            self.assertEqual(object.title, object_to_be["title"])
            if object_type is not "week":
                self.assertEqual(
                    object.description, object_to_be["description"]
                )
            self.assertEqual(object.author, user)
            if object_type == "node":
                self.assertEqual(
                    object.work_classification,
                    object_to_be["work_classification"],
                )
                self.assertEqual(
                    object.activity_classification,
                    object_to_be["activity_classification"],
                )
            serializer_data = serializer_lookups[object_type](object).data
            serializer_data["title"] = "updated test title 1"
            if object_type is not "week":
                serializer_data["description"] = "update test description 1"
            response = self.client.post(
                reverse("dialog-form-update"),
                {
                    "object": JSONRenderer()
                    .render(serializer_data)
                    .decode("utf-8"),
                    "objectID": serializer_data["id"],
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            object = model_lookups[object_type].objects.get(id=object_id)
            serializer_data_refresh = serializer_lookups[object_type](
                object
            ).data
            self.assertEqual(
                serializer_data["title"], serializer_data_refresh["title"]
            )
            self.assertEqual(
                serializer_data["id"], serializer_data_refresh["id"]
            )
            if object_type is not "week":
                self.assertEqual(
                    serializer_data["description"],
                    serializer_data_refresh["description"],
                )
        for object_type in model_keys:
            response = self.client.post(
                reverse("dialog-form-delete"),
                {
                    "objectID": object_id,
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                model_lookups[object_type]
                .objects.filter(id=object_id)
                .count(),
                0,
            )

    def test_json_update_permissions_no_login(self):
        author = get_author()
        for object_type in ["activity", "course", "program"]:
            serializer_data = serializer_lookups[object_type](
                make_object(object_type, author)
            ).data
            serializer_data["title"] = "updated test title 1"
            serializer_data["description"] = "update test description 1"
            response = self.client.post(
                reverse("update-" + object_type + "-json"),
                {
                    "json": JSONRenderer()
                    .render(serializer_data)
                    .decode("utf-8")
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_json_update_permissions_no_authorship(self):
        login(self)
        author = get_author()
        for object_type in ["activity", "course", "program"]:
            serializer_data = serializer_lookups[object_type](
                make_object(object_type, author)
            ).data
            serializer_data["title"] = "updated test title 1"
            serializer_data["description"] = "update test description 1"
            response = self.client.post(
                reverse("update-" + object_type + "-json"),
                {
                    "json": JSONRenderer()
                    .render(serializer_data)
                    .decode("utf-8")
                },
            )
            self.assertEqual(response.status_code, 401)

    def test_json_update(self):
        user = login(self)
        for object_type in ["activity", "course", "program"]:
            serializer_data = serializer_lookups[object_type](
                make_object(object_type, user)
            ).data
            serializer_data["title"] = "updated test title 1"
            serializer_data["description"] = "update test description 1"
            response = self.client.post(
                reverse("update-" + object_type + "-json"),
                {
                    "json": JSONRenderer()
                    .render(serializer_data)
                    .decode("utf-8")
                },
            )
            self.assertEqual(response.status_code, 200)
            serializer_data_refresh = serializer_lookups[object_type](
                model_lookups[object_type].objects.get(
                    id=serializer_data["id"]
                )
            ).data
            self.assertEqual(
                serializer_data["title"], serializer_data_refresh["title"]
            )
            self.assertEqual(
                serializer_data["id"], serializer_data_refresh["id"]
            )
            self.assertEqual(
                serializer_data["description"],
                serializer_data_refresh["description"],
            )

    def test_add_node_permissions_no_login(self):
        author = get_author()
        strategy = make_object("strategy", author)
        node = make_object("node", author)
        response = self.client.post(
            reverse("add-node"), {"strategyPk": strategy.id, "nodePk": node.id}
        )
        self.assertEqual(response.status_code, 302)

    def test_add_node_permissions_no_authorship(self):
        login(self)
        author = get_author()
        strategy = make_object("strategy", author)
        node = make_object("node", author)
        response = self.client.post(
            reverse("add-node"), {"strategyPk": strategy.id, "nodePk": node.id}
        )
        self.assertEqual(response.status_code, 401)

    def test_add_strategy_permissions_no_login(self):
        author = get_author()
        strategy = make_object("strategy", author)
        activity = make_object("activity", author)
        response = self.client.post(
            reverse("add-node"),
            {"activityPk": activity.id, "strategyPk": strategy.id},
        )
        self.assertEqual(response.status_code, 302)

    def test_add_strategy_no_authorship(self):
        login(self)
        author = get_author()
        strategy = make_object("strategy", author)
        activity = make_object("activity", author)
        response = self.client.post(
            reverse("add-strategy"),
            {"activityPk": activity.id, "strategyPk": strategy.id},
        )
        self.assertEqual(response.status_code, 401)

    def test_add_strategy_add_node(self):
        user = login(self)
        strategy = make_object("strategy", user)
        activity = make_object("activity", user)
        node = make_object("node", user)
        response = self.client.post(
            reverse("add-node"), {"nodePk": node.id, "strategyPk": strategy.id}
        )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(Node.objects.all().count(), 2)
        self.assertEqual(
            NodeStrategy.objects.filter(strategy=strategy).count(), 1
        )
        created_node = NodeStrategy.objects.get(strategy=strategy).node
        self.assertEqual(NodeStrategy.objects.get(strategy=strategy).rank, 0)
        self.assertNotEqual(created_node, node)
        self.assertEqual(created_node.title, node.title)
        self.assertEqual(created_node.description, node.description)
        self.assertEqual(created_node.author, node.author)
        self.assertEqual(created_node.author, user)
        self.assertEqual(created_node.parent_node, node)
        self.assertFalse(created_node.is_original)
        self.assertEqual(
            created_node.work_classification, node.work_classification
        )
        self.assertEqual(
            created_node.activity_classification, node.activity_classification
        )
        self.assertEqual(created_node.classification, node.classification)
        response = self.client.post(
            reverse("add-strategy"),
            {"activityPk": activity.id, "strategyPk": strategy.id},
        )
        self.assertEqual(Strategy.objects.all().count(), 2)
        self.assertEqual(
            StrategyActivity.objects.filter(activity=activity).count(), 1
        )
        created_strategy = StrategyActivity.objects.get(
            activity=activity
        ).strategy
        self.assertEqual(
            StrategyActivity.objects.get(activity=activity).rank, 0
        )
        self.assertNotEqual(created_strategy, strategy)
        self.assertEqual(created_strategy.title, strategy.title)
        self.assertEqual(created_strategy.description, strategy.description)
        self.assertEqual(created_strategy.author, strategy.author)
        self.assertEqual(created_strategy.author, user)
        self.assertEqual(created_strategy.parent_strategy, strategy)
        self.assertFalse(created_strategy.is_original)

        self.assertEqual(Node.objects.all().count(), 3)
        new_created_node = NodeStrategy.objects.get(
            strategy=created_strategy
        ).node
        self.assertEqual(
            NodeStrategy.objects.get(strategy=created_strategy).rank, 0
        )
        self.assertNotEqual(new_created_node, node)
        self.assertEqual(new_created_node.title, node.title)
        self.assertEqual(new_created_node.description, node.description)
        self.assertEqual(new_created_node.author, node.author)
        self.assertEqual(new_created_node.author, user)
        self.assertEqual(new_created_node.parent_node, created_node)
        self.assertFalse(new_created_node.is_original)
        self.assertEqual(
            new_created_node.work_classification, node.work_classification
        )
        self.assertEqual(
            new_created_node.activity_classification,
            node.activity_classification,
        )
        self.assertEqual(new_created_node.classification, node.classification)

    def test_add_course_level_component_permissions_no_login(self):
        author = get_author()
        week = make_object("week", author)
        for component_type in [
            "assesment",
            "artifact",
            "preparation",
            "activity",
        ]:
            component = make_component(component_type, author)
            response = self.client.post(
                reverse("add-component-to-course"),
                {"componentPk": component.id, "weekPk": week.id},
            )
            self.assertEqual(response.status_code, 401)

    def test_add_course_level_component_permissions_no_authorship(self):
        login(self)
        author = get_author()
        week = make_object("week", author)
        for component_type in [
            "assesment",
            "artifact",
            "preparation",
            "activity",
        ]:
            component = make_component(component_type, author)
            response = self.client.post(
                reverse("add-component-to-course"),
                {"componentPk": component.id, "weekPk": week.id},
            )
            self.assertEqual(response.status_code, 401)

    def test_add_course_level_component(self):
        user = login(self)
        week = make_object("week", user)
        for component_type in [
            "assesment",
            "artifact",
            "preparation",
            "activity",
        ]:
            component = make_component(component_type, user)
            response = self.client.post(
                reverse("add-component-to-course"),
                {"componentPk": component.id, "weekPk": week.id},
            )
            self.assertEqual(response.status_code, 200)
            new_component = Component.objects.latest("pk")
            self.assertEqual(
                ComponentWeek.objects.get(
                    week=week, component=new_component
                ).rank,
                0,
            )
            if component_type is not "activity":
                self.assertNotEqual(new_component, component)
                self.assertNotEqual(
                    new_component.content_object, component.content_object
                )
                self.assertEqual(
                    new_component.content_object.title,
                    component.content_object.title,
                )
                self.assertEqual(
                    new_component.content_object.description,
                    component.content_object.description,
                )
                self.assertEqual(
                    new_component.content_object.author,
                    component.content_object.author,
                )
                self.assertEqual(new_component.content_object.author, user)
                self.assertFalse(new_component.content_object.is_original)
            else:
                self.assertEqual(new_component, component)
                self.assertTrue(new_component.content_object.is_original)

    def test_add_program_level_component_permissions_no_login(self):
        author = get_author()
        program = make_object("program", author)
        for component_type in ["course", "assesment"]:
            component = make_component(component_type, author)
            response = self.client.post(
                reverse("add-component-to-program"),
                {"componentPk": component.id, "programPk": program.id},
            )
            self.assertEqual(response.status_code, 401)

    def test_add_program_level_component_permissions_no_authorship(self):
        login(self)
        author = get_author()
        program = make_object("program", author)
        for component_type in ["course", "assesment"]:
            component = make_component(component_type, author)
            response = self.client.post(
                reverse("add-component-to-program"),
                {"componentPk": component.id, "programPk": program.id},
            )
            self.assertEqual(response.status_code, 401)

    def test_add_program_level_component(self):
        user = login(self)
        program = make_object("program", user)
        for component_type in ["course", "assesment"]:
            component = make_component(component_type, user)
            response = self.client.post(
                reverse("add-component-to-program"),
                {"componentPk": component.id, "programPk": program.id},
            )
            self.assertEqual(response.status_code, 200)
            new_component = Component.objects.latest("pk")
            self.assertEqual(
                ComponentProgram.objects.get(
                    program=program, component=new_component
                ).rank,
                0,
            )
            if component_type is not "course":
                self.assertNotEqual(new_component, component)
                self.assertEqual(
                    new_component.content_object.title,
                    component.content_object.title,
                )
                self.assertEqual(
                    new_component.content_object.description,
                    component.content_object.description,
                )
                self.assertEqual(
                    new_component.content_object.author,
                    component.content_object.author,
                )
                self.assertEqual(new_component.content_object.author, user)
                self.assertFalse(new_component.content_object.is_original)
            else:
                self.assertEqual(new_component, component)
                self.assertTrue(new_component.content_object.is_original)
