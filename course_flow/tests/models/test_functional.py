import time

from django.conf import settings
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.test import tag
from django.urls import reverse
from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions
from selenium.webdriver.support.ui import WebDriverWait

from course_flow.models import (
    Activity,
    Course,
    Outcome,
    OutcomeOutcome,
    OutcomeProject,
    Program,
    Project,
    Workflow,
    WorkflowProject,
)
from course_flow.utils import get_model_from_str

from .utils import get_author, login

timeout = 10


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


@tag("selenium")
class SeleniumWorkflowsTestCase(StaticLiveServerTestCase):
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

    def test_create_project_and_workflows(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        selenium.get(self.live_server_url + "/home/")
        home = selenium.current_url
        for project_type in ["activity", "course", "project"]:
            if project_type == "project":
                selenium.find_element_by_css_selector(
                    "a[href='#tabs-0']"
                ).click()
            else:
                selenium.find_element_by_css_selector(
                    "a[href='#tabs-1']"
                ).click()
            selenium.find_elements_by_class_name(
                "create-button-" + project_type
            )[0].click()
            title = selenium.find_element_by_id("id_title")
            description = selenium.find_element_by_id("id_description")
            project_title = "test project title"
            project_description = "test project description"
            title.send_keys(project_title)
            description.send_keys(project_description)
            selenium.find_element_by_id("save-button").click()
            if project_type == "project":
                assert (
                    project_title
                    in selenium.find_element_by_id("project-title").text
                )
                assert (
                    project_description
                    in selenium.find_element_by_id("project-description").text
                )
                project_url = selenium.current_url
            else:
                assert (
                    project_title
                    in selenium.find_element_by_class_name(
                        "workflow-title"
                    ).text
                )
                assert (
                    project_description
                    in selenium.find_element_by_class_name(
                        "workflow-description"
                    ).text
                )

            selenium.get(home)
        selenium.get(project_url)

        for workflow_type in ["activity", "course", "program", "outcome"]:
            # Create the workflow
            selenium.find_elements_by_class_name(
                "create-button-" + workflow_type
            )[0].click()
            title = selenium.find_element_by_id("id_title")
            if workflow_type != "outcome":
                description = selenium.find_element_by_id("id_description")
            project_title = "test " + workflow_type + " title"
            project_description = "test " + workflow_type + " description"
            title.send_keys(project_title)
            if workflow_type != "outcome":
                description.send_keys(project_description)
            selenium.find_element_by_id("save-button").click()
            assert (
                project_title
                in selenium.find_element_by_class_name("workflow-title").text
            )
            if workflow_type != "outcome":
                assert (
                    project_description
                    in selenium.find_element_by_class_name(
                        "workflow-description"
                    ).text
                )
            selenium.get(project_url)
            # edit link
            selenium.find_element_by_css_selector(
                ".section-" + workflow_type + " .workflow-edit-button"
            ).click()
            assert (
                project_title
                in selenium.find_element_by_class_name("workflow-title").text
            )
            selenium.get(project_url)
            selenium.find_element_by_css_selector(
                ".section-" + workflow_type + " .workflow-duplicate-button"
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
                    ".section-" + workflow_type + " .workflow-title"
                )[1].text
            )
            if workflow_type != "outcome":
                self.assertEqual(
                    get_model_from_str(workflow_type)
                    .objects.exclude(parent_workflow=None)
                    .count(),
                    1,
                )
            else:
                self.assertEqual(
                    get_model_from_str(workflow_type)
                    .objects.exclude(parent_outcome=None)
                    .count(),
                    1,
                )
            selenium.find_elements_by_css_selector(
                ".section-" + workflow_type + " .workflow-delete-button"
            )[0].click()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(2)

            if workflow_type == "outcome":
                self.assertEqual(
                    get_model_from_str(workflow_type).objects.count(), 1
                )
            else:
                self.assertEqual(
                    get_model_from_str(workflow_type)
                    .objects.filter(is_strategy=False)
                    .count(),
                    1,
                )

    def test_edit_project_details(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=str(project.pk))
        )
        selenium.find_element_by_id("edit-project-button").click()
        selenium.find_element_by_id("project-title-input").send_keys(
            "new title"
        )
        selenium.find_element_by_id("project-description-input").send_keys(
            "new description"
        )
        selenium.find_element_by_id("project-publish-input").click()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(1)
        selenium.find_element_by_id("save-changes").click()
        assert "new title" in selenium.find_element_by_id("project-title").text
        assert (
            "new description"
            in selenium.find_element_by_id("project-description").text
        )
        project = Project.objects.first()
        self.assertEqual(project.title, "new title")
        self.assertEqual(project.description, "new description")
        self.assertEqual(project.published, True)

    def test_import_published(self):
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
        OutcomeProject.objects.create(
            outcome=Outcome.objects.create(author=author, published=True),
            project=project,
        )
        selenium.get(self.live_server_url + reverse("course_flow:home"))
        home = selenium.current_url
        selenium.find_element_by_css_selector("a[href='#tabs-2']").click()
        selenium.find_element_by_css_selector(
            ".section-project .workflow-view-button"
        ).click()
        assert (
            "published project"
            in selenium.find_element_by_id("project-title").text
        )
        project_url = selenium.current_url
        for workflow_type in ["activity", "course", "program", "outcome"]:
            selenium.find_element_by_css_selector(
                ".section-" + workflow_type + " .workflow-view-button"
            ).click()
            self.assertTrue(
                len(selenium.find_elements_by_css_selector(".workflow-title"))
            )
            selenium.get(project_url)
        selenium.get(home)
        selenium.find_element_by_css_selector("a[href='#tabs-2']").click()
        selenium.find_element_by_css_selector(
            ".section-project .workflow-duplicate-button"
        ).click()
        selenium.find_element_by_css_selector("a[href='#tabs-0']").click()
        selenium.find_element_by_css_selector(
            ".section-project .workflow-edit-button"
        ).click()
        assert (
            "published project"
            in selenium.find_element_by_id("project-title").text
        )
        selenium.get(home)
        self.assertEqual(
            Project.objects.get(author=self.user).title, "published project"
        )
        Project.objects.get(author=self.user).delete()

        my_project = Project.objects.create(
            author=self.user, published=True, title="project to be filled"
        )
        selenium.get(home)

        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=str(my_project.pk))
        )
        selenium.find_element_by_css_selector("a[href='#tabs-2']").click()

        for workflow_type in ["activity", "course", "program", "outcome"]:
            selenium.find_element_by_css_selector(
                ".section-" + workflow_type + " .workflow-duplicate-button"
            ).click()
            time.sleep(1)
            if workflow_type == "outcome":
                assert OutcomeProject.objects.get(
                    outcome=get_model_from_str(workflow_type).objects.get(
                        author=self.user,
                        parent_outcome=Outcome.objects.get(author=author),
                    ),
                    project=my_project,
                )
            else:
                assert WorkflowProject.objects.get(
                    workflow=get_model_from_str(workflow_type).objects.get(
                        author=self.user,
                        parent_workflow=get_model_from_str(
                            workflow_type
                        ).objects.get(author=author),
                    ),
                    project=my_project,
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
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .week"
            )
            click_item = selenium.find_element_by_css_selector(
                ".week .insert-sibling-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .node"
            )
            click_item = selenium.find_element_by_css_selector(
                ".node .insert-sibling-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
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
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .week"
            )
            click_item = selenium.find_element_by_css_selector(
                ".week .duplicate-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
            hover_item = selenium.find_element_by_css_selector(
                ".workflow-details .node"
            )
            click_item = selenium.find_element_by_css_selector(
                ".node .duplicate-self-button img"
            )
            action_hover_click(selenium, hover_item, click_item).perform()
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
        base_outcome = Outcome.objects.create(author=self.user)
        OutcomeProject.objects.create(outcome=base_outcome, project=project)
        selenium.get(
            self.live_server_url
            + reverse("course_flow:outcome-update", args=str(base_outcome.pk))
        )
        hover_item = selenium.find_element_by_css_selector(
            ".workflow-details .outcome"
        )
        click_item = selenium.find_element_by_css_selector(
            ".outcome .insert-child-button img"
        )
        action_hover_click(selenium, hover_item, click_item).perform()
        time.sleep(1)

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
        time.sleep(1)
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
        time.sleep(1)
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

    def test_edit_menu(self):
        # Note that we don't test ALL parts of the edit menu, and we test only
        # for nodes. This will catch the vast majority of potential issues.
        # Linked workflows are tested in a different test
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
            selenium.find_element_by_id("project-return").click()
            assert (
                "project title"
                in selenium.find_element_by_id("project-title").text
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
            selenium.find_element_by_css_selector(
                ".workflow-details .week"
            ).click()
            time.sleep(1)
            title = selenium.find_element_by_id("title-editor").send_keys(
                "new strategy"
            )
            time.sleep(2.5)
            selenium.find_element_by_id("toggle-strategy-editor").click()
            time.sleep(2)
            selenium.find_element_by_css_selector(
                "a[href='#strategy-bar']"
            ).click()
            assert (
                "new strategy"
                in selenium.find_element_by_css_selector(
                    ".strategy-bar-strategy div"
                ).text
            )
            selenium.get(self.live_server_url + reverse("course_flow:home"))
            selenium.find_element_by_css_selector("a[href='#tabs-1']").click()
            selenium.find_element_by_css_selector(
                ".section-" + workflow_type + " .workflow-edit-button"
            ).click()
            assert (
                "new strategy"
                in selenium.find_element_by_css_selector(
                    ".workflow-title"
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
        base_outcome = Outcome.objects.create(author=self.user)
        OutcomeProject.objects.create(outcome=base_outcome, project=project)
        OutcomeOutcome.objects.create(
            parent=base_outcome, child=Outcome.objects.create(author=self.user)
        )
        OutcomeOutcome.objects.create(
            parent=base_outcome, child=Outcome.objects.create(author=self.user)
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
            selenium.find_element_by_css_selector(
                "#outcomeviewbar span"
            ).click()
            base_outcome_row_select = (
                ".outcome-table > .outcome > .outcome-row"
            )
            outcome1_row_select = (
                ".outcome .outcome-outcome .outcome > .outcome-row"
            )
            outcome2_row_select = ".outcome .outcome-outcome+.outcome-outcome .outcome > .outcome-row"  # noqa E501
            base_cell = base_outcome_row_select + " .blank-cell+.table-cell"
            base_cell2 = (
                base_outcome_row_select
                + " .blank-cell+.table-cell+.table-cell"
            )
            base_input = (
                base_outcome_row_select + " .blank-cell+.table-cell input"
            )
            base_input2 = (
                base_outcome_row_select
                + " .blank-cell+.table-cell+.table-cell input"
            )
            base_img = base_outcome_row_select + " .blank-cell+.table-cell img"
            base_img2 = (
                base_outcome_row_select
                + " .blank-cell+.table-cell+.table-cell img"
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
            outcome1_cell = outcome1_row_select + " .blank-cell+.table-cell"
            outcome1_cell2 = (
                outcome1_row_select + " .blank-cell+.table-cell+.table-cell"
            )
            outcome1_input = (
                outcome1_row_select + " .blank-cell+.table-cell input"
            )
            outcome1_input2 = (
                outcome1_row_select
                + " .blank-cell+.table-cell+.table-cell input"
            )
            outcome1_img = outcome1_row_select + " .blank-cell+.table-cell img"
            outcome1_img2 = (
                outcome1_row_select
                + " .blank-cell+.table-cell+.table-cell img"
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
            outcome2_cell = outcome2_row_select + " .blank-cell+.table-cell"
            outcome2_cell2 = (
                outcome2_row_select + " .blank-cell+.table-cell+.table-cell"
            )
            outcome2_input = (
                outcome2_row_select + " .blank-cell+.table-cell input"
            )
            outcome2_input2 = (
                outcome2_row_select
                + " .blank-cell+.table-cell+.table-cell input"
            )
            outcome2_img = outcome2_row_select + " .blank-cell+.table-cell img"
            outcome2_img2 = (
                outcome2_row_select
                + " .blank-cell+.table-cell+.table-cell img"
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

            # Toggle the base outcome. Check to make sure the children and
            # totals columns behave as expected
            base_toggle.perform()
            time.sleep(1)
            assert_image(base_img, "solid_check")
            assert_image(base_total_img, "/check")
            assert_image(base_grandtotal_img, "/check")
            assert_image(outcome1_img, "/check")
            assert_image(outcome1_total_img, "/check")
            assert_image(outcome1_grandtotal_img, "/check")
            assert_image(outcome2_img, "/check")
            assert_image(outcome2_total_img, "/check")
            assert_image(outcome2_grandtotal_img, "/check")

            # Toggle one of the children
            outcome1_toggle.perform()
            time.sleep(1)
            assert_image(base_img, "solid_check")
            assert_image(base_total_img, "/check")
            assert_image(base_grandtotal_img, "/check")
            assert_image(outcome1_img, "solid_check")
            assert_image(outcome1_total_img, "/check")
            assert_image(outcome1_grandtotal_img, "/check")
            assert_image(outcome2_img, "/check")
            assert_image(outcome2_total_img, "/check")
            assert_image(outcome2_grandtotal_img, "/check")
            outcome2_toggle.perform()
            time.sleep(1)
            assert_image(base_img, "solid_check")
            assert_image(base_total_img, "/check")
            assert_image(base_grandtotal_img, "/check")
            assert_image(outcome1_img, "solid_check")
            assert_image(outcome1_total_img, "/check")
            assert_image(outcome1_grandtotal_img, "/check")
            assert_image(outcome2_img, "solid_check")
            assert_image(outcome2_total_img, "/check")
            assert_image(outcome2_grandtotal_img, "/check")
            # check completion when all children are toggled but not parent
            base_toggle.perform()
            time.sleep(1)
            assert_image(base_img, "/check")
            assert_image(base_total_img, "/check")
            assert_image(base_grandtotal_img, "/check")
            assert_image(outcome1_img, "solid_check")
            assert_image(outcome1_total_img, "/check")
            assert_image(outcome1_grandtotal_img, "/check")
            assert_image(outcome2_img, "solid_check")
            assert_image(outcome2_total_img, "/check")
            assert_image(outcome2_grandtotal_img, "/check")
            # check completion when not all children are toggled
            outcome2_toggle.perform()
            time.sleep(1)
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
            time.sleep(1)
            # Currently does not pass, will fix later

    #            assert_image(base_img,"/nocheck")
    #            assert_image(base_img2,"/nocheck")
    #            assert_image(base_total_img,"/check")
    #            assert_image(base_grandtotal_img,"/check")
    #            assert_image(outcome1_img,"solid_check")
    #            assert_no_image(outcome1_img2)
    #            assert_image(outcome1_total_img,"/check")
    #            assert_image(outcome1_grandtotal_img,"/check")
    #            assert_no_image(outcome2_img)
    #            assert_image(outcome2_img2,"solid_check")
    #            assert_image(outcome2_total_img,"/check")
    #            assert_image(outcome2_grandtotal_img,"/check")

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
            this_url = selenium.current_url
            if workflow_type == "activity":
                continue
            selenium.find_element_by_css_selector(
                ".workflow-details .node"
            ).click()
            time.sleep(1)
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
            assert (
                workflow_types[i - 1]
                in selenium.find_element_by_css_selector(
                    ".workflow-title"
                ).text
            )
            selenium.get(this_url)
            selenium.find_element_by_css_selector(
                ".workflow-details .node"
            ).click()
            time.sleep(1)
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
                    ".workflow-title"
                ).text
            )

        """
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

        selenium.find_element_by_id("add-week").click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        week_title = "test week title"
        week_description = "test week description"

        title.send_keys(week_title)
        description.send_keys(week_description)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        selenium.find_elements_by_class_name("week")

        assert (
            week_title
            in selenium.find_elements_by_class_name("week-title")[0].text
        )

        assert (
            week_description
            in selenium.find_elements_by_class_name("week-description")[
                0
            ].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("week-author")[0].text
        )

        selenium.find_elements_by_class_name("update-week")[0].click()

        time.sleep(2)

        title = selenium.find_element_by_id("title-field")
        description = selenium.find_element_by_id("description-field")

        week_title = "test week title updated"
        week_description = "test week description updated"

        title.send_keys(" updated")
        description.send_keys(" updated")

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert (
            week_title
            in selenium.find_elements_by_class_name("week-title")[0].text
        )

        assert (
            week_description
            in selenium.find_elements_by_class_name("week-description")[
                0
            ].text
        )

        assert (
            username_text
            in selenium.find_elements_by_class_name("week-author")[0].text
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

        selenium.find_elements_by_class_name("delete-week")[0].click()

        time.sleep(2)

        selenium.find_element_by_id("submit-button").click()

        time.sleep(2)

        assert not selenium.find_elements_by_class_name("week")

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

        week_title = "test week title updated"

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
