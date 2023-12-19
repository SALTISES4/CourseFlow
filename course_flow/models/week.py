import uuid

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models._common import User, title_max_length
from course_flow.models.node import Node


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
        verbose_name = _("Week")
        verbose_name_plural = _("Weeks")
