import base64
import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import (
    GenericForeignKey,
    GenericRelation,
)
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.db.models.signals import post_save, pre_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from model_utils.managers import InheritanceManager

from course_flow.utils import (
    get_all_outcomes_for_outcome,
    get_descendant_outcomes,
)

User = get_user_model()

title_max_length = 200


class Project(models.Model):
    deleted = models.BooleanField(default=False)
    deleted_on = models.DateTimeField(default=timezone.now)
    title = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )
    description = models.TextField(null=True, blank=True)
    author = models.ForeignKey(
        User,
        related_name="authored_projects",
        on_delete=models.SET_NULL,
        null=True,
    )
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)

    is_strategy = models.BooleanField(default=False)

    workflows = models.ManyToManyField(
        "Workflow", through="WorkflowProject", blank=True
    )

    is_original = models.BooleanField(default=False)
    parent_project = models.ForeignKey(
        "Project", on_delete=models.SET_NULL, null=True
    )

    disciplines = models.ManyToManyField("Discipline", blank=True)

    favourited_by = GenericRelation("Favourite", related_query_name="project")
    user_permissions = GenericRelation(
        "ObjectPermission", related_query_name="project"
    )

    object_sets = models.ManyToManyField("ObjectSet", blank=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    @staticmethod
    def get_from_hash(hash_):
        try:
            hash_ = base64.urlsafe_b64decode(hash_.encode()).decode()
        except UnicodeDecodeError:
            hash_ = None
        if hash_:
            try:
                project = Project.objects.get(hash=hash_)
            except (Project.DoesNotExist, ValidationError):
                project = None
        else:
            project = None

        return project

    def registration_hash(self):
        return base64.urlsafe_b64encode(str(self.hash).encode()).decode()

    @property
    def type(self):
        return "project"

    def get_project(self):
        return self

    def get_live_project(self):
        try:
            liveproject = self.liveproject
        except AttributeError:
            liveproject = None
        return liveproject

    def get_permission_objects(self):
        return [self]

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return "Project"

    class Meta:
        verbose_name = "Project"
        verbose_name_plural = "Projects"


class ObjectSet(models.Model):
    term = models.CharField(max_length=title_max_length)
    title = models.CharField(max_length=title_max_length)
    translation_plural = models.CharField(
        max_length=title_max_length, null=True
    )

    def get_permission_objects(self):
        return [Project.objects.filter(object_sets=self).first()]


class WorkflowProject(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    workflow = models.ForeignKey("Workflow", on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_permission_objects(self):
        return [self.project, self.get_workflow().get_permission_objects()[0]]

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

    def get_display_rank(self):
        if self.outcome.deleted:
            return -1
        return list(
            OutcomeWorkflow.objects.filter(
                workflow=self.workflow, outcome__deleted=False
            ).order_by("rank")
        ).index(self)

    def get_permission_objects(self):
        return [self.project, self.outcome]

    class Meta:
        verbose_name = "Outcome-Workflow Link"
        verbose_name_plural = "Outcome-Workflow Links"


class Column(models.Model):
    deleted = models.BooleanField(default=False)
    deleted_on = models.DateTimeField(default=timezone.now)
    title = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
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
        (CUSTOM_ACTIVITY, _("Custom Activity Column")),
        (OUT_OF_CLASS_INSTRUCTOR, _("Out of Class (Instructor)")),
        (OUT_OF_CLASS_STUDENT, _("Out of Class (Students)")),
        (IN_CLASS_INSTRUCTOR, _("In Class (Instructor)")),
        (IN_CLASS_STUDENT, _("In Class (Students)")),
        (CUSTOM_COURSE, _("Custom Course Column")),
        (PREPARATION, _("Preparation")),
        (LESSON, _("Lesson")),
        (ARTIFACT, _("Artifact")),
        (ASSESSMENT, _("Assessment")),
        (CUSTOM_PROGRAM, _("Custom Program Category")),
    )
    column_type = models.PositiveIntegerField(default=0, choices=COLUMN_TYPES)

    is_original = models.BooleanField(default=False)
    parent_column = models.ForeignKey(
        "Column", on_delete=models.SET_NULL, null=True
    )

    comments = models.ManyToManyField(
        "Comment", blank=True, related_name="column"
    )

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

    def get_workflow(self):
        return self.workflow_set.first()

    def get_display_title(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return self.get_column_type_display()

    def __str__(self):
        return self.get_column_type_display()

    class Meta:
        verbose_name = "Column"
        verbose_name_plural = "Columns"


class NodeLink(models.Model):
    deleted = models.BooleanField(default=False)
    deleted_on = models.DateTimeField(default=timezone.now)
    title = models.CharField(max_length=100, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    source_node = models.ForeignKey(
        "Node", on_delete=models.CASCADE, related_name="outgoing_links"
    )
    target_node = models.ForeignKey(
        "Node", on_delete=models.CASCADE, related_name="incoming_links"
    )
    NORTH = 0
    EAST = 1
    SOUTH = 2
    WEST = 3
    SOURCE_PORTS = ((EAST, "e"), (SOUTH, "s"), (WEST, "w"))
    TARGET_PORTS = ((NORTH, "n"), (EAST, "e"), (WEST, "w"))
    source_port = models.PositiveIntegerField(choices=SOURCE_PORTS, default=2)
    target_port = models.PositiveIntegerField(choices=TARGET_PORTS, default=0)

    dashed = models.BooleanField(default=False)
    text_position = models.PositiveSmallIntegerField(default=20)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)

    is_original = models.BooleanField(default=True)

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

    def get_workflow(self):
        return self.source_node.get_workflow()

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    class Meta:
        verbose_name = "Node Link"
        verbose_name_plural = "Node Links"


class Outcome(models.Model):
    deleted = models.BooleanField(default=False)
    deleted_on = models.DateTimeField(default=timezone.now)
    title = models.TextField(null=True, blank=True)
    code = models.CharField(max_length=title_max_length, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
    parent_outcome = models.ForeignKey(
        "Outcome", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    is_dropped = models.BooleanField(default=True)
    depth = models.PositiveIntegerField(default=0)

    sets = models.ManyToManyField("ObjectSet", blank=True)

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

    comments = models.ManyToManyField(
        "Comment", blank=True, related_name="outcome"
    )

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def get_top_outcome(self):
        if self.parent_outcome_links.all().count() > 0:
            return self.parent_outcome_links.first().parent.get_top_outcome()
        else:
            return self

    def get_workflow(self):
        return self.get_top_outcome().workflow_set.first()

    #
    #    def get_project(self):
    #        return self.project_set.first()

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

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

    def get_display_rank(self):
        if self.child.deleted:
            return -1
        return list(
            OutcomeOutcome.objects.filter(
                parent=self.parent, child__deleted=False
            ).order_by("rank")
        ).index(self)

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
                    parent_outcome__in=parent_outcome.children.exclude(
                        deleted=True
                    ).values_list("id", flat=True),
                    degree=self.degree,
                    outcome=self.outcome,
                ).count()
                == parent_outcome.children.exclude(deleted=True).count()
            ):
                new_outcomehorizontallink = (
                    OutcomeHorizontalLink.objects.create(
                        outcome=self.outcome,
                        degree=self.degree,
                        parent_outcome=parent_outcome,
                    )
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
                new_outcomehorizontallink = (
                    OutcomeHorizontalLink.objects.create(
                        outcome=self.outcome,
                        degree=0,
                        parent_outcome=parent_outcome,
                    )
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
    deleted = models.BooleanField(default=False)
    deleted_on = models.DateTimeField(default=timezone.now)
    title = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )
    description = models.TextField(null=True, blank=True)
    author = models.ForeignKey(
        User,
        related_name="authored_nodes",
        on_delete=models.SET_NULL,
        null=True,
    )
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)

    parent_node = models.ForeignKey(
        "Node", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)
    has_autolink = models.BooleanField(default=False)
    is_dropped = models.BooleanField(default=False)

    comments = models.ManyToManyField(
        "Comment", blank=True, related_name="node"
    )

    sets = models.ManyToManyField("ObjectSet", blank=True)

    NONE = 0
    INDIVIDUAL = 1
    GROUPS = 2
    WHOLE_CLASS = 3
    FORMATIVE = 101
    SUMMATIVE = 102
    COMPREHENSIVE = 103
    CONTEXT_CHOICES = (
        (NONE, _("None")),
        (INDIVIDUAL, _("Individual Work")),
        (GROUPS, _("Work in Groups")),
        (WHOLE_CLASS, _("Whole Class")),
        (FORMATIVE, _("Formative")),
        (SUMMATIVE, _("Summative")),
        (COMPREHENSIVE, _("Comprehensive")),
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
        (NONE, _("None")),
        (GATHER_INFO, _("Gather Information")),
        (DISCUSS, _("Discuss")),
        (PROBLEM_SOLVE, _("Problem Solve")),
        (ANALYZE, _("Analyze")),
        (ASSESS_PEERS, _("Assess/Review Peers")),
        (DEBATE, _("Debate")),
        (GAME_ROLEPLAY, _("Game/Roleplay")),
        (CREATE_DESIGN, _("Create/Design")),
        (REVISE, _("Revise/Improve")),
        (READ, _("Read")),
        (WRITE, _("Write")),
        (PRESENT, _("Present")),
        (EXPERIMENT, _("Experiment/Inquiry")),
        (QUIZ_TEST, _("Quiz/Test")),
        (INSTRUCTOR_RESOURCE_CURATION, _("Instructor Resource Curation")),
        (INSTRUCTOR_ORCHESTRATION, _("Instructor Orchestration")),
        (INSTRUCTOR_EVALUATION, _("Instructor Evaluation")),
        (OTHER, _("Other")),
        (JIGSAW, _("Jigsaw")),
        (PEER_INSTRUCTION, _("Peer Instruction")),
        (CASE_STUDIES, _("Case Studies")),
        (GALLERY_WALK, _("Gallery Walk")),
        (REFLECTIVE_WRITING, _("Reflective Writing")),
        (TWO_STAGE_EXAM, _("Two-Stage Exam")),
        (TOOLKIT, _("Toolkit")),
        (ONE_MINUTE_PAPER, _("One Minute Paper")),
        (DISTRIBUTED_PROBLEM_SOLVING, _("Distributed Problem Solving")),
        (PEER_ASSESSMENT, _("Peer Assessment")),
    )
    task_classification = models.PositiveIntegerField(
        choices=TASK_CHOICES, default=0
    )
    ACTIVITY_NODE = 0
    COURSE_NODE = 1
    PROGRAM_NODE = 2
    NODE_TYPES = (
        (ACTIVITY_NODE, _("Activity Node")),
        (COURSE_NODE, _("Course Node")),
        (PROGRAM_NODE, _("Program Node")),
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
        (SECONDS, _("seconds")),
        (MINUTES, _("minutes")),
        (HOURS, _("hours")),
        (DAYS, _("days")),
        (WEEKS, _("weeks")),
        (MONTHS, _("months")),
        (YEARS, _("yrs")),
        (CREDITS, _("credits")),
    )

    # note: use charfield because some users like to put in ranges (i.e. 10-15 minutes)
    time_required = models.CharField(max_length=30, null=True, blank=True)
    time_units = models.PositiveIntegerField(default=0, choices=UNIT_CHOICES)

    ponderation_theory = models.PositiveIntegerField(default=0, null=True)
    ponderation_practical = models.PositiveIntegerField(default=0, null=True)
    ponderation_individual = models.PositiveIntegerField(default=0, null=True)

    time_general_hours = models.PositiveIntegerField(default=0, null=True)
    time_specific_hours = models.PositiveIntegerField(default=0, null=True)

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

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

    def get_workflow(self):
        return self.week_set.first().get_workflow()

    def __str__(self):
        if self.title is not None:
            return self.title
        else:
            return self.get_node_type_display()


class OutcomeNode(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)
    degree = models.PositiveIntegerField(default=1)

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

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
                    outcome__in=parent_outcome.children.exclude(
                        deleted=True
                    ).values_list("id", flat=True),
                    degree=self.degree,
                    node=self.node,
                ).count()
                == parent_outcome.children.exclude(deleted=True).count()
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

        node = self.node
        outcome = self.outcome
        degree = self.degree
        # Get the descendants (all descendant outcomes that don't already have an outcomenode of this degree and node)
        descendants = get_descendant_outcomes(outcome).exclude(
            outcomenode__in=OutcomeNode.objects.filter(
                node=node, degree=degree
            )
        )

        # Delete the outcomenodes of any descendants that still have an outcomenode to this node (i.e. clear those of other degrees, we are using bulk create so they won't get automatically deleted)
        to_delete = OutcomeNode.objects.filter(
            outcome__in=descendants.values_list("pk", flat=True), node=node
        )
        to_delete.delete()
        # Create the new outcomenodes with bulk_create
        now = timezone.now()
        new_children = [
            OutcomeNode(degree=degree, node=node, outcome=x, added_on=now)
            for x in descendants
        ]

        OutcomeNode.objects.bulk_create(new_children)

        return list(OutcomeNode.objects.filter(added_on=now))


class Week(models.Model):
    deleted = models.BooleanField(default=False)
    deleted_on = models.DateTimeField(default=timezone.now)
    title = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )
    description = models.TextField(null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
    default = models.BooleanField(default=False)
    parent_week = models.ForeignKey(
        "Week", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)
    is_strategy = models.BooleanField(default=False)
    original_strategy = models.ForeignKey(
        "Workflow", on_delete=models.SET_NULL, null=True
    )

    is_dropped = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    nodes = models.ManyToManyField(Node, through="NodeWeek", blank=True)

    comments = models.ManyToManyField(
        "Comment", blank=True, related_name="week"
    )

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
        (NONE, _("None")),
        (JIGSAW, _("Jigsaw")),
        (PEER_INSTRUCTION, _("Peer Instruction")),
        (CASE_STUDIES, _("Case Studies")),
        (GALLERY_WALK, _("Gallery Walk")),
        (REFLECTIVE_WRITING, _("Reflective Writing")),
        (TWO_STAGE_EXAM, _("Two-Stage Exam")),
        (TOOLKIT, _("Toolkit")),
        (ONE_MINUTE_PAPER, _("One Minute Paper")),
        (DISTRIBUTED_PROBLEM_SOLVING, _("Distributed Problem Solving")),
        (PEER_ASSESSMENT, _("Peer Assessment")),
        (OTHER, _("Other")),
    )
    strategy_classification = models.PositiveIntegerField(
        choices=STRATEGY_CHOICES, default=0
    )

    PART = 0
    WEEK = 1
    TERM = 2
    WEEK_TYPES = ((PART, _("Part")), (WEEK, _("Week")), (TERM, _("Term")))
    week_type = models.PositiveIntegerField(choices=WEEK_TYPES, default=0)

    def __str__(self):
        return self.get_week_type_display()

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

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

    author = models.ForeignKey(
        User,
        related_name="authored_workflows",
        on_delete=models.SET_NULL,
        null=True,
    )

    @property
    def importing(self):
        return cache.get("workflow" + str(self.pk) + "importing", False)

    deleted = models.BooleanField(default=False)
    deleted_on = models.DateTimeField(default=timezone.now)

    title = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )
    description = models.TextField(null=True, blank=True)
    code = models.CharField(max_length=title_max_length, null=True, blank=True)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)

    static = models.BooleanField(default=False)

    published = models.BooleanField(default=False)

    public_view = models.BooleanField(default=False)

    is_strategy = models.BooleanField(default=False)

    from_saltise = models.BooleanField(default=False)

    condensed = models.BooleanField(default=False)

    user_permissions = GenericRelation(
        "ObjectPermission", related_query_name="workflow"
    )
    favourited_by = GenericRelation("Favourite", related_query_name="workflow")

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
        (OUTCOMES_NORMAL, _("Normal")),
        (OUTCOMES_ADVANCED, _("Advanced")),
    )
    outcomes_type = models.PositiveIntegerField(
        choices=OUTCOME_TYPES, default=0
    )

    OUTCOME_SORT_WEEK = 0
    OUTCOME_SORT_COLUMN = 1
    OUTCOME_SORT_TASK = 2
    OUTCOME_SORT_CONTEXT = 3
    OUTCOME_SORTS = (
        (OUTCOME_SORT_WEEK, _("Time")),
        (OUTCOME_SORT_COLUMN, _("Category")),
        (OUTCOME_SORT_TASK, _("Task")),
        (OUTCOME_SORT_CONTEXT, _("Context")),
    )
    outcomes_sort = models.PositiveIntegerField(
        choices=OUTCOME_SORTS, default=0
    )

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
        (SECONDS, _("seconds")),
        (MINUTES, _("minutes")),
        (HOURS, _("hours")),
        (DAYS, _("days")),
        (WEEKS, _("weeks")),
        (MONTHS, _("months")),
        (YEARS, _("yrs")),
        (CREDITS, _("credits")),
    )

    # note: use charfield because some users like to put in ranges (i.e. 10-15 minutes)
    time_required = models.CharField(max_length=30, null=True, blank=True)
    time_units = models.PositiveIntegerField(default=0, choices=UNIT_CHOICES)

    ponderation_theory = models.PositiveIntegerField(default=0, null=True)
    ponderation_practical = models.PositiveIntegerField(default=0, null=True)
    ponderation_individual = models.PositiveIntegerField(default=0, null=True)

    time_general_hours = models.PositiveIntegerField(default=0, null=True)
    time_specific_hours = models.PositiveIntegerField(default=0, null=True)

    edit_count = models.PositiveIntegerField(default=0, null=False)

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

    def get_workflow(self):
        return self

    def get_permission_objects(self):
        return [Workflow.objects.get(pk=self.pk)]

    def get_live_project(self):
        try:
            liveproject = self.get_project().liveproject
        except AttributeError:
            liveproject = None
        return liveproject

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
        if self.title is not None and self.title != "":
            return self.title
        else:
            return self.type


class Activity(Workflow):

    DEFAULT_CUSTOM_COLUMN = 0
    DEFAULT_COLUMNS = [1, 2, 3, 4]
    WORKFLOW_TYPE = 0

    @property
    def type(self):
        return "activity"

    def get_permission_objects(self):
        return [self]

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return self.type

    class Meta:
        verbose_name = "Activity"
        verbose_name_plural = "Activities"


class Course(Workflow):

    DEFAULT_CUSTOM_COLUMN = 10
    DEFAULT_COLUMNS = [11, 12, 13, 14]
    WORKFLOW_TYPE = 1

    @property
    def type(self):
        return "course"

    def get_permission_objects(self):
        return [self]

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return self.type


class Program(Workflow):

    DEFAULT_CUSTOM_COLUMN = 20
    DEFAULT_COLUMNS = [20, 20, 20]
    WORKFLOW_TYPE = 2

    @property
    def type(self):
        return "program"

    def get_permission_objects(self):
        return [self]

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return self.type


class ColumnWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    column = models.ForeignKey(Column, on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_workflow(self):
        return self.workflow

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

    class Meta:
        verbose_name = "Column-Workflow Link"
        verbose_name_plural = "Column-Workflow Links"


class WeekWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_display_rank(self):
        if self.week.deleted:
            return -1
        return list(
            WeekWorkflow.objects.filter(
                workflow=self.workflow, week__deleted=False
            ).order_by("rank")
        ).index(self)

    def get_workflow(self):
        return self.workflow

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

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


workflow_choices = [
    ContentType.objects.get_for_model(Activity),
    ContentType.objects.get_for_model(Course),
    ContentType.objects.get_for_model(Program),
]


class Favourite(models.Model):
    content_choices = {"model__in": ["project", "workflow"]}
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, limit_choices_to=content_choices
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    def save(self, *args, **kwargs):
        if self.content_type in workflow_choices:
            self.content_type = ContentType.objects.get_for_model(Workflow)
        super().save(*args, **kwargs)


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    text = models.TextField(
        blank=False,
    )
    created_on = models.DateTimeField(default=timezone.now)


class ObjectPermission(models.Model):
    content_choices = {"model__in": ["project", "workflow"]}
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, limit_choices_to=content_choices
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    PERMISSION_NONE = 0
    PERMISSION_VIEW = 1
    PERMISSION_EDIT = 2
    PERMISSION_COMMENT = 3
    PERMISSION_STUDENT = 4
    PERMISSION_CHOICES = (
        (PERMISSION_NONE, _("None")),
        (PERMISSION_VIEW, _("View")),
        (PERMISSION_EDIT, _("Edit")),
        (PERMISSION_COMMENT, _("Comment")),
        (PERMISSION_STUDENT, _("Student")),
    )
    permission_type = models.PositiveIntegerField(
        choices=PERMISSION_CHOICES, default=PERMISSION_NONE
    )

    last_viewed = models.DateTimeField(default=timezone.now)

    def update_last_viewed(user, view_object):
        ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(view_object),
            object_id=view_object.id,
        ).update(last_viewed=timezone.now())

    def save(self, *args, **kwargs):
        if self.content_type in workflow_choices:
            self.content_type = ContentType.objects.get_for_model(Workflow)
        super().save(*args, **kwargs)


class UpdateNotification(models.Model):
    title = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )
    created_on = models.DateTimeField(default=timezone.now)

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return "Untitled Update Notification"


"""
Live Project Models
"""


def default_start_date():
    return timezone.now().replace(
        second=0, microsecond=0, minute=0, hour=0
    ) + timezone.timedelta(weeks=1)


def default_due_date():
    return timezone.now().replace(
        second=0, microsecond=0, minute=0, hour=0
    ) + timezone.timedelta(weeks=2)


class LiveProject(models.Model):

    created_on = models.DateTimeField(default=timezone.now)

    project = models.OneToOneField(
        Project, on_delete=models.CASCADE, primary_key=True
    )

    # Whether students are able to check tasks as complete themselves or
    # must have the instructor mark them as complete
    default_self_reporting = models.BooleanField(default=True)
    # Whether newly created assignments are assigned to all by default
    default_assign_to_all = models.BooleanField(default=True)
    # Whether it is enough for a single assigned user to complete the task,
    # or (when True) when any user completes the task it becomes complete for all users
    default_single_completion = models.BooleanField(default=False)
    # whether workflows are always all visible
    default_all_workflows_visible = models.BooleanField(default=False)
    # These workflows are always visible to all students
    visible_workflows = models.ManyToManyField(Workflow, blank=True)

    def get_permission_objects(self):
        return [self]

    def get_live_project(self):
        return self

    @property
    def type(self):
        return "liveproject"


class LiveProjectUser(models.Model):
    liveproject = models.ForeignKey(LiveProject, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ROLE_NONE = 0
    ROLE_STUDENT = 1
    ROLE_TEACHER = 2
    ROLE_CHOICES = (
        (ROLE_NONE, _("None")),
        (ROLE_STUDENT, _("Student")),
        (ROLE_TEACHER, _("Instructor")),
    )
    role_type = models.PositiveIntegerField(
        choices=ROLE_CHOICES, default=ROLE_NONE
    )


class LiveAssignment(models.Model):
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    liveproject = models.ForeignKey(LiveProject, on_delete=models.CASCADE)
    self_reporting = models.BooleanField(default=True)
    single_completion = models.BooleanField(default=False)
    task = models.ForeignKey(Node, null=True, on_delete=models.SET_NULL)
    start_date = models.DateTimeField(default=default_start_date)
    end_date = models.DateTimeField(default=default_due_date)
    created_on = models.DateTimeField(default=timezone.now)

    def get_live_project(self):
        return self.liveproject

    def get_permission_objects(self):
        return [self.liveproject]


class UserAssignment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    assignment = models.ForeignKey(LiveAssignment, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_on = models.DateTimeField(null=True)

    def get_live_project(self):
        return self.assignment.liveproject

    def get_permission_objects(self):
        return [self.assignment.liveproject]


"""
User Models
"""


class CourseFlowUser(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="courseflow_user",
    )
    first_name = models.CharField(
        max_length=title_max_length,
        null=True,
        blank=True,
    )
    last_name = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )

    # Whether the user wants to receive notifications
    notifications = models.BooleanField(
        default=False,
        help_text="Check this box if you would like to receive emails from us about updates to CourseFlow.",
    )

    # Whether the user has had the opportunity to choose whether they receive notifications
    notifications_active = models.BooleanField(default=False)

    def ensure_user(user):
        courseflow_user = CourseFlowUser.objects.filter(user=user).first()
        if courseflow_user is None:
            courseflow_user = CourseFlowUser.objects.create(
                first_name=user.first_name,
                last_name=user.last_name,
                user=user,
            )
        return courseflow_user


"""
Other receivers
"""


def get_allowed_parent_outcomes(workflow, **kwargs):
    exclude_node = kwargs.get("exclude_node", None)
    exclude_outcomenode = kwargs.get("exclude_outcomenode", None)
    parent_outcomenodes = []
    for parent_node in workflow.linked_nodes.exclude(id=exclude_node):
        parent_outcomenodes += parent_node.outcomenode_set.exclude(
            id=exclude_outcomenode
        )
    parent_outcomes = [ocn.outcome for ocn in parent_outcomenodes]
    return parent_outcomes


# @receiver(pre_delete, sender=OutcomeNode)
# def remove_horizontal_outcome_links_on_outcomenode_delete(
#    sender, instance, **kwargs
# ):
#    workflow = instance.node.linked_workflow
#    if workflow is not None:
#        linked_outcomes = list(workflow.outcomes.all())
#        parent_outcomes = get_allowed_parent_outcomes(
#            workflow, exclude_outcomenode=instance.pk
#        )
#        OutcomeHorizontalLink.objects.filter(
#            outcome__in=linked_outcomes
#        ).exclude(parent_outcome__in=parent_outcomes).delete()


# @receiver(pre_save, sender=Node)
# def remove_horizontal_outcome_links_on_node_unlink(sender, instance, **kwargs):
#    if instance.pk is None:
#        return
#    old_workflow = Node.objects.get(id=instance.pk).linked_workflow
#    new_workflow = instance.linked_workflow
#    if old_workflow is not None and (
#        new_workflow is None or new_workflow.pk != old_workflow.pk
#    ):
#        linked_outcomes = list(old_workflow.outcomes.all())
#        parent_outcomes = get_allowed_parent_outcomes(
#            old_workflow, exclude_node=instance.pk
#        )
#        OutcomeHorizontalLink.objects.filter(
#            outcome__in=linked_outcomes
#        ).exclude(parent_outcome__in=parent_outcomes).delete()


@receiver(pre_delete, sender=Project)
def delete_project_objects(sender, instance, **kwargs):

    # Pick up all non-linking instances pks
    nodes = list(
        Node.objects.filter(week__workflow__project=instance).values_list(
            "pk", flat=True
        )
    )
    weeks = list(
        Week.objects.filter(workflow__project=instance).values_list(
            "pk", flat=True
        )
    )
    columns = list(
        Column.objects.filter(workflow__project=instance).values_list(
            "pk", flat=True
        )
    )
    outcomes = list(
        Outcome.objects.filter(
            Q(workflow__project=instance)
            | Q(parent_outcomes__workflow__project=instance)
            | Q(parent_outcomes__parent_outcomes__workflow__project=instance)
        ).values_list("pk", flat=True)
    )
    workflows = list(
        Workflow.objects.filter(project=instance).values_list("pk", flat=True)
    )
    comments = Comment.objects.filter(
        Q(node__week__workflow__project=instance)
        | Q(outcome__in=outcomes)
        | Q(column__workflow__project=instance)
        | Q(week__workflow__project=instance)
    )
    comments.delete()

    # Delete all links. These should be deleted before non-linking instances because this way we prevent a lot of cascades. Order matters here; we want to go from top to bottom or else we will break the links we need in order to find the next step
    outcomenodes = OutcomeNode.objects.filter(
        node__week__workflow__project=instance
    )
    outcomenodes._raw_delete(outcomenodes.db)
    nodelinks = NodeLink.objects.filter(
        source_node__week__workflow__project=instance
    )
    nodelinks._raw_delete(nodelinks.db)
    outcomehorizontallinks = OutcomeHorizontalLink.objects.filter(
        Q(outcome__workflow__project=instance)
        | Q(outcome__parent_outcomes__workflow__project=instance)
        | Q(
            outcome__parent_outcomes__parent_outcomes__workflow__project=instance
        )
    )
    outcomehorizontallinks._raw_delete(outcomehorizontallinks.db)
    nodeweeks = NodeWeek.objects.filter(week__workflow__project=instance)
    nodeweeks._raw_delete(nodeweeks.db)
    weekworkflows = WeekWorkflow.objects.filter(workflow__project=instance)
    weekworkflows._raw_delete(weekworkflows.db)
    columnworkflows = ColumnWorkflow.objects.filter(workflow__project=instance)
    columnworkflows._raw_delete(columnworkflows.db)
    outcomeoutcomes = OutcomeOutcome.objects.filter(
        Q(parent__workflow__project=instance)
        | Q(parent__parent_outcomes__workflow__project=instance)
    )
    outcomeoutcomes._raw_delete(outcomeoutcomes.db)
    outcomeworkflows = OutcomeWorkflow.objects.filter(
        workflow__project=instance
    )
    outcomeworkflows._raw_delete(outcomeworkflows.db)
    workflowprojects = WorkflowProject.objects.filter(project=instance)
    workflowprojects._raw_delete(workflowprojects.db)

    # remove all FKs pointing to our objects from outside project. The raw deletes don't cascade, so we will get integrity errors if we fail to do this
    #    workflow_subclasses = [workflow.get_subclass() for workflow in workflows]
    #    activities = filter(lambda x: x.type == "activity", workflow_subclasses)
    #    courses = filter(lambda x: x.type == "course", workflow_subclasses)
    #    programs = filter(lambda x: x.type == "program", workflow_subclasses)
    objectpermissions = ObjectPermission.objects.filter(
        Q(workflow__in=workflows) | Q(project=instance)
    )
    favourites = Favourite.objects.filter(
        Q(workflow__in=workflows) | Q(project=instance)
    )
    Node.objects.filter(parent_node__in=nodes).update(parent_node=None)
    Node.objects.filter(linked_workflow__in=workflows).update(
        linked_workflow=None
    )
    Week.objects.filter(parent_week__in=weeks).update(parent_week=None)
    Week.objects.filter(original_strategy__in=workflows).update(
        original_strategy=None
    )
    Column.objects.filter(parent_column__in=columns).update(parent_column=None)
    Workflow.objects.filter(parent_workflow__in=workflows).update(
        parent_workflow=None
    )
    Outcome.objects.filter(parent_outcome__in=outcomes).update(
        parent_outcome=None
    )

    # Delete nonlinking instances
    nodes = Node.objects.filter(pk__in=nodes)
    nodes._raw_delete(nodes.db)
    weeks = Week.objects.filter(pk__in=weeks)
    weeks._raw_delete(weeks.db)
    columns = Column.objects.filter(pk__in=columns)
    columns._raw_delete(columns.db)
    outcomes = Outcome.objects.filter(pk__in=outcomes)
    outcomes._raw_delete(outcomes.db)
    objectpermissions._raw_delete(objectpermissions.db)
    favourites._raw_delete(favourites.db)
    activities = Activity.objects.filter(pk__in=workflows)
    activities._raw_delete(activities.db)
    courses = Course.objects.filter(pk__in=workflows)
    courses._raw_delete(courses.db)
    programs = Program.objects.filter(pk__in=workflows)
    programs._raw_delete(programs.db)
    print(instance.disciplines.all())
    print(Discipline.objects.filter(workflow__in=workflows))
    workflows = Workflow.objects.filter(pk__in=workflows)
    workflows.delete()
    # raw delete was presenting issues with the disciplines for some reason
    # Given that most usage is soft delete, might as well just .delete()
    # workflows._raw_delete(workflows.db)


@receiver(pre_delete, sender=Workflow)
def delete_workflow_objects(sender, instance, **kwargs):

    # Pick up all non-linking instances pks
    nodes = list(
        Node.objects.filter(week__workflow=instance).values_list(
            "pk", flat=True
        )
    )
    weeks = list(
        Week.objects.filter(workflow=instance).values_list("pk", flat=True)
    )
    columns = list(
        Column.objects.filter(workflow=instance).values_list("pk", flat=True)
    )
    outcomes = list(
        Outcome.objects.filter(
            Q(workflow=instance)
            | Q(parent_outcomes__workflow=instance)
            | Q(parent_outcomes__parent_outcomes__workflow=instance)
        ).values_list("pk", flat=True)
    )

    # Delete all comments.
    comments = Comment.objects.filter(
        Q(node__week__workflow=instance)
        | Q(outcome__in=outcomes)
        | Q(column__workflow=instance)
        | Q(week__workflow=instance)
    )
    comments.delete()

    # Delete all links. These should be deleted before non-linking instances because this way we prevent a lot of cascades. Order matters here; we want to go from top to bottom or else we will break the links we need in order to find the next step
    outcomenodes = OutcomeNode.objects.filter(node__week__workflow=instance)
    outcomenodes._raw_delete(outcomenodes.db)
    nodelinks = NodeLink.objects.filter(source_node__week__workflow=instance)
    nodelinks._raw_delete(nodelinks.db)
    outcomehorizontallinks = OutcomeHorizontalLink.objects.filter(
        Q(outcome__workflow=instance)
        | Q(outcome__parent_outcomes__workflow=instance)
        | Q(outcome__parent_outcomes__parent_outcomes__workflow=instance)
        | Q(parent_outcome__workflow=instance)
        | Q(parent_outcome__parent_outcomes__workflow=instance)
        | Q(
            parent_outcome__parent_outcomes__parent_outcomes__workflow=instance
        )
    )
    outcomehorizontallinks._raw_delete(outcomehorizontallinks.db)
    nodeweeks = NodeWeek.objects.filter(week__workflow=instance)
    nodeweeks._raw_delete(nodeweeks.db)
    weekworkflows = WeekWorkflow.objects.filter(workflow=instance)
    weekworkflows._raw_delete(weekworkflows.db)
    columnworkflows = ColumnWorkflow.objects.filter(workflow=instance)
    columnworkflows._raw_delete(columnworkflows.db)
    outcomeoutcomes = OutcomeOutcome.objects.filter(
        Q(parent__workflow=instance)
        | Q(parent__parent_outcomes__workflow=instance)
    )
    outcomeoutcomes._raw_delete(outcomeoutcomes.db)
    outcomeworkflows = OutcomeWorkflow.objects.filter(workflow=instance)
    outcomeworkflows._raw_delete(outcomeworkflows.db)

    # remove all FKs pointing to our objects from outside project. The raw deletes don't cascade, so we will get integrity errors if we fail to do this
    Node.objects.filter(parent_node__in=nodes).update(parent_node=None)
    Week.objects.filter(parent_week__in=weeks).update(parent_week=None)
    Column.objects.filter(parent_column__in=columns).update(parent_column=None)
    Outcome.objects.filter(parent_outcome__in=outcomes).update(
        parent_outcome=None
    )

    # Delete nonlinking instances
    nodes = Node.objects.filter(pk__in=nodes)
    nodes._raw_delete(nodes.db)
    weeks = Week.objects.filter(pk__in=weeks)
    weeks._raw_delete(weeks.db)
    columns = Column.objects.filter(pk__in=columns)
    columns._raw_delete(columns.db)
    outcomes = Outcome.objects.filter(pk__in=outcomes)
    outcomes._raw_delete(outcomes.db)


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


#
# @receiver(pre_delete, sender=OutcomeNode)
# def reorder_for_deleted_outcome_node(sender, instance, **kwargs):
#    for out_of_order_link in OutcomeNode.objects.filter(
#        node=instance.node, rank__gt=instance.rank
#    ):
#        out_of_order_link.rank -= 1
#        out_of_order_link.save()

#
# @receiver(pre_delete, sender=OutcomeHorizontalLink)
# def reorder_for_deleted_outcome_horizontal_link(sender, instance, **kwargs):
#    for out_of_order_link in OutcomeNode.objects.filter(
#        outcome=instance.outcome, rank__gt=instance.rank
#    ):
#        out_of_order_link.rank -= 1
#        out_of_order_link.save()


@receiver(pre_save, sender=WorkflowProject)
def delete_existing_workflow_project(sender, instance, **kwargs):
    if instance.pk is None:
        WorkflowProject.objects.filter(workflow=instance.workflow).delete()
        if instance.rank < 0:
            instance.rank = 0
        new_parent_count = WorkflowProject.objects.filter(
            project=instance.project
        ).count()
        if instance.rank > new_parent_count:
            instance.rank = new_parent_count


@receiver(pre_save, sender=NodeWeek)
def delete_existing_node_week(sender, instance, **kwargs):
    if instance.pk is None:
        try:
            NodeWeek.objects.filter(node=instance.node).delete()
        except Exception as e:
            print(e)
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


#
#
# @receiver(post_save, sender=OutcomeNode)
# def reorder_for_created_outcome_node(sender, instance, created, **kwargs):
#    if created:
#        for out_of_order_link in OutcomeNode.objects.filter(
#            node=instance.node, rank__gte=instance.rank
#        ).exclude(outcome=instance.outcome):
#            out_of_order_link.rank += 1
#            out_of_order_link.save()


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


# @receiver(post_save, sender=OutcomeHorizontalLink)
# def reorder_for_created_horizontal_outcome_link(
#    sender, instance, created, **kwargs
# ):
#    if created:
#        for out_of_order_link in OutcomeHorizontalLink.objects.filter(
#            outcome=instance.outcome, rank__gte=instance.rank
#        ).exclude(parent_outcome=instance.parent_outcome):
#            out_of_order_link.rank += 1
#            out_of_order_link.save()


"""
Default content creation receivers
"""


@receiver(post_save, sender=ObjectPermission)
def set_permissions_to_project_objects(sender, instance, created, **kwargs):
    if created:
        if instance.content_type == ContentType.objects.get_for_model(Project):
            if instance.permission_type == ObjectPermission.PERMISSION_STUDENT:
                liveproject = instance.content_object.liveproject
                if liveproject is not None:
                    if liveproject.default_all_workflows_visible:
                        workflows = instance.content_object.workflows.all()
                    else:
                        workflows = liveproject.visible_workflows.all()
            else:
                workflows = instance.content_object.workflows.all()
            for workflow in workflows:
                # If user already has edit or comment permissions and we are adding view, do not override
                if (
                    instance.permission_type
                    == ObjectPermission.PERMISSION_VIEW
                    and ObjectPermission.objects.filter(
                        user=instance.user,
                        content_type=ContentType.objects.get_for_model(
                            workflow
                        ),
                        object_id=workflow.id,
                        permission_type__in=[
                            ObjectPermission.PERMISSION_EDIT,
                            ObjectPermission.PERMISSION_COMMENT,
                        ],
                    ).count()
                    > 0
                ):
                    pass
                elif (
                    instance.permission_type
                    == ObjectPermission.PERMISSION_COMMENT
                    and ObjectPermission.objects.filter(
                        user=instance.user,
                        content_type=ContentType.objects.get_for_model(
                            workflow
                        ),
                        object_id=workflow.id,
                        permission_type__in=[ObjectPermission.PERMISSION_EDIT],
                    ).count()
                    > 0
                ):
                    pass
                else:
                    # If user is the owner, don't override their ownership
                    if workflow.author == instance.user:
                        if (
                            ObjectPermission.objects.filter(
                                workflow=workflow,
                                user=instance.user,
                                permission_type=ObjectPermission.PERMISSION_EDIT,
                            ).count()
                            == 0
                        ):
                            # Just in case the user has somehow lost their permission
                            ObjectPermission.objects.create(
                                user=instance.user,
                                content_object=workflow,
                                permission_type=ObjectPermission.PERMISSION_EDIT,
                            )
                    else:
                        ObjectPermission.objects.create(
                            user=instance.user,
                            content_object=workflow,
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


@receiver(pre_save, sender=LiveProjectUser)
def delete_existing_role(sender, instance, **kwargs):
    LiveProjectUser.objects.filter(
        user=instance.user,
        liveproject=instance.liveproject,
    ).delete()


@receiver(post_save, sender=LiveProjectUser)
def delete_role_none(sender, instance, **kwargs):
    if instance.role_type == instance.ROLE_NONE:
        instance.delete()


@receiver(pre_delete, sender=ObjectPermission)
def remove_permissions_to_project_objects(sender, instance, **kwargs):
    if instance.content_type == ContentType.objects.get_for_model(Project):
        for workflow in instance.content_object.workflows.all():
            ObjectPermission.objects.filter(
                user=instance.user,
                content_type=ContentType.objects.get_for_model(workflow),
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
    except ValidationError:
        print("couldn't set default node type")


@receiver(post_save, sender=WeekWorkflow)
def set_week_type_default(sender, instance, created, **kwargs):
    week = instance.week
    try:
        week.week_type = instance.workflow.get_subclass().WORKFLOW_TYPE
        week.save()
    except ValidationError:
        print("couldn't set default week type")


@receiver(post_save, sender=OutcomeOutcome)
def set_outcome_depth_default(sender, instance, created, **kwargs):
    try:
        set_list = list(instance.parent.sets.all())
        outcomes, outcomeoutcomes = get_all_outcomes_for_outcome(
            instance.child
        )
        for outcomeoutcome in [instance] + list(outcomeoutcomes):
            child = outcomeoutcome.child
            parent = outcomeoutcome.parent
            child.depth = parent.depth + 1
            child.sets.clear()
            child.sets.add(*set_list)
            child.save()
    except ValidationError:
        print("couldn't set default outcome depth or copy sets")


@receiver(post_save, sender=Node)
def create_default_node_content(sender, instance, created, **kwargs):
    if created and instance.is_original:
        # If this is an activity-level node, set the autolinks to true
        if instance.node_type == instance.ACTIVITY_NODE:
            instance.has_autolink = True
            instance.save()
        elif instance.node_type == instance.PROGRAM_NODE:
            instance.time_units = instance.CREDITS
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
        instance.time_units = instance.CREDITS
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
        instance.condensed = True
        instance.save()


@receiver(post_save, sender=Project)
@receiver(post_save, sender=Workflow)
def add_default_editor_workflow(sender, instance, created, **kwargs):
    if created and instance.author is not None:
        ObjectPermission.objects.create(
            content_object=instance,
            user=instance.author,
            permission_type=ObjectPermission.PERMISSION_EDIT,
        )


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
                content_object=workflow,
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


# Live project receivers


@receiver(pre_save, sender=LiveProject)
def add_all_workflows(sender, instance, **kwargs):
    if instance.default_all_workflows_visible:
        if LiveProject.objects.get(
            pk=instance.pk
        ).default_all_workflows_visible:
            return
        instance.visible_workflows.add(
            *Workflow.objects.filter(project=instance.project, deleted=False)
        )


@receiver(post_save, sender=WorkflowProject)
def add_to_visible_workflows(sender, instance, created, **kwargs):
    if created and abs(
        instance.workflow.created_on - timezone.now()
    ) < timezone.timedelta(seconds=10):
        project = instance.project
        if project is not None:
            try:
                liveproject = project.liveproject
                if liveproject.default_all_workflows_visible:
                    liveproject.visible_workflows.add(instance.workflow)
            except AttributeError:
                pass


@receiver(pre_save, sender=Workflow)
def add_or_remove_visible_workflow_on_delete_restore(
    sender, instance, **kwargs
):
    workflow = Workflow.objects.get(pk=instance.pk)
    if workflow.deleted != instance.deleted:
        project = instance.get_project()
        if project is not None:
            try:
                liveproject = project.liveproject
                if instance.deleted:
                    liveproject.visible_workflows.remove(workflow)
                elif liveproject.default_all_workflows_visible:
                    liveproject.visible_workflows.add(workflow)
            except AttributeError:
                pass


@receiver(post_save, sender=LiveProjectUser)
def add_user_to_assignments(sender, instance, created, **kwargs):
    if (
        instance.role_type == LiveProjectUser.ROLE_STUDENT
        and instance.liveproject.default_assign_to_all
    ):
        for assignment in LiveAssignment.objects.filter(
            liveproject=instance.liveproject,
        ).exclude(userassignment__user=instance.user):
            print("auto-creating a userassignment")
            UserAssignment.objects.create(
                user=instance.user, assignment=assignment
            )


@receiver(post_save, sender=LiveProjectUser)
def add_user_to_assignments(sender, instance, created, **kwargs):
    if instance.role_type == LiveProjectUser.ROLE_NONE:
        UserAssignment.objects.filter(
            assignment__liveproject=instance.liveproject
        ).delete()


@receiver(post_save, sender=LiveAssignment)
def live_assignment_creation_defaults(sender, instance, created, **kwargs):
    if created:
        liveproject = instance.liveproject
        instance.self_reporting = liveproject.default_self_reporting
        instance.single_completion = liveproject.default_single_completion
        if liveproject.default_assign_to_all:
            students = LiveProjectUser.objects.filter(
                liveproject=liveproject, role_type=LiveProjectUser.ROLE_STUDENT
            )
            for student in students:
                UserAssignment.objects.create(
                    user=student.user, assignment=instance
                )
