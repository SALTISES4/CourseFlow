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
    model_lookups,
    model_keys,
    Strategy,
    Column,
    Node,
    NodeStrategy,
    StrategyWorkflow,
    ColumnWorkflow,
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
        return model_lookups[model_key].objects.create(
            title="test" + model_key + "title", author=author
        )
    else:
        return model_lookups[model_key].objects.create(
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

def check_order(test_case,object_links):
    sorted_links = object_links.order_by('rank')
    for i, link in enumerate(sorted_links):
        test_case.assertEqual(link.rank,i)


class ModelViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_workflow_detail_view(self):
        author = get_author()
        for workflow_type in ["activity","course","program"]:
            workflow = make_object(workflow_type, author)
            response = self.client.get(
                reverse("course_flow:workflow-detail", args=str(workflow.pk))
            )
            self.assertEqual(response.status_code, 302)
        login(self)
        for workflow_type in ["activity","course","program"]:
            workflow = make_object(workflow_type, author)
            response = self.client.get(
                reverse("course_flow:workflow-detail", args=str(workflow.pk))
            )
            self.assertEqual(response.status_code, 200)
    
    def test_workflow_update_view(self):
        author = get_author()
        for workflow_type in ["activity","course","program"]:
            workflow = make_object(workflow_type, author)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=str(workflow.pk))
            )
            self.assertEqual(response.status_code, 302)
        login(self)
        for workflow_type in ["activity","course","program"]:
            workflow = make_object(workflow_type, author)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=str(workflow.pk))
            )
            self.assertEqual(response.status_code, 403)
    
       
    def test_workflow_update_view_is_owner(self):
        user = login(self)
        for workflow_type in ["activity","course","program"]:
            workflow = make_object(workflow_type, user)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=str(workflow.pk))
            )
            self.assertEqual(response.status_code, 200) 
    

    def test_program_create_view(self):
        response = self.client.get(reverse("course_flow:program-create"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("course_flow:program-create"))
        self.assertEqual(response.status_code, 200)

    def test_course_create_view(self):
        response = self.client.get(reverse("course_flow:course-create"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("course_flow:course-create"))
        self.assertEqual(response.status_code, 200)

    def test_activity_create_view(self):
        response = self.client.get(reverse("course_flow:activity-create"))
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(reverse("course_flow:activity-create"))
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
        object_id = 1
        idlist = []
        type_list = ["program","strategy","node","activity","strategy","node","course","strategy","node"]
        for object_type in type_list:
            object =  make_object(object_type, author)
            object_id = object.id
            idlist.append(object_id)
            response = self.client.post(
                reverse("course_flow:dialog-form-create"),
                {
                    "object": JSONRenderer()
                    .render(object_to_be)
                    .decode("utf-8"),
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                    "parentID": parent_id,
                },
            )
            self.assertEqual(response.status_code, 401)
            
            serializer_data = serializer_lookups[object_type](object).data
            serializer_data["title"] = "updated test title 1"
            if object_type != "column":
                serializer_data["description"] = "update test description 1"
            response = self.client.post(
                reverse("course_flow:dialog-form-update"),
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
            parent_id = object_id
        for i, object_id in reversed(list(enumerate(idlist))):
            response = self.client.post(
                reverse("course_flow:dialog-form-delete"),
                {
                    "objectID": object_id,
                    "objectType": JSONRenderer()
                    .render(type_list[i])
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 401)
    
    def test_dialog_post_permissions_no_authorship(self):
        author = get_author()
        login(self)
        object_to_be = {
            "title": "test title 1",
            "description": "test description 1",
            "author": None,
            "work_classification": 1,
            "activity_classification": 1,
        }
        parent_id = 1
        object_id = 1
        idlist = []
        type_list = ["program","strategy","node","activity","strategy","node","course","strategy","node"]
        for object_type in type_list:
            object =  make_object(object_type, author)
            object_id = object.id
            idlist.append(object_id)
            response = self.client.post(
                reverse("course_flow:dialog-form-create"),
                {
                    "object": JSONRenderer()
                    .render(object_to_be)
                    .decode("utf-8"),
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                    "parentID": parent_id,
                },
            )
            if object_type == "program" or object_type == "course" or object_type == "activity":
                self.assertEqual(response.status_code, 200)
            else: self.assertEqual(response.status_code, 401)
            
            serializer_data = serializer_lookups[object_type](object).data
            serializer_data["title"] = "updated test title 1"
            if object_type != "column":
                serializer_data["description"] = "update test description 1"
            response = self.client.post(
                reverse("course_flow:dialog-form-update"),
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
            parent_id = object_id
        for i, object_id in reversed(list(enumerate(idlist))):
            response = self.client.post(
                reverse("course_flow:dialog-form-delete"),
                {
                    "objectID": object_id,
                    "objectType": JSONRenderer()
                    .render(type_list[i])
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
        parent_id = 1
        object_id = 1
        idlist = []
        type_list = ["program","strategy","node","activity","strategy","node","course","strategy","node"]
        for object_type in type_list:
            response = self.client.post(
                reverse("course_flow:dialog-form-create"),
                {
                    "object": JSONRenderer()
                    .render(object_to_be)
                    .decode("utf-8"),
                    "objectType": JSONRenderer()
                    .render(object_type)
                    .decode("utf-8"),
                    "parentID": parent_id,
                },
            )
            self.assertEqual(response.status_code, 200)
            object = model_lookups[object_type].objects.all().order_by('-created_on').first()
            object_id = object.id
            idlist.append(object_id)
            self.assertEqual(object.title, object_to_be["title"])
            if object_type != "column":
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
            if object_type != "column":
                serializer_data["description"] = "update test description 1"
            response = self.client.post(
                reverse("course_flow:dialog-form-update"),
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
            if object_type != "column":
                self.assertEqual(
                    serializer_data["description"],
                    serializer_data_refresh["description"],
                )
            parent_id = object_id
        for i, object_id in reversed(list(enumerate(idlist))):
            response = self.client.post(
                reverse("course_flow:dialog-form-delete"),
                {
                    "objectID": object_id,
                    "objectType": JSONRenderer()
                    .render(type_list[i])
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
                reverse("course_flow:update-" + object_type + "-json"),
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
                reverse("course_flow:update-" + object_type + "-json"),
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
                reverse("course_flow:update-" + object_type + "-json"),
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
            reverse("course_flow:add-node"),
            {"strategyPk": strategy.id, "nodePk": node.id},
        )
        self.assertEqual(response.status_code, 302)

    def test_add_node_permissions_no_authorship(self):
        login(self)
        author = get_author()
        strategy = make_object("strategy", author)
        node = make_object("node", author)
        response = self.client.post(
            reverse("course_flow:add-node"),
            {"strategyPk": strategy.id, "nodePk": node.id},
        )
        self.assertEqual(response.status_code, 401)

    def test_add_strategy_permissions_no_login(self):
        author = get_author()
        for object_type in ["activity", "course", "program"]:
            strategy = make_object("strategy", author)
            workflow = make_object(object_type, author)
            response = self.client.post(
                reverse("course_flow:add-strategy"),
                {"workflowPk": workflow.id, "strategyPk": strategy.id},
            )
            self.assertEqual(response.status_code, 401)

    def test_add_strategy_no_authorship(self):
        login(self)
        author = get_author()
        for object_type in ["activity", "course", "program"]:
            strategy = make_object("strategy", author)
            workflow = make_object(object_type, author)
            response = self.client.post(
                reverse("course_flow:add-strategy"),
                {"workflowPk": workflow.id, "strategyPk": strategy.id},
            )
            self.assertEqual(response.status_code, 401)

    def test_add_strategy_column_node(self):
        user = login(self)
        for i, object_type in enumerate(["activity", "course", "program"]):
            workflow = make_object(object_type,user)
            #Check for the default strategy
            self.assertEqual(workflow.strategies.all().count(),1)
            #Check for the default columns
            self.assertEqual(workflow.columns.all().count(),len(Column.default_columns[object_type]))
            #Get the base strategy and the first column
            base_strategy = StrategyWorkflow.objects.get(workflow=workflow,rank=0).strategy
            first_column = ColumnWorkflow.objects.get(workflow=workflow,rank=0).column
            #Add a custom column to the base strategy
            response = self.client.post(
                reverse("course_flow:new-column"),
                {"workflowPk":str(workflow.id),"column_type":i*10}
            )
            self.assertEqual(response.status_code, 200)
            #Add a node to the base strategy
            response = self.client.post(
                reverse("course_flow:new-node"),
                {"strategyPk":str(base_strategy.id),"columnPk":str(first_column.id),"position":0}
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(Node.objects.all().count(), 1)
            first_node = base_strategy.nodes.all().first()
            #Insert a node below the node
            response = self.client.post(
                reverse("course_flow:insert-sibling"),
                {"objectID":str(NodeStrategy.objects.get(node=first_node).id),
                 "objectType": JSONRenderer()
                    .render("nodestrategy")
                    .decode("utf-8"),
                 "parentID":str(base_strategy.id)}
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(Node.objects.all().count(), 2)
            #Insert a strategy below the strategy
            response = self.client.post(
                reverse("course_flow:insert-sibling"),
                {"objectID":StrategyWorkflow.objects.get(strategy=base_strategy).id,
                 "objectType":JSONRenderer()
                    .render("strategyworkflow")
                    .decode("utf-8"),
                 "parentID":workflow.id}
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(Strategy.objects.all().count(), 2)
            
            #Update the titles
            new_values = {
                "title": "test title 1"
            }
            response = self.client.post(
                reverse("course_flow:update-value"),
                {"objectID":base_strategy.id,
                 "objectType":JSONRenderer()
                    .render("strategy")
                    .decode("utf-8"),
                 "data":JSONRenderer()
                    .render(new_values)
                    .decode("utf-8")
                }
            )
            base_strategy = StrategyWorkflow.objects.get(workflow=workflow,rank=0).strategy
            self.assertEqual(response.status_code, 200)
            self.assertEqual(base_strategy.title, "test title 1")
            response = self.client.post(
                reverse("course_flow:update-value"),
                {"objectID":first_node.id,
                 "objectType":JSONRenderer()
                    .render("node")
                    .decode("utf-8"),
                 "data":JSONRenderer()
                    .render(new_values)
                    .decode("utf-8")
                }
            )
            first_node = NodeStrategy.objects.get(strategy=base_strategy,rank=0).node
            self.assertEqual(response.status_code, 200)
            self.assertEqual(first_node.title, "test title 1")
            response = self.client.post(
                reverse("course_flow:update-value"),
                {"objectID":first_column.id,
                 "objectType":JSONRenderer()
                    .render("column")
                    .decode("utf-8"),
                 "data":JSONRenderer()
                    .render(new_values)
                    .decode("utf-8")
                }
            )
            first_column = ColumnWorkflow.objects.get(workflow=workflow,rank=0).column
            self.assertEqual(response.status_code, 200)
            self.assertEqual(first_node.title, "test title 1")
            #Add more nodes to the base strategy
            for column in workflow.columns.all():
                self.client.post(
                    reverse("course_flow:new-node"),
                    {"strategyPk":str(base_strategy.id),"columnPk":str(first_column.id),"position":0}
                )
            second_column = ColumnWorkflow.objects.get(workflow=workflow,rank=1).column
            second_strategy = StrategyWorkflow.objects.get(workflow=workflow,rank=1).strategy
            #reorder the nodes
            #Move rank 1 up a rank, down a rank, and not at all
            for change in [0,1,-1,99,-99]:
                to_move = NodeStrategy.objects.get(strategy=base_strategy,rank=1)
                response = self.client.post(
                    reverse("course_flow:inserted-at"),
                    {"objectID":to_move.id,"newParentID":base_strategy.id,
                     "objectType":JSONRenderer().render("nodestrategy").decode("utf-8"),
                     "parentID":base_strategy.id,"newColumnID":second_column.id,"newPosition":1+change}
                )
                self.assertEqual(response.status_code, 200)
                to_move = NodeStrategy.objects.get(id=to_move.id)
                self.assertEqual(to_move.rank,max(min(1+change,base_strategy.nodes.count()-1),0))
                self.assertEqual(to_move.node.column.id,second_column.id)
                check_order(self,base_strategy.nodestrategy_set)
            #move some nodes into the second week
            for position in [0,1,-1]:
                to_move = NodeStrategy.objects.get(strategy=base_strategy,rank=0)
                response = self.client.post(
                    reverse("course_flow:inserted-at"),
                    {"objectID":to_move.id,"newParentID":second_strategy.id,
                     "objectType":JSONRenderer().render("nodestrategy").decode("utf-8"),
                     "parentID":base_strategy.id,"newColumnID":second_column.id,"newPosition":position}
                )
                self.assertEqual(response.status_code, 200)
                to_move = NodeStrategy.objects.get(id=to_move.id)
                print("new rank:"+str(to_move.rank))
                self.assertEqual(to_move.rank,max(min(position,second_strategy.nodes.count()-1),0))
                self.assertEqual(to_move.node.column.id,second_column.id)
                self.assertEqual(to_move.strategy.id,second_strategy.id)
                check_order(self,base_strategy.nodestrategy_set)
                check_order(self,second_strategy.nodestrategy_set)
            #swap two strategies
            to_move = StrategyWorkflow.objects.get(strategy=base_strategy)
            response = self.client.post(
                reverse("course_flow:inserted-at"),
                {"objectID":to_move.id,"newParentID":workflow.id,
                 "objectType":JSONRenderer().render("strategyworkflow").decode("utf-8"),
                 "parentID":workflow.id,"newColumnID":-1,"newPosition":1}
            )
            self.assertEqual(response.status_code, 200)
            to_move = StrategyWorkflow.objects.get(id=to_move.id)
            self.assertEqual(to_move.rank,1)
            check_order(self,workflow.strategyworkflow_set)
            #swap two columns
            to_move = ColumnWorkflow.objects.get(column=first_column)
            response = self.client.post(
                reverse("course_flow:inserted-at"),
                {"objectID":to_move.id,"newParentID":workflow.id,
                 "objectType":JSONRenderer().render("columnworkflow").decode("utf-8"),
                 "parentID":workflow.id,"newColumnID":-1,"newPosition":1}
            )
            self.assertEqual(response.status_code, 200)
            to_move = ColumnWorkflow.objects.get(id=to_move.id)
            self.assertEqual(to_move.rank,1)
            check_order(self,workflow.columnworkflow_set)
            #test delete
            base_strategy = StrategyWorkflow.objects.get(workflow=workflow,rank=0).strategy
            number_of_nodes = base_strategy.nodes.count()
            node = base_strategy.nodes.all().first()
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {"objectID":node.id,"objectType":JSONRenderer().render("node").decode("utf-8")}
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(base_strategy.nodes.count(),number_of_nodes-1)
            check_order(self,base_strategy.nodestrategy_set)
            number_of_strategies = workflow.strategies.count()
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {"objectID":base_strategy.id,"objectType":JSONRenderer().render("strategy").decode("utf-8")}
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(workflow.strategies.count(),number_of_strategies-1)
            check_order(self,workflow.strategyworkflow_set)
            
            
            Node.objects.all().delete()
            Strategy.objects.all().delete()
            Column.objects.all().delete()
            
           
        
        
    def test_delete_self_no_login_no_authorship(self):
        author = get_author()
        type_list = ["program","course","activity","strategy","node","column"]
        for object_type in type_list:
            object = make_object(object_type, author)
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {"objectID":object.id,"objectType":JSONRenderer().render(object_type).decode("utf-8")}
            )
            self.assertEqual(response.status_code, 401)
        login(self)
        for object_type in type_list:
            object = make_object(object_type, author)
            response = self.client.post(
                reverse("course_flow:delete-self"),
                {"objectID":object.id,"objectType":JSONRenderer().render(object_type).decode("utf-8")}
            )
            self.assertEqual(response.status_code, 401)
            
    def test_update_value_no_login_no_authorship(self):
        author = get_author()
        type_list = ["program","course","activity","strategy","node","column"]
        for object_type in type_list:
            object = make_object(object_type, author)
            response = self.client.post(
                reverse("course_flow:update-value"),
                {"objectID":object.id,
                 "objectType":JSONRenderer().render(object_type).decode("utf-8"),
                 "data":JSONRenderer().render({"title":"test title 1"}).decode("utf-8")
                }
            )
            self.assertEqual(response.status_code, 401)
        login(self)
        for object_type in type_list:
            object = make_object(object_type, author)
            response = self.client.post(
                reverse("course_flow:update-value"),
                {"objectID":object.id,
                 "objectType":JSONRenderer().render(object_type).decode("utf-8"),
                 "data":JSONRenderer().render({"title":"test title 1"}).decode("utf-8")
                }
            )
            self.assertEqual(response.status_code, 401)
        
    def test_reorder_no_login_no_authorship(self):
        author = get_author()
        strategy1 = make_object("strategy",author)
        strategy1.nodes.create(author=author)
        strategy1.nodes.create(author=author,through_defaults={"rank":1})
        column1 = make_object("column",author)
        to_move = NodeStrategy.objects.get(strategy=strategy1,rank=0)
        #Try to move within the same strategy
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {"objectID":to_move.id,"newParentID":strategy1.id,
             "objectType":JSONRenderer().render("nodestrategy").decode("utf-8"),
             "parentID":strategy1.id,"newColumnID":column1.id,"newPosition":1}
        )
        self.assertEqual(response.status_code, 401)
        user=login(self)
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {"objectID":to_move.id,"newParentID":strategy1.id,
             "objectType":JSONRenderer().render("nodestrategy").decode("utf-8"),
             "parentID":strategy1.id,"newColumnID":column1.id,"newPosition":1}
        )
        self.assertEqual(response.status_code, 401)
        #Try to move from their stuff to your own
        strategy2 = make_object("strategy",user)
        strategy2.nodes.create(author=user)
        column2 = make_object("column",user)
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {"objectID":to_move.id,"newParentID":strategy2.id,
             "objectType":JSONRenderer().render("nodestrategy").decode("utf-8"),
             "parentID":strategy1.id,"newColumnID":column2.id,"newPosition":1}
        )
        self.assertEqual(response.status_code, 401)
        #Try to move from your stuff to theirs, in various combinations
        to_move = NodeStrategy.objects.get(strategy=strategy2,rank=0)
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {"objectID":to_move.id,"newParentID":strategy1.id,
             "objectType":JSONRenderer().render("nodestrategy").decode("utf-8"),
             "parentID":strategy1.id,"newColumnID":column2.id,"newPosition":1}
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {"objectID":to_move.id,"newParentID":strategy2.id,
             "objectType":JSONRenderer().render("nodestrategy").decode("utf-8"),
             "parentID":strategy1.id,"newColumnID":column1.id,"newPosition":1}
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:inserted-at"),
            {"objectID":to_move.id,"newParentID":strategy1.id,
             "objectType":JSONRenderer().render("nodestrategy").decode("utf-8"),
             "parentID":strategy1.id,"newColumnID":column1.id,"newPosition":1}
        )
        self.assertEqual(response.status_code, 401)
        
    def test_insert_sibling_no_login_no_authorship(self):
        author = get_author()
        activity1 = make_object("activity",author)
        strategy1 = activity1.strategies.create(author=author)
        node1 = strategy1.nodes.create(author=author)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {"objectID":NodeStrategy.objects.get(node=node1).id,"parentID":strategy1.id,
             "objectType":JSONRenderer().render("nodestrategy").decode("utf-8")}
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {"objectID":StrategyWorkflow.objects.get(strategy=strategy1).id,"parentID":activity1.id,
             "objectType":JSONRenderer().render("strategyworkflow").decode("utf-8")}
        )
        self.assertEqual(response.status_code, 401)
        login(self)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {"objectID":NodeStrategy.objects.get(node=node1).id,"parentID":strategy1.id,
             "objectType":JSONRenderer().render("nodestrategy").decode("utf-8")}
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:insert-sibling"),
            {"objectID":StrategyWorkflow.objects.get(strategy=strategy1).id,"parentID":activity1.id,
             "objectType":JSONRenderer().render("strategyworkflow").decode("utf-8")}
        )
        self.assertEqual(response.status_code, 401)
        
        
        
                             
    def test_add_strategy_add_node(self):
        user = login(self)
        for object_type in ["activity", "course", "program"]:
            workflow = make_object(object_type, user)
            #Check for the default strategy
            self.assertEqual(Strategy.objects.all().count(),1)
            #Check for the default columns
            self.assertEqual(workflow.columns.all().count(),len(Column.default_columns[object_type]))
            strategy = make_object("strategy", user)
            #Create a node outside the workflow
            node = make_object("node", user)
            #Add the node through add-node
            response = self.client.post(
                reverse("course_flow:add-node"),
                {"nodePk": node.id, "strategyPk": strategy.id},
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
            self.assertEqual(created_node.column, node.column)
            #Add the strategy through add-strategy
            response = self.client.post(
                reverse("course_flow:add-strategy"),
                {"workflowPk": workflow.id, "strategyPk": strategy.id},
            )
            self.assertEqual(Strategy.objects.all().count(), 3)
            self.assertEqual(
                StrategyWorkflow.objects.filter(workflow=workflow).count(), 2
            )
            created_strategy = StrategyWorkflow.objects.get(
                workflow=workflow,rank=0
            ).strategy
            self.assertEqual(
                StrategyWorkflow.objects.get(workflow=workflow,strategy=created_strategy).rank, 0
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
            self.assertEqual(new_created_node.column, node.column)
            Strategy.objects.all().delete()
            Node.objects.all().delete()
