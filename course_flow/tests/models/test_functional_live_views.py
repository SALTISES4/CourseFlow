import asyncio
import json
import time

from channels.routing import URLRouter
from channels.testing import (
    ChannelsLiveServerTestCase,
    HttpCommunicator,
    WebsocketCommunicator,
)
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.test import tag
from django.urls import reverse
from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.ui import WebDriverWait

from course_flow.consumers import WorkflowUpdateConsumer
from course_flow.models import (
    Activity,
    Course,
    Discipline,
    Favourite,
    LiveProject,
    LiveProjectUser,
    ObjectPermission,
    Outcome,
    OutcomeHorizontalLink,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    Program,
    Project,
    Week,
    Workflow,
    WorkflowProject,
)
from course_flow.routing import websocket_urlpatterns
from course_flow.utils import get_model_from_str

from .utils import get_author, login

timeout = 10


class ChannelsStaticLiveServerTestCase(ChannelsLiveServerTestCase):
    serve_static = True


def action_hover_click(selenium, hover_item, click_item):
    hover = (
        ActionChains(selenium).move_to_element(hover_item).click(click_item)
    )
    return hover

class SeleniumLiveProjectTestCase(ChannelsStaticLiveServerTestCase):
    def setUp(self):
        chrome_options = webdriver.chrome.options.Options()
        if settings.CHROMEDRIVER_PATH is not None:
            self.selenium = webdriver.Chrome(settings.CHROMEDRIVER_PATH)
        else:
            self.selenium = webdriver.Chrome()

        super(SeleniumLiveProjectTestCase, self).setUp()
        selenium = self.selenium
        selenium.maximize_window()

        self.user = login(self)
        selenium.get(self.live_server_url + "/home/")
        username = selenium.find_element_by_id("id_username")
        password = selenium.find_element_by_id("id_password")
        username.send_keys("testuser1")
        password.send_keys("testpass1")
        selenium.find_element_by_css_selector("button[type=Submit]").click()

    def tearDown(self):
        self.selenium.quit()
        super(SeleniumLiveProjectTestCase, self).tearDown()

    def test_create_liveproject(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user, title="new title")
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )
        selenium.find_element_by_id("live-project").click()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        assert (
            "new title"
            in selenium.find_element_by_css_selector("#workflowtitle div").text
        )


    def test_my_classrooms_teacher(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user, title="new title")
        LiveProject.objects.create(project=project)
        selenium.get(self.live_server_url + "/home/")
        selenium.find_element_by_css_selector("#panel-my-live-projects").click()
        selenium.find_element_by_css_selector(".workflow-top-row a").click()
        windows = selenium.window_handles
        selenium.switch_to_window(windows[0])
        selenium.close()
        selenium.switch_to_window(windows[1])        
        assert (
            "new title"
            in selenium.find_element_by_css_selector("#workflowtitle div").text
        )
        selenium.get(self.live_server_url + "/home/")
        selenium.find_element_by_css_selector("#home-liveprojects a:first-child").click()
        selenium.find_element_by_css_selector(".workflow-top-row a").click()
        windows = selenium.window_handles
        selenium.switch_to_window(windows[0])
        selenium.close()
        selenium.switch_to_window(windows[1])        
        assert (
            "new title"
            in selenium.find_element_by_css_selector("#workflowtitle div").text
        )
        selenium.get(self.live_server_url + "/home/")
        selenium.find_element_by_css_selector("#home-liveprojects a+a").click()
        assert (
            "new title"
            in selenium.find_element_by_css_selector("#workflowtitle div").text
        )

    def test_my_classrooms_student(self):
        self.user.groups.remove(self.user.groups.first())
        author = get_author()
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=author, title="new title")
        liveproject=LiveProject.objects.create(project=project)
        LiveProjectUser.objects.create(liveproject=liveproject,user=self.user,role_type=LiveProjectUser.ROLE_STUDENT)
        selenium.get(self.live_server_url + "/home/")
        #make sure only correct items are visible
        assert(
            len(selenium.find_elements_by_css_selector("#panel-my-projects"))==0
        )
        selenium.find_element_by_css_selector("#panel-my-live-projects").click()
        selenium.find_element_by_css_selector(".workflow-top-row a").click()
        windows = selenium.window_handles
        selenium.switch_to_window(windows[0])
        selenium.close()
        selenium.switch_to_window(windows[1])        
        assert (
            "new title"
            in selenium.find_element_by_css_selector("#workflowtitle div").text
        )
        selenium.get(self.live_server_url + "/home/")
        selenium.find_element_by_css_selector("#home-liveprojects a:first-child").click()
        selenium.find_element_by_css_selector(".workflow-top-row a").click()
        windows = selenium.window_handles
        selenium.switch_to_window(windows[0])
        selenium.close()
        selenium.switch_to_window(windows[1])        
        assert (
            "new title"
            in selenium.find_element_by_css_selector("#workflowtitle div").text
        )
        selenium.get(self.live_server_url + "/home/")
        selenium.find_element_by_css_selector("#home-liveprojects a+a").click()
        assert (
            "new title"
            in selenium.find_element_by_css_selector("#workflowtitle div").text
        )

    def test_add_roles(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user, title="new title")
        user2 = get_author()
        print(user2.username)
        liveproject=LiveProject.objects.create(project=project)
        selenium.get(self.live_server_url 
            + reverse("course_flow:live-project-update", args=[project.id])
        )
        selenium.find_element_by_css_selector("#button_students").click()
        time.sleep(1)
        inputs = selenium.find_elements_by_css_selector(".user-add input")
        inputs[0].send_keys("testuser2")
        time.sleep(2)
        selenium.find_elements_by_css_selector(".ui-autocomplete li")[
            0
        ].click()
        time.sleep(0.5)
        selenium.find_elements_by_css_selector(".user-add button")[0].click()
        time.sleep(2)
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=user2,
                role_type=LiveProjectUser.ROLE_STUDENT,
                liveproject=liveproject,
            ).count(),
            1,
        )

        selenium.find_elements_by_css_selector(".user-label select")[1].click()
        selenium.find_elements_by_css_selector(".user-label select option")[
            4
        ].click()
        time.sleep(2)
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=user2,
                role_type=LiveProjectUser.ROLE_STUDENT,
                liveproject=liveproject,
            ).count(),
            0,
        )
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=user2,
                role_type=LiveProjectUser.ROLE_TEACHER,
                liveproject=liveproject,
            ).count(),
            1,
        )
        selenium.find_elements_by_css_selector(".user-label select")[1].click()
        selenium.find_elements_by_css_selector(".user-label select option")[
            5
        ].click()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(2)
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=user2,
                liveproject=liveproject,
            ).count(),
            0,
        )


    def test_enroll_from_link(self):
        self.user.groups.remove(self.user.groups.first())
        author = get_author()
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=author, title="new title")
        liveproject=LiveProject.objects.create(project=project)
        selenium.get(self.live_server_url
            + reverse("course_flow:register-as-student", args=[project.registration_hash()])
        )   
        assert (
            "new title"
            in selenium.find_element_by_css_selector("#workflowtitle div").text
        )





