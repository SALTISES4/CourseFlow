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

class Project(models.Model):
    title = models.CharField(max_length=50, null=True, blank=True)
    description = models.CharField(max_length=400, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)
    
    
    workflows= models.ManyToManyField(
        "Workflow", through="WorkflowProject", blank=True
    )
    outcomes = models.ManyToManyField(
        "Outcome", through="OutcomeProject",blank=True
    )
    
    class Meta:
        verbose_name = "Project"
        verbose_name_plural = "Projects"
    
class WorkflowProject(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    workflow = models.ForeignKey("Workflow", on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Workflow-Project Link"
        verbose_name_plural = "Workflow-Project Links"

class OutcomeProject(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    outcome = models.ForeignKey("Outcome", on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Project Link"
        verbose_name_plural = "Outcome-Project Links"
        
class Column(models.Model):
    title = models.CharField(max_length=50, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)
    visible = models.BooleanField(default=True)
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

    is_original=models.BooleanField(default=False)
    parent_column=models.ForeignKey(
        "Column", on_delete=models.SET_NULL, null=True
    )
    

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

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
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    is_original=models.BooleanField(default=True)
    parent_nodelink=models.ForeignKey(
        "NodeLink", on_delete=models.SET_NULL, null=True
    )
    
    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    class Meta:
        verbose_name = "Node Link"
        verbose_name_plural = "Node Links"


class Outcome(models.Model):
    title = models.CharField(max_length=400)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)
    parent_outcome = models.ForeignKey(
        "Outcome", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)
    
    is_dropped = models.BooleanField(default=True)
    depth = models.PositiveIntegerField(default=0)
    
    

    
    children = models.ManyToManyField("Outcome", through="OutcomeOutcome", blank=True, related_name="parent_outcomes")
    
    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Outcome"
        verbose_name_plural = "Outcomes"


class OutcomeOutcome(models.Model):
    parent = models.ForeignKey(Outcome, on_delete=models.CASCADE, related_name='child_outcome_links')
    child = models.ForeignKey(Outcome, on_delete=models.CASCADE, related_name='parent_outcome_links')
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Outcome Link"
        verbose_name_plural = "Outcome-Outcome Links"

class Node(models.Model):
    title = models.CharField(max_length=30, null=True, blank=True)
    description = models.TextField(max_length=400, null=True, blank=True)
    author = models.ForeignKey(
        User,
        related_name="authored_nodes",
        on_delete=models.SET_NULL,
        null=True,
    )
    created_on = models.DateTimeField(auto_now_add=True)
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
        (NONE,"None"),
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
        (NONE,"None"),
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
        (INSTRUCTOR_RESOURCE_CURATION,"Instructor Resource Curation"),
        (INSTRUCTOR_ORCHESTRATION,"Instructor Orchestration"),
        (INSTRUCTOR_EVALUATION,"Instructor Evaluation"),
        (OTHER, "Other"),
        (JIGSAW,"Jigsaw"),
        (PEER_INSTRUCTION,"Peer Instruction"),
        (CASE_STUDIES,"Case Studies"),
        (GALLERY_WALK,"Gallery Walk"),
        (REFLECTIVE_WRITING,"Reflective Writing"),
        (TWO_STAGE_EXAM,"Two-Stage Exam"),
        (TOOLKIT,"Toolkit"),
        (ONE_MINUTE_PAPER,"One Minute Paper"),
        (DISTRIBUTED_PROBLEM_SOLVING,"Distributed Problem Solving"),
        (PEER_ASSESSMENT,"Peer Assessment"),
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
    
    
    NO_UNITS=0
    SECONDS=1
    MINUTES=2
    HOURS=3
    DAYS=4
    WEEKS=5
    MONTHS=6
    YEARS=7
    CREDITS=8
    UNIT_CHOICES = (
        (NO_UNITS,""),
        (SECONDS,"seconds"),
        (MINUTES,"minutes"),
        (HOURS,"hours"),
        (DAYS,"days"),
        (WEEKS,"weeks"),
        (MONTHS,"months"),
        (YEARS,"yrs"),
        (CREDITS,"credits")
    )
    
    #note: use charfield because some users like to put in ranges (i.e. 10-15 minutes)
    time_required = models.CharField(max_length=30, null=True, blank=True)
    time_units = models.PositiveIntegerField(default=0,choices=UNIT_CHOICES)
    
    
    
    represents_workflow = models.BooleanField(default=False)
    linked_workflow = models.ForeignKey("Workflow", on_delete=models.SET_NULL, null=True)

    column = models.ForeignKey("Column", on_delete=models.DO_NOTHING, null=True)

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
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)
    degree = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = "Outcome-Node Link"
        verbose_name_plural = "Outcome-Node Links"


class Week(models.Model):
    title = models.CharField(max_length=30, null=True, blank=True)
    description = models.TextField(max_length=400, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    default = models.BooleanField(default=False)
    parent_week = models.ForeignKey(
        "Week", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)
    published = models.BooleanField(default=False)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    nodes = models.ManyToManyField(Node, through="NodeWeek", blank=True)


    PART = 0
    WEEK = 1
    TERM = 2
    STRATEGY_TYPES = ((PART, "Part"), (WEEK, "Week"), (TERM, "Term"))
    week_type = models.PositiveIntegerField(
        choices=STRATEGY_TYPES, default=0
    )

    def __str__(self):
        return self.get_week_type_display()

    class Meta:
        verbose_name = "Week"
        verbose_name_plural = "Weeks"


class OutcomeWeek(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Week Link"
        verbose_name_plural = "Outcome-Week Links"


class NodeWeek(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Node-Week Link"
        verbose_name_plural = "Node-Week Links"


class Workflow(models.Model):
    objects = InheritanceManager()

    title = models.CharField(max_length=30, null=True, blank=True)
    description = models.TextField(max_length=400, null=True, blank=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    static = models.BooleanField(default=False)
    
    published = models.BooleanField(default=False)

    parent_workflow = models.ForeignKey(
        "Workflow", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    weeks = models.ManyToManyField(
        Week, through="WeekWorkflow", blank=True
    )

    columns = models.ManyToManyField(
        Column, through="ColumnWorkflow", blank=True
    )

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeWorkflow", blank=True
    )
    
    OUTCOMES_NORMAL = 0
    OUTCOMES_ADVANCED = 1
    OUTCOME_TYPES = ((OUTCOMES_NORMAL, "Normal"), (OUTCOMES_ADVANCED, "Advanced"))
    outcomes_type = models.PositiveIntegerField(choices=OUTCOME_TYPES,default=0)
    
    OUTCOME_SORT_WEEK = 0
    OUTCOME_SORT_COLUMN = 1
    OUTCOME_SORT_TASK = 2
    OUTCOME_SORT_CONTEXT = 3
    OUTCOME_SORTS = ((OUTCOME_SORT_WEEK,"Time"),(OUTCOME_SORT_COLUMN,"Category"),(OUTCOME_SORT_TASK,"Task"),(OUTCOME_SORT_CONTEXT,"Context"))
    outcomes_sort = models.PositiveIntegerField(choices=OUTCOME_SORTS,default=0)

    SUBCLASSES = ["activity", "course", "program"]
    
    @property
    def type(self):
        for subclass in self.SUBCLASSES:
            try:
                return getattr(self, subclass).type
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
        if self.title is not None:
            return self.title
        else:
            return self.type()


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
    DEFAULT_COLUMNS = [1, 2, 3, 4]
    WORKFLOW_TYPE = 0

    @property
    def type(self):
        return "activity"

    def __str__(self):
        if self.title is not None:
            return self.title
        else:
            return self.type()

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
    DEFAULT_COLUMNS = [11, 12, 13, 14]
    WORKFLOW_TYPE = 1

    @property
    def type(self):
        return "course"

    def __str__(self):
        if self.title is not None:
            return self.title
        else:
            return self.type()


class Program(Workflow):
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    DEFAULT_CUSTOM_COLUMN = 20
    DEFAULT_COLUMNS = [20, 20, 20]
    WORKFLOW_TYPE = 2

    @property
    def type(self):
        return "program"

    def __str__(self):
        if self.title is not None:
            return self.title
        else:
            return self.type()


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


class WeekWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

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

"""
Other receivers
"""

@receiver(pre_delete, sender=Workflow)
def delete_workflow_objects(sender, instance, **kwargs):
    instance.weeks.all().delete()
    instance.columns.all().delete()


@receiver(pre_delete, sender=Week)
def delete_week_objects(sender, instance, **kwargs):
    instance.nodes.all().delete()

@receiver(pre_delete, sender=Node)
def delete_node_objects(sender, instance, **kwargs):
    instance.outgoing_links.all().delete()
    instance.incoming_links.all().delete()

@receiver(pre_delete, sender=Outcome)
def delete_outcome_objects(sender, instance, **kwargs):
    instance.children.all().delete()


@receiver(post_save, sender=NodeWeek)
def switch_node_to_static(sender, instance, created, **kwargs):
    if created:
        activity = Activity.objects.filter(
            weeks=instance.week
        ).first()
        if activity:
            if activity.static:
                instance.node.students.add(*list(activity.students.all()))

                
@receiver(pre_delete,sender=Column)
def move_nodes(sender, instance, **kwargs):
    columnworkflow = instance.columnworkflow_set.first()
    workflow = columnworkflow.workflow
    
    other_columns = workflow.columnworkflow_set.all().order_by('rank').exclude(column=instance)
    if other_columns.count()>0:
        new_column = other_columns.first().column
        for node in Node.objects.filter(column=instance):
            node.column = new_column
            node.save()
    else:
        print("couldn't find a column")
        

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


@receiver(post_save, sender=NodeWeek)
def reorder_for_inserted_node_week(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in NodeWeek.objects.filter(
            week=instance.week, rank__gte=instance.rank
        ).exclude(node=instance.node):
            out_of_order_link.rank += 1
            out_of_order_link.save()


@receiver(post_save, sender=WeekWorkflow)
def reorder_for_inserted_week_workflow(
    sender, instance, created, **kwargs
):
    if created:
        for out_of_order_link in WeekWorkflow.objects.filter(
            workflow=instance.workflow, rank__gte=instance.rank
        ).exclude(week=instance.week):
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

@receiver(post_save, sender=OutcomeOutcome)
def reorder_for_inserted_outcome_outcome(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in OutcomeOutcome.objects.filter(
            parent=instance.parent, rank__gte=instance.rank
        ).exclude(child=instance.child):
            out_of_order_link.rank += 1
            out_of_order_link.save()

@receiver(post_save, sender=OutcomeNode)
def reorder_for_inserted_outcome_node(sender, instance, created, **kwargs):
    if created:
        for out_of_order_link in OutcomeNode.objects.filter(
            node=instance.node, rank__gte=instance.rank
        ).exclude(outcome=instance.outcome):
            out_of_order_link.rank += 1
            out_of_order_link.save()

"""
Default content creation receivers
"""


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
            week_type=Week.PART, author=instance.author
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
            week_type=Week.WEEK, author=instance.author
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
            week_type=Week.TERM, author=instance.author
        )
        instance.save()


@receiver(post_save, sender=WeekWorkflow)
def switch_week_to_static(sender, instance, created, **kwargs):
    if created:
        if instance.workflow.static:
            for node in instance.week.nodes.all():
                node.students.add(*list(instance.workflow.students.all()))
