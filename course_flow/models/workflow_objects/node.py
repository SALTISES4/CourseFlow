import uuid
from pprint import pprint

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from course_flow.models._abstract import AbstractCourseFlowModel
from course_flow.models.workflow_objects.outcome import Outcome

User = get_user_model()


def context_choices():
    NONE = 0
    INDIVIDUAL = 1
    GROUPS = 2
    WHOLE_CLASS = 3
    FORMATIVE = 101
    SUMMATIVE = 102
    COMPREHENSIVE = 103
    return (
        (NONE, _("None")),
        (INDIVIDUAL, _("Individual Work")),
        (GROUPS, _("Work in Groups")),
        (WHOLE_CLASS, _("Whole Class")),
        (FORMATIVE, _("Formative")),
        (SUMMATIVE, _("Summative")),
        (COMPREHENSIVE, _("Comprehensive")),
    )


def task_choices():
    NONE = 0
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
    return (
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


def node_types():
    ACTIVITY_NODE = 0
    COURSE_NODE = 1
    PROGRAM_NODE = 2
    return (
        (ACTIVITY_NODE, _("Activity Node")),
        (COURSE_NODE, _("Course Node")),
        (PROGRAM_NODE, _("Program Node")),
    )


def unit_choices():
    NO_UNITS = 0
    SECONDS = 1
    MINUTES = 2
    HOURS = 3
    DAYS = 4
    WEEKS = 5
    MONTHS = 6
    YEARS = 7
    CREDITS = 8

    return (
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


class Node(AbstractCourseFlowModel):
    #########################################################
    # FIELDS
    #########################################################
    is_original = models.BooleanField(default=True)

    has_autolink = models.BooleanField(default=False)

    is_dropped = models.BooleanField(default=False)

    context_classification = models.PositiveIntegerField(choices=context_choices(), default=0)

    task_classification = models.PositiveIntegerField(choices=task_choices(), default=0)

    node_type = models.PositiveIntegerField(choices=node_types(), default=0)

    represents_workflow = models.BooleanField(default=False)

    ponderation_theory = models.PositiveIntegerField(default=0, null=True)

    ponderation_practical = models.PositiveIntegerField(default=0, null=True)

    ponderation_individual = models.PositiveIntegerField(default=0, null=True)

    # note: use charfield because some users like to put in ranges (i.e. 10-15 minutes)
    time_required = models.CharField(max_length=30, null=True, blank=True)

    time_units = models.PositiveIntegerField(choices=unit_choices(), default=0)

    time_general_hours = models.PositiveIntegerField(default=0, null=True)

    time_specific_hours = models.PositiveIntegerField(default=0, null=True)

    #########################################################
    # RELATIONS
    #########################################################
    sets = models.ManyToManyField("ObjectSet", blank=True)

    comments = models.ManyToManyField("Comment", blank=True, related_name="node")

    parent_node = models.ForeignKey("Node", on_delete=models.SET_NULL, null=True)

    author = models.ForeignKey(
        User,
        related_name="authored_nodes",
        on_delete=models.SET_NULL,
        null=True,
    )

    linked_workflow = models.ForeignKey(
        "Workflow",
        on_delete=models.SET_NULL,
        null=True,
        related_name="linked_nodes",
    )

    column = models.ForeignKey("Column", on_delete=models.DO_NOTHING, null=True)

    outcomes = models.ManyToManyField(Outcome, through="OutcomeNode", blank=True)

    #########################################################
    # META
    #########################################################
    class Meta:
        verbose_name = _("Node")
        verbose_name_plural = _("Nodes")

    #########################################################
    # MODEL METHODS / GETTERS
    #########################################################
    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

    def get_workflow(self):
        """
        The self.week_set.first() method in Django performs a database operation to fetch the
        first record of a queryset related to the self object (i.e. the current node instance),
        self.week_set is a relationship manager
        self.week_set.first gets first record in the query set

        developer has chained on YET another relationship via get_workflow on the found node
        :return:
        """
        workflow = self.week_set.first().get_workflow()
        return workflow

    def __str__(self):
        if self.title is not None:
            return self.title
        else:
            return self.get_node_type_display()
