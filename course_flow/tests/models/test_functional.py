import asyncio
import json
import time

from channels.routing import URLRouter
from channels.testing import ChannelsLiveServerTestCase, WebsocketCommunicator
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.test import tag
from django.urls import reverse
from selenium import webdriver
from selenium.webdriver import Chrome, ChromeOptions, Firefox, FirefoxOptions
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from course_flow.models import (
    Activity,
    Course,
    CourseFlowUser,
    Discipline,
    Favourite,
    LiveAssignment,
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
    UserAssignment,
    Workflow,
    WorkflowProject,
)
from course_flow.routing import websocket_urlpatterns
from course_flow.utils import get_model_from_str

from .utils import get_author, login

timeout = 10


class ChannelsStaticLiveServerTestCase(ChannelsLiveServerTestCase):
    serve_static = True


class SeleniumBase:
    def __init__(self):
        self.selenium = None
        self.executable_path: str = "nopath"

    def create_ff_browser(self):
        options = FirefoxOptions()
        options.add_argument("--headless")
        options.add_argument("--disable-extensions")
        options.add_argument("--no-sandbox")
        options.add_argument("--ignore-certificate-errors")
        options.add_argument("--allow-running-insecure-content")
        options.add_argument("window-size=1920x1480")
        options.set_capability("acceptInsecureCerts", True)
        browser = Firefox(options=options)
        browser.implicitly_wait(10)
        return browser

    def create_chrome_browser(self, options):
        if options is None:
            options = webdriver.chrome.options.Options()

        if self.test_headless:
            options.add_argument("--headless")
        options.add_argument("--disable-extensions")
        options.add_argument("--no-sandbox")
        options.add_argument("--ignore-certificate-errors")
        options.add_argument("--disable-gpu")
        options.add_argument("--allow-running-insecure-content")
        options.set_capability("acceptInsecureCerts", True)
        if self.executable_path == "nopath":
            browser = Chrome(options=options)
        else:
            browser = Chrome(self.executable_path, options=options)
        return browser

    def init_selenium(self, options: dict = None):
        if settings.CHROMEDRIVER_PATH is not None:
            self.executable_path = settings.CHROMEDRIVER_PATH

        try:
            self.test_headless = settings.COURSEFLOW_TEST_HEADLESS
        except AttributeError:
            self.test_headless = False
        try:
            if settings.COURSEFLOW_TEST_BROWSER == "ff":
                return self.create_ff_browser()
        except AttributeError:
            pass
        return self.create_chrome_browser(options)


@tag("selenium")
class SeleniumRegistrationTestCase(StaticLiveServerTestCase):
    def setUp(self):
        selbase = SeleniumBase()
        self.selenium = selbase.init_selenium()

        super().setUp()

    def tearDown(self):
        self.selenium.quit()
        super().tearDown()

    def test_register_user(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium

        selenium.get(self.live_server_url + "/register/")

        first_name = selenium.find_element(By.ID, "id_first_name")
        last_name = selenium.find_element(By.ID, "id_last_name")
        username = selenium.find_element(By.ID, "id_username")
        email = selenium.find_element(By.ID, "id_email")
        password1 = selenium.find_element(By.ID, "id_password1")
        password2 = selenium.find_element(By.ID, "id_password2")

        username_text = "test_user1"
        password_text = "testpass123"

        first_name.send_keys("test")
        last_name.send_keys("user")
        username.send_keys(username_text)
        email.send_keys("testuser@test.com")
        password1.send_keys(password_text)
        password2.send_keys(password_text)

        selenium.find_element(By.ID, "register-button").click()
        time.sleep(100)
        self.assertEqual(
            self.live_server_url + "/course-flow/home/", selenium.current_url
        )


class SeleniumUserTestCase(ChannelsStaticLiveServerTestCase):
    def setUp(self):
        selbase = SeleniumBase()
        self.selenium = selbase.init_selenium()

        super().setUp()
        selenium = self.selenium
        selenium.maximize_window()

        self.user = login(self)
        self.user.first_name = "old first"
        self.user.last_name = "old last"
        self.user.save()
        selenium.get(self.live_server_url + reverse("course_flow:home"))
        username = selenium.find_element(By.ID, "id_username")
        password = selenium.find_element(By.ID, "id_password")
        username.send_keys("testuser1")
        password.send_keys("testpass1")
        selenium.find_element(By.CSS_SELECTOR, "button[type=Submit]").click()

    def tearDown(self):
        self.selenium.quit()
        super().tearDown()

    def test_edit_user(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        selenium.get(self.live_server_url + reverse("course_flow:user-update"))

        courseflow_user = CourseFlowUser.objects.get(pk=self.user.pk)
        assert courseflow_user.first_name == "old first"
        assert courseflow_user.last_name == "old last"
        first_name = selenium.find_element(By.ID, "id_first_name")
        last_name = selenium.find_element(By.ID, "id_last_name")
        first_name.clear()
        last_name.clear()

        new_first = "new first"
        new_last = "new last"

        first_name.send_keys(new_first)
        last_name.send_keys(new_last)
        selenium.find_element(By.ID, "save-button").click()

        time.sleep(1)

        courseflow_user = CourseFlowUser.objects.get(pk=self.user.pk)

        assert courseflow_user.first_name == "new first"
        assert courseflow_user.last_name == "new last"


class SeleniumLiveProjectTestCase(ChannelsStaticLiveServerTestCase):
    def setUp(self):
        selbase = SeleniumBase()
        self.selenium = selbase.init_selenium()

        super().setUp()
        selenium = self.selenium
        selenium.maximize_window()

        self.user = login(self)
        selenium.get(self.live_server_url + reverse("course_flow:home"))
        username = selenium.find_element(By.ID, "id_username")
        password = selenium.find_element(By.ID, "id_password")
        username.send_keys("testuser1")
        password.send_keys("testpass1")
        selenium.find_element(By.CSS_SELECTOR, "button[type=Submit]").click()

    def tearDown(self):
        self.selenium.quit()
        super().tearDown()

    def test_create_liveproject(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user, title="new title")
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )
        time.sleep(1)
        selenium.find_element(By.ID, "overflow-options").click()
        selenium.find_element(By.ID, "live-project").click()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(1)
        assert (
            "new title"
            in selenium.find_element(By.CSS_SELECTOR, ".project-title").text
        )
        assert LiveProject.objects.filter(project=project).count() == 1

    def test_my_classrooms_teacher(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user, title="new title")
        LiveProject.objects.create(project=project)
        selenium.get(self.live_server_url + "/course-flow/home/")
        button_workflows = wait.until(
            EC.element_to_be_clickable((By.ID, "panel-my-live-projects"))
        )
        selenium.find_element_by_css_selector(
            "#panel-my-live-projects"
        ).click()
        selenium.find_element(By.CSS_SELECTOR, ".workflow-top-row a").click()
        # windows = selenium.window_handles
        # selenium.switch_to_window(windows[0])
        # selenium.close()
        # selenium.switch_to_window(windows[1])
        assert (
            "new title"
            in selenium.find_element(By.CSS_SELECTOR, ".project-title").text
        )
        selenium.get(self.live_server_url + "/course-flow/mylibrary/")
        time.sleep(0.5)
        selenium.find_element(
            By.CSS_SELECTOR, ".workflow-for-menu .workflow-live-classroom"
        ).click()
        time.sleep(0.5)
        # windows = selenium.window_handles
        # selenium.switch_to_window(windows[0])
        # selenium.close()
        # selenium.switch_to_window(windows[1])
        assert (
            "new title"
            in selenium.find_element(By.CSS_SELECTOR, ".project-title").text
        )

    def test_my_classrooms_student(self):
        print("\nIn method", self._testMethodName, ": ")
        self.user.groups.remove(self.user.groups.first())
        author = get_author()
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=author, title="new title")
        liveproject = LiveProject.objects.create(project=project)
        LiveProjectUser.objects.create(
            liveproject=liveproject,
            user=self.user,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        selenium.get(self.live_server_url + "/course-flow/home/")
        # make sure only correct items are visible
        button_workflows = wait.until(
            EC.element_to_be_clickable((By.ID, "panel-my-live-projects"))
        )
        assert (
            len(selenium.find_elements(By.CSS_SELECTOR, "#panel-my-projects"))
            == 0
        )
        time.sleep(0.5)
        selenium.find_element(
            By.CSS_SELECTOR, "#panel-my-live-projects"
        ).click()
        selenium.find_element(By.CSS_SELECTOR, ".workflow-top-row a").click()
        # windows = selenium.window_handles
        # selenium.switch_to_window(windows[0])
        # selenium.close()
        # selenium.switch_to_window(windows[1])
        assert (
            "new title"
            in selenium.find_element(By.CSS_SELECTOR, ".workflow-title").text
        )
        selenium.get(self.live_server_url + "/course-flow/home/")
        selenium.find_element(
            By.CSS_SELECTOR, ".home-item .home-title-row a"
        ).click()
        selenium.find_element(By.CSS_SELECTOR, ".workflow-top-row a").click()
        # windows = selenium.window_handles
        # selenium.switch_to_window(windows[0])
        # selenium.close()
        # selenium.switch_to_window(windows[1])
        assert (
            "new title"
            in selenium.find_element(By.CSS_SELECTOR, ".workflow-title").text
        )
        selenium.get(self.live_server_url + "/course-flow/home/")
        time.sleep(0.5)
        selenium.find_element(By.CSS_SELECTOR, ".workflow-top-row a").click()
        assert (
            "new title"
            in selenium.find_element(By.CSS_SELECTOR, ".workflow-title").text
        )

    def test_settings(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user, title="new title")
        liveproject = LiveProject.objects.create(project=project)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.id])
        )
        selenium.find_element(By.CSS_SELECTOR, "#edit-project-button").click()
        time.sleep(1)
        selenium.find_element(By.ID, "default-assign-to-all").click()
        selenium.find_element(By.ID, "default-self-reporting").click()
        selenium.find_element(By.ID, "default-single-completion").click()
        selenium.find_element(By.ID, "default-all-workflows-visible").click()

        selenium.find_element(
            By.CSS_SELECTOR, ".workflow-details button"
        ).click()

        time.sleep(1)
        liveproject = LiveProject.objects.first()
        self.assertEqual(liveproject.default_self_reporting, False)
        self.assertEqual(liveproject.default_assign_to_all, False)
        self.assertEqual(liveproject.default_single_completion, True)
        self.assertEqual(liveproject.default_all_workflows_visible, True)

    def test_add_roles(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user, title="new title")

        user2 = get_author()
        liveproject = LiveProject.objects.create(project=project)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.id])
        )
        selenium.find_element(By.CSS_SELECTOR, "#button_students").click()
        time.sleep(1)
        inputs = selenium.find_elements(By.CSS_SELECTOR, ".user-add input")
        inputs[0].send_keys("testuser2")
        time.sleep(2)
        selenium.find_elements(By.CSS_SELECTOR, ".ui-autocomplete li")[
            0
        ].click()
        time.sleep(0.5)
        selenium.find_elements(By.CSS_SELECTOR, ".user-add button")[0].click()
        time.sleep(2)
        self.assertEqual(
            LiveProjectUser.objects.filter(
                user=user2,
                role_type=LiveProjectUser.ROLE_STUDENT,
                liveproject=liveproject,
            ).count(),
            1,
        )

        selenium.find_elements(By.CSS_SELECTOR, ".user-label select")[
            1
        ].click()
        selenium.find_elements(By.CSS_SELECTOR, ".user-label select option")[
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
        selenium.find_elements(By.CSS_SELECTOR, ".user-label select")[
            1
        ].click()
        selenium.find_elements(By.CSS_SELECTOR, ".user-label select option")[
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
        liveproject = LiveProject.objects.create(project=project)
        selenium.get(
            self.live_server_url
            + reverse(
                "course_flow:register-as-student",
                args=[project.registration_hash()],
            )
        )
        assert (
            "new title"
            in selenium.find_element(By.CSS_SELECTOR, ".workflow-title").text
        )

    def test_add_workflows(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)

        # create test data, project + activity
        project = Project.objects.create(author=self.user, title="new title")
        workflow = Activity.objects.create(
            author=self.user, title="new workflow"
        )
        WorkflowProject.objects.create(project=project, workflow=workflow)
        liveproject = LiveProject.objects.create(project=project)

        # navigate to just created project single page
        print(reverse("course_flow:project-update", args=[project.id]))
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.id])
        )
        # todo where is this from?
        print(selenium.current_url)
        button_workflows = wait.until(
            EC.element_to_be_clickable((By.ID, "button_workflows"))
        )
        button_workflows.click()

        wait.until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, ".permission-select select ")
            )
        )
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".permission-select select option:checked[value='true']",
                )
            ),
            0,
        )
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".permission-select select option:checked[value='false']",
                )
            ),
            1,
        )

        selenium.find_element(
            By.CSS_SELECTOR, ".permission-select select"
        ).click()
        selenium.find_elements(
            By.CSS_SELECTOR, ".permission-select select option"
        )[1].click()
        time.sleep(2)
        self.assertEqual(liveproject.visible_workflows.count(), 1)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".permission-select select option:checked[value='true']",
                )
            ),
            1,
        )
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".permission-select select option:checked[value='false']",
                )
            ),
            0,
        )

        selenium.find_element(
            By.CSS_SELECTOR, ".permission-select select"
        ).click()
        selenium.find_elements(
            By.CSS_SELECTOR, ".permission-select select option"
        )[0].click()
        time.sleep(2)
        self.assertEqual(liveproject.visible_workflows.count(), 0)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".permission-select select option:checked[value='true']",
                )
            ),
            0,
        )
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".permission-select select option:checked[value='false']",
                )
            ),
            1,
        )

    def test_student_workflows(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        user2 = get_author()
        project = Project.objects.create(author=user2, title="new title")
        workflow = Activity.objects.create(author=user2, title="new workflow")
        WorkflowProject.objects.create(project=project, workflow=workflow)
        liveproject = LiveProject.objects.create(project=project)
        LiveProjectUser.objects.create(
            liveproject=liveproject,
            user=self.user,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        liveproject.visible_workflows.add(workflow)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:live-project-update", args=[project.id])
        )
        selenium.find_element(By.CSS_SELECTOR, "#button_workflows").click()
        time.sleep(1)

        self.assertEqual(
            len(
                selenium.find_elements(By.CSS_SELECTOR, ".menu-grid")[
                    0
                ].find_elements(By.CSS_SELECTOR, ".workflow-for-menu")
            ),
            1,
        )

        selenium.find_element(
            By.CSS_SELECTOR, ".menu-grid .workflow-for-menu .workflow-title"
        ).click()

        # windows = selenium.window_handles
        # selenium.switch_to_window(windows[0])
        # selenium.close()
        # selenium.switch_to_window(windows[1])

        time.sleep(1)
        assert (
            "new workflow"
            in selenium.find_element(By.CSS_SELECTOR, ".project-title").text
        )

    def test_create_assignment(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user, title="new title")
        workflow = Course.objects.create(
            author=self.user, title="new workflow"
        )
        node = workflow.weeks.first().nodes.create(
            author=self.user, column=workflow.columns.first()
        )
        WorkflowProject.objects.create(project=project, workflow=workflow)
        liveproject = LiveProject.objects.create(project=project)
        liveproject.visible_workflows.add(workflow)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.id])
        )
        time.sleep(1)
        selenium.find_element(By.CSS_SELECTOR, "#button_assignments").click()
        time.sleep(3)

        selenium.find_element(
            By.CSS_SELECTOR, "#select-workflow > div"
        ).click()

        time.sleep(3)

        hover_item = selenium.find_element(By.CSS_SELECTOR, ".node")
        click_item = selenium.find_element(
            By.CSS_SELECTOR, ".node .mouseover-actions img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()

        time.sleep(3)

        selenium.find_elements(By.CSS_SELECTOR, "#users_all option")[0].click()
        selenium.find_element(By.ID, "add-user").click()

        time.sleep(2)

        self.assertEqual(
            len(
                selenium.find_elements(By.CSS_SELECTOR, "#users_chosen option")
            ),
            1,
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, "#users_all option")),
            0,
        )
        self.assertEqual(
            UserAssignment.objects.filter(
                user=self.user,
                assignment=liveproject.liveassignment_set.all().first(),
            ).count(),
            1,
        )

        selenium.find_element(By.ID, "button_report").click()
        time.sleep(2)
        selenium.find_element(By.CSS_SELECTOR, "td > input").click()
        time.sleep(1)
        self.assertEqual(UserAssignment.objects.first().completed, True)

    def test_student_assignment(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        user2 = get_author()
        project = Project.objects.create(author=user2, title="new title")
        workflow = Course.objects.create(author=user2, title="new workflow")
        workflow2 = Activity.objects.create(
            author=user2, title="linked workflow"
        )
        WorkflowProject.objects.create(project=project, workflow=workflow)
        WorkflowProject.objects.create(project=project, workflow=workflow2)
        node = workflow.weeks.first().nodes.create(
            author=self.user, column=workflow.columns.first()
        )
        node.linked_workflow = workflow2
        node.save()
        liveproject = LiveProject.objects.create(
            project=project, default_assign_to_all=False
        )
        LiveProjectUser.objects.create(
            liveproject=liveproject,
            user=self.user,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        assignment = LiveAssignment.objects.create(
            author=user2, task=node, liveproject=liveproject
        )

        selenium.get(
            self.live_server_url
            + reverse("course_flow:live-project-update", args=[project.id])
        )
        selenium.find_element(By.CSS_SELECTOR, "#button_assignments").click()
        time.sleep(2)

        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".workflow-details .node"
                )
            ),
            0,
        )

        UserAssignment.objects.create(user=self.user, assignment=assignment)

        selenium.get(
            self.live_server_url
            + reverse("course_flow:live-project-update", args=[project.id])
        )
        selenium.find_element(By.CSS_SELECTOR, "#button_assignments").click()
        time.sleep(1)

        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".workflow-details .node"
                )
            ),
            1,
        )

        selenium.find_element(
            By.CSS_SELECTOR, ".node input[type='checkbox']"
        ).click()

        time.sleep(1)

        self.assertEqual(
            UserAssignment.objects.get(user=self.user).completed, True
        )

        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".node .linked-workflow"
                )
            ),
            0,
        )

        liveproject.visible_workflows.add(workflow)
        liveproject.visible_workflows.add(workflow2)

        selenium.get(
            self.live_server_url
            + reverse("course_flow:live-project-update", args=[project.id])
        )
        selenium.find_element(By.CSS_SELECTOR, "#button_assignments").click()
        time.sleep(2)

        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".node .linked-workflow"
                )
            ),
            2,
        )
        selenium.find_element(
            By.CSS_SELECTOR, ".node .containing-workflow"
        ).click()
        time.sleep(2)

        windows = selenium.window_handles
        selenium.switch_to.window(windows[1])

        self.assertEqual(
            "new workflow",
            selenium.find_element(By.CSS_SELECTOR, ".project-title").text,
        )

        selenium.close()
        selenium.switch_to.window(windows[0])

        selenium.get(
            self.live_server_url
            + reverse("course_flow:live-project-update", args=[project.id])
        )
        selenium.find_element(By.CSS_SELECTOR, "#button_assignments").click()
        time.sleep(2)

        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".node .linked-workflow"
                )
            ),
            2,
        )
        selenium.find_element(
            By.CSS_SELECTOR, ".node .linked-workflow:not(.containing-workflow)"
        ).click()
        time.sleep(2)
        windows = selenium.window_handles
        selenium.switch_to.window(windows[1])
        self.assertEqual(
            "linked workflow",
            selenium.find_element(By.CSS_SELECTOR, ".project-title").text,
        )

    def test_create_assignment_from_workflow(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user, title="new title")
        workflow = Activity.objects.create(
            author=self.user, title="new workflow"
        )
        node = workflow.weeks.first().nodes.create(
            author=self.user, column=workflow.columns.first()
        )
        WorkflowProject.objects.create(project=project, workflow=workflow)
        liveproject = LiveProject.objects.create(project=project)
        liveproject.visible_workflows.add(workflow)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[workflow.id])
        )
        time.sleep(2)

        hover_item = selenium.find_element(
            By.CSS_SELECTOR, ".workflow-details .node"
        )
        click_item = selenium.find_element(
            By.CSS_SELECTOR, ".node .assignment-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()

        selenium.find_element(
            By.CSS_SELECTOR, ".node .create-assignment img"
        ).click()
        time.sleep(1)

        self.assertEqual(LiveAssignment.objects.filter(task=node).count(), 1)
        self.assertEqual(
            len(
                selenium.find_elements(By.CSS_SELECTOR, ".assignment-in-node")
            ),
            1,
        )

    def test_student_complete_assignment_from_workflow(self):
        print("\nIn method", self._testMethodName, ": ")
        user2 = get_author()
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=user2, title="new title")
        workflow = Activity.objects.create(author=user2, title="new workflow")
        node = workflow.weeks.first().nodes.create(
            author=user2, column=workflow.columns.first()
        )
        WorkflowProject.objects.create(project=project, workflow=workflow)
        liveproject = LiveProject.objects.create(
            project=project, default_assign_to_all=False
        )
        liveproject.visible_workflows.add(workflow)
        LiveProjectUser.objects.create(
            user=self.user,
            liveproject=liveproject,
            role_type=LiveProjectUser.ROLE_STUDENT,
        )
        assignment = LiveAssignment.objects.create(
            liveproject=liveproject, task=node
        )
        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[workflow.id])
        )
        time.sleep(2)

        hover_item = selenium.find_element(
            By.CSS_SELECTOR, ".workflow-details .node"
        )
        click_item = selenium.find_element(
            By.CSS_SELECTOR, ".node .assignment-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()

        time.sleep(1)
        self.assertEqual(
            len(
                selenium.find_elements(By.CSS_SELECTOR, ".assignment-in-node")
            ),
            0,
        )
        UserAssignment.objects.create(user=self.user, assignment=assignment)

        selenium.find_element(
            By.CSS_SELECTOR, ".node .close-button img"
        ).click()
        time.sleep(0.5)

        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)
        self.assertEqual(
            len(
                selenium.find_elements(By.CSS_SELECTOR, ".assignment-in-node")
            ),
            1,
        )
        selenium.find_element(
            By.CSS_SELECTOR, ".assignment-timing input[type='checkbox']"
        ).click()
        time.sleep(1)
        self.assertEqual(
            UserAssignment.objects.filter(user=self.user).first().completed,
            True,
        )
        selenium.find_element(
            By.CSS_SELECTOR, ".assignment-timing input[type='checkbox']"
        ).click()
        time.sleep(1)
        self.assertEqual(
            UserAssignment.objects.filter(user=self.user).first().completed,
            False,
        )


class SeleniumFrenchTestCase(ChannelsStaticLiveServerTestCase):
    def setUp(self):
        chrome_options = webdriver.chrome.options.Options()
        chrome_options.add_experimental_option(
            "prefs", {"intl.accept_languages": "fr"}
        )
        chrome_options.add_argument("--lang=fr")
        selbase = SeleniumBase()
        self.selenium = selbase.init_selenium(chrome_options)

        super().setUp()
        selenium = self.selenium
        selenium.maximize_window()

        self.user = login(self)
        selenium.get(self.live_server_url + "/course-flow/home/")
        username = selenium.find_element(By.ID, "id_username")
        password = selenium.find_element(By.ID, "id_password")
        username.send_keys("testuser1")
        password.send_keys("testpass1")
        selenium.find_element(By.CSS_SELECTOR, "button[type=Submit]").click()

    def tearDown(self):
        self.selenium.quit()
        super().tearDown()

    def test_home(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        selenium.get(self.live_server_url + "/course-flow/home/")
        assert (
            "Projets récents"
            in selenium.find_elements(By.CSS_SELECTOR, ".home-item-title")[
                0
            ].text
        )


class SeleniumWorkflowsTestCase(ChannelsStaticLiveServerTestCase):
    def setUp(self):
        selbase = SeleniumBase()
        self.selenium = selbase.init_selenium()

        super().setUp()
        selenium = self.selenium
        selenium.maximize_window()

        self.user = login(self)
        selenium.get(self.live_server_url + "/course-flow/home/")
        username = selenium.find_element(By.ID, "id_username")
        password = selenium.find_element(By.ID, "id_password")
        username.send_keys("testuser1")
        password.send_keys("testpass1")
        selenium.find_element(By.CSS_SELECTOR, "button[type=Submit]").click()

    def tearDown(self):
        self.selenium.quit()
        super().tearDown()

    def test_create_project_and_workflows(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)

        # why were we going home first?
        # selenium.get(self.live_server_url + "/course-flow/home/")

        # Navigate to My Library
        selenium.get(self.live_server_url + "/course-flow/mylibrary/")

        create_project_button = wait.until(
            EC.element_to_be_clickable((By.ID, "create-project-button"))
        )
        create_project_button.click()

        # click new project button
        selenium.find_element(
            By.CSS_SELECTOR, "#project-create-library"
        ).click()

        title = selenium.find_element(By.ID, "id_title")
        description = selenium.find_element(By.ID, "id_description")
        project_title = "test project title"
        project_description = "test project description"
        title.send_keys(project_title)
        description.send_keys(project_description)
        selenium.find_element(By.ID, "save-button").click()

        # this sleep is a hack because jquery is giving back interrmittent errors on save and we can't figure out why yet
        time.sleep(1)
        # wait for evidence that the save is finished
        wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".project-menu"))
        )
        project_url = selenium.current_url

        assert (
            project_title
            in selenium.find_element(By.CSS_SELECTOR, ".project-title").text
        )

        assert (
            project_description
            in selenium.find_element(
                By.CSS_SELECTOR, ".project-description"
            ).text
        )

        # input('wait')
        # Create templates
        selenium.get(self.live_server_url + "/course-flow/mylibrary/")
        wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".project-menu"))
        )
        mylibrary = selenium.current_url

        for template_type in ["activity", "course"]:
            print("in: " + template_type)

            create_project_button = wait.until(
                EC.element_to_be_clickable((By.ID, "create-project-button"))
            )
            create_project_button.click()

            # click activity-strategy-create
            # click course-strategy-create
            selenium.find_element(
                By.CSS_SELECTOR, "#" + template_type + "-strategy-create"
            ).click()

            title = wait.until(
                EC.presence_of_element_located((By.ID, "id_title"))
            )

            description = selenium.find_element(By.ID, "id_description")
            project_title = "test project title"
            project_description = "test project description"
            title.send_keys(project_title)
            description.send_keys(project_description)

            selenium.find_element(By.ID, "save-button").click()
            # this sleep is a hack because jquery is giving back intermittent errors on save and we can't figure out why yet
            time.sleep(1)
            assert (
                project_title
                in selenium.find_element(
                    By.CSS_SELECTOR, ".project-title"
                ).text
            )
            assert (
                project_description
                in selenium.find_element(
                    By.CSS_SELECTOR, ".project-description"
                ).text
            )

            selenium.get(mylibrary)

        for i, workflow_type in enumerate(["activity", "course", "program"]):
            selenium.get(project_url)
            time.sleep(1)
            # Create the workflow
            create_project_button = wait.until(
                EC.element_to_be_clickable((By.ID, "create-project-button"))
            )
            create_project_button.click()

            create_workflow_button = wait.until(
                EC.element_to_be_clickable(
                    (By.ID, workflow_type + "-create-project")
                )
            )
            create_workflow_button.click()

            title = selenium.find_element(By.ID, "id_title")
            description = selenium.find_element(By.ID, "id_description")
            project_title = "test " + workflow_type + " title"
            project_description = "test " + workflow_type + " description"
            title.send_keys(project_title)
            description.send_keys(project_description)
            selenium.find_element(By.ID, "save-button").click()
            # hack, jquery gives error otherwise
            time.sleep(2)

            assert (
                project_title
                in selenium.find_element(
                    By.CSS_SELECTOR, ".project-title"
                ).text
            )
            assert (
                project_description
                in selenium.find_element(
                    By.CSS_SELECTOR, ".project-description"
                ).text
            )
            selenium.get(project_url)

            # edit link
            time.sleep(1)
            selenium.find_element(
                By.CSS_SELECTOR,
                ".workflow-for-menu." + workflow_type + " .workflow-title",
            ).click()

            time.sleep(5)

            assert (
                project_title
                in selenium.find_element(
                    By.CSS_SELECTOR, ".project-title"
                ).text
            )

            selenium.find_element(By.CSS_SELECTOR, "#overflow-options").click()
            selenium.find_element(
                By.CSS_SELECTOR, "#copy-to-project-button"
            ).click()
            time.sleep(5)
            assert (
                project_title
                in selenium.find_element(
                    By.CSS_SELECTOR, ".project-title"
                ).text
            )
            self.assertEqual(
                get_model_from_str(workflow_type)
                .objects.exclude(parent_workflow=None)
                .count(),
                1,
            )
            selenium.find_element(By.CSS_SELECTOR, "#overflow-options").click()
            selenium.find_element(By.CSS_SELECTOR, "#delete-workflow").click()
            wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(2)
            self.assertEqual(
                get_model_from_str(workflow_type)
                .objects.filter(is_strategy=False, deleted=False)
                .count(),
                1,
            )
            self.assertEqual(
                get_model_from_str(workflow_type)
                .objects.filter(is_strategy=False, deleted=True)
                .count(),
                1,
            )

    def test_edit_project_details(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        discipline = Discipline.objects.create(title="discipline")
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )
        time.sleep(1)
        selenium.find_element(By.ID, "edit-project-button").click()
        selenium.find_element(By.ID, "project-title-input").send_keys(
            "new title"
        )
        selenium.find_element(By.ID, "project-description-input").send_keys(
            "new description"
        )
        selenium.find_element(By.ID, "project-discipline-input").click()
        selenium.find_elements(By.CSS_SELECTOR, ".ui-autocomplete li")[
            0
        ].click()
        selenium.find_element(By.ID, "save-changes").click()
        assert (
            "new title"
            in selenium.find_element(By.CSS_SELECTOR, ".project-title").text
        )
        assert (
            "new description"
            in selenium.find_element(
                By.CSS_SELECTOR, ".project-description"
            ).text
        )
        time.sleep(2)
        project = Project.objects.first()
        self.assertEqual(project.title, "new title")
        self.assertEqual(project.description, "new description")
        self.assertEqual(project.disciplines.first(), discipline)

    def test_import_favourite(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        project = Project.objects.create(
            author=author, published=True, title="published project"
        )
        WorkflowProject.objects.create(
            workflow=Activity.objects.create(author=author, published=True),
            project=project,
        )
        WorkflowProject.objects.create(
            workflow=Course.objects.create(author=author, published=True),
            project=project,
        )
        WorkflowProject.objects.create(
            workflow=Program.objects.create(author=author, published=True),
            project=project,
        )
        ObjectPermission.objects.create(
            user=self.user,
            content_object=project,
            permission_type=ObjectPermission.PERMISSION_VIEW,
        )
        Favourite.objects.create(user=self.user, content_object=project)
        Favourite.objects.create(
            user=self.user,
            content_object=Workflow.objects.get(
                pk=Activity.objects.first().pk
            ),
        )
        Favourite.objects.create(
            user=self.user,
            content_object=Workflow.objects.get(pk=Course.objects.first().pk),
        )
        Favourite.objects.create(
            user=self.user,
            content_object=Workflow.objects.get(pk=Program.objects.first().pk),
        )

        # View the favourites
        selenium.get(
            self.live_server_url + reverse("course_flow:my-favourites")
        )
        time.sleep(2)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".workflow-for-menu .workflow-toggle-favourite .filled",
                )
            ),
            4,
        )
        selenium.find_element(
            By.CSS_SELECTOR, ".workflow-for-menu.project .workflow-title"
        ).click()
        favourites = selenium.current_url
        time.sleep(2)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".workflow-for-menu .workflow-toggle-favourite .filled",
                )
            ),
            3,
        )
        # Import the project
        selenium.find_element(By.CSS_SELECTOR, "#overflow-options").click()
        selenium.find_element(By.CSS_SELECTOR, "#copy-button").click()

        time.sleep(2)
        new_project = Project.objects.get(parent_project=project)
        for workflow_type in ["activity", "course", "program"]:
            assert WorkflowProject.objects.get(
                workflow=get_model_from_str(workflow_type).objects.get(
                    author=self.user,
                    parent_workflow=get_model_from_str(
                        workflow_type
                    ).objects.get(author=author),
                ),
                project=new_project,
            )

        # Create a project, then import the favourites one at a time
        my_project1 = Project.objects.create(author=self.user)
        selenium.get(favourites)
        time.sleep(1)
        selenium.find_element(
            By.CSS_SELECTOR, ".workflow-for-menu.activity .workflow-title"
        ).click()
        time.sleep(0.5)
        selenium.find_element(By.CSS_SELECTOR, "#overflow-options").click()
        selenium.find_element(By.CSS_SELECTOR, "#copy-button").click()
        time.sleep(0.5)
        selenium.find_elements(
            By.CSS_SELECTOR, "#popup-container #tabs-0 .workflow-for-menu"
        )[1].click()
        selenium.find_element(By.CSS_SELECTOR, "#set-linked-workflow").click()
        time.sleep(1)

        selenium.get(favourites)
        time.sleep(1)
        selenium.find_element(
            By.CSS_SELECTOR, ".workflow-for-menu.course .workflow-title"
        ).click()
        time.sleep(0.5)
        selenium.find_element(By.CSS_SELECTOR, "#overflow-options").click()
        selenium.find_element(By.CSS_SELECTOR, "#copy-button").click()
        time.sleep(0.5)
        selenium.find_elements(
            By.CSS_SELECTOR, "#popup-container #tabs-0 .workflow-for-menu"
        )[1].click()
        selenium.find_element(By.CSS_SELECTOR, "#set-linked-workflow").click()
        time.sleep(1)

        selenium.get(favourites)
        time.sleep(1)
        selenium.find_element(
            By.CSS_SELECTOR, ".workflow-for-menu.program .workflow-title"
        ).click()
        time.sleep(0.5)
        selenium.find_element(By.CSS_SELECTOR, "#overflow-options").click()
        selenium.find_element(By.CSS_SELECTOR, "#copy-button").click()
        time.sleep(0.5)
        selenium.find_elements(
            By.CSS_SELECTOR, "#popup-container #tabs-0 .workflow-for-menu"
        )[1].click()
        selenium.find_element(By.CSS_SELECTOR, "#set-linked-workflow").click()
        time.sleep(1)

        for workflow_type in ["activity", "course", "program"]:
            assert WorkflowProject.objects.get(
                workflow=get_model_from_str(workflow_type)
                .objects.filter(
                    author=self.user,
                    parent_workflow=get_model_from_str(
                        workflow_type
                    ).objects.get(author=author),
                )
                .last(),
                project=my_project1,
            )

    def test_workflow_read_only(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        project = Project.objects.create(author=author, published=True)
        for workflow_type in ["activity", "course", "program"]:
            workflow = get_model_from_str(workflow_type).objects.create(
                author=author
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            workflow.weeks.first().nodes.create(
                author=self.user, column=workflow.columns.first()
            )

            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)

            self.assertEqual(
                len(selenium.find_elements(By.CSS_SELECTOR, ".action-button")),
                0,
            )

            selenium.find_elements(By.CSS_SELECTOR, ".week")[0].click()
            time.sleep(0.3)
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        "#edit-menu .right-panel-inner #title-editor:disabled",
                    )
                ),
                1,
            )

    def test_workflow_editing(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        for workflow_type in ["activity", "course", "program"]:
            workflow = get_model_from_str(workflow_type).objects.create(
                author=self.user
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            workflow.weeks.first().nodes.create(
                author=self.user, column=workflow.columns.first()
            )
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            num_columns = workflow.columns.all().count()
            num_weeks = workflow.weeks.all().count()
            num_nodes = 1
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .column"
                    )
                ),
                num_columns,
            )
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .week"
                    )
                ),
                num_weeks,
            )
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .node"
                    )
                ),
                num_nodes,
            )
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .column"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR, ".column .insert-sibling-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            time.sleep(0.5)
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .week"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR, ".week .insert-sibling-button img"
            )
            selenium.find_element(
                By.CSS_SELECTOR, "#sidebar .window-close-button"
            ).click()
            time.sleep(0.5)
            action_hover_click(selenium, hover_item, click_item).perform()
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .node"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR, ".node .insert-sibling-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            time.sleep(8)
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .column"
                    )
                ),
                num_columns + 1,
            )
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .week"
                    )
                ),
                num_weeks + 1,
            )
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .node"
                    )
                ),
                num_nodes + 1,
            )
            # Deleting
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .node"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR, ".node .delete-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(1)
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .column"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR, ".column .delete-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(1)
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .week"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR, ".week .delete-self-button img"
            )
            #            selenium.find_element(By.CSS_SELECTOR,
            #                "#sidebar .window-close-button"
            #            ).click()
            time.sleep(0.5)
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(1)
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .column"
                    )
                ),
                num_columns,
            )
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .week"
                    )
                ),
                num_weeks,
            )
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .node"
                    )
                ),
                0,
            )

    def test_workflow_duplication(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        for workflow_type in ["activity", "course", "program"]:
            workflow = get_model_from_str(workflow_type).objects.create(
                author=self.user
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            workflow.weeks.first().nodes.create(
                author=self.user, column=workflow.columns.first()
            )

            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            num_columns = workflow.columns.all().count()
            num_weeks = workflow.weeks.all().count()
            num_nodes = 1
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .column"
                    )
                ),
                num_columns,
            )
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .week"
                    )
                ),
                num_weeks,
            )
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .node"
                    )
                ),
                num_nodes,
            )
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .column"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR, ".column .duplicate-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            time.sleep(1)
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .week"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR,
                ".week > .mouseover-container-bypass > .mouseover-actions > .duplicate-self-button img",
            )
            selenium.find_element(
                By.CSS_SELECTOR, "#sidebar .window-close-button"
            ).click()
            time.sleep(0.5)
            action_hover_click(selenium, hover_item, click_item).perform()
            time.sleep(1)
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .node"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR, ".node .duplicate-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            time.sleep(1)
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .column"
                    )
                ),
                num_columns + 1,
            )
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .week"
                    )
                ),
                num_weeks + 1,
            )
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .node"
                    )
                ),
                num_nodes * 2 + 1,
            )

    def test_outcome_editing(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        workflow = Course.objects.create(author=self.user)
        WorkflowProject.objects.create(workflow=workflow, project=project)
        base_outcome = Outcome.objects.create(author=self.user)
        OutcomeWorkflow.objects.create(outcome=base_outcome, workflow=workflow)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[workflow.pk])
        )
        time.sleep(4)
        selenium.find_element(
            By.CSS_SELECTOR, "a[href='#outcome-bar']"
        ).click()
        selenium.find_element(By.CSS_SELECTOR, "#edit-outcomes-button").click()
        time.sleep(1)
        hover_item = selenium.find_element(
            By.CSS_SELECTOR, ".workflow-details .outcome"
        )
        click_item = selenium.find_element(
            By.CSS_SELECTOR, ".outcome .insert-child-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)

        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".workflow-details .outcome .outcome"
                )
            ),
            1,
        )
        self.assertEqual(
            OutcomeOutcome.objects.filter(parent=base_outcome).count(), 1
        )
        hover_item = selenium.find_element(
            By.CSS_SELECTOR, ".workflow-details .outcome .outcome"
        )
        click_item = selenium.find_element(
            By.CSS_SELECTOR, ".outcome .outcome .insert-sibling-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".workflow-details .outcome .outcome"
                )
            ),
            2,
        )
        self.assertEqual(
            OutcomeOutcome.objects.filter(parent=base_outcome).count(), 2
        )
        hover_item = selenium.find_element(
            By.CSS_SELECTOR, ".workflow-details .outcome .outcome"
        )
        click_item = selenium.find_element(
            By.CSS_SELECTOR, ".outcome .outcome .delete-self-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(2)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".workflow-details .outcome .outcome"
                )
            ),
            1,
        )
        # Make sure item has only been soft deleted
        self.assertEqual(
            OutcomeOutcome.objects.filter(parent=base_outcome).count(), 2
        )
        time.sleep(1)

        hover_item = selenium.find_element(
            By.CSS_SELECTOR, ".workflow-details .outcome .outcome"
        )
        click_item = selenium.find_element(
            By.CSS_SELECTOR, ".outcome .outcome .insert-child-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)
        selenium.find_element(
            By.CSS_SELECTOR, ".outcome:not(.dropped) > .outcome-drop"
        ).click()
        time.sleep(1)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".workflow-details .outcome .outcome"
                )
            ),
            2,
        )
        hover_item = selenium.find_element(
            By.CSS_SELECTOR, ".workflow-details .outcome .outcome"
        )
        click_item = selenium.find_element(
            By.CSS_SELECTOR, ".outcome .outcome .duplicate-self-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".workflow-details .outcome .outcome"
                )
            ),
            3,
        )
        self.assertEqual(
            OutcomeOutcome.objects.filter(parent=base_outcome).count(), 2
        )
        selenium.find_element(By.CSS_SELECTOR, "#add-new-outcome").click()
        time.sleep(3)
        self.assertEqual(Outcome.objects.filter(depth=0).count(), 2)
        self.assertEqual(
            OutcomeWorkflow.objects.filter(workflow=workflow).count(), 2
        )
        hover_item = selenium.find_element(
            By.CSS_SELECTOR, ".workflow-details .outcome-workflow > .outcome"
        )
        click_item = selenium.find_element(
            By.CSS_SELECTOR,
            ".workflow-details .outcome-workflow > .outcome > .mouseover-actions .insert-sibling-button img",
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)

        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".workflow-details .outcome-workflow > .outcome",
                )
            ),
            3,
        )
        self.assertEqual(
            OutcomeWorkflow.objects.filter(workflow=workflow).count(), 3
        )
        hover_item = selenium.find_element(
            By.CSS_SELECTOR, ".workflow-details .outcome-workflow > .outcome"
        )
        click_item = selenium.find_element(
            By.CSS_SELECTOR,
            ".workflow-details .outcome-workflow > .outcome > .mouseover-actions .duplicate-self-button img",
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)

        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".workflow-details .outcome-workflow > .outcome",
                )
            ),
            4,
        )
        self.assertEqual(
            OutcomeWorkflow.objects.filter(workflow=workflow).count(), 4
        )

    def test_edit_menu(self):
        print("\nIn method", self._testMethodName, ": ")
        # Note that we don't test ALL parts of the edit menu, and we test only for nodes. This will catch the vast majority of potential issues. Linked workflows are tested in a different test
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        for i, workflow_type in enumerate(["activity", "course", "program"]):
            workflow = get_model_from_str(workflow_type).objects.create(
                author=self.user
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            workflow.weeks.first().nodes.create(
                author=self.user,
                column=workflow.columns.first(),
                title="test node",
                node_type=i,
            )

            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .node"
            ).click()
            time.sleep(1)
            title = selenium.find_element(By.ID, "title-editor")
            assert "test node" in title.get_attribute("value")
            title.clear()
            title.send_keys("new title")
            time.sleep(2.5)
            assert (
                "new title"
                in selenium.find_element(
                    By.CSS_SELECTOR, ".workflow-details .node .node-title"
                ).text
            )
            self.assertEqual(
                workflow.weeks.first().nodes.first().title, "new title"
            )
            if i < 2:
                context = selenium.find_element(By.ID, "context-editor")
                context.click()
                selenium.find_elements(
                    By.CSS_SELECTOR, "#context-editor option"
                )[2].click()
                time.sleep(2.5)
                self.assertEqual(
                    workflow.weeks.first()
                    .nodes.first()
                    .context_classification,
                    2 + 100 * i,
                )
            else:
                self.assertEqual(
                    len(
                        selenium.find_elements(
                            By.CSS_SELECTOR, "#context-editor"
                        )
                    ),
                    0,
                )
            if i < 2:
                context = selenium.find_element(By.ID, "task-editor")
                context.click()
                selenium.find_elements(By.CSS_SELECTOR, "#task-editor option")[
                    2
                ].click()
                time.sleep(2.5)
                self.assertEqual(
                    workflow.weeks.first().nodes.first().task_classification,
                    2 + 100 * i,
                )
            else:
                self.assertEqual(
                    len(
                        selenium.find_elements(By.CSS_SELECTOR, "#task-editor")
                    ),
                    0,
                )

    def test_project_return(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(
            author=self.user, title="project title"
        )
        for i, workflow_type in enumerate(["activity", "course", "program"]):
            workflow = get_model_from_str(workflow_type).objects.create(
                author=self.user
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            workflow.weeks.first().nodes.create(
                author=self.user,
                column=workflow.columns.first(),
                title="test node",
                node_type=i,
            )

            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            selenium.find_element(By.ID, "project-return").click()
            assert (
                "project title"
                in selenium.find_element(
                    By.CSS_SELECTOR, ".project-title"
                ).text
            )

    def test_strategy_convert(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(
            author=self.user, title="project title"
        )
        for i, workflow_type in enumerate(["activity", "course"]):
            workflow = get_model_from_str(workflow_type).objects.create(
                author=self.user
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            workflow.weeks.first().nodes.create(
                author=self.user,
                column=workflow.columns.first(),
                title="test node",
                node_type=i,
            )

            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(5)
            selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .week"
            ).click()
            time.sleep(1)
            title = selenium.find_element(By.ID, "title-editor").send_keys(
                "new strategy"
            )
            time.sleep(2.5)
            selenium.find_element(By.ID, "toggle-strategy-editor").click()
            time.sleep(4)
            selenium.find_element(
                By.CSS_SELECTOR, "a[href='#node-bar']"
            ).click()
            assert (
                "new strategy"
                in selenium.find_element(
                    By.CSS_SELECTOR, ".strategy-bar-strategy div"
                ).text
            )
            selenium.get(
                self.live_server_url + reverse("course_flow:my-library")
            )
            time.sleep(1)
            selenium.find_element(
                By.CSS_SELECTOR, "." + workflow_type + " .workflow-title"
            ).click()
            time.sleep(2)

            # windows = selenium.window_handles
            # selenium.switch_to_window(windows[0])
            # selenium.close()
            # selenium.switch_to_window(windows[1])

            assert (
                "new strategy"
                in selenium.find_element(
                    By.CSS_SELECTOR, ".project-title"
                ).text
            )
            self.assertEqual(
                Workflow.objects.filter(is_strategy=True).count(), 1
            )
            self.assertEqual(
                Workflow.objects.get(is_strategy=True)
                .weeks.get(is_strategy=True)
                .parent_week,
                workflow.weeks.first(),
            )
            Workflow.objects.get(is_strategy=True).delete()

    # @todo currently crashing app
    def test_outcome_view(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(
            author=self.user, title="project title"
        )
        for i, workflow_type in enumerate(["activity", "course", "program"]):
            workflow = get_model_from_str(workflow_type).objects.create(
                author=self.user
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            base_outcome = Outcome.objects.create(author=self.user)
            OutcomeWorkflow.objects.create(
                outcome=base_outcome, workflow=workflow
            )
            OutcomeOutcome.objects.create(
                parent=base_outcome,
                child=Outcome.objects.create(author=self.user),
            )
            OutcomeOutcome.objects.create(
                parent=base_outcome,
                child=Outcome.objects.create(author=self.user),
            )
            workflow.weeks.first().nodes.create(
                author=self.user,
                column=workflow.columns.first(),
                title="test node",
                node_type=i,
            )
            workflow.weeks.first().nodes.create(
                author=self.user,
                column=workflow.columns.first(),
                title="test node",
                node_type=i,
            )

            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            selenium.find_element(By.CSS_SELECTOR, ".other-views").click()
            selenium.find_element(
                By.CSS_SELECTOR, "#button_outcometable"
            ).click()
            time.sleep(1)
            base_outcome_row_select = ".outcome-table > div > .outcome-row:first-child > .outcome-cells"
            outcome1_row_select = ".outcome-table > div > .outcome-row:first-child+.outcome-row .outcome-cells"
            outcome2_row_select = ".outcome-table > div > .outcome-row:first-child+.outcome-row+.outcome-row .outcome-cells"
            base_cell = (
                base_outcome_row_select
                + " .table-group:first-of-type .total-cell+.table-cell"
            )
            base_cell2 = (
                base_outcome_row_select
                + " .table-group:first-of-type .total-cell+.table-cell+.table-cell"
            )
            base_input = (
                base_outcome_row_select
                + " .table-group:first-of-type .total-cell+.table-cell input"
            )
            base_input2 = (
                base_outcome_row_select
                + " .table-group:first-of-type .total-cell+.table-cell+.table-cell input"
            )
            base_img = (
                base_outcome_row_select
                + " .table-group:first-of-type .total-cell+.table-cell img"
            )
            base_img2 = (
                base_outcome_row_select
                + " .table-group:first-of-type .total-cell+.table-cell+.table-cell img"
            )
            base_total_img = (
                base_outcome_row_select
                + " .table-cell.total-cell:not(.grand-total-cell) img"
            )
            base_grandtotal_img = (
                base_outcome_row_select + " .table-cell.grand-total-cell img"
            )
            base_toggle = action_hover_click(
                selenium,
                selenium.find_element(By.CSS_SELECTOR, base_cell),
                selenium.find_element(By.CSS_SELECTOR, base_input),
            )
            outcome1_cell = (
                outcome1_row_select
                + " .table-group:first-of-type .total-cell+.table-cell"
            )
            outcome1_cell2 = (
                outcome1_row_select
                + " .table-group:first-of-type .total-cell+.table-cell+.table-cell"
            )
            outcome1_input = (
                outcome1_row_select
                + " .table-group:first-of-type .total-cell+.table-cell input"
            )
            outcome1_input2 = (
                outcome1_row_select
                + " .table-group:first-of-type .total-cell+.table-cell+.table-cell input"
            )
            outcome1_img = (
                outcome1_row_select
                + " .table-group:first-of-type .total-cell+.table-cell img"
            )
            outcome1_img2 = (
                outcome1_row_select
                + " .table-group:first-of-type .total-cell+.table-cell+.table-cell img"
            )
            outcome1_total_img = (
                outcome1_row_select
                + " .table-cell.total-cell:not(.grand-total-cell) img"
            )
            outcome1_grandtotal_img = (
                outcome1_row_select + " .table-cell.grand-total-cell img"
            )
            outcome1_toggle = action_hover_click(
                selenium,
                selenium.find_element(By.CSS_SELECTOR, outcome1_cell),
                selenium.find_element(By.CSS_SELECTOR, outcome1_input),
            )
            outcome2_cell = (
                outcome2_row_select
                + " .table-group:first-of-type .total-cell+.table-cell"
            )
            outcome2_cell2 = (
                outcome2_row_select
                + " .table-group:first-of-type .total-cell+.table-cell+.table-cell"
            )
            outcome2_input = (
                outcome2_row_select
                + " .table-group:first-of-type .total-cell+.table-cell input"
            )
            outcome2_input2 = (
                outcome2_row_select
                + " .table-group:first-of-type .total-cell+.table-cell+.table-cell input"
            )
            outcome2_img = (
                outcome2_row_select
                + " .table-group:first-of-type .total-cell+.table-cell img"
            )
            outcome2_img2 = (
                outcome2_row_select
                + " .table-group:first-of-type .total-cell+.table-cell+.table-cell img"
            )
            outcome2_total_img = (
                outcome2_row_select
                + " .table-cell.total-cell:not(.grand-total-cell) img"
            )
            outcome2_grandtotal_img = (
                outcome2_row_select + " .table-cell.grand-total-cell img"
            )
            outcome2_toggle = action_hover_click(
                selenium,
                selenium.find_element(By.CSS_SELECTOR, outcome2_cell),
                selenium.find_element(By.CSS_SELECTOR, outcome2_input),
            )

            def assert_image(element_string, string):
                assert string in selenium.find_element(
                    By.CSS_SELECTOR, element_string
                ).get_attribute("src")

            def assert_no_image(element_string):
                self.assertEqual(
                    len(
                        selenium.find_elements(By.CSS_SELECTOR, element_string)
                    ),
                    0,
                )

            # Toggle the base outcome. Check to make sure the children and totals columns behave as expected
            base_toggle.perform()
            time.sleep(2)
            assert_image(base_img, "solid_check")
            assert_image(base_total_img, "/check")
            assert_image(base_grandtotal_img, "/check")
            assert_image(outcome1_img, "/solid_check")
            assert_image(outcome1_total_img, "/check")
            assert_image(outcome1_grandtotal_img, "/check")
            assert_image(outcome2_img, "/solid_check")
            assert_image(outcome2_total_img, "/check")
            assert_image(outcome2_grandtotal_img, "/check")

            # Toggle one of the children. We expect to lose the top outcome to partial completion
            outcome1_toggle.perform()
            time.sleep(3)
            assert_image(base_img, "/nocheck")
            assert_image(base_total_img, "/nocheck")
            assert_image(base_grandtotal_img, "/nocheck")
            assert_no_image(outcome1_img)
            assert_no_image(outcome1_total_img)
            assert_no_image(outcome1_grandtotal_img)
            assert_image(outcome2_img, "/solid_check")
            assert_image(outcome2_total_img, "/check")
            assert_image(outcome2_grandtotal_img, "/check")
            # check that re-toggling outcome 1 adds the parent
            outcome1_toggle.perform()
            time.sleep(3)
            assert_image(base_img, "solid_check")
            assert_image(base_total_img, "/check")
            assert_image(base_grandtotal_img, "/check")
            assert_image(outcome1_img, "/solid_check")
            assert_image(outcome1_total_img, "/check")
            assert_image(outcome1_grandtotal_img, "/check")
            assert_image(outcome2_img, "/solid_check")
            assert_image(outcome2_total_img, "/check")
            assert_image(outcome2_grandtotal_img, "/check")
            # check that removing the base outcome clears all
            base_toggle.perform()
            time.sleep(3)
            assert_no_image(base_img)
            assert_no_image(base_total_img)
            assert_no_image(base_grandtotal_img)
            assert_no_image(outcome1_img)
            assert_no_image(outcome1_total_img)
            assert_no_image(outcome1_grandtotal_img)
            assert_no_image(outcome2_img)
            assert_no_image(outcome2_total_img)
            assert_no_image(outcome2_grandtotal_img)
            # check completion when not all children are toggled
            outcome1_toggle.perform()
            time.sleep(3)
            assert_image(base_img, "/nocheck")
            assert_image(base_total_img, "/nocheck")
            assert_image(base_grandtotal_img, "/nocheck")
            assert_image(outcome1_img, "solid_check")
            assert_image(outcome1_total_img, "/check")
            assert_image(outcome1_grandtotal_img, "/check")
            assert_no_image(outcome2_img)
            assert_no_image(outcome2_total_img)
            assert_no_image(outcome2_grandtotal_img)
            # check completion when children are toggled but in different nodes
            action_hover_click(
                selenium,
                selenium.find_element(By.CSS_SELECTOR, outcome2_cell2),
                selenium.find_element(By.CSS_SELECTOR, outcome2_input2),
            ).perform()
            time.sleep(3)

            assert_image(base_img, "/nocheck")
            assert_image(base_img2, "/nocheck")
            assert_image(base_total_img, "/check")
            assert_image(base_grandtotal_img, "/check")
            assert_image(outcome1_img, "solid_check")
            assert_no_image(outcome1_img2)
            assert_image(outcome1_total_img, "/check")
            assert_image(outcome1_grandtotal_img, "/check")
            assert_no_image(outcome2_img)
            assert_image(outcome2_img2, "solid_check")
            assert_image(outcome2_total_img, "/check")
            assert_image(outcome2_grandtotal_img, "/check")

    def test_outcome_analytics(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)

        # Create test data
        project = Project.objects.create(
            author=self.user, title="project title"
        )
        course = Course.objects.create(author=self.user)
        program = Program.objects.create(author=self.user)
        # add course and program to project
        WorkflowProject.objects.create(workflow=course, project=project)
        WorkflowProject.objects.create(workflow=program, project=project)

        base_outcome = Outcome.objects.create(author=self.user)
        OutcomeWorkflow.objects.create(outcome=base_outcome, workflow=program)
        poo1 = OutcomeOutcome.objects.create(
            parent=base_outcome,
            child=Outcome.objects.create(author=self.user),
        )
        poo2 = OutcomeOutcome.objects.create(
            parent=base_outcome,
            child=Outcome.objects.create(author=self.user),
        )
        coc1 = course.outcomes.create(author=self.user)
        coc2 = course.outcomes.create(author=self.user)
        node = program.weeks.first().nodes.create(
            author=self.user,
            linked_workflow=course,
            column=program.columns.first(),
        )
        response = self.client.post(
            reverse("course_flow:json-api-post-update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": base_outcome.id, "degree": 1},
        )

        OutcomeHorizontalLink.objects.create(
            outcome=coc1, parent_outcome=poo1.child
        )
        OutcomeHorizontalLink.objects.create(
            outcome=coc2, parent_outcome=poo2.child
        )

        # Navigate to URL
        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[program.pk])
        )
        other_views = wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".other-views"))
        )
        other_views.click()

        # click the Course Outcome Analytics button
        selenium.find_element(
            By.CSS_SELECTOR, "#button_alignmentanalysis"
        ).click()

        wait.until(
            EC.presence_of_all_elements_located(
                (By.CSS_SELECTOR, ".week .title-text")
            )
        )

        title_text = selenium.find_elements(
            By.CSS_SELECTOR,
            ".week .title-text"
        )[0]

        assert title_text.text == "Term 1"

        assert len(selenium.find_elements(By.CSS_SELECTOR, ".week .node")) == 1

        assert (
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".week .node .child-outcome"
                )
            )
            == 3
        )

        assert (
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".week .node .child-outcome .half-width>.outcome",
                )
            )
            == 2
        )
        assert (
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR,
                    ".week .node .child-outcome .alignment-row .outcome",
                )
            )
            == 2
        )

    def test_outcome_matrix_view(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(
            author=self.user, title="project title"
        )
        course = Course.objects.create(author=self.user)
        program = Program.objects.create(author=self.user)
        WorkflowProject.objects.create(workflow=course, project=project)
        WorkflowProject.objects.create(workflow=program, project=project)
        base_outcome = Outcome.objects.create(author=self.user)
        OutcomeWorkflow.objects.create(outcome=base_outcome, workflow=program)
        # program outcome-outcome
        poo1 = OutcomeOutcome.objects.create(
            parent=base_outcome,
            child=Outcome.objects.create(author=self.user),
        )
        poo2 = OutcomeOutcome.objects.create(
            parent=base_outcome,
            child=Outcome.objects.create(author=self.user),
        )
        coc1 = course.outcomes.create(author=self.user)
        coc2 = course.outcomes.create(author=self.user)
        node = program.weeks.first().nodes.create(
            author=self.user,
            linked_workflow=course,
            column=program.columns.first(),
        )
        response = self.client.post(
            reverse("course_flow:json-api-post-update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": poo1.child.pk, "degree": 1},
        )

        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[program.pk])
        )
        time.sleep(2)
        selenium.find_element(By.CSS_SELECTOR, ".other-views").click()
        selenium.find_element(By.CSS_SELECTOR, "#button_outcometable").click()
        time.sleep(2)

        selenium.find_element(By.CSS_SELECTOR, "#table_type_matrix").click()
        time.sleep(2)
        assert (
            len(selenium.find_elements(By.CSS_SELECTOR, ".table-cell .node"))
            == 1
        )
        assert (
            len(selenium.find_elements(By.CSS_SELECTOR, ".table-cell input"))
            == 1
        )
        time.sleep(2)
        assert (
            len(selenium.find_elements(By.CSS_SELECTOR, ".table-cell > img"))
            == 3
        )

    def test_grid_view(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(
            author=self.user, title="project title"
        )
        program = Program.objects.create(author=self.user)
        WorkflowProject.objects.create(workflow=program, project=project)
        node = program.weeks.first().nodes.create(
            author=self.user,
            column=program.columns.first(),
        )

        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[program.pk])
        )
        time.sleep(2)
        selenium.find_element(By.CSS_SELECTOR, ".other-views").click()
        selenium.find_element(By.CSS_SELECTOR, "#button_grid").click()
        time.sleep(1)
        assert (
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-grid")) > 0
        )

    def test_linked_workflow(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        selenium.set_window_size(
            1920, 1480
        )  # need to expand the window size to show the right sidebar buttons
        workflow_types = ["activity", "course", "program"]

        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(
            author=self.user, title="project title"
        )

        for i, workflow_type in enumerate(workflow_types):
            print("creating: " + workflow_type)
            workflow = get_model_from_str(workflow_type).objects.create(
                author=self.user, title=workflow_type
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            workflow.weeks.first().nodes.create(
                author=self.user,
                column=workflow.columns.first(),
                title="test node",
                node_type=i,
            )

            # app is crashing without this
            time.sleep(1)
            # navigate to newly created workflow page
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )

            this_url = selenium.current_url

            # why?
            if workflow_type == "activity":
                continue

            node_details = wait.until(
                EC.element_to_be_clickable(
                    (By.CSS_SELECTOR, ".workflow-details .node .node-title")
                )
            )
            node_details.click()

            linked_workflow_editor = wait.until(
                EC.element_to_be_clickable((By.ID, "linked-workflow-editor"))
            )
            linked_workflow_editor.click()

            section_workflow_menu = wait.until(
                EC.element_to_be_clickable(
                    (
                        By.CSS_SELECTOR,
                        ".section-"
                        + workflow_types[i - 1]
                        + " .workflow-for-menu",
                    )
                )
            )
            section_workflow_menu.click()

            # link to node button
            set_linked_workflow = wait.until(
                EC.element_to_be_clickable((By.ID, "set-linked-workflow"))
            )
            set_linked_workflow.click()

            set_linked_workflow = wait.until(
                EC.element_to_be_clickable(
                    (By.CSS_SELECTOR, ".linked-workflow.hover-shade")
                )
            )

            self.assertEqual(
                workflow.weeks.first().nodes.first().linked_workflow.id,
                get_model_from_str(workflow_types[i - 1]).objects.first().id,
            )
            linked_workflow_cta = wait.until(
                EC.element_to_be_clickable(
                    (
                        By.CSS_SELECTOR,
                        ".workflow-details .node .linked-workflow",
                    )
                )
            )
            linked_workflow_cta.click()

            windows = selenium.window_handles
            if len(windows) > 0:
                selenium.switch_to.window(windows[0])
                selenium.close()
            else:
                # Handle the case where no windows are left
                print("No more windows to switch to.")

            windows = selenium.window_handles
            if len(windows) > 0:
                selenium.switch_to.window(windows[0])
            else:
                # Handle the case where no windows are left
                print("No more windows to switch to.")

            wait.until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, ".project-title")
                )
            )
            assert (
                workflow_types[i - 1]
                in selenium.find_element(
                    By.CSS_SELECTOR, ".project-title"
                ).text
            )
            selenium.get(this_url)
            time.sleep(2)
            ActionChains(selenium).move_to_element_with_offset(
                selenium.find_element(
                    By.CSS_SELECTOR, ".workflow-details .node .node-title"
                ),
                5,
                5,
            ).click().perform()

            linked_workflow_editor = wait.until(
                EC.element_to_be_clickable((By.ID, "linked-workflow-editor"))
            )
            linked_workflow_editor.click()

            section_workflow_menu = wait.until(
                EC.element_to_be_clickable(
                    (
                        By.CSS_SELECTOR,
                        ".section-"
                        + workflow_types[i - 1]
                        + " .workflow-for-menu",
                    )
                )
            )
            section_workflow_menu.click()

            selenium.find_element(By.ID, "set-linked-workflow-none").click()
            time.sleep(2)

            self.assertEqual(
                workflow.weeks.first().nodes.first().linked_workflow, None
            )
            ActionChains(selenium).move_to_element_with_offset(
                selenium.find_element(
                    By.CSS_SELECTOR, ".workflow-details .node .node-title"
                ),
                5,
                5,
            ).double_click().perform()
            assert (
                workflow_type
                in selenium.find_element(
                    By.CSS_SELECTOR, ".project-title"
                ).text
            )

    def create_many_items(self, author, published, disciplines):
        print("\nIn method", self._testMethodName, ": ")
        for object_type in [
            "activity",
            "course",
            "program",
            "project",
        ]:
            for i in range(10):
                item = get_model_from_str(object_type).objects.create(
                    author=author,
                    published=published,
                    title=object_type + str(i),
                )
                if object_type in ["activity", "course", "program"]:
                    item.weeks.first().nodes.create(author=author)
                    item.weeks.first().nodes.create(author=author)
                    item.weeks.first().nodes.create(author=author)
                else:
                    item.disciplines.set(disciplines)
                    WorkflowProject.objects.create(
                        workflow=Activity.objects.filter(project=None).first(),
                        project=item,
                    )
                    WorkflowProject.objects.create(
                        workflow=Course.objects.filter(project=None).first(),
                        project=item,
                    )
                    WorkflowProject.objects.create(
                        workflow=Program.objects.filter(project=None).first(),
                        project=item,
                    )

    # why does this method get invoked 3 times by test runner?
    # this test working again but needs a lot of work to remove the time.sleeps
    def test_explore(self):
        print("\nIn method", self._testMethodName, ": ")

        # helper functions
        def count_pagination_and_elements():
            # find all the paginated page links and count them  (4)
            created_by_buttons = wait.until(
                EC.presence_of_all_elements_located(page_buttons_selector)
            )
            self.assertEqual(len(created_by_buttons), 4)
            # count the number of articles (20)
            workflow_title = wait.until(
                EC.presence_of_all_elements_located(
                    (By.CSS_SELECTOR, ".workflow-title")
                )
            )
            self.assertEqual(len(workflow_title), 20)

        def has_loading_finished():
            # not sure why this check is not working, use time sleep as a 'hack/stopgap' until we can fix it
            # it might not be worth fixing until we have full SPA, then we can attach a loading class to the body, for example
            # if we design a good general 'ajax done' test, should move it into global scope
            wait.until(EC.element_to_be_clickable((By.ID, "prev-page-button")))
            time.sleep(5)

        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        selenium.set_window_size(
            1920, 1480
        )  # need to expand the window size to show the right sidebar buttons
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        discipline = Discipline.objects.create(title="Discipline1")

        #
        search_button_selector = (By.CSS_SELECTOR, "#workflow-search+button")
        page_buttons_selector = (By.CSS_SELECTOR, ".page-button")

        # how many items does create_many_items create?
        self.create_many_items(author, True, disciplines=[discipline])
        self.create_many_items(author, True, disciplines=[discipline])

        # navigate to URL
        selenium.get(self.live_server_url + reverse("course_flow:explore"))

        # open the filters menu
        selenium.find_element(By.ID, "workflow-filter").click()

        # select all filter checkboxes
        for checkbox in selenium.find_elements(
            By.CSS_SELECTOR, "#workflow-filter input"
        ):
            checkbox.click()

        # click search button
        search_button = wait.until(
            EC.element_to_be_clickable(search_button_selector)
        )
        search_button.click()

        # count pagination and elements
        count_pagination_and_elements()

        # go to page 2
        selenium.find_elements(By.CSS_SELECTOR, ".page-button")[2].click()
        has_loading_finished()
        count_pagination_and_elements()

        # check that page 2 button CTA is active
        page_buttons = wait.until(
            EC.presence_of_all_elements_located(page_buttons_selector)
        )
        assert "active" in page_buttons[2].get_attribute("class")

        # paginate right
        selenium.find_element(By.CSS_SELECTOR, "#next-page-button").click()

        has_loading_finished()
        count_pagination_and_elements()

        # check that page 3 button CTA is active
        page_buttons = wait.until(
            EC.presence_of_all_elements_located(page_buttons_selector)
        )
        assert "active" in page_buttons[3].get_attribute("class")

        selenium.find_element(By.CSS_SELECTOR, "#prev-page-button").click()

        created_by_buttons = wait.until(
            EC.presence_of_all_elements_located(
                (By.CSS_SELECTOR, ".page-button")
            )
        )
        self.assertEqual(len(created_by_buttons), 4)
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR,".workflow-title")), 20
        )
        has_loading_finished()
        count_pagination_and_elements()

        page_buttons = wait.until(
            EC.presence_of_all_elements_located(page_buttons_selector)
        )
        assert "active" in page_buttons[2].get_attribute("class")

        # open the disciplines menu
        selenium.find_element(By.ID, "workflow-disciplines").click()

        # check all the disciplines checkboxes
        for checkbox in selenium.find_elements(
            By.CSS_SELECTOR, "#workflow-disciplines input"
        ):
            checkbox.click()

        # click search button again
        search_button = wait.until(
            EC.element_to_be_clickable(search_button_selector)
        )
        search_button.click()
        has_loading_finished()

        count_pagination_and_elements()

        # still failing here
        workflow_search_input = selenium.find_element(
            By.ID, "workflow-search-input"
        )
        workflow_search_input.send_keys("1")
        workflow_search_input.send_keys(Keys.TAB)
        wait.until_not(
            lambda driver: selenium.find_element(
                *search_button_selector
            ).get_attribute("disabled")
        )
        search_button = wait.until(
            EC.element_to_be_clickable(search_button_selector)
        )
        search_button.click()

        # has_loading_finished()
        time.sleep(5)

        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-title")), 8
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".page-button")), 1
        )
        for button in selenium.find_elements(
            By.CSS_SELECTOR, ".workflow-toggle-favourite"
        ):
            button.click()

        time.sleep(5)

        self.assertEqual(
            Favourite.objects.filter(
                user=self.user,
                content_type=ContentType.objects.get_for_model(Project),
            ).count(),
            2,
        )
        self.assertEqual(
            Favourite.objects.filter(
                user=self.user,
                content_type=ContentType.objects.get_for_model(Workflow),
            ).count(),
            6,
        )

    def test_explore_no_publish(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        discipline = Discipline.objects.create(title="Discipline1")
        self.create_many_items(author, False, disciplines=[discipline])
        selenium.get(self.live_server_url + reverse("course_flow:explore"))
        selenium.find_element(
            By.CSS_SELECTOR, "#workflow-search+button"
        ).click()
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".page-button")), 0
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-title")), 0
        )

    def test_explore_disciplines(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        discipline1 = Discipline.objects.create(title="Discipline1")
        discipline2 = Discipline.objects.create(title="Discipline2")
        self.create_many_items(author, True, disciplines=[discipline1])
        self.create_many_items(author, True, disciplines=[discipline2])
        self.create_many_items(
            author, True, disciplines=[discipline1, discipline2]
        )
        selenium.get(self.live_server_url + reverse("course_flow:explore"))
        selenium.find_element(
            By.CSS_SELECTOR, "#workflow-search+button"
        ).click()
        time.sleep(1)
        self.assertEqual(
            selenium.find_elements(By.CSS_SELECTOR, ".page-button")[4].text,
            "6",
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-title")), 20
        )
        selenium.find_element(By.ID, "workflow-disciplines").click()
        selenium.find_elements(By.CSS_SELECTOR, "#workflow-disciplines input")[
            0
        ].click()
        selenium.find_element(
            By.CSS_SELECTOR, "#workflow-search+button"
        ).click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".page-button")), 4
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-title")), 20
        )
        selenium.find_element(By.ID, "workflow-disciplines").click()
        selenium.find_elements(By.CSS_SELECTOR, "#workflow-disciplines input")[
            0
        ].click()
        selenium.find_elements(By.CSS_SELECTOR, "#workflow-disciplines input")[
            1
        ].click()
        selenium.find_element(
            By.CSS_SELECTOR, "#workflow-search+button"
        ).click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".page-button")), 4
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-title")), 20
        )
        selenium.find_element(By.ID, "workflow-disciplines").click()
        selenium.find_elements(By.CSS_SELECTOR, "#workflow-disciplines input")[
            0
        ].click()
        selenium.find_element(
            By.CSS_SELECTOR, "#workflow-search+button"
        ).click()
        time.sleep(1)
        self.assertEqual(
            selenium.find_elements(By.CSS_SELECTOR, ".page-button")[4].text,
            "6",
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-title")), 20
        )

    def test_share_edit_view(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        user2 = get_author()
        project = Project.objects.create(author=self.user)
        project.title = "Title"
        project.save()
        discipline = Discipline.objects.create(title="discipline")
        project.disciplines.add(discipline)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )
        selenium.find_element(By.ID, "share-button").click()
        inputs = selenium.find_elements(By.CSS_SELECTOR, ".user-add input")
        inputs[0].send_keys("testuser2")
        time.sleep(2)
        selenium.find_elements(By.CSS_SELECTOR, ".ui-autocomplete li")[
            0
        ].click()
        time.sleep(0.5)
        selenium.find_elements(By.CSS_SELECTOR, ".user-add button")[0].click()
        time.sleep(2)
        self.assertEqual(
            ObjectPermission.objects.filter(
                user=user2,
                permission_type=ObjectPermission.PERMISSION_EDIT,
                content_type=ContentType.objects.get_for_model(project),
                object_id=project.id,
            ).count(),
            1,
        )

        selenium.find_elements(By.CSS_SELECTOR, ".user-label select")[
            0
        ].click()
        selenium.find_elements(By.CSS_SELECTOR, ".user-label select option")[
            1
        ].click()
        time.sleep(2)
        self.assertEqual(
            ObjectPermission.objects.filter(
                user=user2,
                permission_type=ObjectPermission.PERMISSION_EDIT,
                content_type=ContentType.objects.get_for_model(project),
                object_id=project.id,
            ).count(),
            0,
        )
        self.assertEqual(
            ObjectPermission.objects.filter(
                user=user2,
                permission_type=ObjectPermission.PERMISSION_COMMENT,
                content_type=ContentType.objects.get_for_model(project),
                object_id=project.id,
            ).count(),
            1,
        )
        selenium.find_elements(By.CSS_SELECTOR, ".user-label select")[
            0
        ].click()
        selenium.find_elements(By.CSS_SELECTOR, ".user-label select option")[
            2
        ].click()
        time.sleep(2)
        self.assertEqual(
            ObjectPermission.objects.filter(
                user=user2,
                permission_type=ObjectPermission.PERMISSION_COMMENT,
                content_type=ContentType.objects.get_for_model(project),
                object_id=project.id,
            ).count(),
            0,
        )
        self.assertEqual(
            ObjectPermission.objects.filter(
                user=user2,
                permission_type=ObjectPermission.PERMISSION_VIEW,
                content_type=ContentType.objects.get_for_model(project),
                object_id=project.id,
            ).count(),
            1,
        )
        selenium.find_elements(By.CSS_SELECTOR, ".user-label select")[
            0
        ].click()
        selenium.find_elements(By.CSS_SELECTOR, ".user-label select option")[
            3
        ].click()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(2)
        self.assertEqual(
            ObjectPermission.objects.filter(
                user=user2,
                permission_type=ObjectPermission.PERMISSION_VIEW,
                content_type=ContentType.objects.get_for_model(project),
                object_id=project.id,
            ).count(),
            0,
        )
        selenium.find_element(By.CSS_SELECTOR, ".make-public").click()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(2)
        project = Project.objects.get(pk=project.pk)
        self.assertEqual(project.published, True)

        selenium.find_element(
            By.CSS_SELECTOR, ".message-wrap > .window-close-button"
        ).click()
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".message-wrap")), 0
        )


class SeleniumDeleteRestoreTestCase(ChannelsStaticLiveServerTestCase):
    def setUp(self):
        selbase = SeleniumBase()
        self.selenium = selbase.init_selenium()

        super().setUp()
        selenium = self.selenium
        selenium.maximize_window()

        self.user = login(self)
        selenium.get(self.live_server_url + "/course-flow/home/")
        username = selenium.find_element(By.ID, "id_username")
        password = selenium.find_element(By.ID, "id_password")
        username.send_keys("testuser1")
        password.send_keys("testpass1")
        selenium.find_element(By.CSS_SELECTOR, "button[type=Submit]").click()

    def tearDown(self):
        self.selenium.quit()
        super().tearDown()

    def create_many_items(self, author, published, disciplines):
        print("\nIn method", self._testMethodName, ": ")
        for object_type in [
            "activity",
            "course",
            "program",
            "project",
        ]:
            for i in range(10):
                item = get_model_from_str(object_type).objects.create(
                    author=author,
                    published=published,
                    title=object_type + str(i),
                )
                if object_type in ["activity", "course", "program"]:
                    item.weeks.first().nodes.create(author=author)
                    item.weeks.first().nodes.create(author=author)
                    item.weeks.first().nodes.create(author=author)
                else:
                    item.disciplines.set(disciplines)
                    WorkflowProject.objects.create(
                        workflow=Activity.objects.filter(project=None).first(),
                        project=item,
                    )
                    WorkflowProject.objects.create(
                        workflow=Course.objects.filter(project=None).first(),
                        project=item,
                    )
                    WorkflowProject.objects.create(
                        workflow=Program.objects.filter(project=None).first(),
                        project=item,
                    )

    # Begin tests
    def test_delete_restore_column(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)

        project = Project.objects.create(author=self.user)

        for workflow_type in ["activity", "course", "program"]:
            # create test data
            # create one of activity, course, program and add to the previously created project
            workflow = get_model_from_str(workflow_type).objects.create(
                author=self.user
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            workflow.weeks.first().nodes.create(
                author=self.user, column=workflow.columns.first()
            )
            workflow.outcomes.create(author=self.user)
            workflow.outcomes.first().children.create(author=self.user)

            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)

            # Delete a column
            column_id = workflow.columns.first().id

            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".workflow-details .node.column-" + str(column_id),
                    )
                ),
                1,
            )
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .column"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR, ".column .delete-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(2)
            column2_id = workflow.columns.filter(deleted=False).first().id

            # Make sure all nodes have been moved to the first column
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".workflow-details .node.column-" + str(column2_id),
                    )
                ),
                1,
            )

            # Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".workflow-details .node.column-" + str(column2_id),
                    )
                ),
                1,
            )

            # Restore the column
            selenium.find_element(
                By.CSS_SELECTOR, "a[href='#restore-bar'] span"
            ).click()
            selenium.find_element(
                By.CSS_SELECTOR,
                "#restore-bar-workflow .node-bar-column-block button",
            ).click()
            time.sleep(2)

            # Make sure all nodes have been moved back to the restored column
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".workflow-details .node.column-" + str(column_id),
                    )
                ),
                1,
            )

            # Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".workflow-details .node.column-" + str(column_id),
                    )
                ),
                1,
            )

    def test_delete_restore_node(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        for workflow_type in ["activity", "course", "program"]:
            workflow = get_model_from_str(workflow_type).objects.create(
                author=self.user
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            workflow.weeks.first().nodes.create(
                author=self.user, column=workflow.columns.first()
            )
            workflow.outcomes.create(author=self.user)
            workflow.outcomes.first().children.create(author=self.user)
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)

            # Delete a node
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .node"
                    )
                ),
                1,
            )
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .node"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR, ".node .delete-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(2)

            # Make sure the node has vanished
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .node"
                    )
                ),
                0,
            )

            # Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .node"
                    )
                ),
                0,
            )

            # Restore the node
            selenium.find_element(
                By.CSS_SELECTOR, "a[href='#restore-bar'] span"
            ).click()
            selenium.find_element(
                By.CSS_SELECTOR,
                "#restore-bar-workflow .node-bar-column-block button",
            ).click()
            time.sleep(2)

            # Make sure the node was restored
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .node"
                    )
                ),
                1,
            )

            # Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR, ".workflow-details .node"
                    )
                ),
                1,
            )

    def test_delete_restore_outcome(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        for workflow_type in ["activity", "course", "program"]:
            workflow = get_model_from_str(workflow_type).objects.create(
                author=self.user
            )
            WorkflowProject.objects.create(workflow=workflow, project=project)
            node1 = workflow.weeks.first().nodes.create(
                author=self.user, column=workflow.columns.first()
            )
            node2 = workflow.weeks.first().nodes.create(
                author=self.user, column=workflow.columns.first()
            )
            outcome = workflow.outcomes.create(author=self.user)
            outcome2 = workflow.outcomes.create(author=self.user)

            child1 = workflow.outcomes.first().children.create(
                author=self.user, depth=1
            )
            child2 = workflow.outcomes.first().children.create(
                author=self.user, depth=1
            )
            OutcomeNode.objects.create(node=node1, outcome=child1)
            OutcomeNode.objects.create(node=node1, outcome=outcome2)
            OutcomeNode.objects.create(node=node2, outcome=outcome)
            OutcomeNode.objects.create(node=node2, outcome=outcome2)
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(3)
            ActionChains(selenium).move_to_element(
                selenium.find_elements(By.CSS_SELECTOR, ".node .side-actions")[
                    1
                ]
            ).perform()
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".outcome-node .outcome-" + str(outcome.id),
                    )
                ),
                1,
            )
            ActionChains(selenium).move_to_element(
                selenium.find_elements(By.CSS_SELECTOR, ".node .side-actions")[
                    0
                ]
            ).perform()
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".outcome-node .outcome-" + str(child1.id),
                    )
                ),
                1,
            )

            selenium.find_element(
                By.CSS_SELECTOR, "#button_outcomeedit"
            ).click()
            time.sleep(3)
            # Delete the parent outcome
            hover_item = selenium.find_element(
                By.CSS_SELECTOR, ".outcome-edit .outcome-workflow > .outcome"
            )
            click_item = selenium.find_element(
                By.CSS_SELECTOR,
                ".outcome-edit .outcome-workflow > .outcome>.mouseover-actions .delete-self-button img",
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(2)
            selenium.find_element(
                By.CSS_SELECTOR, "#button_workflowview"
            ).click()

            # Make sure the outcomenodes have vanished
            time.sleep(1)
            ActionChains(selenium).move_to_element(
                selenium.find_elements(By.CSS_SELECTOR, ".node .side-actions")[
                    1
                ]
            ).perform()
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".outcome-node .outcome-" + str(outcome.id),
                    )
                ),
                0,
            )
            ActionChains(selenium).move_to_element(
                selenium.find_elements(By.CSS_SELECTOR, ".node .side-actions")[
                    0
                ]
            ).perform()
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".outcome-node .outcome-" + str(child1.id),
                    )
                ),
                0,
            )

            # Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            ActionChains(selenium).move_to_element(
                selenium.find_elements(By.CSS_SELECTOR, ".node .side-actions")[
                    1
                ]
            ).perform()
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".outcome-node .outcome-" + str(outcome.id),
                    )
                ),
                0,
            )
            ActionChains(selenium).move_to_element(
                selenium.find_elements(By.CSS_SELECTOR, ".node .side-actions")[
                    0
                ]
            ).perform()
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".outcome-node .outcome-" + str(child1.id),
                    )
                ),
                0,
            )

            # Restore the outcome
            selenium.find_element(
                By.CSS_SELECTOR, "a[href='#restore-bar'] span"
            ).click()
            selenium.find_element(
                By.CSS_SELECTOR,
                "#restore-bar-workflow .node-bar-column-block button",
            ).click()
            time.sleep(2)

            # Make sure the outcome was restored
            ActionChains(selenium).move_to_element(
                selenium.find_elements(By.CSS_SELECTOR, ".node .side-actions")[
                    1
                ]
            ).perform()
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".outcome-node .outcome-" + str(outcome.id),
                    )
                ),
                1,
            )
            ActionChains(selenium).move_to_element(
                selenium.find_elements(By.CSS_SELECTOR, ".node .side-actions")[
                    0
                ]
            ).perform()
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".outcome-node .outcome-" + str(child1.id),
                    )
                ),
                1,
            )

            # Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            ActionChains(selenium).move_to_element(
                selenium.find_elements(By.CSS_SELECTOR, ".node .side-actions")[
                    1
                ]
            ).perform()
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".outcome-node .outcome-" + str(outcome.id),
                    )
                ),
                1,
            )
            ActionChains(selenium).move_to_element(
                selenium.find_elements(By.CSS_SELECTOR, ".node .side-actions")[
                    0
                ]
            ).perform()
            self.assertEqual(
                len(
                    selenium.find_elements(
                        By.CSS_SELECTOR,
                        ".outcome-node .outcome-" + str(child1.id),
                    )
                ),
                1,
            )

    def test_delete_restore_workflow(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        course = Course.objects.create(author=self.user)
        program = Program.objects.create(author=self.user)
        WorkflowProject.objects.create(workflow=course, project=project)
        WorkflowProject.objects.create(workflow=program, project=project)
        program.weeks.first().nodes.create(
            author=self.user, column=program.columns.first(), node_type=2
        )
        Favourite.objects.create(
            user=self.user, content_object=course.get_workflow()
        )
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )

        wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".panel-favourite"))
        )

        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".panel-favourite")),
            2,
        )

        # delete a workflow
        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[course.pk])
        )
        time.sleep(2)
        selenium.find_element(By.CSS_SELECTOR, "#overflow-options").click()
        selenium.find_element(By.CSS_SELECTOR, "#delete-workflow").click()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(2)
        self.assertEqual(Course.objects.get(pk=course.pk).deleted, True)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )

        # make sure it doesn't show up in favourites
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".panel-favourite")),
            0,
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-for-menu")),
            1,
        )

        # make sure it doesn't show up in linked wf
        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[program.pk])
        )
        time.sleep(2)
        ActionChains(selenium).move_to_element_with_offset(
            selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .node .node-title"
            ),
            5,
            5,
        ).click().perform()
        time.sleep(1)
        selenium.find_element(
            By.CSS_SELECTOR, "#linked-workflow-editor"
        ).click()
        time.sleep(3)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".message-wrap .workflow-for-menu"
                )
            ),
            0,
        )

        # Restore
        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[course.pk])
        )
        time.sleep(1)
        time.sleep(2)
        selenium.find_element(By.CSS_SELECTOR, "#overflow-options").click()
        selenium.find_element(By.CSS_SELECTOR, "#restore-workflow").click()
        time.sleep(2)
        # make sure shows up in favourites

        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".panel-favourite")),
            1,
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-for-menu")),
            2,
        )

        # make sure it shows up in linked wf
        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[program.pk])
        )
        time.sleep(2)
        ActionChains(selenium).move_to_element_with_offset(
            selenium.find_element(
                By.CSS_SELECTOR, ".workflow-details .node .node-title"
            ),
            5,
            5,
        ).click().perform()
        time.sleep(1)
        selenium.find_element(
            By.CSS_SELECTOR, "#linked-workflow-editor"
        ).click()
        time.sleep(3)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".message-wrap .workflow-for-menu"
                )
            ),
            1,
        )

    def test_explore_deleted(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium

        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        discipline = Discipline.objects.create(title="Discipline1")
        self.create_many_items(author, True, disciplines=[discipline])

        Workflow.objects.all().update(deleted=True)
        # make deleted workflows don't show up in explore
        selenium.get(self.live_server_url + reverse("course_flow:explore"))

        selenium.find_element(
            By.CSS_SELECTOR, "#workflow-search+button"
        ).click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".page-button")), 1
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-title")), 10
        )
        Project.objects.all().update(deleted=True)
        # make deleted projects don't show up in explore
        selenium.get(self.live_server_url + reverse("course_flow:explore"))
        selenium.find_element(
            By.CSS_SELECTOR, "#workflow-search+button"
        ).click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".page-button")), 0
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-title")), 0
        )
        Workflow.objects.all().update(deleted=False)
        # make workflows from deleted projects don't show up in explore
        selenium.get(self.live_server_url + reverse("course_flow:explore"))
        selenium.find_element(
            By.CSS_SELECTOR, "#workflow-search+button"
        ).click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".page-button")), 0
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".workflow-title")), 0
        )


class SeleniumObjectSetsTestCase(ChannelsStaticLiveServerTestCase):
    def setUp(self):
        selbase = SeleniumBase()
        self.selenium = selbase.init_selenium()

        super().setUp()
        selenium = self.selenium
        selenium.maximize_window()

        self.user = login(self)
        selenium.get(self.live_server_url + "/course-flow/home/")
        username = selenium.find_element(By.ID, "id_username")
        password = selenium.find_element(By.ID, "id_password")
        username.send_keys("testuser1")
        password.send_keys("testpass1")
        selenium.find_element(By.CSS_SELECTOR, "button[type=Submit]").click()

    def tearDown(self):
        self.selenium.quit()
        super().tearDown()

    def test_create_sets(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)

        # Navigate to newly created project
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )
        edit_projects_button = wait.until(
            EC.element_to_be_clickable((By.ID, "edit-project-button"))
        )
        edit_projects_button.click()

        nomenclature_select_button = wait.until(
            EC.element_to_be_clickable((By.ID, "nomenclature-select"))
        )
        nomenclature_select_button.click()

        selenium.find_element(
            By.CSS_SELECTOR,
            "#nomenclature-select option[value='program outcome']",
        ).click()
        selenium.find_element(By.CSS_SELECTOR, "#term-singular").send_keys(
            "competency"
        )
        selenium.find_element(
            By.CSS_SELECTOR, ".nomenclature-add-button"
        ).click()

        time.sleep(1)

        # test how many object sets are on project
        self.assertEqual(project.object_sets.count(), 1)

        # now delete the project set
        selenium.find_element(
            By.CSS_SELECTOR, ".nomenclature-delete-button"
        ).click()

        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()

        time.sleep(2)
        self.assertEqual(project.object_sets.count(), 0)

    def test_view_sets(self):
        print("\nIn method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)

        # create test data
        project = Project.objects.create(author=self.user)
        workflow = Program.objects.create(author=self.user)
        WorkflowProject.objects.create(workflow=workflow, project=project)
        node = workflow.weeks.first().nodes.create(
            author=self.user, column=workflow.columns.first(), node_type=2
        )
        outcome = workflow.outcomes.create(author=self.user)
        OutcomeNode.objects.create(outcome=outcome, node=node)
        nodeset = project.object_sets.create(
            term="program node", title="Nodes"
        )
        outcomeset = project.object_sets.create(
            term="program outcome", title="Outcomes"
        )
        outcome.sets.add(outcomeset)

        # navigate to project URL
        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[workflow.pk])
        )
        created_by_button = wait.until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".node"))
        )
        self.assertEqual(len(created_by_button), 1)

        # hover over the side actions panel to show outcomes assigned to node
        ActionChains(selenium).move_to_element(
            selenium.find_elements(By.CSS_SELECTOR, ".node .side-actions")[0]
        ).perform()

        print(str(outcome.id))

        # @todo fails here, why would there be 2 outcome by ID when we only created one ?
        # test needs to be fixed (and some more verbose commenting would help)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".outcome-" + str(outcome.id)
                )
            ),
            2,
        )

        selenium.find_element(By.CSS_SELECTOR, ".node").click()
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, "input[name='" + str(outcomeset.id) + "']"
                )
            ),
            0,
        )
        element = selenium.find_element(
            By.CSS_SELECTOR, "input[name='" + str(nodeset.id) + "']"
        )
        selenium.execute_script("arguments[0].scrollIntoView();", element)
        element.click()
        time.sleep(2)
        selenium.find_element(By.CSS_SELECTOR, "[href='#view-bar']").click()
        selenium.find_element(
            By.CSS_SELECTOR, "#set" + str(outcomeset.id)
        ).click()

        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".outcome-" + str(outcome.id)
                )
            ),
            0,
        )
        selenium.find_element(
            By.CSS_SELECTOR, "#set" + str(nodeset.id)
        ).click()
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".node")), 1
        )

        selenium.find_element(By.CSS_SELECTOR, "#button_outcomeedit").click()
        time.sleep(3)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".outcome-" + str(outcome.id)
                )
            ),
            0,
        )

        selenium.find_element(By.CSS_SELECTOR, ".other-views").click()
        selenium.find_element(By.CSS_SELECTOR, "#button_outcometable").click()
        time.sleep(3)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".outcome-" + str(outcome.id)
                )
            ),
            0,
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".node")), 0
        )
        selenium.find_element(By.CSS_SELECTOR, "#table_type_matrix").click()
        time.sleep(3)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".outcome-" + str(outcome.id)
                )
            ),
            0,
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".node")), 0
        )
        selenium.find_element(By.CSS_SELECTOR, ".other-views").click()
        selenium.find_element(
            By.CSS_SELECTOR, "#button_alignmentanalysis"
        ).click()
        time.sleep(3)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".outcome-" + str(outcome.id)
                )
            ),
            0,
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".node")), 0
        )

        selenium.find_element(By.CSS_SELECTOR, ".other-views").click()
        selenium.find_element(By.CSS_SELECTOR, "#button_grid").click()
        time.sleep(3)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".outcome-" + str(outcome.id)
                )
            ),
            0,
        )
        self.assertEqual(
            len(selenium.find_elements(By.CSS_SELECTOR, ".node")), 0
        )


class ComparisonViewTestCase(ChannelsStaticLiveServerTestCase):
    def setUp(self):
        selbase = SeleniumBase()
        self.selenium = selbase.init_selenium()

        super().setUp()
        selenium = self.selenium
        selenium.maximize_window()

        self.user = login(self)
        selenium.get(self.live_server_url + "/course-flow/home/")
        username = selenium.find_element(By.ID, "id_username")
        password = selenium.find_element(By.ID, "id_password")

        username.send_keys("testuser1")
        password.send_keys("testpass1")
        selenium.find_element(By.CSS_SELECTOR, "button[type=Submit]").click()

    def tearDown(self):
        self.selenium.quit()
        super().tearDown()

    def test_comparison_views(self):
        print("In method", self._testMethodName, ": ")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)

        # create a project and add 2 courses to it
        project = Project.objects.create(author=self.user)
        workflow = Course.objects.create(author=self.user)
        workflow2 = Course.objects.create(author=self.user)
        WorkflowProject.objects.create(workflow=workflow, project=project)
        WorkflowProject.objects.create(workflow=workflow2, project=project)

        # get the just created project's URL
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )

        # click the more icon ( three dots)
        more_icon = wait.until(
            EC.element_to_be_clickable((By.ID, "overflow-options"))
        )
        more_icon.click()

        # click the "workflow comparison tool" menu item
        workflow_comparison_tool_button = wait.until(
            EC.element_to_be_clickable((By.ID, "comparison-view"))
        )
        workflow_comparison_tool_button.click()

        # click the "load new workflow" button
        load_new_workflow_button = wait.until(
            EC.element_to_be_clickable((By.ID, "load-workflow"))
        )
        load_new_workflow_button.click()

        # click the "created by" button (selects card)
        # using presence_of_all_elements_located but could move this back to element_to_be_clickable if problems
        created_by_button = wait.until(
            EC.presence_of_all_elements_located(
                (By.CSS_SELECTOR, ".message-wrap .workflow-for-menu")
            )
        )
        created_by_button[0].click()

        print(created_by_button)

        # click select button
        select_button = wait.until(
            EC.element_to_be_clickable((By.ID, "set-linked-workflow"))
        )
        select_button.click()

        workflow_menu = wait.until(
            EC.presence_of_all_elements_located(
                (By.CSS_SELECTOR, ".workflow-wrapper .workflow-for-menu")
            )
        )

        # can we see one course box?
        self.assertEqual(len(workflow_menu), 1)

        # load a different workflow
        load_workflow_button = wait.until(
            EC.element_to_be_clickable((By.ID, "load-workflow"))
        )
        load_workflow_button.click()

        # click the "created by" button (selects card), get the 2nd element this time
        created_by_button = wait.until(
            EC.presence_of_all_elements_located(
                (By.CSS_SELECTOR, ".message-wrap .workflow-created")
            )
        )
        created_by_button[1].click()

        select_button = wait.until(
            EC.element_to_be_clickable((By.ID, "set-linked-workflow"))
        )
        select_button.click()

        # can we see two course boxes?
        workflow_menu = wait.until(
            EC.presence_of_all_elements_located(
                (By.CSS_SELECTOR, ".workflow-wrapper .workflow-for-menu")
            )
        )
        self.assertEqual(len(workflow_menu), 2)

        outcome_button = wait.until(
            EC.element_to_be_clickable((By.ID, "button_outcomeedit"))
        )
        outcome_button.click()

        # @todo this is still failing, not sure why we have expected outcomes here
        outcomes = wait.until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".outcome"))
        )
        self.assertEqual(len(outcomes), 2)


class WebsocketTestCase(ChannelsStaticLiveServerTestCase):
    def setUp(self):
        selbase = SeleniumBase()
        self.selenium = selbase.init_selenium()

        super().setUp()
        selenium = self.selenium
        selenium.maximize_window()

        self.user = login(self)
        selenium.get(self.live_server_url + "/course-flow/home/")
        username = selenium.find_element(By.ID, "id_username")
        password = selenium.find_element(By.ID, "id_password")
        username.send_keys("testuser1")
        password.send_keys("testpass1")
        selenium.find_element(By.CSS_SELECTOR, "button[type=Submit]").click()

    def tearDown(self):
        self.selenium.quit()
        super().tearDown()

    def test_permissions_connect_to_workflow_update_consumer(self):
        print("In method", self._testMethodName, "\n")
        author = get_author()
        user = self.user
        workflow_owned = Course.objects.create(author=user)
        workflow_view = Course.objects.create(author=author)
        workflow_edit = Course.objects.create(author=author)
        workflow_published = Course.objects.create(
            author=author, published=True
        )
        workflow_none = Course.objects.create(author=author)
        ObjectPermission.objects.create(
            user=user,
            content_object=workflow_view,
            permission_type=ObjectPermission.PERMISSION_VIEW,
        )
        ObjectPermission.objects.create(
            user=user,
            content_object=workflow_edit,
            permission_type=ObjectPermission.PERMISSION_EDIT,
        )

        application = URLRouter(websocket_urlpatterns)
        headers = [
            (b"origin", b"..."),
            (
                b"cookie",
                self.client.cookies.output(header="", sep="; ").encode(),
            ),
        ]

        url = "/ws/update/" + str(workflow_owned.pk) + "/"
        communicator = WebsocketCommunicator(application, url, headers)
        communicator.scope["user"] = user
        connected, subprotocol = async_to_sync_connect(communicator)
        assert connected
        my_input = async_to_sync_send_input(
            communicator, {"type": "micro_update", "action": "my_action"}
        )
        output = json.loads(async_to_sync_receive_output(communicator))
        self.assertEqual(output["action"], "my_action")
        async_to_sync_disconnect(communicator)

        url = "/ws/update/" + str(workflow_view.pk) + "/"
        communicator = WebsocketCommunicator(application, url, headers)
        communicator.scope["user"] = user
        connected, subprotocol = async_to_sync_connect(communicator)
        assert connected
        my_input = async_to_sync_send_input(
            communicator, {"type": "micro_update", "action": "my_action"}
        )
        output = async_to_sync_receive_nothing(communicator)
        assert output
        async_to_sync_disconnect(communicator)

        url = "/ws/update/" + str(workflow_edit.pk) + "/"
        communicator = WebsocketCommunicator(application, url, headers)
        communicator.scope["user"] = user
        connected, subprotocol = async_to_sync_connect(communicator)
        assert connected
        my_input = async_to_sync_send_input(
            communicator, {"type": "micro_update", "action": "my_action"}
        )
        output = json.loads(async_to_sync_receive_output(communicator))
        self.assertEqual(output["action"], "my_action")
        async_to_sync_disconnect(communicator)

        url = "/ws/update/" + str(workflow_published.pk) + "/"
        communicator = WebsocketCommunicator(application, url, headers)
        communicator.scope["user"] = user
        connected, subprotocol = async_to_sync_connect(communicator)
        assert connected
        my_input = async_to_sync_send_input(
            communicator, {"type": "micro_update", "action": "my_action"}
        )
        output = async_to_sync_receive_nothing(communicator)
        assert output
        async_to_sync_disconnect(communicator)

        url = "/ws/update/" + str(workflow_none.pk) + "/"
        communicator = WebsocketCommunicator(application, url, headers)
        communicator.scope["user"] = user
        connected, subprotocol = async_to_sync_connect(communicator)
        assert not connected

    def test_connection_bar(self):
        print("In method", self._testMethodName, "\n")
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)

        author = get_author()
        user = self.user
        workflow_edit = Course.objects.create(author=author).get_workflow()
        workflow_published = Course.objects.create(
            author=author
        ).get_workflow()
        project = Project.objects.create(author=author)
        WorkflowProject.objects.create(project=project, workflow=workflow_edit)
        WorkflowProject.objects.create(
            project=project, workflow=workflow_published
        )
        ObjectPermission.objects.create(
            user=user,
            content_object=workflow_edit,
            permission_type=ObjectPermission.PERMISSION_EDIT,
        )

        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[workflow_edit.pk])
        )
        time.sleep(3)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".users-box .users-small .user-indicator"
                )
            ),
            1,
        )
        workflow_published.published = True
        workflow_published.save()
        project.published = True
        project.save()
        selenium.get(
            self.live_server_url
            + reverse(
                "course_flow:workflow-update", args=[workflow_published.pk]
            )
        )
        time.sleep(3)
        self.assertEqual(
            len(
                selenium.find_elements(
                    By.CSS_SELECTOR, ".users-box .users-small .user-indicator"
                )
            ),
            0,
        )
        selenium.close()


########################
# HELPERS
########################


def action_hover_click(selenium, hover_item, click_item):
    hover = (
        ActionChains(selenium).move_to_element(hover_item).click(click_item)
    )
    return hover


async def connect_ws(ws):
    return await ws.connect()


async def disconnect_ws(ws):
    return await ws.disconnect()


async def send_input_ws(ws, data):
    return await ws.send_json_to(data)


async def receive_output_ws(ws):
    return await ws.receive_from(timeout=1)


async def receive_nothing_ws(ws):
    return await ws.receive_nothing(timeout=1)


def async_to_sync_connect(ws):
    loop = asyncio.get_event_loop()
    coroutine = connect_ws(ws)
    return loop.run_until_complete(coroutine)


def async_to_sync_disconnect(ws):
    loop = asyncio.get_event_loop()
    coroutine = disconnect_ws(ws)
    return loop.run_until_complete(coroutine)


def async_to_sync_send_input(ws, data):
    loop = asyncio.get_event_loop()
    coroutine = send_input_ws(ws, data)
    return loop.run_until_complete(coroutine)


def async_to_sync_receive_output(ws):
    loop = asyncio.get_event_loop()
    coroutine = receive_output_ws(ws)
    return loop.run_until_complete(coroutine)


def async_to_sync_receive_nothing(ws):
    loop = asyncio.get_event_loop()
    coroutine = receive_nothing_ws(ws)
    return loop.run_until_complete(coroutine)
