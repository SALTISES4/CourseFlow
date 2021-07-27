import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import (
    GenericForeignKey,
    GenericRelation,
)
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models.signals import post_save, pre_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from model_utils.managers import InheritanceManager

from course_flow.utils import get_all_outcomes

User = get_user_model()


class Project(models.Model):
    title = models.CharField(max_length=50, null=True, blank=True)
    description = models.CharField(max_length=500, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)

    workflows = models.ManyToManyField(
        "Workflow", through="WorkflowProject", blank=True
    )
    #    outcomes = models.ManyToManyField(
    #        "Outcome", through="OutcomeProject", blank=True
    #    )

    is_original = models.BooleanField(default=False)
    parent_project = models.ForeignKey(
        "Project", on_delete=models.SET_NULL, null=True
    )

    disciplines = models.ManyToManyField("Discipline", blank=True)

    favourited_by = GenericRelation("Favourite", related_query_name="project")
    user_permissions = GenericRelation(
        "ObjectPermission", related_query_name="project"
    )

    @property
    def type(self):
        return "project"

    def get_permission_objects(self):
        return [self]

    class Meta:
        verbose_name = "Project"
        verbose_name_plural = "Projects"


class WorkflowProject(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    workflow = models.ForeignKey("Workflow", on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_permission_objects(self):
        return [self.project, self.workflow.get_subclass()]

    class Meta:
        verbose_name = "Workflow-Project Link"
        verbose_name_plural = "Workflow-Project Links"


# class OutcomeProject(models.Model):
#    project = models.ForeignKey(Project, on_delete=models.CASCADE)
#    outcome = models.ForeignKey("Outcome", on_delete=models.CASCADE)
#    added_on = models.DateTimeField(default=timezone.now)
#    rank = models.PositiveIntegerField(default=0)
#
#    def get_permission_objects(self):
#        return [self.project, self.outcome]
#
#    class Meta:
#        verbose_name = "Outcome-Project Link"
#        verbose_name_plural = "Outcome-Project Links"


class OutcomeWorkflow(models.Model):
    workflow = models.ForeignKey("Workflow", on_delete=models.CASCADE)
    outcome = models.ForeignKey("Outcome", on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_permission_objects(self):
        return [self.project, self.outcome]

    class Meta:
        verbose_name = "Outcome-Workflow Link"
        verbose_name_plural = "Outcome-Workflow Links"


class Column(models.Model):
    title = models.CharField(max_length=50, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)
    visible = models.BooleanField(default=True)
    colour = models.PositiveIntegerField(null=True)
    CUSTOM_ACTIVITY = 0
    OUT_OF_CLASS_INSTRUCTOR = 1
    OUT_OF_CLASS_STUDENT = 2
    IN_CLASS_INSTRUCTOR = 3
    IN_CLASS_STUDENT = 4
    CUSTOM_COURSE = 10
    PREPARATION = 11
    LESSON = 12
    ARTIFACT = 13
    ASSESSMENT = 14
    CUSTOM_PROGRAM = 20

    COLUMN_TYPES = (
        (CUSTOM_ACTIVITY, "Custom Activity Column"),
        (OUT_OF_CLASS_INSTRUCTOR, "Out of Class (Instructor)"),
        (OUT_OF_CLASS_STUDENT, "Out of Class (Students)"),
        (IN_CLASS_INSTRUCTOR, "In Class (Instructor)"),
        (IN_CLASS_STUDENT, "In Class (Students)"),
        (CUSTOM_COURSE, "Custom Course Column"),
        (PREPARATION, "Preparation"),
        (LESSON, "Lesson"),
        (ARTIFACT, "Artifact"),
        (ASSESSMENT, "Assessment"),
        (CUSTOM_PROGRAM, "Custom Program Category"),
    )
    column_type = models.PositiveIntegerField(default=0, choices=COLUMN_TYPES)

    is_original = models.BooleanField(default=False)
    parent_column = models.ForeignKey(
        "Column", on_delete=models.SET_NULL, null=True
    )

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def get_permission_objects(self):
        return [self.get_workflow().get_subclass()]

    def get_workflow(self):
        return self.workflow_set.first()

    def __str__(self):
        return self.get_column_type_display()

    class Meta:
        verbose_name = "Column"
        verbose_name_plural = "Columns"


class NodeLink(models.Model):
    title = models.CharField(max_length=100, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    source_node = models.ForeignKey(
        "Node", on_delete=models.CASCADE, related_name="outgoing_links"
    )
    target_node = models.ForeignKey(
        "Node", on_delete=models.CASCADE, related_name="incoming_links"
    )
    published = models.BooleanField(default=False)
    NORTH = 0
    EAST = 1
    SOUTH = 2
    WEST = 3
    SOURCE_PORTS = ((EAST, "e"), (SOUTH, "s"), (WEST, "w"))
    TARGET_PORTS = ((NORTH, "n"), (EAST, "e"), (WEST, "w"))
    source_port = models.PositiveIntegerField(choices=SOURCE_PORTS, default=2)
    target_port = models.PositiveIntegerField(choices=TARGET_PORTS, default=0)

    dashed = models.BooleanField(default=False)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)

    is_original = models.BooleanField(default=True)
    parent_nodelink = models.ForeignKey(
        "NodeLink", on_delete=models.SET_NULL, null=True
    )

    def get_permission_objects(self):
        return [self.get_workflow().get_subclass()]

    def get_workflow(self):
        return self.source_node.get_workflow()

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    class Meta:
        verbose_name = "Node Link"
        verbose_name_plural = "Node Links"


class Outcome(models.Model):
    title = models.CharField(max_length=500)
    description = models.TextField(max_length=500)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
    parent_outcome = models.ForeignKey(
        "Outcome", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    is_dropped = models.BooleanField(default=True)
    depth = models.PositiveIntegerField(default=0)

    children = models.ManyToManyField(
        "Outcome",
        through="OutcomeOutcome",
        blank=True,
        related_name="parent_outcomes",
    )

    horizontal_outcomes = models.ManyToManyField(
        "Outcome",
        through="OutcomeHorizontalLink",
        blank=True,
        related_name="reverse_horizontal_outcomes",
    )

    @property
    def type(self):
        return "outcome"

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def get_top_outcome(self):
        if self.parent_outcome_links.all().count() > 0:
            return self.parent_outcome_links.first().parent.get_top_outcome()
        else:
            return self

    def get_workflow(self):
        return self.get_top_outcome().workflow_set.first().get_subclass()

    #
    #    def get_project(self):
    #        return self.project_set.first()

    def get_permission_objects(self):
        return [self.get_workflow()]

    def __str__(self):
        return self.title

    def get_all_outcome_ids(self, ids):
        ids.append(self.id)
        for outcome in self.children.all():
            outcome.get_all_outcome_ids(ids)

    class Meta:
        verbose_name = "Outcome"
        verbose_name_plural = "Outcomes"


class OutcomeOutcome(models.Model):
    parent = models.ForeignKey(
        Outcome, on_delete=models.CASCADE, related_name="child_outcome_links"
    )
    child = models.ForeignKey(
        Outcome, on_delete=models.CASCADE, related_name="parent_outcome_links"
    )
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_permission_objects(self):
        return self.get_top_outcome().get_permission_objects()

    def get_top_outcome(self):
        return self.parent.get_top_outcome()

    class Meta:
        verbose_name = "Outcome-Outcome Link"
        verbose_name_plural = "Outcome-Outcome Links"


class OutcomeHorizontalLink(models.Model):
    outcome = models.ForeignKey(
        Outcome,
        on_delete=models.CASCADE,
        related_name="outcome_horizontal_links",
    )
    parent_outcome = models.ForeignKey(
        Outcome,
        on_delete=models.CASCADE,
        related_name="reverse_outcome_horizontal_links",
    )
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)
    degree = models.PositiveIntegerField(default=1)

    def get_permission_objects(self):
        return self.get_top_outcome().get_permission_objects()

    def get_top_outcome(self):
        return self.outcome.get_top_outcome()

    # Check to see if the parent has all its children the same, and add it if necessary
    def check_parent_outcomes(self):
        if self.parent_outcome.parent_outcomes.count() > 0:
            parent_outcome = self.parent_outcome.parent_outcomes.first()
            if (
                OutcomeHorizontalLink.objects.filter(
                    parent_outcome__in=parent_outcome.children.all().values_list(
                        "id", flat=True
                    ),
                    degree=self.degree,
                    outcome=self.outcome,
                ).count()
                == parent_outcome.children.all().count()
            ):
                new_outcomehorizontallink = OutcomeHorizontalLink.objects.create(
                    outcome=self.outcome,
                    degree=self.degree,
                    parent_outcome=parent_outcome,
                )
                return [
                    new_outcomehorizontallink
                ] + new_outcomehorizontallink.check_parent_outcomes()
            elif (
                OutcomeHorizontalLink.objects.filter(
                    parent_outcome=parent_outcome, outcome=self.outcome
                ).count()
                > 0
            ):
                new_outcomehorizontallink = OutcomeHorizontalLink.objects.create(
                    outcome=self.outcome,
                    degree=0,
                    parent_outcome=parent_outcome,
                )
                return [
                    new_outcomehorizontallink
                ] + new_outcomehorizontallink.check_parent_outcomes()

        return []

    # Check to see if the children already exist, and if not, add them
    def check_child_outcomes(self):
        new_children = []
        for child in self.parent_outcome.children.all():
            if (
                OutcomeHorizontalLink.objects.filter(
                    parent_outcome=child,
                    outcome=self.outcome,
                    degree=self.degree,
                ).count()
                == 0
            ):
                new_child = OutcomeHorizontalLink.objects.create(
                    parent_outcome=child,
                    outcome=self.outcome,
                    degree=self.degree,
                )
                new_children += [new_child] + new_child.check_child_outcomes()
        return new_children

    class Meta:
        verbose_name = "Outcome-Outcome Link"
        verbose_name_plural = "Outcome-Outcome Links"


class Node(models.Model):
    title = models.CharField(max_length=50, null=True, blank=True)
    description = models.TextField(max_length=500, null=True, blank=True)
    author = models.ForeignKey(
        User,
        related_name="authored_nodes",
        on_delete=models.SET_NULL,
        null=True,
    )
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)

    parent_node = models.ForeignKey(
        "Node", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)
    has_autolink = models.BooleanField(default=False)
    is_dropped = models.BooleanField(default=False)

    NONE = 0
    INDIVIDUAL = 1
    GROUPS = 2
    WHOLE_CLASS = 3
    FORMATIVE = 101
    SUMMATIVE = 102
    COMPREHENSIVE = 103
    CONTEXT_CHOICES = (
        (NONE, "None"),
        (INDIVIDUAL, "Individual Work"),
        (GROUPS, "Work in Groups"),
        (WHOLE_CLASS, "Whole Class"),
        (FORMATIVE, "Formative"),
        (SUMMATIVE, "Summative"),
        (COMPREHENSIVE, "Comprehensive"),
    )
    context_classification = models.PositiveIntegerField(
        choices=CONTEXT_CHOICES, default=0
    )
    GATHER_INFO = 1
    DISCUSS = 2
    PROBLEM_SOLVE = 3
    ANALYZE = 4
    ASSESS_PEERS = 5
    DEBATE = 6
    GAME_ROLEPLAY = 7
    CREATE_DESIGN = 8
    REVISE = 9
    READ = 10
    WRITE = 11
    PRESENT = 12
    EXPERIMENT = 13
    QUIZ_TEST = 14
    INSTRUCTOR_RESOURCE_CURATION = 15
    INSTRUCTOR_ORCHESTRATION = 16
    INSTRUCTOR_EVALUATION = 17
    OTHER = 18
    JIGSAW = 101
    PEER_INSTRUCTION = 102
    CASE_STUDIES = 103
    GALLERY_WALK = 104
    REFLECTIVE_WRITING = 105
    TWO_STAGE_EXAM = 106
    TOOLKIT = 107
    ONE_MINUTE_PAPER = 108
    DISTRIBUTED_PROBLEM_SOLVING = 109
    PEER_ASSESSMENT = 110
    TASK_CHOICES = (
        (NONE, "None"),
        (GATHER_INFO, "Gather Information"),
        (DISCUSS, "Discuss"),
        (PROBLEM_SOLVE, "Problem Solve"),
        (ANALYZE, "Analyze"),
        (ASSESS_PEERS, "Assess/Review Peers"),
        (DEBATE, "Debate"),
        (GAME_ROLEPLAY, "Game/Roleplay"),
        (CREATE_DESIGN, "Create/Design"),
        (REVISE, "Revise/Improve"),
        (READ, "Read"),
        (WRITE, "Write"),
        (PRESENT, "Present"),
        (EXPERIMENT, "Experiment/Inquiry"),
        (QUIZ_TEST, "Quiz/Test"),
        (INSTRUCTOR_RESOURCE_CURATION, "Instructor Resource Curation"),
        (INSTRUCTOR_ORCHESTRATION, "Instructor Orchestration"),
        (INSTRUCTOR_EVALUATION, "Instructor Evaluation"),
        (OTHER, "Other"),
        (JIGSAW, "Jigsaw"),
        (PEER_INSTRUCTION, "Peer Instruction"),
        (CASE_STUDIES, "Case Studies"),
        (GALLERY_WALK, "Gallery Walk"),
        (REFLECTIVE_WRITING, "Reflective Writing"),
        (TWO_STAGE_EXAM, "Two-Stage Exam"),
        (TOOLKIT, "Toolkit"),
        (ONE_MINUTE_PAPER, "One Minute Paper"),
        (DISTRIBUTED_PROBLEM_SOLVING, "Distributed Problem Solving"),
        (PEER_ASSESSMENT, "Peer Assessment"),
    )
    task_classification = models.PositiveIntegerField(
        choices=TASK_CHOICES, default=0
    )
    ACTIVITY_NODE = 0
    COURSE_NODE = 1
    PROGRAM_NODE = 2
    NODE_TYPES = (
        (ACTIVITY_NODE, "Activity Node"),
        (COURSE_NODE, "Course Node"),
        (PROGRAM_NODE, "Program Node"),
    )
    node_type = models.PositiveIntegerField(choices=NODE_TYPES, default=0)

    NO_UNITS = 0
    SECONDS = 1
    MINUTES = 2
    HOURS = 3
    DAYS = 4
    WEEKS = 5
    MONTHS = 6
    YEARS = 7
    CREDITS = 8
    UNIT_CHOICES = (
        (NO_UNITS, ""),
        (SECONDS, "seconds"),
        (MINUTES, "minutes"),
        (HOURS, "hours"),
        (DAYS, "days"),
        (WEEKS, "weeks"),
        (MONTHS, "months"),
        (YEARS, "yrs"),
        (CREDITS, "credits"),
    )

    # note: use charfield because some users like to put in ranges (i.e. 10-15 minutes)
    time_required = models.CharField(max_length=30, null=True, blank=True)
    time_units = models.PositiveIntegerField(default=0, choices=UNIT_CHOICES)

    represents_workflow = models.BooleanField(default=False)
    linked_workflow = models.ForeignKey(
        "Workflow",
        on_delete=models.SET_NULL,
        null=True,
        related_name="linked_nodes",
    )

    column = models.ForeignKey(
        "Column", on_delete=models.DO_NOTHING, null=True
    )

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeNode", blank=True
    )

    students = models.ManyToManyField(
        User,
        related_name="assigned_nodes",
        through="NodeCompletionStatus",
        blank=True,
    )

    def get_permission_objects(self):
        return [self.get_workflow().get_subclass()]

    def get_workflow(self):
        return self.week_set.first().get_workflow()

    def __str__(self):
        if self.title is not None:
            return self.title
        else:
            return self.get_node_type_display()


class NodeCompletionStatus(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Node Completion Status"
        verbose_name_plural = "Node Completion Statuses"


class OutcomeNode(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)
    degree = models.PositiveIntegerField(default=1)

    def get_permission_objects(self):
        return [self.get_workflow().get_subclass()]

    def get_workflow(self):
        return self.node.get_workflow()

    def get_top_outcome(self):
        return self.outcome.get_top_outcome()

    class Meta:
        verbose_name = "Outcome-Node Link"
        verbose_name_plural = "Outcome-Node Links"

    # Check to see if the parent has all its children the same, and add it if necessary
    def check_parent_outcomes(self):
        if self.outcome.parent_outcomes.count() > 0:
            parent_outcome = self.outcome.parent_outcomes.first()
            if (
                OutcomeNode.objects.filter(
                    outcome__in=parent_outcome.children.all().values_list(
                        "id", flat=True
                    ),
                    degree=self.degree,
                    node=self.node,
                ).count()
                == parent_outcome.children.all().count()
            ):
                new_outcomenode = OutcomeNode.objects.create(
                    node=self.node, degree=self.degree, outcome=parent_outcome
                )
                return [
                    new_outcomenode
                ] + new_outcomenode.check_parent_outcomes()
            elif (
                OutcomeNode.objects.filter(
                    outcome=parent_outcome, node=self.node
                ).count()
                > 0
            ):
                new_outcomenode = OutcomeNode.objects.create(
                    node=self.node, degree=0, outcome=parent_outcome
                )
                return [
                    new_outcomenode
                ] + new_outcomenode.check_parent_outcomes()

        return []

    # Check to see if the children already exist, and if not, add them
    def check_child_outcomes(self):
        new_children = []
        for child in self.outcome.children.all():
            if (
                OutcomeNode.objects.filter(
                    outcome=child, node=self.node, degree=self.degree
                ).count()
                == 0
            ):
                new_child = OutcomeNode.objects.create(
                    outcome=child, node=self.node, degree=self.degree
                )
                new_children += [new_child] + new_child.check_child_outcomes()
        return new_children


class Week(models.Model):
    title = models.CharField(max_length=50, null=True, blank=True)
    description = models.TextField(max_length=500, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
    default = models.BooleanField(default=False)
    parent_week = models.ForeignKey(
        "Week", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)
    published = models.BooleanField(default=False)
    is_strategy = models.BooleanField(default=False)
    original_strategy = models.ForeignKey(
        "Workflow", on_delete=models.SET_NULL, null=True
    )

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    nodes = models.ManyToManyField(Node, through="NodeWeek", blank=True)

    NONE = 0
    JIGSAW = 1
    PEER_INSTRUCTION = 2
    CASE_STUDIES = 3
    GALLERY_WALK = 4
    REFLECTIVE_WRITING = 5
    TWO_STAGE_EXAM = 6
    TOOLKIT = 7
    ONE_MINUTE_PAPER = 8
    DISTRIBUTED_PROBLEM_SOLVING = 9
    PEER_ASSESSMENT = 10
    OTHER = 11
    STRATEGY_CHOICES = (
        (NONE, "None"),
        (JIGSAW, "Jigsaw"),
        (PEER_INSTRUCTION, "Peer Instruction"),
        (CASE_STUDIES, "Case Studies"),
        (GALLERY_WALK, "Gallery Walk"),
        (REFLECTIVE_WRITING, "Reflective Writing"),
        (TWO_STAGE_EXAM, "Two-Stage Exam"),
        (TOOLKIT, "Toolkit"),
        (ONE_MINUTE_PAPER, "One Minute Paper"),
        (DISTRIBUTED_PROBLEM_SOLVING, "Distributed Problem Solving"),
        (PEER_ASSESSMENT, "Peer Assessment"),
        (OTHER, "Other"),
    )
    strategy_classification = models.PositiveIntegerField(
        choices=STRATEGY_CHOICES, default=0
    )

    PART = 0
    WEEK = 1
    TERM = 2
    WEEK_TYPES = ((PART, "Part"), (WEEK, "Week"), (TERM, "Term"))
    week_type = models.PositiveIntegerField(choices=WEEK_TYPES, default=0)

    def __str__(self):
        return self.get_week_type_display()

    def get_permission_objects(self):
        return [self.get_workflow().get_subclass()]

    def get_workflow(self):
        return self.workflow_set.first()

    class Meta:
        verbose_name = "Week"
        verbose_name_plural = "Weeks"


class NodeWeek(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_workflow(self):
        return self.week.get_workflow()

    class Meta:
        verbose_name = "Node-Week Link"
        verbose_name_plural = "Node-Week Links"


class Workflow(models.Model):
    objects = InheritanceManager()

    @property
    def author(self):
        return self.get_subclass().author

    title = models.CharField(max_length=50, null=True, blank=True)
    description = models.TextField(max_length=500, null=True, blank=True)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)

    static = models.BooleanField(default=False)

    published = models.BooleanField(default=False)

    is_strategy = models.BooleanField(default=False)

    from_saltise = models.BooleanField(default=False)

    parent_workflow = models.ForeignKey(
        "Workflow", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    disciplines = models.ManyToManyField("Discipline", blank=True)
    weeks = models.ManyToManyField(Week, through="WeekWorkflow", blank=True)

    columns = models.ManyToManyField(
        Column, through="ColumnWorkflow", blank=True
    )

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeWorkflow", blank=True
    )

    OUTCOMES_NORMAL = 0
    OUTCOMES_ADVANCED = 1
    OUTCOME_TYPES = (
        (OUTCOMES_NORMAL, "Normal"),
        (OUTCOMES_ADVANCED, "Advanced"),
    )
    outcomes_type = models.PositiveIntegerField(
        choices=OUTCOME_TYPES, default=0
    )

    OUTCOME_SORT_WEEK = 0
    OUTCOME_SORT_COLUMN = 1
    OUTCOME_SORT_TASK = 2
    OUTCOME_SORT_CONTEXT = 3
    OUTCOME_SORTS = (
        (OUTCOME_SORT_WEEK, "Time"),
        (OUTCOME_SORT_COLUMN, "Category"),
        (OUTCOME_SORT_TASK, "Task"),
        (OUTCOME_SORT_CONTEXT, "Context"),
    )
    outcomes_sort = models.PositiveIntegerField(
        choices=OUTCOME_SORTS, default=0
    )

    SUBCLASSES = ["activity", "course", "program"]

    @property
    def type(self):
        for subclass in self.SUBCLASSES:
            try:
                return getattr(self, subclass).type
            except AttributeError:
                pass
        return "workflow"

    def get_project(self):
        return self.project_set.first()

    def get_permission_objects(self):
        return [self.get_subclass()]

    def get_subclass(self):
        subclass = self
        try:
            subclass = self.activity
        except AttributeError:
            pass
        try:
            subclass = self.course
        except AttributeError:
            pass
        try:
            subclass = self.program
        except AttributeError:
            pass
        return subclass

    def get_all_outcome_ids(self):
        ids = []
        for outcome in self.outcomes.all():
            outcome.get_all_outcome_ids(ids)
        return ids

    def __str__(self):
        if self.title is not None:
            return self.title
        else:
            return self.type


class Activity(Workflow):
    author = models.ForeignKey(
        User,
        related_name="authored_activities",
        on_delete=models.SET_NULL,
        null=True,
    )

    students = models.ManyToManyField(
        User, related_name="assigned_activities", blank=True
    )

    favourited_by = GenericRelation("Favourite", related_query_name="activity")
    user_permissions = GenericRelation(
        "ObjectPermission", related_query_name="activity"
    )

    DEFAULT_CUSTOM_COLUMN = 0
    DEFAULT_COLUMNS = [1, 2, 3, 4]
    WORKFLOW_TYPE = 0

    @property
    def type(self):
        return "activity"

    def get_permission_objects(self):
        return [self]

    def __str__(self):
        if self.title is not None:
            return self.title
        else:
            return self.type

    class Meta:
        verbose_name = "Activity"
        verbose_name_plural = "Activities"


class Course(Workflow):
    author = models.ForeignKey(
        User,
        related_name="authored_courses",
        on_delete=models.SET_NULL,
        null=True,
    )

    students = models.ManyToManyField(
        User, related_name="assigned_courses", blank=True
    )

    favourited_by = GenericRelation("Favourite", related_query_name="course")
    user_permissions = GenericRelation(
        "ObjectPermission", related_query_name="course"
    )

    DEFAULT_CUSTOM_COLUMN = 10
    DEFAULT_COLUMNS = [11, 12, 13, 14]
    WORKFLOW_TYPE = 1

    @property
    def type(self):
        return "course"

    def get_permission_objects(self):
        return [self]

    def __str__(self):
        if self.title is not None:
            return self.title
        else:
            return self.type


class Program(Workflow):
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    DEFAULT_CUSTOM_COLUMN = 20
    DEFAULT_COLUMNS = [20, 20, 20]
    WORKFLOW_TYPE = 2

    favourited_by = GenericRelation("Favourite", related_query_name="program")
    user_permissions = GenericRelation(
        "ObjectPermission", related_query_name="program"
    )

    @property
    def type(self):
        return "program"

    def get_permission_objects(self):
        return [self]

    def __str__(self):
        if self.title is not None:
            return self.title
        else:
            return self.type


class ColumnWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    column = models.ForeignKey(Column, on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_workflow():
        return self.workflow

    def get_permission_objects(self):
        return [self.get_workflow().get_subclass()]

    class Meta:
        verbose_name = "Column-Workflow Link"
        verbose_name_plural = "Column-Workflow Links"


class WeekWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_workflow():
        return self.workflow

    def get_permission_objects(self):
        return [self.get_workflow().get_subclass()]

    class Meta:
        verbose_name = "Week-Workflow Link"
        verbose_name_plural = "Week-Workflow Links"


class Discipline(models.Model):
    title = models.CharField(
        _("Discipline name"),
        unique=True,
        max_length=100,
        help_text=_("Enter the name of a new discipline."),
    )

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = _("discipline")
        verbose_name_plural = _("disciplines")


class Favourite(models.Model):
    content_choices = {
        "model__in": ["project", "activity", "course", "program"]
    }
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, limit_choices_to=content_choices
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")


class ObjectPermission(models.Model):
    content_choices = {
        "model__in": ["project", "activity", "course", "program"]
    }
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, limit_choices_to=content_choices
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    PERMISSION_NONE = 0
    PERMISSION_VIEW = 1
    PERMISSION_EDIT = 2
    PERMISSION_CHOICES = (
        (PERMISSION_NONE, "None"),
        (PERMISSION_VIEW, "View"),
        (PERMISSION_EDIT, "Edit"),
    )
    permission_type = models.PositiveIntegerField(
        choices=PERMISSION_CHOICES, default=PERMISSION_NONE
    )


"""
Other receivers
"""


def get_allowed_parent_outcomes(workflow, **kwargs):
    exclude_node = kwargs.get("exclude_node", None)
    exclude_outcomenode = kwargs.get("exclude_outcomenode", None)
    parent_outcomes = []
    parent_outcomenodes = []
    for parent_node in workflow.linked_nodes.exclude(id=exclude_node):
        parent_outcomenodes += parent_node.outcomenode_set.exclude(
            id=exclude_outcomenode
        )
    parent_node_base_outcomes = [ocn.outcome for ocn in parent_outcomenodes]
    for oc in parent_node_base_outcomes:
        parent_outcomes += get_all_outcomes(oc, 0)
    return parent_outcomes


@receiver(pre_delete, sender=OutcomeNode)
def remove_horizontal_outcome_links_on_outcomenode_delete(
    sender, instance, **kwargs
):
    workflow = instance.node.linked_workflow
    if workflow is not None:
        linked_outcomes = list(workflow.outcomes.all())
        parent_outcomes = get_allowed_parent_outcomes(
            workflow, exclude_outcomenode=instance.pk
        )
        OutcomeHorizontalLink.objects.filter(
            outcome__in=linked_outcomes
        ).exclude(parent_outcome__in=parent_outcomes).delete()


@receiver(pre_save, sender=Node)
def remove_horizontal_outcome_links_on_node_unlink(sender, instance, **kwargs):
    if instance.pk is None:
        return
    old_workflow = Node.objects.get(id=instance.pk).linked_workflow
    new_workflow = instance.linked_workflow
    if old_workflow is not None and (
        new_workflow is None or new_workflow.pk == old_workflow.pk
    ):
        linked_outcomes = list(old_workflow.outcomes.all())
        parent_outcomes = get_allowed_parent_outcomes(
            old_workflow, exclude_node=instance.pk
        )
        OutcomeHorizontalLink.objects.filter(
            outcome__in=linked_outcomes
        ).exclude(parent_outcome__in=parent_outcomes).delete()


@receiver(pre_delete, sender=Project)
def delete_project_objects(sender, instance, **kwargs):
    instance.workflows.all().delete()


@receiver(pre_delete, sender=Workflow)
def delete_workflow_objects(sender, instance, **kwargs):
    instance.weeks.all().delete()
    instance.columns.all().delete()
    instance.outcomes.all().delete()


@receiver(pre_delete, sender=Week)
def delete_week_objects(sender, instance, **kwargs):
    instance.nodes.all().delete()


@receiver(pre_delete, sender=Node)
def delete_node_objects(sender, instance, **kwargs):
    instance.outgoing_links.all().delete()
    instance.incoming_links.all().delete()
    if instance.linked_workflow is not None:
        instance.linked_workflow = None
        instance.save()
    


@receiver(pre_delete, sender=Outcome)
def delete_outcome_objects(sender, instance, **kwargs):
    instance.children.all().delete()


@receiver(post_save, sender=NodeWeek)
def switch_node_to_static(sender, instance, created, **kwargs):
    if created:
        activity = Activity.objects.filter(weeks=instance.week).first()
        if activity:
            if activity.static:
                instance.node.students.add(*list(activity.students.all()))


@receiver(pre_delete, sender=Column)
def move_nodes(sender, instance, **kwargs):
    columnworkflow = instance.columnworkflow_set.first()
    if columnworkflow is None:
        print("This column has no columnworkflow, probably orphaned")
        return
    workflow = columnworkflow.workflow

    other_columns = (
        workflow.columnworkflow_set.all()
        .order_by("rank")
        .exclude(column=instance)
    )
    if other_columns.count() > 0:
        new_column = other_columns.first().column
        for node in Node.objects.filter(column=instance):
            node.column = new_column
            node.save()
    else:
        print("couldn't find a column")


# Removed, this interferes with automatic adding/removing of ndoes
# @receiver(post_save, sender=OutcomeNode)
# def delete_outcomenode_no_degree(sender, instance, created, **kwargs):
#    if instance.degree == 0:
#        instance.delete()


"""
Reorder Receivers
"""


@receiver(pre_delete, sender=NodeWeek)
def reorder_for_deleted_node_week(sender, instance, **kwargs):
    for out_of_order_link in NodeWeek.objects.filter(
        week=instance.week, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=WeekWorkflow)
def reorder_for_deleted_week_workflow(sender, instance, **kwargs):
    for out_of_order_link in WeekWorkflow.objects.filter(
        workflow=instance.workflow, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=ColumnWorkflow)
def reorder_for_deleted_column_workflow(sender, instance, **kwargs):
    for out_of_order_link in ColumnWorkflow.objects.filter(
        workflow=instance.workflow, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=OutcomeWorkflow)
def reorder_for_deleted_outcome_workflow(sender, instance, **kwargs):
    for out_of_order_link in OutcomeWorkflow.objects.filter(
        workflow=instance.workflow, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=OutcomeOutcome)
def reorder_for_deleted_outcome_outcome(sender, instance, **kwargs):
    for out_of_order_link in OutcomeOutcome.objects.filter(
        parent=instance.parent, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=OutcomeNode)
def reorder_for_deleted_outcome_node(sender, instance, **kwargs):
    for out_of_order_link in OutcomeNode.objects.filter(
        node=instance.node, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=OutcomeHorizontalLink)
def reorder_for_deleted_outcome_horizontal_link(sender, instance, **kwargs):
    for out_of_order_link in OutcomeNode.objects.filter(
        outcome=instance.outcome, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_save, sender=NodeWeek)
def delete_existing_node_week(sender, instance, **kwargs):
    if instance.pk is None:
        NodeWeek.objects.filter(node=instance.node).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = NodeWeek.objects.filter(week=instance.week).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=NodeWeek)
def reorder_for_created_node_week(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in NodeWeek.objects.filter(
            week=instance.week, rank__gte=instance.rank
        ).exclude(node=instance.node):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(pre_save, sender=WeekWorkflow)
def delete_existing_week_workflow(sender, instance, **kwargs):
    if instance.pk is None:
        WeekWorkflow.objects.filter(week=instance.week).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = WeekWorkflow.objects.filter(
            workflow=instance.workflow
        ).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=WeekWorkflow)
def reorder_for_created_week_workflow(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in WeekWorkflow.objects.filter(
            workflow=instance.workflow, rank__gte=instance.rank
        ).exclude(week=instance.week):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(pre_save, sender=ColumnWorkflow)
def delete_existing_column_workflow(sender, instance, **kwargs):
    if instance.pk is None:
        ColumnWorkflow.objects.filter(column=instance.column).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = ColumnWorkflow.objects.filter(
            workflow=instance.workflow
        ).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=ColumnWorkflow)
def reorder_for_created_column_workflow(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in ColumnWorkflow.objects.filter(
            workflow=instance.workflow, rank__gte=instance.rank
        ).exclude(column=instance.column):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(pre_save, sender=OutcomeWorkflow)
def delete_existing_outcome_workflow(sender, instance, **kwargs):
    if instance.pk is None:
        OutcomeWorkflow.objects.filter(outcome=instance.outcome).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = OutcomeWorkflow.objects.filter(
            workflow=instance.workflow
        ).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=OutcomeWorkflow)
def reorder_for_created_outcome_workflow(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in OutcomeWorkflow.objects.filter(
            workflow=instance.workflow, rank__gte=instance.rank
        ).exclude(outcome=instance.outcome):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(pre_save, sender=OutcomeOutcome)
def delete_existing_outcome_outcome(sender, instance, **kwargs):
    if instance.pk is None:
        OutcomeOutcome.objects.filter(child=instance.child).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = OutcomeOutcome.objects.filter(
            parent=instance.parent
        ).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=OutcomeOutcome)
def reorder_for_created_outcome_outcome(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in OutcomeOutcome.objects.filter(
            parent=instance.parent, rank__gte=instance.rank
        ).exclude(child=instance.child):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(pre_save, sender=OutcomeNode)
def delete_existing_outcome_node(sender, instance, **kwargs):
    if instance.pk is None:
        OutcomeNode.objects.filter(
            node=instance.node, outcome=instance.outcome
        ).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = OutcomeNode.objects.filter(
            node=instance.node
        ).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=OutcomeNode)
def reorder_for_created_outcome_node(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in OutcomeNode.objects.filter(
            node=instance.node, rank__gte=instance.rank
        ).exclude(outcome=instance.outcome):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(pre_save, sender=OutcomeHorizontalLink)
def delete_existing_horizontal_link(sender, instance, **kwargs):
    if instance.pk is None:
        OutcomeHorizontalLink.objects.filter(
            outcome=instance.outcome, parent_outcome=instance.parent_outcome
        ).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = OutcomeHorizontalLink.objects.filter(
            outcome=instance.outcome
        ).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(post_save, sender=OutcomeHorizontalLink)
def reorder_for_created_horizontal_outcome_link(
    sender, instance, created, **kwargs
):
    if created:
        for out_of_order_link in OutcomeHorizontalLink.objects.filter(
            outcome=instance.outcome, rank__gte=instance.rank
        ).exclude(parent_outcome=instance.parent_outcome):
            out_of_order_link.rank += 1
            out_of_order_link.save()


"""
Default content creation receivers
"""


@receiver(post_save, sender=ObjectPermission)
def set_permissions_to_project_objects(sender, instance, created, **kwargs):
    if created:
        if instance.content_type == ContentType.objects.get_for_model(Project):
            for workflow in instance.content_object.workflows.all():
                # If user already has edit permissions and we are adding view, do not override
                if (
                    instance.permission_type
                    == ObjectPermission.PERMISSION_VIEW
                    and ObjectPermission.objects.filter(
                        user=instance.user,
                        content_type=ContentType.objects.get_for_model(
                            workflow.get_subclass()
                        ),
                        object_id=workflow.id,
                        permission_type=ObjectPermission.PERMISSION_EDIT,
                    ).count()
                    > 0
                ):
                    pass
                else:
                    ObjectPermission.objects.create(
                        user=instance.user,
                        content_object=workflow.get_subclass(),
                        permission_type=instance.permission_type,
                    )


#        elif instance.content_type == ContentType.objects.get_for_model(Workflow):
#            workflow = instance.content_object
#            if not workflow.is_strategy:
#                project = workflow.project
#                ObjectPermission.objects.create(content_object=project, user=instance.user,permission_type=ObjectPermission.PERMISSION_VIEW)


@receiver(pre_save, sender=ObjectPermission)
def delete_existing_permission(sender, instance, **kwargs):
    ObjectPermission.objects.filter(
        user=instance.user,
        content_type=instance.content_type,
        object_id=instance.object_id,
    ).delete()


@receiver(pre_delete, sender=ObjectPermission)
def remove_permissions_to_project_objects(sender, instance, **kwargs):
    if instance.content_type == ContentType.objects.get_for_model(Project):
        for workflow in instance.content_object.workflows.all():
            ObjectPermission.objects.filter(
                user=instance.user,
                content_type=ContentType.objects.get_for_model(
                    workflow.get_subclass()
                ),
                object_id=workflow.get_subclass().id,
            ).delete()


@receiver(post_save, sender=Project)
def set_publication_of_project_objects(sender, instance, created, **kwargs):
    for workflow in instance.workflows.all():
        workflow.published = instance.published
        workflow.disciplines.set(instance.disciplines.all())
        workflow.save()


#    for outcome in instance.outcomes.all():
#        outcome.published = instance.published
#        outcome.disciplines.set(instance.disciplines.all())
#        outcome.save()


@receiver(post_save, sender=NodeWeek)
def set_node_type_default(sender, instance, created, **kwargs):
    node = instance.node
    try:
        node.node_type = instance.week.week_type
        node.save()
    except:
        print("couldn't set default node type")


@receiver(post_save, sender=WeekWorkflow)
def set_week_type_default(sender, instance, created, **kwargs):
    week = instance.week
    try:
        week.week_type = instance.workflow.get_subclass().WORKFLOW_TYPE
        week.save()
    except:
        print("couldn't set default week type")


@receiver(post_save, sender=OutcomeOutcome)
def set_outcome_depth_default(sender, instance, created, **kwargs):
    child = instance.child
    try:
        child.depth = instance.parent.depth + 1
        child.save()
    except:
        print("couldn't set default outcome depth")


@receiver(post_save, sender=Node)
def create_default_node_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If this is an activity-level node, set the autolinks to true
        if instance.node_type == instance.ACTIVITY_NODE:
            instance.has_autolink = True
            instance.save()


@receiver(post_save, sender=Activity)
def create_default_activity_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If the activity is newly created, add the default columns
        cols = instance.DEFAULT_COLUMNS
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                column_type=col,
                author=instance.author,
            )

        instance.weeks.create(
            week_type=Week.PART,
            author=instance.author,
            is_strategy=instance.is_strategy,
        )
        instance.save()


@receiver(post_save, sender=Course)
def create_default_course_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If the activity is newly created, add the default columns
        cols = instance.DEFAULT_COLUMNS
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                column_type=col,
                author=instance.author,
            )

        instance.weeks.create(
            week_type=Week.WEEK,
            author=instance.author,
            is_strategy=instance.is_strategy,
        )
        instance.save()


@receiver(post_save, sender=Program)
def create_default_program_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If the activity is newly created, add the default columns
        cols = instance.DEFAULT_COLUMNS
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                column_type=col,
                author=instance.author,
            )

        instance.weeks.create(
            week_type=Week.TERM,
            author=instance.author,
            is_strategy=instance.is_strategy,
        )
        instance.save()


@receiver(post_save, sender=WorkflowProject)
def set_publication_workflow(sender, instance, created, **kwargs):
    if created:
        # Set the workflow's publication status to that of the project
        workflow = instance.workflow
        workflow.published = instance.project.published
        workflow.disciplines.set(instance.project.disciplines.all())
        if instance.project.author != workflow.get_subclass().author:
            ObjectPermission.objects.create(
                content_object=workflow.get_subclass(),
                user=instance.project.author,
                permission_type=ObjectPermission.PERMISSION_EDIT,
            )
        for op in ObjectPermission.objects.filter(
            content_type=ContentType.objects.get_for_model(instance.project),
            object_id=instance.project.id,
        ):
            ObjectPermission.objects.create(
                content_object=workflow.get_subclass(),
                user=op.user,
                permission_type=op.permission_type,
            )
        workflow.save()


# @receiver(post_save, sender=OutcomeProject)
# def set_publication_outcome(sender, instance, created, **kwargs):
#    if created:
#        # Set the workflow's publication status to that of the project
#        outcome = instance.outcome
#        outcome.published = instance.project.published
#        outcome.disciplines.set(instance.project.disciplines.all())
#        if instance.project.author != outcome.author:
#            ObjectPermission.objects.create(
#                content_object=outcome,
#                user=instance.project.author,
#                permission_type=ObjectPermission.PERMISSION_EDIT,
#            )
#        for op in ObjectPermission.objects.filter(
#            content_type=ContentType.objects.get_for_model(instance.project),
#            object_id=instance.project.id,
#        ):
#            ObjectPermission.objects.create(
#                content_object=outcome,
#                user=op.user,
#                permission_type=op.permission_type,
#            )
#        outcome.save()


@receiver(post_save, sender=WeekWorkflow)
def switch_week_to_static(sender, instance, created, **kwargs):
    if created:
        if instance.workflow.static:
            for node in instance.week.nodes.all():
                node.students.add(*list(instance.workflow.students.all()))
