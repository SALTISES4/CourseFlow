import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models.signals import pre_delete, post_save
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _
from model_utils.managers import InheritanceManager


User = get_user_model()


class Column(models.Model):
    title = models.CharField(max_length=50, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
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

    default_columns = {
        "activity": [1, 2, 3, 4],
        "course": [11, 12, 13, 14],
        "program": [20, 20, 20],
    }

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return self.get_column_type_display()

    class Meta:
        verbose_name = "Column"
        verbose_name_plural = "Columns"


class NodeLink(models.Model):
    title = models.CharField(max_length=100, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    source_node = models.ForeignKey(
        "Node", on_delete=models.CASCADE, related_name="outgoing_links"
    )
    target_node = models.ForeignKey(
        "Node", on_delete=models.CASCADE, related_name="incoming_links"
    )
    NORTH=0
    EAST=1
    SOUTH=2
    WEST=3
    SOURCE_PORTS = (
        (EAST,"e"),
        (SOUTH,"s"),
        (WEST,"w")
    )
    TARGET_PORTS = (
        (NORTH,"n"),
        (EAST,"e"),
        (WEST,"w")
    )
    source_port = models.PositiveIntegerField(
        choices=SOURCE_PORTS, default=2
    )
    target_port = models.PositiveIntegerField(
        choices=TARGET_PORTS, default=0
    )
    
    dashed = models.BooleanField(default=False)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    class Meta:
        verbose_name = "Node Link"
        verbose_name_plural = "Node Links"


class Outcome(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Outcome"
        verbose_name_plural = "Outcomes"


class Node(models.Model):
    title = models.CharField(max_length=30, blank=True)
    description = models.TextField(max_length=400, blank=True)
    author = models.ForeignKey(
        User,
        related_name="authored_nodes",
        on_delete=models.SET_NULL,
        null=True,
    )
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    parent_node = models.ForeignKey(
        "Node", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)
    has_autolink = models.BooleanField(default=False)

    INDIVIDUAL = 1
    GROUPS = 2
    WHOLE_CLASS = 3
    WORK_TYPES = (
        (INDIVIDUAL, "Individual Work"),
        (GROUPS, "Work in Groups"),
        (WHOLE_CLASS, "Whole Class"),
    )
    work_classification = models.PositiveIntegerField(
        choices=WORK_TYPES, default=2
    )
    GATHER_INFO = 1
    DISCUSS = 2
    SOLVE = 3
    ANALYZE = 4
    EVAL_PAPERS = 5
    EVAL_PEERS = 6
    DEBATE = 7
    GAME_ROLEPLAY = 8
    CREATE_DESIGN = 9
    REVISE = 10
    READ = 11
    WRITE = 12
    PRESENT = 13
    EXPERIMENT = 14
    QUIZ_TEST = 15
    OTHER = 16
    ACTIVITY_TYPES = (
        (GATHER_INFO, "Gather Information"),
        (DISCUSS, "Discuss"),
        (SOLVE, "Solve"),
        (ANALYZE, "Analyze"),
        (EVAL_PAPERS, "Assess/Review Papers"),
        (EVAL_PEERS, "Evaluate Peers"),
        (DEBATE, "Debate"),
        (GAME_ROLEPLAY, "Game/Roleplay"),
        (CREATE_DESIGN, "Create/Design"),
        (REVISE, "Revise/Improve"),
        (READ, "Read"),
        (WRITE, "Write"),
        (PRESENT, "Present"),
        (EXPERIMENT, "Experiment/Inquiry"),
        (QUIZ_TEST, "Quiz/Test"),
        (OTHER, "Other"),
    )
    activity_classification = models.PositiveIntegerField(
        choices=ACTIVITY_TYPES, default=1
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

    column = models.ForeignKey("Column", on_delete=models.PROTECT, null=True)

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

    def __str__(self):
        if self.title is not None: return self.title
        else: return self.get_node_type_display()


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
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Node Link"
        verbose_name_plural = "Outcome-Node Links"


class Strategy(models.Model):
    title = models.CharField(max_length=30, blank=True)
    description = models.TextField(max_length=400, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    default = models.BooleanField(default=False)
    parent_strategy = models.ForeignKey(
        "Strategy", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    nodes = models.ManyToManyField(Node, through="NodeStrategy", blank=True)

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeStrategy", blank=True
    )

    PART = 0
    WEEK = 1
    TERM = 2
    STRATEGY_TYPES = ((PART, "Part"), (WEEK, "Week"), (TERM, "Term"))
    strategy_type = models.PositiveIntegerField(
        choices=STRATEGY_TYPES, default=0
    )

    def __str__(self):
        return self.get_strategy_type_display()

    class Meta:
        verbose_name = "Strategy"
        verbose_name_plural = "Strategies"


class OutcomeStrategy(models.Model):
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Strategy Link"
        verbose_name_plural = "Outcome-Strategy Links"


class NodeStrategy(models.Model):
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Node-Strategy Link"
        verbose_name_plural = "Node-Strategy Links"


class Workflow(models.Model):
    objects = InheritanceManager()

    title = models.CharField(max_length=30, blank=True)
    description = models.TextField(max_length=400, blank=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    static = models.BooleanField(default=False)

    parent_workflow = models.ForeignKey(
        "Workflow", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    strategies = models.ManyToManyField(
        Strategy, through="StrategyWorkflow", blank=True
    )

    columns = models.ManyToManyField(
        Column, through="ColumnWorkflow", blank=True
    )

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeWorkflow", blank=True
    )

    SUBCLASSES = ["activity", "course", "program"]

    @property
    def type(self):
        for subclass in self.SUBCLASSES:
            try:
                return getattr(self,subclass).type
            except AttributeError:
                pass
        return "workflow"

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

    def __str__(self):
        if self.title is not None: return self.title
        else: return self.type()


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

    DEFAULT_CUSTOM_COLUMN = 0
    WORKFLOW_TYPE = 0

    @property
    def type(self):
        return "activity"

    def __str__(self):
        if self.title is not None:return self.title
        else: return self.type()

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

    discipline = models.ForeignKey(
        "Discipline", on_delete=models.SET_NULL, null=True
    )

    students = models.ManyToManyField(
        User, related_name="assigned_courses", blank=True
    )

    DEFAULT_CUSTOM_COLUMN = 10
    WORKFLOW_TYPE = 1

    @property
    def type(self):
        return "course"

    def __str__(self):
        if self.title is not None:return self.title
        else: return self.type()


class Program(Workflow):
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    DEFAULT_CUSTOM_COLUMN = 20
    WORKFLOW_TYPE = 2

    @property
    def type(self):
        return "program"

    def __str__(self):
        if self.title is not None:return self.title
        else: return self.type()


class ColumnWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    column = models.ForeignKey(Column, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Column-Workflow Link"
        verbose_name_plural = "Column-Workflow Links"


class OutcomeWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Workflow Link"
        verbose_name_plural = "Outcome-Workflow Links"


class StrategyWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Strategy-Workflow Link"
        verbose_name_plural = "Strategy-Workflow Links"


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


@receiver(pre_delete, sender=Workflow)
def delete_workflow_objects(sender, instance, **kwargs):
    instance.strategies.all().delete()
    instance.columns.all().delete()


@receiver(pre_delete, sender=Strategy)
def delete_strategy_objects(sender, instance, **kwargs):
    instance.nodes.all().delete()


@receiver(post_save, sender=NodeStrategy)
def switch_node_to_static(sender, instance, created, **kwargs):
    if created:
        activity = Activity.objects.filter(
            strategies=instance.strategy
        ).first()
        if activity:
            if activity.static:
                instance.node.students.add(*list(activity.students.all()))


"""
Reorder Receivers
"""


@receiver(pre_delete, sender=NodeStrategy)
def reorder_for_deleted_node_strategy(sender, instance, **kwargs):
    for out_of_order_link in NodeStrategy.objects.filter(
        strategy=instance.strategy, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=StrategyWorkflow)
def reorder_for_deleted_strategy_workflow(sender, instance, **kwargs):
    for out_of_order_link in StrategyWorkflow.objects.filter(
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


@receiver(post_save, sender=NodeStrategy)
def reorder_for_inserted_node_strategy(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in NodeStrategy.objects.filter(
            strategy=instance.strategy, rank__gte=instance.rank
        ).exclude(node=instance.node):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(post_save, sender=StrategyWorkflow)
def reorder_for_inserted_strategy_workflow(
    sender, instance, created, **kwargs
):
    if created:
        for out_of_order_link in StrategyWorkflow.objects.filter(
            workflow=instance.workflow, rank__gte=instance.rank
        ).exclude(strategy=instance.strategy):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(post_save, sender=ColumnWorkflow)
def reorder_for_inserted_column_workflow(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in ColumnWorkflow.objects.filter(
            workflow=instance.workflow, rank__gte=instance.rank
        ).exclude(column=instance.column):
            out_of_order_link.rank += 1
            out_of_order_link.save()


"""
Default content creation receivers
"""

@receiver(post_save, sender=Node)
def create_default_node_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        print(instance.node_type)
        # If this is an activity-level node, set the autolinks to true
        if instance.node_type==instance.ACTIVITY_NODE:
            instance.has_autolink=True
            instance.save()

@receiver(post_save, sender=Activity)
def create_default_activity_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If the activity is newly created, add the default columns
        cols = Column.default_columns["activity"]
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                column_type=col,
                author=instance.author,
            )

        instance.strategies.create(
            strategy_type=Strategy.PART, author=instance.author
        )
        instance.save()


@receiver(post_save, sender=Course)
def create_default_course_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If the activity is newly created, add the default columns
        cols = Column.default_columns["course"]
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                column_type=col,
                author=instance.author,
            )

        instance.strategies.create(
            strategy_type=Strategy.WEEK, author=instance.author
        )
        instance.save()


@receiver(post_save, sender=Program)
def create_default_program_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If the activity is newly created, add the default columns
        cols = Column.default_columns["program"]
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                column_type=col,
                author=instance.author,
            )

        instance.strategies.create(
            strategy_type=Strategy.TERM, author=instance.author
        )
        instance.save()


@receiver(post_save, sender=StrategyWorkflow)
def switch_strategy_to_static(sender, instance, created, **kwargs):
    if created:
        if instance.workflow.static:
            for node in instance.strategy.nodes.all():
                node.students.add(*list(instance.workflow.students.all()))


model_lookups = {
    "nodelink": NodeLink,
    "node": Node,
    "column": Column,
    "strategy": Strategy,
    "activity": Activity,
    "course": Course,
    "program": Program,
    "workflow": Workflow,
    "nodestrategy": NodeStrategy,
    "strategyworkflow": StrategyWorkflow,
    "columnworkflow": ColumnWorkflow,
}
model_keys = [
    "nodelink",
    "node",
    "column",
    "strategy",
    "activity",
    "course",
    "program",
    "nodestrategy",
    "strategyworkflow",
    "columnworkflow",
]
