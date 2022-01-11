import time

from channels.testing import ChannelsLiveServerTestCase, HttpCommunicator
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


@tag("selenium")
class SeleniumRegistrationTestCase(StaticLiveServerTestCase):
    def setUp(self):
        chrome_options = webdriver.chrome.options.Options()
        if settings.CHROMEDRIVER_PATH is not None:
            self.selenium = webdriver.Chrome(settings.CHROMEDRIVER_PATH)
        else:
            self.selenium = webdriver.Chrome()

        super(SeleniumRegistrationTestCase, self).setUp()

    def tearDown(self):
        self.selenium.quit()
        super(SeleniumRegistrationTestCase, self).tearDown()

    def test_register_user(self):
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

        self.assertEqual(self.live_server_url + "/home/", selenium.current_url)


class SeleniumWorkflowsTestCase(ChannelsStaticLiveServerTestCase):
    def setUp(self):
        chrome_options = webdriver.chrome.options.Options()
        if settings.CHROMEDRIVER_PATH is not None:
            self.selenium = webdriver.Chrome(settings.CHROMEDRIVER_PATH)
        else:
            self.selenium = webdriver.Chrome()

        super(SeleniumWorkflowsTestCase, self).setUp()
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
        super(SeleniumWorkflowsTestCase, self).tearDown()

    #    async def test_my_consumer(self):
    #        communicator = HttpCommunicator(WorkflowUpdateConsumer,"GET","/test/")
    #        response = await communicator.get_response()
    #        self.assertEqual(response["body"], b"test response")
    #        self.assertEqual(response["status"], 200)

    def test_create_project_and_workflows(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        selenium.get(self.live_server_url + "/home/")
        home = selenium.current_url

        # Create a project
        selenium.get(self.live_server_url + "/myprojects/")
        selenium.find_element_by_css_selector(
            ".section-project .menu-create"
        ).click()
        selenium.find_element_by_css_selector(
            ".section-project .create-dropdown.active a:first-child"
        ).click()
        title = selenium.find_element_by_id("id_title")
        description = selenium.find_element_by_id("id_description")
        project_title = "test project title"
        project_description = "test project description"
        title.send_keys(project_title)
        description.send_keys(project_description)
        selenium.find_element_by_id("save-button").click()
        assert (
            project_title in selenium.find_element_by_id("workflowtitle").text
        )
        assert (
            project_description
            in selenium.find_element_by_css_selector(
                ".project-header .workflow-description"
            ).text
        )
        project_url = selenium.current_url

        # Create templates
        selenium.get(self.live_server_url + "/mytemplates/")
        templates = selenium.current_url

        for template_type in ["activity", "course"]:
            if template_type == "course":
                selenium.find_element_by_css_selector(
                    'a[href="#tabs-1"]'
                ).click()
            selenium.find_element_by_css_selector(
                ".section-" + template_type + " .menu-create"
            ).click()
            selenium.find_element_by_css_selector(
                ".section-"
                + template_type
                + " .create-dropdown.active a:first-child"
            ).click()
            title = selenium.find_element_by_id("id_title")
            description = selenium.find_element_by_id("id_description")
            project_title = "test project title"
            project_description = "test project description"
            title.send_keys(project_title)
            description.send_keys(project_description)
            selenium.find_element_by_id("save-button").click()
            time.sleep(2)
            assert (
                project_title
                in selenium.find_element_by_id("workflowtitle").text
            )
            assert (
                project_description
                in selenium.find_element_by_css_selector(
                    ".workflow-header .workflow-description"
                ).text
            )

            selenium.get(templates)
        selenium.get(project_url)

        for i, workflow_type in enumerate(["activity", "course", "program"]):
            # Create the workflow
            selenium.find_element_by_css_selector(
                'a[href="#tabs-' + str(i + 1) + '"]'
            ).click()
            selenium.find_element_by_css_selector(
                ".section-" + workflow_type + " .menu-create"
            ).click()
            selenium.find_element_by_css_selector(
                ".section-"
                + workflow_type
                + " .create-dropdown.active a:first-child"
            ).click()
            title = selenium.find_element_by_id("id_title")
            description = selenium.find_element_by_id("id_description")
            project_title = "test " + workflow_type + " title"
            project_description = "test " + workflow_type + " description"
            title.send_keys(project_title)
            description.send_keys(project_description)
            selenium.find_element_by_id("save-button").click()
            time.sleep(2)
            assert (
                project_title
                in selenium.find_element_by_class_name("workflow-title").text
            )
            assert (
                project_description
                in selenium.find_element_by_css_selector(
                    ".workflow-header .workflow-description"
                ).text
            )
            selenium.get(project_url)
            # edit link
            selenium.find_element_by_css_selector(
                ".workflow-for-menu." + workflow_type + " .workflow-title"
            ).click()
            time.sleep(2)
            assert (
                project_title
                in selenium.find_element_by_id("workflowtitle").text
            )
            selenium.get(project_url)
            selenium.find_element_by_css_selector(
                ".workflow-for-menu."
                + workflow_type
                + " .workflow-duplicate-button"
            ).click()
            wait.until(
                lambda driver: len(
                    driver.find_elements_by_css_selector(
                        ".section-" + workflow_type + " .workflow-title"
                    )
                )
                > 1
            )
            assert (
                project_title
                in selenium.find_elements_by_css_selector(
                    ".section-workflow .workflow-title"
                )[1].text
            )
            self.assertEqual(
                get_model_from_str(workflow_type)
                .objects.exclude(parent_workflow=None)
                .count(),
                1,
            )
            selenium.find_elements_by_css_selector(
                ".section-workflow ."
                + workflow_type
                + " .workflow-delete-button"
            )[0].click()
            alert = wait.until(expected_conditions.alert_is_present())
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
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        discipline = Discipline.objects.create(title="discipline")
        discipline2 = Discipline.objects.create(title="discipline2")
        discipline3 = Discipline.objects.create(title="discipline3")
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )
        time.sleep(1)
        selenium.find_element_by_id("edit-project-button").click()
        selenium.find_element_by_id("project-title-input").send_keys(
            "new title"
        )
        selenium.find_element_by_id("project-description-input").send_keys(
            "new description"
        )
        selenium.find_elements_by_css_selector("#disciplines_all option")[
            0
        ].click()
        selenium.find_element_by_css_selector("#add-discipline").click()
        selenium.find_element_by_id("project-publish-input").click()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(2)
        selenium.find_element_by_id("save-changes").click()
        assert (
            "new title"
            in selenium.find_element_by_css_selector("#workflowtitle div").text
        )
        assert (
            "new description"
            in selenium.find_element_by_css_selector(
                ".project-header .workflow-description"
            ).text
        )
        project = Project.objects.first()
        self.assertEqual(project.title, "new title")
        self.assertEqual(project.description, "new description")
        self.assertEqual(project.published, True)
        self.assertEqual(project.disciplines.first(), discipline)

    def test_import_favourite(self):
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
        Favourite.objects.create(user=self.user, content_object=project)
        Favourite.objects.create(
            user=self.user, content_object=Activity.objects.first()
        )
        Favourite.objects.create(
            user=self.user, content_object=Course.objects.first()
        )
        Favourite.objects.create(
            user=self.user, content_object=Program.objects.first()
        )

        # View the favourites
        selenium.get(
            self.live_server_url + reverse("course_flow:my-favourites")
        )
        favourites = selenium.current_url

        assert (
            len(
                selenium.find_elements_by_css_selector(
                    "#tabs-0 .workflow-title"
                )
            )
            == 4
        )
        assert (
            len(
                selenium.find_elements_by_css_selector(
                    "#tabs-1 .workflow-title"
                )
            )
            == 1
        )
        assert (
            len(
                selenium.find_elements_by_css_selector(
                    "#tabs-2 .workflow-title"
                )
            )
            == 1
        )
        assert (
            len(
                selenium.find_elements_by_css_selector(
                    "#tabs-3 .workflow-title"
                )
            )
            == 1
        )
        assert (
            len(
                selenium.find_elements_by_css_selector(
                    "#tabs-4 .workflow-title"
                )
            )
            == 1
        )
        # Import the project
        selenium.find_element_by_css_selector(
            "#tabs-0 .project .workflow-duplicate-button"
        ).click()
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
        selenium.find_element_by_css_selector("a[href='#tabs-2']").click()
        selenium.find_element_by_css_selector(
            "#tabs-2 .workflow-duplicate-button"
        ).click()
        time.sleep(0.5)
        selenium.find_elements_by_css_selector(
            "#popup-container #tabs-0 .workflow-for-menu"
        )[1].click()
        selenium.find_element_by_css_selector("#set-linked-workflow").click()
        time.sleep(1)
        selenium.find_element_by_css_selector("a[href='#tabs-3']").click()
        selenium.find_element_by_css_selector(
            "#tabs-3 .workflow-duplicate-button"
        ).click()
        time.sleep(0.5)
        selenium.find_elements_by_css_selector(
            "#popup-container #tabs-0 .workflow-for-menu"
        )[1].click()
        selenium.find_element_by_css_selector("#set-linked-workflow").click()
        time.sleep(1)
        selenium.find_element_by_css_selector("a[href='#tabs-4']").click()
        selenium.find_element_by_css_selector(
            "#tabs-4 .workflow-duplicate-button"
        ).click()
        time.sleep(0.5)
        selenium.find_elements_by_css_selector(
            "#popup-container #tabs-0 .workflow-for-menu"
        )[1].click()
        selenium.find_element_by_css_selector("#set-linked-workflow").click()
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

        # Import the workflows from a project rather than from the favourites menu
        my_project = Project.objects.create(author=self.user)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[my_project.pk])
        )
        selenium.find_element_by_css_selector("#tabs-0 .menu-create").click()
        selenium.find_element_by_css_selector(
            ".create-dropdown.active a:last-child"
        ).click()
        time.sleep(0.5)
        selenium.find_element_by_css_selector(
            "#popup-container a[href='#tabs-2']"
        ).click()
        selenium.find_elements_by_css_selector(
            "#popup-container #tabs-2 .workflow-for-menu"
        )[0].click()
        selenium.find_element_by_css_selector("#set-linked-workflow").click()
        time.sleep(1)
        selenium.find_element_by_css_selector("#tabs-0 .menu-create").click()
        selenium.find_element_by_css_selector(
            ".create-dropdown.active a:last-child"
        ).click()
        time.sleep(0.5)
        selenium.find_element_by_css_selector(
            "#popup-container a[href='#tabs-2']"
        ).click()
        selenium.find_elements_by_css_selector(
            "#popup-container #tabs-2 .workflow-for-menu"
        )[1].click()
        selenium.find_element_by_css_selector("#set-linked-workflow").click()
        time.sleep(1)
        selenium.find_element_by_css_selector("#tabs-0 .menu-create").click()
        selenium.find_element_by_css_selector(
            ".create-dropdown.active a:last-child"
        ).click()
        time.sleep(0.5)
        selenium.find_element_by_css_selector(
            "#popup-container a[href='#tabs-2']"
        ).click()
        selenium.find_elements_by_css_selector(
            "#popup-container #tabs-2 .workflow-for-menu"
        )[2].click()
        selenium.find_element_by_css_selector("#set-linked-workflow").click()
        time.sleep(1)
        assert (
            len(
                selenium.find_elements_by_css_selector(
                    "#tabs-0 .workflow-title"
                )
            )
            == 3
        )
        assert (
            len(
                selenium.find_elements_by_css_selector(
                    "#tabs-1 .workflow-title"
                )
            )
            == 1
        )
        assert (
            len(
                selenium.find_elements_by_css_selector(
                    "#tabs-2 .workflow-title"
                )
            )
            == 1
        )
        assert (
            len(
                selenium.find_elements_by_css_selector(
                    "#tabs-3 .workflow-title"
                )
            )
            == 1
        )

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
                project=my_project,
            )

    def test_workflow_read_only(self):
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
                len(selenium.find_elements_by_css_selector(".action-button")),
                0,
            )
            selenium.find_elements_by_css_selector(".week")[0].click()
            time.sleep(0.3)
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        "#edit-menu .right-panel-inner"
                    )
                ),
                0,
            )

    def test_workflow_editing(self):
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
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .column"
                    )
                ),
                num_columns,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .week"
                    )
                ),
                num_weeks,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node"
                    )
                ),
                num_nodes,
            )
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .column"
            )
            click_item = selenium.find_element_by_css_selector(
                ".column .insert-sibling-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            time.sleep(0.5)
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .week"
            )
            click_item = selenium.find_element_by_css_selector(
                ".week .insert-sibling-button img"
            )
            selenium.find_element_by_css_selector(
                "#sidebar .window-close-button"
            ).click()
            time.sleep(0.5)
            action_hover_click(selenium, hover_item, click_item).perform()
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .node"
            )
            click_item = selenium.find_element_by_css_selector(
                ".node .insert-sibling-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            time.sleep(8)
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .column"
                    )
                ),
                num_columns + 1,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .week"
                    )
                ),
                num_weeks + 1,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node"
                    )
                ),
                num_nodes + 1,
            )
            # Deleting
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .node"
            )
            click_item = selenium.find_element_by_css_selector(
                ".node .delete-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(1)
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .column"
            )
            click_item = selenium.find_element_by_css_selector(
                ".column .delete-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(1)
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .week"
            )
            click_item = selenium.find_element_by_css_selector(
                ".week .delete-self-button img"
            )
            #            selenium.find_element_by_css_selector(
            #                "#sidebar .window-close-button"
            #            ).click()
            time.sleep(0.5)
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(1)
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .column"
                    )
                ),
                num_columns,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .week"
                    )
                ),
                num_weeks,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node"
                    )
                ),
                0,
            )

    def test_workflow_duplication(self):
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
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .column"
                    )
                ),
                num_columns,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .week"
                    )
                ),
                num_weeks,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node"
                    )
                ),
                num_nodes,
            )
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .column"
            )
            click_item = selenium.find_element_by_css_selector(
                ".column .duplicate-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            time.sleep(1)
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .week"
            )
            click_item = selenium.find_element_by_css_selector(
                ".week > .mouseover-container-bypass > .mouseover-actions > .duplicate-self-button img"
            )
            selenium.find_element_by_css_selector(
                "#sidebar .window-close-button"
            ).click()
            time.sleep(0.5)
            action_hover_click(selenium, hover_item, click_item).perform()
            time.sleep(1)
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .node"
            )
            click_item = selenium.find_element_by_css_selector(
                ".node .duplicate-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            time.sleep(1)
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .column"
                    )
                ),
                num_columns + 1,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .week"
                    )
                ),
                num_weeks + 1,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node"
                    )
                ),
                num_nodes * 2 + 1,
            )

    def test_outcome_editing(self):
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
        time.sleep(2)
        selenium.find_element_by_css_selector("a[href='#outcome-bar']").click()
        selenium.find_element_by_css_selector("#edit-outcomes-button").click()
        time.sleep(1)
        hover_item = selenium.find_element_by_css_selector(
            ".workflow-details .outcome"
        )
        click_item = selenium.find_element_by_css_selector(
            ".outcome .insert-child-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)

        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".workflow-details .outcome .outcome"
                )
            ),
            1,
        )
        self.assertEqual(
            OutcomeOutcome.objects.filter(parent=base_outcome).count(), 1
        )
        hover_item = selenium.find_element_by_css_selector(
            ".workflow-details .outcome .outcome"
        )
        click_item = selenium.find_element_by_css_selector(
            ".outcome .outcome .insert-sibling-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)
        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".workflow-details .outcome .outcome"
                )
            ),
            2,
        )
        self.assertEqual(
            OutcomeOutcome.objects.filter(parent=base_outcome).count(), 2
        )
        hover_item = selenium.find_element_by_css_selector(
            ".workflow-details .outcome .outcome"
        )
        click_item = selenium.find_element_by_css_selector(
            ".outcome .outcome .delete-self-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(2)
        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".workflow-details .outcome .outcome"
                )
            ),
            1,
        )
        # Make sure item has only been soft deleted
        self.assertEqual(
            OutcomeOutcome.objects.filter(parent=base_outcome).count(), 2
        )
        selenium.find_element_by_css_selector(
            ".children-block:not(:empty)+.outcome-create-child"
        ).click()
        time.sleep(2)
        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".workflow-details .outcome .outcome"
                )
            ),
            2,
        )
        hover_item = selenium.find_element_by_css_selector(
            ".workflow-details .outcome .outcome"
        )
        click_item = selenium.find_element_by_css_selector(
            ".outcome .outcome .duplicate-self-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)
        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".workflow-details .outcome .outcome"
                )
            ),
            3,
        )
        self.assertEqual(
            OutcomeOutcome.objects.filter(parent=base_outcome).count(), 2
        )
        selenium.find_element_by_css_selector("#add-new-outcome").click()
        time.sleep(3)
        self.assertEqual(Outcome.objects.filter(depth=0).count(), 2)
        self.assertEqual(
            OutcomeWorkflow.objects.filter(workflow=workflow).count(), 2
        )
        hover_item = selenium.find_element_by_css_selector(
            ".workflow-details .outcome-workflow > .outcome"
        )
        click_item = selenium.find_element_by_css_selector(
            ".workflow-details .outcome-workflow > .outcome > .mouseover-actions .insert-sibling-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)

        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".workflow-details .outcome-workflow"
                )
            ),
            3,
        )
        self.assertEqual(
            OutcomeWorkflow.objects.filter(workflow=workflow).count(), 3
        )
        hover_item = selenium.find_element_by_css_selector(
            ".workflow-details .outcome-workflow > .outcome"
        )
        click_item = selenium.find_element_by_css_selector(
            ".workflow-details .outcome-workflow > .outcome > .mouseover-actions .duplicate-self-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(2)

        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".workflow-details .outcome-workflow"
                )
            ),
            4,
        )
        self.assertEqual(
            OutcomeWorkflow.objects.filter(workflow=workflow).count(), 4
        )

    def test_edit_menu(self):
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
            selenium.find_element_by_css_selector(
                ".workflow-details .node"
            ).click()
            time.sleep(1)
            title = selenium.find_element_by_id("title-editor")
            assert "test node" in title.get_attribute("value")
            title.clear()
            title.send_keys("new title")
            time.sleep(2.5)
            assert (
                "new title"
                in selenium.find_element_by_css_selector(
                    ".workflow-details .node .node-title"
                ).text
            )
            self.assertEqual(
                workflow.weeks.first().nodes.first().title, "new title"
            )
            if i < 2:
                context = selenium.find_element_by_id("context-editor")
                context.click()
                selenium.find_elements_by_css_selector(
                    "#context-editor option"
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
                        selenium.find_elements_by_css_selector(
                            "#context-editor"
                        )
                    ),
                    0,
                )
            if i < 2:
                context = selenium.find_element_by_id("task-editor")
                context.click()
                selenium.find_elements_by_css_selector("#task-editor option")[
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
                        selenium.find_elements_by_css_selector("#task-editor")
                    ),
                    0,
                )

    def test_project_return(self):
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
            selenium.find_element_by_id("project-return").click()
            assert (
                "project title"
                in selenium.find_element_by_css_selector(
                    "#workflowtitle div"
                ).text
            )

    def test_strategy_convert(self):
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
            time.sleep(2)
            selenium.find_element_by_css_selector(
                ".workflow-details .week"
            ).click()
            time.sleep(1)
            title = selenium.find_element_by_id("title-editor").send_keys(
                "new strategy"
            )
            time.sleep(2.5)
            selenium.find_element_by_id("toggle-strategy-editor").click()
            time.sleep(4)
            selenium.find_element_by_css_selector(
                "a[href='#strategy-bar']"
            ).click()
            assert (
                "new strategy"
                in selenium.find_element_by_css_selector(
                    ".strategy-bar-strategy div"
                ).text
            )
            selenium.get(
                self.live_server_url + reverse("course_flow:my-templates")
            )
            selenium.find_element_by_css_selector(
                "a[href='#tabs-" + str(i) + "']"
            ).click()
            selenium.find_element_by_css_selector(".workflow-title").click()
            time.sleep(2)
            assert (
                "new strategy"
                in selenium.find_element_by_css_selector(
                    "#workflowtitle a"
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

    def test_outcome_view(self):
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
            selenium.find_element_by_css_selector(".other-views").click()
            selenium.find_element_by_css_selector(
                "#button_outcometable"
            ).click()
            time.sleep(1)
            base_outcome_row_select = ".outcome-table > div > .outcome > .outcome-row > .outcome-cells"
            outcome1_row_select = ".outcome .outcome-outcome:first-of-type .outcome > .outcome-row"
            outcome2_row_select = ".outcome .outcome-outcome+.outcome-outcome .outcome > .outcome-row"
            base_cell = (
                base_outcome_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell"
            )
            base_cell2 = (
                base_outcome_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell"
            )
            base_input = (
                base_outcome_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell input"
            )
            base_input2 = (
                base_outcome_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell input"
            )
            base_img = (
                base_outcome_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell img"
            )
            base_img2 = (
                base_outcome_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell img"
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
                selenium.find_element_by_css_selector(base_cell),
                selenium.find_element_by_css_selector(base_input),
            )
            outcome1_cell = (
                outcome1_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell"
            )
            outcome1_cell2 = (
                outcome1_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell"
            )
            outcome1_input = (
                outcome1_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell input"
            )
            outcome1_input2 = (
                outcome1_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell input"
            )
            outcome1_img = (
                outcome1_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell img"
            )
            outcome1_img2 = (
                outcome1_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell img"
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
                selenium.find_element_by_css_selector(outcome1_cell),
                selenium.find_element_by_css_selector(outcome1_input),
            )
            outcome2_cell = (
                outcome2_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell"
            )
            outcome2_cell2 = (
                outcome2_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell"
            )
            outcome2_input = (
                outcome2_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell input"
            )
            outcome2_input2 = (
                outcome2_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell input"
            )
            outcome2_img = (
                outcome2_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell img"
            )
            outcome2_img2 = (
                outcome2_row_select
                + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell img"
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
                selenium.find_element_by_css_selector(outcome2_cell),
                selenium.find_element_by_css_selector(outcome2_input),
            )

            def assert_image(element_string, string):
                assert string in selenium.find_element_by_css_selector(
                    element_string
                ).get_attribute("src")

            def assert_no_image(element_string):
                self.assertEqual(
                    len(
                        selenium.find_elements_by_css_selector(element_string)
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
                selenium.find_element_by_css_selector(outcome2_cell2),
                selenium.find_element_by_css_selector(outcome2_input2),
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

    def test_horizontal_outcome_view(self):
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
        OutcomeOutcome.objects.create(
            parent=base_outcome,
            child=Outcome.objects.create(author=self.user),
        )
        OutcomeOutcome.objects.create(
            parent=base_outcome,
            child=Outcome.objects.create(author=self.user),
        )
        course.outcomes.create(author=self.user)
        course.outcomes.create(author=self.user)
        node = program.weeks.first().nodes.create(
            author=self.user,
            linked_workflow=course,
            column=program.columns.first(),
        )
        response = self.client.post(
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": base_outcome.id, "degree": 1},
        )

        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[program.pk])
        )
        time.sleep(2)
        selenium.find_element_by_css_selector(
            "#sidebar .window-close-button"
        ).click()
        time.sleep(0.5)
        selenium.find_element_by_css_selector(".other-views").click()
        selenium.find_element_by_css_selector(
            "#button_horizontaloutcometable"
        ).click()
        time.sleep(5)
        base_outcome_row_select = (
            ".outcome-table > div > .outcome > .outcome-row > .outcome-cells"
        )
        outcome1_row_select = (
            ".outcome .outcome-outcome:first-of-type .outcome > .outcome-row"
        )
        outcome2_row_select = ".outcome .outcome-outcome+.outcome-outcome .outcome > .outcome-row"
        base_cell = (
            base_outcome_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell"
        )
        base_cell2 = (
            base_outcome_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell"
        )
        base_input = (
            base_outcome_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell input"
        )
        base_input2 = (
            base_outcome_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell input"
        )
        base_img = (
            base_outcome_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell img"
        )
        base_img2 = (
            base_outcome_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell img"
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
            selenium.find_element_by_css_selector(base_cell),
            selenium.find_element_by_css_selector(base_input),
        )
        outcome1_cell = (
            outcome1_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell"
        )
        outcome1_cell2 = (
            outcome1_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell"
        )
        outcome1_input = (
            outcome1_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell input"
        )
        outcome1_input2 = (
            outcome1_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell input"
        )
        outcome1_img = (
            outcome1_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell img"
        )
        outcome1_img2 = (
            outcome1_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell img"
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
            selenium.find_element_by_css_selector(outcome1_cell),
            selenium.find_element_by_css_selector(outcome1_input),
        )
        outcome2_cell = (
            outcome2_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell"
        )
        outcome2_cell2 = (
            outcome2_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell"
        )
        outcome2_input = (
            outcome2_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell input"
        )
        outcome2_input2 = (
            outcome2_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell input"
        )
        outcome2_img = (
            outcome2_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell img"
        )
        outcome2_img2 = (
            outcome2_row_select
            + " .table-group:first-of-type .blank-cell+.table-cell+.table-cell img"
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
            selenium.find_element_by_css_selector(outcome2_cell),
            selenium.find_element_by_css_selector(outcome2_input),
        )

        def assert_image(element_string, string):
            assert string in selenium.find_element_by_css_selector(
                element_string
            ).get_attribute("src")

        def assert_no_image(element_string):
            self.assertEqual(
                len(selenium.find_elements_by_css_selector(element_string)), 0,
            )

        # Toggle the base outcome. Check to make sure the children and totals columns behave as expected
        base_toggle.perform()
        time.sleep(4)
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
        time.sleep(4)
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
            selenium.find_element_by_css_selector(outcome2_cell2),
            selenium.find_element_by_css_selector(outcome2_input2),
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
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": base_outcome.id, "degree": 1},
        )

        OutcomeHorizontalLink.objects.create(
            outcome=coc1, parent_outcome=poo1.child
        )
        OutcomeHorizontalLink.objects.create(
            outcome=coc2, parent_outcome=poo2.child
        )

        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[program.pk])
        )
        time.sleep(2)
        selenium.find_element_by_css_selector(".other-views").click()
        selenium.find_element_by_css_selector(
            "#button_alignmentanalysis"
        ).click()
        time.sleep(5)

        assert (
            selenium.find_element_by_css_selector(".week .title-text").text
            == "Term 1"
        )
        assert len(selenium.find_elements_by_css_selector(".week .node")) == 1
        assert (
            len(
                selenium.find_elements_by_css_selector(
                    ".week .node .child-outcome"
                )
            )
            == 2
        )
        assert (
            len(
                selenium.find_elements_by_css_selector(
                    ".week .node .child-outcome .half-width>.outcome"
                )
            )
            == 2
        )
        assert (
            len(
                selenium.find_elements_by_css_selector(
                    ".week .node .child-outcome .alignment-row .outcome"
                )
            )
            == 2
        )

    def test_outcome_matrix_view(self):
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
            reverse("course_flow:update-outcomenode-degree"),
            {"nodePk": node.id, "outcomePk": base_outcome.id, "degree": 1},
        )

        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[program.pk])
        )
        time.sleep(2)
        selenium.find_element_by_css_selector(".other-views").click()
        selenium.find_element_by_css_selector(
            "#button_competencymatrix"
        ).click()
        time.sleep(1)

    def test_grid_view(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(
            author=self.user, title="project title"
        )
        program = Program.objects.create(author=self.user)
        WorkflowProject.objects.create(workflow=program, project=project)
        node = program.weeks.first().nodes.create(
            author=self.user, column=program.columns.first(),
        )

        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[program.pk])
        )
        time.sleep(2)
        selenium.find_element_by_css_selector(".other-views").click()
        selenium.find_element_by_css_selector("#button_grid").click()
        time.sleep(1)
        assert (
            len(selenium.find_elements_by_css_selector(".workflow-grid")) > 0
        )

    def test_linked_workflow(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(
            author=self.user, title="project title"
        )
        workflow_types = ["activity", "course", "program"]
        for i, workflow_type in enumerate(workflow_types):
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

            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            this_url = selenium.current_url
            if workflow_type == "activity":
                continue
            selenium.find_element_by_css_selector(
                ".workflow-details .node .node-title"
            ).click()
            time.sleep(2)
            selenium.find_element_by_id("linked-workflow-editor").click()
            time.sleep(2)
            selenium.find_element_by_css_selector(
                ".section-" + workflow_types[i - 1] + " .workflow-for-menu"
            ).click()
            selenium.find_element_by_id("set-linked-workflow").click()
            time.sleep(1)
            self.assertEqual(
                workflow.weeks.first().nodes.first().linked_workflow.id,
                get_model_from_str(workflow_types[i - 1]).objects.first().id,
            )
            ActionChains(selenium).double_click(
                selenium.find_element_by_css_selector(
                    ".workflow-details .node"
                )
            ).perform()
            time.sleep(2)
            assert (
                workflow_types[i - 1]
                in selenium.find_element_by_css_selector(
                    "#workflowtitle a"
                ).text
            )
            selenium.get(this_url)
            time.sleep(2)
            selenium.find_element_by_css_selector(
                ".workflow-details .node .node-title"
            ).click()
            selenium.find_element_by_id("linked-workflow-editor").click()
            time.sleep(2)
            selenium.find_element_by_css_selector(
                ".section-" + workflow_types[i - 1] + " .workflow-for-menu"
            ).click()
            selenium.find_element_by_id("set-linked-workflow-none").click()
            time.sleep(2)
            self.assertEqual(
                workflow.weeks.first().nodes.first().linked_workflow, None
            )
            ActionChains(selenium).double_click(
                selenium.find_element_by_css_selector(
                    ".workflow-details .node"
                )
            ).perform()
            assert (
                workflow_type
                in selenium.find_element_by_css_selector(
                    "#workflowtitle a"
                ).text
            )

    def create_many_items(self, author, published, disciplines):
        for object_type in [
            "project",
            "activity",
            "course",
            "program",
        ]:
            for i in range(10):
                item = get_model_from_str(object_type).objects.create(
                    author=author,
                    published=published,
                    title=object_type + str(i),
                )
                item.disciplines.set(disciplines)

    def test_explore(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        discipline = Discipline.objects.create(title="Discipline1")
        self.create_many_items(author, True, disciplines=[discipline])
        selenium.get(self.live_server_url + reverse("course_flow:explore"))
        for checkbox in selenium.find_elements_by_css_selector(
            "#search-type input[type='checkbox']"
        ):
            checkbox.click()
        selenium.find_element_by_id("submit").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 4
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 10
        )
        selenium.find_elements_by_css_selector(".page-button")[2].click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 4
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 10
        )
        assert "active" in selenium.find_elements_by_css_selector(
            ".page-button"
        )[2].get_attribute("class")
        selenium.find_element_by_css_selector("#next-page-button").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 4
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 10
        )
        assert "active" in selenium.find_elements_by_css_selector(
            ".page-button"
        )[3].get_attribute("class")
        selenium.find_element_by_css_selector("#prev-page-button").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 4
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 10
        )
        assert "active" in selenium.find_elements_by_css_selector(
            ".page-button"
        )[2].get_attribute("class")
        for checkbox in selenium.find_elements_by_css_selector(
            "#search-discipline input[type='checkbox']"
        ):
            checkbox.click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 10
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 4
        )
        selenium.find_element_by_css_selector("select[name='results']").click()
        time.sleep(0.5)
        selenium.find_elements_by_css_selector(
            "select[name='results'] option"
        )[1].click()
        time.sleep(0.5)
        selenium.find_element_by_id("submit").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 20
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 2
        )
        selenium.find_element_by_css_selector("select[name='results']").click()
        selenium.find_elements_by_css_selector(
            "select[name='results'] option"
        )[2].click()
        selenium.find_element_by_id("submit").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 40
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 1
        )
        selenium.find_element_by_id("search-title").send_keys("1")
        selenium.find_element_by_id("submit").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 4
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 1
        )
        for button in selenium.find_elements_by_css_selector(
            ".workflow-toggle-favourite"
        ):
            button.click()
        time.sleep(3)
        self.assertEqual(
            Favourite.objects.filter(
                user=self.user,
                content_type=ContentType.objects.get_for_model(Project),
            ).count(),
            1,
        )
        self.assertEqual(
            Favourite.objects.filter(
                user=self.user,
                content_type=ContentType.objects.get_for_model(Activity),
            ).count(),
            1,
        )
        self.assertEqual(
            Favourite.objects.filter(
                user=self.user,
                content_type=ContentType.objects.get_for_model(Course),
            ).count(),
            1,
        )
        self.assertEqual(
            Favourite.objects.filter(
                user=self.user,
                content_type=ContentType.objects.get_for_model(Program),
            ).count(),
            1,
        )
        selenium.find_element_by_css_selector("select[name='results']").click()
        selenium.find_elements_by_css_selector(
            "select[name='results'] option"
        )[0].click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 4
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 1
        )

    def test_explore_no_publish(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        discipline = Discipline.objects.create(title="Discipline1")
        self.create_many_items(author, False, disciplines=[discipline])
        selenium.get(self.live_server_url + reverse("course_flow:explore"))
        for checkbox in selenium.find_elements_by_css_selector(
            "#search-type input[type='checkbox']"
        ):
            checkbox.click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 0
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 0
        )

    def test_explore_disciplines(self):
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
        for checkbox in selenium.find_elements_by_css_selector(
            "#search-type input[type='checkbox']"
        ):
            checkbox.click()
        selenium.find_element_by_id("submit").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 12
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 10
        )
        selenium.find_elements_by_css_selector(
            "#search-discipline input[type='checkbox']"
        )[0].click()
        selenium.find_element_by_id("submit").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 8
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 10
        )
        selenium.find_elements_by_css_selector(
            "#search-discipline input[type='checkbox']"
        )[0].click()
        selenium.find_elements_by_css_selector(
            "#search-discipline input[type='checkbox']"
        )[1].click()
        selenium.find_element_by_id("submit").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 8
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 10
        )
        selenium.find_elements_by_css_selector(
            "#search-discipline input[type='checkbox']"
        )[0].click()
        selenium.find_element_by_id("submit").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 12
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 10
        )

    def test_share_edit_view(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        user2 = get_author()
        project = Project.objects.create(author=self.user)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )
        selenium.find_element_by_id("share-button").click()
        inputs = selenium.find_elements_by_css_selector(".user-add input")
        adds = selenium.find_elements_by_css_selector(".user-add button")
        inputs[0].send_keys("testuser2")
        time.sleep(2)
        selenium.find_elements_by_css_selector(".ui-autocomplete li")[
            0
        ].click()
        adds[0].click()
        time.sleep(1)
        self.assertEqual(
            ObjectPermission.objects.filter(
                user=user2,
                permission_type=ObjectPermission.PERMISSION_EDIT,
                content_type=ContentType.objects.get_for_model(project),
                object_id=project.id,
            ).count(),
            1,
        )
        self.assertEqual(
            ObjectPermission.objects.filter(
                user=user2,
                permission_type=ObjectPermission.PERMISSION_VIEW,
                content_type=ContentType.objects.get_for_model(project),
                object_id=project.id,
            ).count(),
            0,
        )
        inputs[1].send_keys("testuser2")
        time.sleep(2)
        selenium.find_elements_by_css_selector(".ui-autocomplete li")[
            1
        ].click()
        adds[1].click()
        time.sleep(1)
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
                permission_type=ObjectPermission.PERMISSION_VIEW,
                content_type=ContentType.objects.get_for_model(project),
                object_id=project.id,
            ).count(),
            1,
        )
        selenium.find_element_by_css_selector(
            ".user-label .window-close-button"
        ).click()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(2)
        self.assertEqual(
            ObjectPermission.objects.filter(
                user=user2,
                content_type=ContentType.objects.get_for_model(project),
                object_id=project.id,
            ).count(),
            0,
        )
        selenium.find_element_by_css_selector(
            ".message-wrap > .window-close-button"
        ).click()
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".message-wrap")), 0
        )

        
class SeleniumDeleteRestoreTestCase(SeleniumWorkflowsTestCase):
    def test_delete_restore_column(self):
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
            
            #Delete a column
            column_id = workflow.columns.first().id
            
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node.column-"+str(column_id)
                    )
                ),
                1,
            )
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .column"
            )
            click_item = selenium.find_element_by_css_selector(
                ".column .delete-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(2)
            column2_id = workflow.columns.filter(deleted=False).first().id
            
            #Make sure all nodes have been moved to the first column
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node.column-"+str(column2_id)
                    )
                ),
                1,
            )
            
            #Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node.column-"+str(column2_id)
                    )
                ),
                1,
            )
            
            #Restore the column
            selenium.find_element_by_css_selector("a[href='#restore-bar'] img").click()
            selenium.find_element_by_css_selector("#restore-bar-workflow .node-bar-column-block button").click()
            time.sleep(2)
            
            #Make sure all nodes have been moved back to the restored column
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node.column-"+str(column_id)
                    )
                ),
                1,
            )
            
            #Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node.column-"+str(column_id)
                    )
                ),
                1,
            )
            
    def test_delete_restore_node(self):
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
            
            #Delete a node
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node"
                    )
                ),
                1,
            )
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .node"
            )
            click_item = selenium.find_element_by_css_selector(
                ".node .delete-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(2)
            
            #Make sure the node has vanished
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node"
                    )
                ),
                0,
            )
            
            #Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node"
                    )
                ),
                0,
            )
            
            #Restore the node
            selenium.find_element_by_css_selector("a[href='#restore-bar'] img").click()
            selenium.find_element_by_css_selector("#restore-bar-workflow .node-bar-column-block button").click()
            time.sleep(2)
            
            #Make sure the node was restored
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node"
                    )
                ),
                1,
            )
            
            #Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".workflow-details .node"
                    )
                ),
                1,
            ) 
            
    def test_delete_restore_outcome(self):
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
            child1 = workflow.outcomes.first().children.create(author=self.user,depth=1)
            child2 = workflow.outcomes.first().children.create(author=self.user,depth=1)
            OutcomeNode.objects.create(node=node1,outcome=child1)
            OutcomeNode.objects.create(node=node2,outcome=outcome)
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(3)
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".outcome-node .outcome-"+str(outcome.id)
                    )
                ),
                1,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".outcome-node .outcome-"+str(child1.id)
                    )
                ),
                2,
            )
            
            
            selenium.find_element_by_css_selector("#button_outcomeedit").click()
            time.sleep(3)
            
            #Delete the parent outcome
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .outcome-workflow>.outcome"
            )
            click_item = selenium.find_element_by_css_selector(
                ".outcome-workflow>.outcome>.mouseover-actions .delete-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(2)
            selenium.find_element_by_css_selector("#button_workflowview").click()
            
            #Make sure the outcomenodes have vanished
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".outcome-node .outcome-"+str(outcome.id)
                    )
                ),
                0,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".outcome-node .outcome-"+str(child1.id)
                    )
                ),
                0,
            )
            
            #Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".outcome-node .outcome-"+str(outcome.id)
                    )
                ),
                0,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".outcome-node .outcome-"+str(child1.id)
                    )
                ),
                0,
            )
            
            #Restore the outcome
            selenium.find_element_by_css_selector("a[href='#restore-bar'] img").click()
            selenium.find_element_by_css_selector("#restore-bar-workflow .node-bar-column-block button").click()
            time.sleep(2)
            
            #Make sure the outcome was restored
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".outcome-node .outcome-"+str(outcome.id)
                    )
                ),
                1,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".outcome-node .outcome-"+str(child1.id)
                    )
                ),
                2,
            )
            
            #Refresh, and make sure the change is permanent
            selenium.get(
                self.live_server_url
                + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            time.sleep(2)
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".outcome-node .outcome-"+str(outcome.id)
                    )
                ),
                1,
            )
            self.assertEqual(
                len(
                    selenium.find_elements_by_css_selector(
                        ".outcome-node .outcome-"+str(child1.id)
                    )
                ),
                2,
            )
            
    def test_delete_restore_workflow(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        course = Course.objects.create(author=self.user)
        program=Program.objects.create(author=self.user)
        WorkflowProject.objects.create(workflow=course,project=project)
        WorkflowProject.objects.create(workflow=program,project=project)
        program.weeks.first().nodes.create(author=self.user,column=program.columns.first(),node_type=2)
        Favourite.objects.create(user=self.user,content_object=course)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )
        
        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".panel-favourite"
                )
            ),
            2,
        )
        
        #delete a workflow
        time.sleep(2)
        selenium.find_element_by_css_selector(".course .workflow-delete-button").click()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(2)
        
        #make sure it doesn't show up in favourites
        
        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".panel-favourite"
                )
            ),
            1,
        )
        selenium.find_element_by_css_selector("a[href='/myfavourites/']").click()
        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".workflow-for-menu"
                )
            ),
            0,
        )
        
        #make sure it doesn't show up in linked wf
        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[program.pk])
        )
        time.sleep(2)
        selenium.find_element_by_css_selector(".workflow-details .node .node-title").click()
        time.sleep(1)
        selenium.find_element_by_css_selector("#linked-workflow-editor").click()
        time.sleep(3)
        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".message-wrap .workflow-for-menu"
                )
            ),
            0,
        )
        
        #Restore 
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )
        time.sleep(1)
        selenium.find_element_by_css_selector("a[href='#tabs-4']").click()
        selenium.find_element_by_css_selector(".course .workflow-delete-button").click()
        time.sleep(2)
        #make sure shows up in favourites
        
        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".panel-favourite"
                )
            ),
            2,
        )
        selenium.find_element_by_css_selector("a[href='/myfavourites/']").click()
        time.sleep(10)
        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".workflow-for-menu"
                )
            ),
            2,
        )
        
        #make sure it shows up in linked wf
        selenium.get(
            self.live_server_url
            + reverse("course_flow:workflow-update", args=[program.pk])
        )
        time.sleep(2)
        selenium.find_element_by_css_selector(".workflow-details .node .node-title").click()
        time.sleep(1)
        selenium.find_element_by_css_selector("#linked-workflow-editor").click()
        time.sleep(3)
        self.assertEqual(
            len(
                selenium.find_elements_by_css_selector(
                    ".message-wrap .workflow-for-menu"
                )
            ),
            1,
        )
        
        
        
    def test_explore_deleted(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        discipline = Discipline.objects.create(title="Discipline1")
        self.create_many_items(author, True, disciplines=[discipline])
        project_list = list(Project.objects.all().values_list("pk",flat=True))
        activity_list = list(Activity.objects.all().values_list("pk",flat=True))
        course_list = list(Course.objects.all().values_list("pk",flat=True))
        program_list = list(Program.objects.all().values_list("pk",flat=True))
        for i,project in enumerate(project_list):
            WorkflowProject.objects.create(project=Project.objects.get(id=project_list[i]),workflow=Workflow.objects.get(id=activity_list[i]))
            WorkflowProject.objects.create(project=Project.objects.get(id=project_list[i]),workflow=Workflow.objects.get(id=course_list[i]))
            WorkflowProject.objects.create(project=Project.objects.get(id=project_list[i]),workflow=Workflow.objects.get(id=program_list[i]))
        Workflow.objects.all().update(deleted=True)
        #make deleted workflows don't show up in explore
        selenium.get(self.live_server_url + reverse("course_flow:explore"))
        for checkbox in selenium.find_elements_by_css_selector(
            "#search-type input[type='checkbox']"
        ):
            checkbox.click()
        selenium.find_element_by_id("submit").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 1
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 10
        )
        Project.objects.all().update(deleted=True)
        #make deleted projects don't show up in explore
        selenium.get(self.live_server_url + reverse("course_flow:explore"))
        for checkbox in selenium.find_elements_by_css_selector(
            "#search-type input[type='checkbox']"
        ):
            checkbox.click()
        selenium.find_element_by_id("submit").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 0
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 0
        )
        Workflow.objects.all().update(deleted=False)
        #make workflows from deleted projects don't show up in explore
        selenium.get(self.live_server_url + reverse("course_flow:explore"))
        for checkbox in selenium.find_elements_by_css_selector(
            "#search-type input[type='checkbox']"
        ):
            checkbox.click()
        selenium.find_element_by_id("submit").click()
        time.sleep(1)
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".page-button")), 0
        )
        self.assertEqual(
            len(selenium.find_elements_by_css_selector(".workflow-title")), 0
        )
        
    
    
    
    