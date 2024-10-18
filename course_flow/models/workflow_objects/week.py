"""
@todo describe this since 'week' is misnamed

"""
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from course_flow.models._abstract import AbstractCourseFlowModel
from course_flow.models.common import User
from course_flow.models.workflow_objects.node import Node


def strategy_choices():
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
    return (
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


def week_types():
    PART = 0
    WEEK = 1
    TERM = 2
    return ((PART, _("Part")), (WEEK, _("Week")), (TERM, _("Term")))


class Week(AbstractCourseFlowModel):
    ##########################################################
    # FIELDS
    #########################################################
    default = models.BooleanField(default=False)

    is_original = models.BooleanField(default=True)

    is_strategy = models.BooleanField(default=False)

    is_dropped = models.BooleanField(default=True)

    strategy_classification = models.PositiveIntegerField(choices=strategy_choices(), default=0)
    week_type = models.PositiveIntegerField(choices=week_types(), default=0)
    #########################################################
    # RELATIONS
    #########################################################
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    parent_week = models.ForeignKey("Week", on_delete=models.SET_NULL, null=True)

    original_strategy = models.ForeignKey("Workflow", on_delete=models.SET_NULL, null=True)

    nodes = models.ManyToManyField(Node, through="NodeWeek", blank=True)

    comments = models.ManyToManyField("Comment", blank=True, related_name="week")

    #########################################################
    # META
    #########################################################
    class Meta:
        verbose_name = _("Week")
        verbose_name_plural = _("Weeks")

    #########################################################
    # MODEL METHODS / GETTERS
    #########################################################
    def __str__(self):
        return self.get_week_type_display()

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

    def get_workflow(self):
        return self.workflow_set.first()
