import uuid

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models._common import User, title_max_length
from course_flow.models.outcome import Outcome


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

    class Meta:
        verbose_name = _("Node")
        verbose_name_plural = _("Nodes")
