from django.test import TestCase
from django.conf import settings
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions
from django.test.client import RequestFactory
from django.urls import reverse
import os
import json
from django.contrib.auth.models import Group, User
from course_flow.models import (
    Project,
    Workflow,
    Week,
    Column,
    Node,
    NodeWeek,
    WeekWorkflow,
    ColumnWorkflow,
    WorkflowProject,
    NodeLink,
    Activity,
    Course,
    Program,
    Outcome,
    OutcomeProject,
    OutcomeNode,
    OutcomeOutcome,
    Discipline,
    ProjectFavourite,
    ActivityFavourite,
    CourseFavourite,
    ProgramFavourite,
    OutcomeFavourite,
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

TESTJSON_FILENAME = os.path.join(os.path.dirname(__file__), "test_json.json")

import time

timeout = 10


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

def action_hover_click(selenium,hover_item,click_item):
    hover = ActionChains(selenium).move_to_element(hover_item).click(click_item)
    return hover

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
            wait = WebDriverWait(selenium,timeout=10)
            selenium.get(self.live_server_url + "/home/")
            home = selenium.current_url
            for project_type in ["activity","course","project"]:
                if project_type=="project":
                    selenium.find_element_by_css_selector("a[href='#tabs-0']").click()
                else:
                    selenium.find_element_by_css_selector("a[href='#tabs-1']").click()
                selenium.find_elements_by_class_name("create-button-"+project_type)[0].click()
                title = selenium.find_element_by_id("id_title")
                description = selenium.find_element_by_id("id_description")
                project_title = "test project title"
                project_description = "test project description"
                title.send_keys(project_title)
                description.send_keys(project_description)
                selenium.find_element_by_id("save-button").click()
                if project_type == "project":
                    assert project_title in selenium.find_element_by_id("project-title").text
                    assert project_description in selenium.find_element_by_id("project-description").text
                    project_url = selenium.current_url
                else:
                    assert project_title in selenium.find_element_by_class_name("workflow-title").text
                    assert project_description in selenium.find_element_by_class_name("workflow-description").text
    
                selenium.get(home)
            selenium.get(project_url)
    
    
            for workflow_type in ["activity","course","program","outcome"]:
                #Create the workflow
                selenium.find_elements_by_class_name("create-button-"+workflow_type)[0].click()
                title = selenium.find_element_by_id("id_title")
                if workflow_type !="outcome":description = selenium.find_element_by_id("id_description")
                project_title = "test "+workflow_type+" title"
                project_description = "test "+workflow_type+" description"
                title.send_keys(project_title)
                if workflow_type !="outcome":description.send_keys(project_description)
                selenium.find_element_by_id("save-button").click()
                assert project_title in selenium.find_element_by_class_name("workflow-title").text
                if workflow_type !="outcome":assert project_description in selenium.find_element_by_class_name("workflow-description").text
                selenium.get(project_url)
                #edit link
                selenium.find_element_by_css_selector(".section-"+workflow_type+" .workflow-edit-button").click()
                assert project_title in selenium.find_element_by_class_name("workflow-title").text
                selenium.get(project_url)
                selenium.find_element_by_css_selector(".section-"+workflow_type+" .workflow-duplicate-button").click()
                wait.until(lambda driver: len(driver.find_elements_by_css_selector(".section-"+workflow_type+" .workflow-title"))>1)
                assert project_title in selenium.find_elements_by_css_selector(".section-"+workflow_type+" .workflow-title")[1].text
                if workflow_type!="outcome":
                    self.assertEqual(get_model_from_str(workflow_type).objects.exclude(parent_workflow=None).count(),1)
                else:
                    self.assertEqual(get_model_from_str(workflow_type).objects.exclude(parent_outcome=None).count(),1)
                selenium.find_elements_by_css_selector(".section-"+workflow_type+" .workflow-delete-button")[0].click()
                alert = wait.until(expected_conditions.alert_is_present())
                selenium.switch_to.alert.accept()
                time.sleep(2)
    
                if workflow_type =="outcome":
                    self.assertEqual(get_model_from_str(workflow_type).objects.count(),1)
                else:
                    self.assertEqual(get_model_from_str(workflow_type).objects.filter(is_strategy=False).count(),1)

    def test_edit_project_details(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        discipline = Discipline.objects.create(title="discipline")
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[project.pk])
        )
        selenium.find_element_by_id("edit-project-button").click()
        selenium.find_element_by_id("project-title-input").send_keys(
            "new title"
        )
        selenium.find_element_by_id("project-description-input").send_keys(
            "new description"
        )
        selenium.find_elements_by_css_selector("#disciplines_all option")[0].click()
        selenium.find_element_by_css_selector("#add-discipline").click()
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
        self.assertEqual(project.disciplines.first(),discipline)

    def test_import_favourite(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        project = Project.objects.create(author=author,published=True,title="published project")
        WorkflowProject.objects.create(workflow = Activity.objects.create(author=author,published=True),project=project)
        WorkflowProject.objects.create(workflow = Course.objects.create(author=author,published=True),project=project)
        WorkflowProject.objects.create(workflow = Program.objects.create(author=author,published=True),project=project)
        OutcomeProject.objects.create(outcome = Outcome.objects.create(author=author,published=True),project=project)
        ProjectFavourite.objects.create(user=self.user,project=project)
        ActivityFavourite.objects.create(user=self.user,activity=Activity.objects.first())
        CourseFavourite.objects.create(user=self.user,course=Course.objects.first())
        ProgramFavourite.objects.create(user=self.user,program=Program.objects.first())
        OutcomeFavourite.objects.create(user=self.user,outcome=Outcome.objects.first())
        selenium.get(
            self.live_server_url
            + reverse("course_flow:home")
        )
        home = selenium.current_url
        selenium.find_element_by_css_selector("a[href='#tabs-2']").click()
        selenium.find_element_by_css_selector(".section-project .workflow-view-button").click()
        assert "published project" in selenium.find_element_by_id("project-title").text
        project_url = selenium.current_url
        for workflow_type in ["activity","course","program","outcome"]:
            selenium.find_element_by_css_selector(".section-"+workflow_type+" .workflow-view-button").click()
            self.assertTrue(len(selenium.find_elements_by_css_selector(".workflow-title")))
            selenium.get(project_url)
        selenium.get(home)
        selenium.find_element_by_css_selector("a[href='#tabs-2']").click()
        selenium.find_element_by_css_selector(".section-project .workflow-duplicate-button").click()
        selenium.find_element_by_css_selector("a[href='#tabs-0']").click()
        selenium.find_element_by_css_selector(".section-project .workflow-edit-button").click()
        assert "published project" in selenium.find_element_by_id("project-title").text
        selenium.get(home)
        self.assertEqual(Project.objects.get(author=self.user).title,"published project")
        Project.objects.get(author=self.user).delete()
        
        my_project = Project.objects.create(author=self.user,published=True,title="project to be filled")
        selenium.get(home)
        
        selenium.get(
            self.live_server_url
            + reverse("course_flow:project-update", args=[my_project.pk])
        )
        selenium.find_element_by_css_selector("a[href='#tabs-2']").click()
        
        for workflow_type in ["activity","course","program","outcome"]:
            selenium.find_element_by_css_selector(".section-"+workflow_type+" .workflow-duplicate-button").click()
            time.sleep(1)
            if workflow_type=="outcome":
                assert OutcomeProject.objects.get(
                    outcome=get_model_from_str(workflow_type).objects.get(author=self.user,parent_outcome=Outcome.objects.get(author=author)),
                    project=my_project
                )
            else:
                assert WorkflowProject.objects.get(
                    workflow=get_model_from_str(workflow_type).objects.get(author=self.user,parent_workflow=get_model_from_str(workflow_type).objects.get(author=author)),
                    project=my_project
                )
    
    
    
    def test_workflow_editing(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        for workflow_type in ["activity","course","program"]:
            workflow = get_model_from_str(workflow_type).objects.create(author=self.user)
            WorkflowProject.objects.create(workflow=workflow,project=project)
            workflow.weeks.first().nodes.create(author=self.user,column=workflow.columns.first())
            
            selenium.get(
                self.live_server_url + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            num_columns = workflow.columns.all().count()
            num_weeks = workflow.weeks.all().count()
            num_nodes = 1
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .column")),num_columns)
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .week")),num_weeks)
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .node")),num_nodes)
            hover_item = selenium.find_element_by_css_selector(".workflow-details .column")
            click_item = selenium.find_element_by_css_selector(".column .insert-sibling-button img")
            action_hover_click(selenium,hover_item,click_item).perform()
            hover_item = selenium.find_element_by_css_selector(".workflow-details .week")
            click_item = selenium.find_element_by_css_selector(".week .insert-sibling-button img")
            action_hover_click(selenium,hover_item,click_item).perform()
            hover_item = selenium.find_element_by_css_selector(".workflow-details .node")
            click_item = selenium.find_element_by_css_selector(".node .insert-sibling-button img")
            action_hover_click(selenium,hover_item,click_item).perform()
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .column")),num_columns+1)
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .week")),num_weeks+1)
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .node")),num_nodes+1)
            #Deleting
            hover_item = selenium.find_element_by_css_selector(".workflow-details .node")
            click_item = selenium.find_element_by_css_selector(".node .delete-self-button img")
            action_hover_click(selenium,hover_item,click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(1)
            hover_item = selenium.find_element_by_css_selector(".workflow-details .column")
            click_item = selenium.find_element_by_css_selector(".column .delete-self-button img")
            action_hover_click(selenium,hover_item,click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(1)
            hover_item = selenium.find_element_by_css_selector(".workflow-details .week")
            click_item = selenium.find_element_by_css_selector(".week .delete-self-button img")
            action_hover_click(selenium,hover_item,click_item).perform()
            alert = wait.until(expected_conditions.alert_is_present())
            selenium.switch_to.alert.accept()
            time.sleep(1)
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .column")),num_columns)
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .week")),num_weeks)
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .node")),0)
            
    def test_workflow_duplication(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        for workflow_type in ["activity","course","program"]:
            workflow = get_model_from_str(workflow_type).objects.create(author=self.user)
            WorkflowProject.objects.create(workflow=workflow,project=project)
            workflow.weeks.first().nodes.create(author=self.user,column=workflow.columns.first())
            
            selenium.get(
                self.live_server_url + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            num_columns = workflow.columns.all().count()
            num_weeks = workflow.weeks.all().count()
            num_nodes = 1
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .column")),num_columns)
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .week")),num_weeks)
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .node")),num_nodes)
            hover_item = selenium.find_element_by_css_selector(".workflow-details .column")
            click_item = selenium.find_element_by_css_selector(".column .duplicate-self-button img")
            action_hover_click(selenium,hover_item,click_item).perform()
            hover_item = selenium.find_element_by_css_selector(".workflow-details .week")
            click_item = selenium.find_element_by_css_selector(".week .duplicate-self-button img")
            action_hover_click(selenium,hover_item,click_item).perform()
            hover_item = selenium.find_element_by_css_selector(".workflow-details .node")
            click_item = selenium.find_element_by_css_selector(".node .duplicate-self-button img")
            action_hover_click(selenium,hover_item,click_item).perform()
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .column")),num_columns+1)
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .week")),num_weeks+1)
            self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .node")),num_nodes*2+1)
            
        
        
    def test_outcome_editing(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        base_outcome = Outcome.objects.create(author=self.user)
        OutcomeProject.objects.create(outcome=base_outcome,project=project)
        selenium.get(
            self.live_server_url + reverse("course_flow:outcome-update", args=[base_outcome.pk])
        )
        hover_item = selenium.find_element_by_css_selector(".workflow-details .outcome")
        click_item = selenium.find_element_by_css_selector(".outcome .insert-child-button img")
        action_hover_click(selenium,hover_item,click_item).perform()
        time.sleep(1)
        
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .outcome .outcome")),1)
        self.assertEqual(OutcomeOutcome.objects.filter(parent=base_outcome).count(),1)
        hover_item = selenium.find_element_by_css_selector(".workflow-details .outcome .outcome")
        click_item = selenium.find_element_by_css_selector(".outcome .outcome .insert-sibling-button img")
        action_hover_click(selenium,hover_item,click_item).perform()
        time.sleep(1)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .outcome .outcome")),2)
        self.assertEqual(OutcomeOutcome.objects.filter(parent=base_outcome).count(),2)
        hover_item = selenium.find_element_by_css_selector(".workflow-details .outcome .outcome")
        click_item = selenium.find_element_by_css_selector(".outcome .outcome .delete-self-button img")
        action_hover_click(selenium,hover_item,click_item).perform()
        alert = wait.until(expected_conditions.alert_is_present())
        selenium.switch_to.alert.accept()
        time.sleep(1)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-details .outcome .outcome")),1)
        self.assertEqual(OutcomeOutcome.objects.filter(parent=base_outcome).count(),1)
        
        
        
        
    def test_edit_menu(self):
        #Note that we don't test ALL parts of the edit menu, and we test only for nodes. This will catch the vast majority of potential issues. Linked workflows are tested in a different test
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user)
        for i,workflow_type in enumerate(["activity","course","program"]):
            workflow = get_model_from_str(workflow_type).objects.create(author=self.user)
            WorkflowProject.objects.create(workflow=workflow,project=project)
            workflow.weeks.first().nodes.create(author=self.user,column=workflow.columns.first(),title="test node",node_type=i)
            
            selenium.get(
                self.live_server_url + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            selenium.find_element_by_css_selector(".workflow-details .node").click()
            time.sleep(1)
            title = selenium.find_element_by_id("title-editor")
            assert "test node" in title.get_attribute("value")
            title.clear()
            title.send_keys("new title")
            time.sleep(2.5)
            assert "new title" in selenium.find_element_by_css_selector(".workflow-details .node .node-title").text
            self.assertEqual(workflow.weeks.first().nodes.first().title,"new title")
            if i<2:
                context = selenium.find_element_by_id("context-editor")
                context.click()
                selenium.find_elements_by_css_selector("#context-editor option")[2].click()
                time.sleep(2.5)
                self.assertEqual(workflow.weeks.first().nodes.first().context_classification,2+100*i)
            else:
                self.assertEqual(len(selenium.find_elements_by_css_selector("#context-editor")),0)
            if i<2:
                context = selenium.find_element_by_id("task-editor")
                context.click()
                selenium.find_elements_by_css_selector("#task-editor option")[2].click()
                time.sleep(2.5)
                self.assertEqual(workflow.weeks.first().nodes.first().task_classification,2+100*i)
            else:
                self.assertEqual(len(selenium.find_elements_by_css_selector("#task-editor")),0)
            
            
    def test_project_return(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user,title="project title")
        for i,workflow_type in enumerate(["activity","course","program"]):
            workflow = get_model_from_str(workflow_type).objects.create(author=self.user)
            WorkflowProject.objects.create(workflow=workflow,project=project)
            workflow.weeks.first().nodes.create(author=self.user,column=workflow.columns.first(),title="test node",node_type=i)
            
            selenium.get(
                self.live_server_url + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            selenium.find_element_by_id('project-return').click()
            assert "project title" in selenium.find_element_by_id("project-title").text
            
        
    def test_strategy_convert(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user,title="project title")
        for i,workflow_type in enumerate(["activity","course"]):
            workflow = get_model_from_str(workflow_type).objects.create(author=self.user)
            WorkflowProject.objects.create(workflow=workflow,project=project)
            workflow.weeks.first().nodes.create(author=self.user,column=workflow.columns.first(),title="test node",node_type=i)
            
            selenium.get(
                self.live_server_url + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            selenium.find_element_by_css_selector(".workflow-details .week").click()
            time.sleep(1)
            title = selenium.find_element_by_id("title-editor").send_keys("new strategy")
            time.sleep(2.5)
            selenium.find_element_by_id("toggle-strategy-editor").click()
            time.sleep(2)
            selenium.find_element_by_css_selector("a[href='#strategy-bar']").click()
            assert "new strategy" in selenium.find_element_by_css_selector(".strategy-bar-strategy div").text
            selenium.get(
                self.live_server_url + reverse("course_flow:home")
            )
            selenium.find_element_by_css_selector("a[href='#tabs-1']").click()
            selenium.find_element_by_css_selector(".section-"+workflow_type+" .workflow-edit-button").click()
            assert "new strategy" in selenium.find_element_by_css_selector(".workflow-title").text
            self.assertEqual(Workflow.objects.filter(is_strategy=True).count(),1)
            self.assertEqual(Workflow.objects.get(is_strategy=True).weeks.get(is_strategy=True).parent_week,workflow.weeks.first())
            Workflow.objects.get(is_strategy=True).delete()
            
        
        
        
    def test_outcome_view(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        project = Project.objects.create(author=self.user,title="project title")
        base_outcome = Outcome.objects.create(author=self.user)
        OutcomeProject.objects.create(outcome=base_outcome,project=project)
        OutcomeOutcome.objects.create(parent=base_outcome,child=Outcome.objects.create(author=self.user))
        OutcomeOutcome.objects.create(parent=base_outcome,child=Outcome.objects.create(author=self.user))
        for i,workflow_type in enumerate(["activity","course","program"]):
            workflow = get_model_from_str(workflow_type).objects.create(author=self.user)
            WorkflowProject.objects.create(workflow=workflow,project=project)
            workflow.weeks.first().nodes.create(author=self.user,column=workflow.columns.first(),title="test node",node_type=i)
            workflow.weeks.first().nodes.create(author=self.user,column=workflow.columns.first(),title="test node",node_type=i)
            
            selenium.get(
                self.live_server_url + reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            selenium.find_element_by_css_selector("#outcomeviewbar span").click()
            base_outcome_row_select = ".outcome-table > .outcome > .outcome-row"
            outcome1_row_select = ".outcome .outcome-outcome .outcome > .outcome-row"
            outcome2_row_select = ".outcome .outcome-outcome+.outcome-outcome .outcome > .outcome-row"
            base_cell = base_outcome_row_select+" .blank-cell+.table-cell"
            base_cell2 = base_outcome_row_select+" .blank-cell+.table-cell+.table-cell"
            base_input = base_outcome_row_select+" .blank-cell+.table-cell input"
            base_input2 = base_outcome_row_select+" .blank-cell+.table-cell+.table-cell input"
            base_img = base_outcome_row_select+" .blank-cell+.table-cell img"
            base_img2 = base_outcome_row_select+" .blank-cell+.table-cell+.table-cell img"
            base_total_img = base_outcome_row_select+" .table-cell.total-cell:not(.grand-total-cell) img"
            base_grandtotal_img = base_outcome_row_select+" .table-cell.grand-total-cell img"
            base_toggle = action_hover_click(selenium,selenium.find_element_by_css_selector(base_cell),selenium.find_element_by_css_selector(base_input))
            outcome1_cell = outcome1_row_select+" .blank-cell+.table-cell"
            outcome1_cell2 = outcome1_row_select+" .blank-cell+.table-cell+.table-cell"
            outcome1_input = outcome1_row_select+" .blank-cell+.table-cell input"
            outcome1_input2 = outcome1_row_select+" .blank-cell+.table-cell+.table-cell input"
            outcome1_img = outcome1_row_select+" .blank-cell+.table-cell img"
            outcome1_img2 = outcome1_row_select+" .blank-cell+.table-cell+.table-cell img"
            outcome1_total_img = outcome1_row_select+" .table-cell.total-cell:not(.grand-total-cell) img"
            outcome1_grandtotal_img = outcome1_row_select+" .table-cell.grand-total-cell img"
            outcome1_toggle = action_hover_click(selenium,selenium.find_element_by_css_selector(outcome1_cell),selenium.find_element_by_css_selector(outcome1_input))
            outcome2_cell = outcome2_row_select+" .blank-cell+.table-cell"
            outcome2_cell2 = outcome2_row_select+" .blank-cell+.table-cell+.table-cell"
            outcome2_input = outcome2_row_select+" .blank-cell+.table-cell input"
            outcome2_input2 = outcome2_row_select+" .blank-cell+.table-cell+.table-cell input"
            outcome2_img = outcome2_row_select+" .blank-cell+.table-cell img"
            outcome2_img2 = outcome2_row_select+" .blank-cell+.table-cell+.table-cell img"
            outcome2_total_img = outcome2_row_select+" .table-cell.total-cell:not(.grand-total-cell) img"
            outcome2_grandtotal_img = outcome2_row_select+" .table-cell.grand-total-cell img"
            outcome2_toggle = action_hover_click(selenium,selenium.find_element_by_css_selector(outcome2_cell),selenium.find_element_by_css_selector(outcome2_input))
            
            def assert_image(element_string,string):
                assert string in selenium.find_element_by_css_selector(element_string).get_attribute("src")
                
            def assert_no_image(element_string):
                self.assertEqual(len(selenium.find_elements_by_css_selector(element_string)),0)
            
            #Toggle the base outcome. Check to make sure the children and totals columns behave as expected
            base_toggle.perform()
            time.sleep(1)
            assert_image(base_img,"solid_check")
            assert_image(base_total_img,"/check")
            assert_image(base_grandtotal_img,"/check")
            assert_image(outcome1_img,"/check")
            assert_image(outcome1_total_img,"/check")
            assert_image(outcome1_grandtotal_img,"/check")
            assert_image(outcome2_img,"/check")
            assert_image(outcome2_total_img,"/check")
            assert_image(outcome2_grandtotal_img,"/check")
            
            #Toggle one of the children
            outcome1_toggle.perform()
            time.sleep(1)
            assert_image(base_img,"solid_check")
            assert_image(base_total_img,"/check")
            assert_image(base_grandtotal_img,"/check")
            assert_image(outcome1_img,"solid_check")
            assert_image(outcome1_total_img,"/check")
            assert_image(outcome1_grandtotal_img,"/check")
            assert_image(outcome2_img,"/check")
            assert_image(outcome2_total_img,"/check")
            assert_image(outcome2_grandtotal_img,"/check")
            outcome2_toggle.perform()
            time.sleep(1)
            assert_image(base_img,"solid_check")
            assert_image(base_total_img,"/check")
            assert_image(base_grandtotal_img,"/check")
            assert_image(outcome1_img,"solid_check")
            assert_image(outcome1_total_img,"/check")
            assert_image(outcome1_grandtotal_img,"/check")
            assert_image(outcome2_img,"solid_check")
            assert_image(outcome2_total_img,"/check")
            assert_image(outcome2_grandtotal_img,"/check")
            #check completion when all children are toggled but not parent
            base_toggle.perform()
            time.sleep(1)
            assert_image(base_img,"/check")
            assert_image(base_total_img,"/check")
            assert_image(base_grandtotal_img,"/check")
            assert_image(outcome1_img,"solid_check")
            assert_image(outcome1_total_img,"/check")
            assert_image(outcome1_grandtotal_img,"/check")
            assert_image(outcome2_img,"solid_check")
            assert_image(outcome2_total_img,"/check")
            assert_image(outcome2_grandtotal_img,"/check")
            #check completion when not all children are toggled
            outcome2_toggle.perform()
            time.sleep(1)
            assert_image(base_img,"/nocheck")
            assert_image(base_total_img,"/nocheck")
            assert_image(base_grandtotal_img,"/nocheck")
            assert_image(outcome1_img,"solid_check")
            assert_image(outcome1_total_img,"/check")
            assert_image(outcome1_grandtotal_img,"/check")
            assert_no_image(outcome2_img)
            assert_no_image(outcome2_total_img)
            assert_no_image(outcome2_grandtotal_img)
            #check completion when children are toggled but in different nodes 
            action_hover_click(
                selenium,
                selenium.find_element_by_css_selector(outcome2_cell2),
                selenium.find_element_by_css_selector(outcome2_input2)
            ).perform()
            time.sleep(1)
            #Currently does not pass, will fix later
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
        project = Project.objects.create(author=self.user,title="project title")
        workflow_types = ["activity","course","program"]
        for i,workflow_type in enumerate(workflow_types):
            workflow = get_model_from_str(workflow_type).objects.create(author=self.user,title=workflow_type)
            WorkflowProject.objects.create(workflow=workflow,project=project)
            workflow.weeks.first().nodes.create(
                author=self.user,column=workflow.columns.first(),title="test node",node_type=i
            )
            
            selenium.get(
                self.live_server_url + reverse("course_flow:workflow-update", args=[workflow.pk])
            ) 
            this_url = selenium.current_url
            if workflow_type=="activity":continue
            selenium.find_element_by_css_selector(".workflow-details .node").click()
            time.sleep(1)
            selenium.find_element_by_id("linked-workflow-editor").click()
            time.sleep(2)
            selenium.find_element_by_css_selector(".section-"+workflow_types[i-1]+" .workflow-for-menu").click()
            selenium.find_element_by_id("set-linked-workflow").click()
            time.sleep(1)
            self.assertEqual(workflow.weeks.first().nodes.first().linked_workflow.id,get_model_from_str(workflow_types[i-1]).objects.first().id)
            ActionChains(selenium).double_click(selenium.find_element_by_css_selector(".workflow-details .node")).perform()
            assert workflow_types[i-1] in selenium.find_element_by_css_selector(".workflow-title").text
            selenium.get(this_url)
            selenium.find_element_by_css_selector(".workflow-details .node").click()
            time.sleep(1)
            selenium.find_element_by_id("linked-workflow-editor").click()
            time.sleep(2)
            selenium.find_element_by_css_selector(".section-"+workflow_types[i-1]+" .workflow-for-menu").click()
            selenium.find_element_by_id("set-linked-workflow-none").click()
            time.sleep(2) 
            self.assertEqual(workflow.weeks.first().nodes.first().linked_workflow,None)
            ActionChains(selenium).double_click(selenium.find_element_by_css_selector(".workflow-details .node")).perform()
            assert workflow_type in selenium.find_element_by_css_selector(".workflow-title").text
        
    def create_many_items(self,author,published,disciplines):
        for object_type in ["project","activity","outcome","course","program"]:
            for i in range(10):
                item = get_model_from_str(object_type).objects.create(author=author,published=published,title=object_type+str(i))
                item.disciplines.set(disciplines)

    def test_explore(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        discipline = Discipline.objects.create(title="Discipline1")
        self.create_many_items(author,True,disciplines=[discipline])
        selenium.get(
            self.live_server_url + reverse("course_flow:explore")
        )
        for checkbox in selenium.find_elements_by_css_selector("#search-type input[type='checkbox']"):checkbox.click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),5)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),10)
        selenium.find_elements_by_css_selector(".page-button")[3].click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),5)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),10)
        assert "active" in selenium.find_elements_by_css_selector(".page-button")[3].get_attribute("class")
        selenium.find_element_by_css_selector("#next-page-button").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),5)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),10)
        assert "active" in selenium.find_elements_by_css_selector(".page-button")[4].get_attribute("class")
        selenium.find_element_by_css_selector("#prev-page-button").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),5)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),10)
        assert "active" in selenium.find_elements_by_css_selector(".page-button")[3].get_attribute("class")
        for checkbox in selenium.find_elements_by_css_selector("#search-discipline input[type='checkbox']"):checkbox.click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),10)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),5)
        selenium.find_element_by_css_selector("select[name='results']").click()
        selenium.find_elements_by_css_selector("select[name='results'] option")[1].click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),20)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),3)
        selenium.find_element_by_css_selector("select[name='results']").click()
        selenium.find_elements_by_css_selector("select[name='results'] option")[2].click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),50)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),1)
        selenium.find_element_by_id("search-title").send_keys("1")
        selenium.find_element_by_id("submit").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),5)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),1)
        for button in selenium.find_elements_by_css_selector(".workflow-toggle-favourite"): button.click()
        time.sleep(0.5)
        self.assertEqual(ProjectFavourite.objects.filter(user=self.user).count(),1)
        self.assertEqual(ActivityFavourite.objects.filter(user=self.user).count(),1)
        self.assertEqual(CourseFavourite.objects.filter(user=self.user).count(),1)
        self.assertEqual(ProgramFavourite.objects.filter(user=self.user).count(),1)
        self.assertEqual(OutcomeFavourite.objects.filter(user=self.user).count(),1)
        selenium.find_element_by_css_selector("select[name='results']").click()
        selenium.find_elements_by_css_selector("select[name='results'] option")[0].click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),5)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),1)
        
        
    def test_explore_no_publish(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        discipline = Discipline.objects.create(title="Discipline1")
        self.create_many_items(author,False,disciplines=[discipline])
        selenium.get(
            self.live_server_url + reverse("course_flow:explore")
        )
        for checkbox in selenium.find_elements_by_css_selector("#search-type input[type='checkbox']"):checkbox.click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),0)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),0)
        
    def test_explore_disciplines(self):
        selenium = self.selenium
        wait = WebDriverWait(selenium, timeout=10)
        author = get_author()
        discipline1 = Discipline.objects.create(title="Discipline1")
        discipline2 = Discipline.objects.create(title="Discipline2")
        self.create_many_items(author,True,disciplines=[discipline1])
        self.create_many_items(author,True,disciplines=[discipline2])
        self.create_many_items(author,True,disciplines=[discipline1,discipline2])
        selenium.get(
            self.live_server_url + reverse("course_flow:explore")
        )
        for checkbox in selenium.find_elements_by_css_selector("#search-type input[type='checkbox']"):checkbox.click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),15)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),10)
        selenium.find_elements_by_css_selector("#search-discipline input[type='checkbox']")[0].click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),10)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),10)
        selenium.find_elements_by_css_selector("#search-discipline input[type='checkbox']")[0].click()
        selenium.find_elements_by_css_selector("#search-discipline input[type='checkbox']")[1].click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),10)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),10)
        selenium.find_elements_by_css_selector("#search-discipline input[type='checkbox']")[0].click()
        selenium.find_element_by_id("submit").click()
        self.assertEqual(len(selenium.find_elements_by_css_selector(".page-button")),15)
        self.assertEqual(len(selenium.find_elements_by_css_selector(".workflow-title")),10)


class ModelViewTest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_project_detail_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        response = self.client.get(
            reverse("course_flow:project-detail-view", args=[project.pk])
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(
            reverse("course_flow:project-detail-view", args=[project.pk])
        )
        self.assertEqual(response.status_code, 403)
        project.published = True
        project.save()
        response = self.client.get(
            reverse("course_flow:project-detail-view", args=[project.pk])
        )
        self.assertEqual(response.status_code, 200)

    def test_project_update_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        response = self.client.get(
            reverse("course_flow:project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        response = self.client.get(
            reverse("course_flow:project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 403)
        project.published = True
        project.save()
        response = self.client.get(
            reverse("course_flow:project-update", args=[project.pk])
        )
        self.assertEqual(response.status_code, 403)

    def test_outcome_detail_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        outcome = make_object("outcome", author)
        OutcomeProject.objects.create(outcome=outcome, project=project)
        response = self.client.get(
            reverse("course_flow:outcome-detail-view", args=[outcome.pk])
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        project = Project.objects.create(author=author)
        outcome = make_object("outcome", author)
        OutcomeProject.objects.create(outcome=outcome, project=project)
        response = self.client.get(
            reverse("course_flow:outcome-detail-view", args=[outcome.pk])
        )
        self.assertEqual(response.status_code, 403)
        outcome.published = True
        outcome.save()
        response = self.client.get(
            reverse("course_flow:outcome-detail-view", args=[outcome.pk])
        )
        self.assertEqual(response.status_code, 200)

    def test_outcome_update_view(self):
        author = get_author()
        project = Project.objects.create(author=author)
        outcome = make_object("outcome", author)
        OutcomeProject.objects.create(outcome=outcome, project=project)
        response = self.client.get(
            reverse("course_flow:outcome-update", args=[outcome.pk])
        )
        self.assertEqual(response.status_code, 302)
        login(self)
        project = Project.objects.create(author=author)
        outcome = make_object("outcome", author)
        OutcomeProject.objects.create(outcome=outcome, project=project)
        response = self.client.get(
            reverse("course_flow:outcome-update", args=[outcome.pk])
        )
        self.assertEqual(response.status_code, 403)

    def test_outcome_update_view_is_owner(self):
        user = login(self)
        project = Project.objects.create(author=user)
        outcome = make_object("outcome", user)
        OutcomeProject.objects.create(outcome=outcome, project=project)
        response = self.client.get(
            reverse("course_flow:outcome-update", args=[outcome.pk])
        )
        self.assertEqual(response.status_code, 200)

    def test_workflow_detail_view(self):
        author = get_author()
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=author)
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-detail", args=[workflow.pk])
            )
            self.assertEqual(response.status_code, 302)
        login(self)
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=author)
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-detail", args=[workflow.pk])
            )
            self.assertEqual(response.status_code, 403)
            workflow.published = True
            workflow.save()
            response = self.client.get(
                reverse("course_flow:workflow-detail", args=[workflow.pk])
            )
            self.assertEqual(response.status_code, 200)

    def test_workflow_update_view(self):
        author = get_author()
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=author)
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            self.assertEqual(response.status_code, 302)
        login(self)
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=author)
            workflow = make_object(workflow_type, author)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=[workflow.pk])
            )
            self.assertEqual(response.status_code, 403)

    def test_workflow_update_view_is_owner(self):
        user = login(self)
        for workflow_type in ["activity", "course", "program"]:
            project = Project.objects.create(author=user)
            workflow = make_object(workflow_type, user)
            WorkflowProject.objects.create(workflow=workflow, project=project)
            response = self.client.get(
                reverse("course_flow:workflow-update", args=[workflow.pk])
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
        self.assertEqual(response.status_code, 401)

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

    # Test for linking a workflow from another project. The workflow should be duplicated into the project
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
        self.assertEqual(response.status_code, 401)
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
        self.assertEqual(response.status_code, 401)

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
        # check to make sure all nodes have different columns. This acts as a check that a) they have been assigned to the new columns in the workflow and b) the two nodes that were in different custom columns did not get placed into the same custom column
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
            self.assertEqual(response.status_code, 401)

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
            self.assertEqual(response.status_code, 401)

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
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:change-column"),
            {"nodePk": to_move.node.id, "columnID": columnworkflow1.id},
        )
        self.assertEqual(response.status_code, 401)
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
        self.assertEqual(response.status_code, 401)
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
        self.assertEqual(response.status_code, 401)

    def test_add_remove_outcome_to_node_permissions_no_authorship(self):
        myself = login(self)
        author = get_author()
        node = make_object("node", author)
        outcome = make_object("outcome", author)
        response = self.client.post(
            reverse("course_flow:add-outcome-to-node"),
            {"nodePk": node.id, "outcomePk": outcome.id},
        )
        self.assertEqual(response.status_code, 401)
        outcomenode = OutcomeNode.objects.create(node=node, outcome=outcome)
        response = self.client.post(
            reverse("course_flow:unlink-outcome-from-node"),
            {"nodePk": node.id, "outcomePk": outcome.id},
        )
        self.assertEqual(response.status_code, 401)
        myoutcome = make_object("outcome", myself)
        mynode = make_object("node", myself)
        response = self.client.post(
            reverse("course_flow:add-outcome-to-node"),
            {"nodePk": mynode.id, "outcomePk": outcome.id},
        )
        self.assertEqual(response.status_code, 401)
        response = self.client.post(
            reverse("course_flow:add-outcome-to-node"),
            {"nodePk": node.id, "outcomePk": myoutcome.id},
        )
        self.assertEqual(response.status_code, 401)
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
                .render({"published": True})
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
                .render({"published": True})
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)

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
        
    def test_add_discipline_permissions_no_login_no_authorship(self):
        author = get_author()
        project = make_object("project", author)
        discipline_to_add = Discipline.objects.create(title="My Discipline")
        response = self.client.post(
            reverse("course_flow:update-value"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
                "data": JSONRenderer()
                .render({"disciplines":[discipline_to_add.id]})
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)    
        
    def test_add_discipline_permissions_no_authorship(self):
        author = get_author()
        login(self)
        project = make_object("project", author)
        discipline_to_add = Discipline.objects.create(title="My Discipline")
        response = self.client.post(
            reverse("course_flow:update-value"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
                "data": JSONRenderer()
                .render({"disciplines":[discipline_to_add.id]})
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 401)   
        
    def test_add_discipline(self):
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
        discipline1 = Discipline.objects.create(title="My Discipline")
        discipline2 = Discipline.objects.create(title="My Second Discipline")
        response = self.client.post(
            reverse("course_flow:update-value"),
            {
                "objectID": project.id,
                "objectType": JSONRenderer().render("project").decode("utf-8"),
                "data": JSONRenderer()
                .render({"disciplines":[discipline1.id,discipline2.id]})
                .decode("utf-8"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Project.objects.first().disciplines.count(),2)
        self.assertEqual(Activity.objects.first().disciplines.count(),2)
        self.assertEqual(Course.objects.first().disciplines.count(),2)
        self.assertEqual(Program.objects.first().disciplines.count(),2)
        self.assertEqual(Outcome.objects.first().disciplines.count(),2)
        
    def test_add_favourite_permissions_no_login_no_authorship(self):
        author = get_author()
        for object_type in ["project","activity","course","program","outcome"]:
            item = get_model_from_str(object_type).objects.create(author=author,published=True)
            response = self.client.post(
                reverse("course_flow:toggle-favourite"),
                {
                    "objectID": item.id,
                    "objectType": JSONRenderer().render(object_type).decode("utf-8"),
                    "favourite": JSONRenderer()
                    .render(True)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 401)    
            
    def test_add_favourite_permissions_no_login_not_published(self):
        author = get_author()
        user=login(self)
        for object_type in ["project","activity","course","program","outcome"]:
            item = get_model_from_str(object_type).objects.create(author=author,published=False)
            response = self.client.post(
                reverse("course_flow:toggle-favourite"),
                {
                    "objectID": item.id,
                    "objectType": JSONRenderer().render(object_type).decode("utf-8"),
                    "favourite": JSONRenderer()
                    .render(True)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 401)    
            
    def test_add_favourite(self):
        author = get_author()
        user = login(self)
        for object_type in ["project","activity","course","program","outcome"]:
            item = get_model_from_str(object_type).objects.create(author=author,published=True)
            response = self.client.post(
                reverse("course_flow:toggle-favourite"),
                {
                    "objectID": item.id,
                    "objectType": JSONRenderer().render(object_type).decode("utf-8"),
                    "favourite": JSONRenderer()
                    .render(True)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(get_model_from_str(object_type+"favourite").objects.filter(user=user).count(),1)
            response = self.client.post(
                reverse("course_flow:toggle-favourite"),
                {
                    "objectID": item.id,
                    "objectType": JSONRenderer().render(object_type).decode("utf-8"),
                    "favourite": JSONRenderer()
                    .render(False)
                    .decode("utf-8"),
                },
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(get_model_from_str(object_type+"favourite").objects.filter(user=user).count(),0)
          
        
    

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
        self.assertEqual(response.status_code, 401)

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
            self.assertEqual(response.status_code, 401)
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
            self.assertEqual(response.status_code, 401)
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
        self.assertEqual(response.status_code, 401)
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
        
    def test_explore_no_login(self):
        response = self.client.get(
            reverse("course_flow:explore")
        )
        self.assertEqual(response.status_code,302)  
        
    def test_explore_login(self):
        user = login(self)
        response = self.client.get(
            reverse("course_flow:explore")
        )
        self.assertEqual(response.status_code,200)
    
        
        
