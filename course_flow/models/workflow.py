import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericRelation
from django.core.cache import cache
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from model_utils.managers import InheritanceManager

from ._common import title_max_length
from .column import Column
from .outcome import Outcome
from .week import Week

User = get_user_model()


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
        return Workflow.objects.get(pk=self.pk)

    def get_permission_objects(self):
        return [self.get_workflow()]

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

    class Meta:
        verbose_name = _("Workflow")
        verbose_name_plural = _("Workflows")
