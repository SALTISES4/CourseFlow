import logging
import uuid
from pprint import pprint

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericRelation
from django.core.cache import cache
from django.db import models
from django.utils.translation import gettext_lazy as _
from model_utils.managers import InheritanceManager

from course_flow.apps import logger
from course_flow.models.common import title_max_length

from ._abstract import AbstractCourseFlowModel
from .column import Column
from .outcome import Outcome
from .week import Week

User = get_user_model()

SUBCLASSES = ["activity", "course", "program"]


def outcome_choices():
    OUTCOMES_NORMAL = 0
    OUTCOMES_ADVANCED = 1
    return (
        (OUTCOMES_NORMAL, _("Normal")),
        (OUTCOMES_ADVANCED, _("Advanced")),
    )


def outcome_sorts():
    OUTCOME_SORT_WEEK = 0
    OUTCOME_SORT_COLUMN = 1
    OUTCOME_SORT_TASK = 2
    OUTCOME_SORT_CONTEXT = 3
    return (
        (OUTCOME_SORT_WEEK, _("Time")),
        (OUTCOME_SORT_COLUMN, _("Category")),
        (OUTCOME_SORT_TASK, _("Task")),
        (OUTCOME_SORT_CONTEXT, _("Context")),
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


# developer should have implemented polymorphism ?
# try class Workflow(PolymorphicModel):
class Workflow(AbstractCourseFlowModel):
    objects = InheritanceManager()

    ##########################################################
    # FIELDS
    #########################################################
    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    edit_count = models.PositiveIntegerField(default=0, null=False)

    #########################################################
    # PUBLISHING / SHARING / FAV
    #########################################################
    static = models.BooleanField(default=False)

    # might be not relevant, see docs, see
    published = models.BooleanField(default=False)

    #
    public_view = models.BooleanField(default=False)

    # TBD
    is_strategy = models.BooleanField(default=False)

    # TBD
    is_template = models.BooleanField(default=False)

    # TBD, equivalent of new 'templates'
    from_saltise = models.BooleanField(default=False)

    # TBD maybe for when you copy something
    is_original = models.BooleanField(default=True)

    #########################################################
    # TIME
    #########################################################
    # note: use charfield because some users like to put in ranges (i.e. 10-15 minutes)
    time_required = models.CharField(max_length=30, null=True, blank=True)

    time_units = models.PositiveIntegerField(default=0, choices=unit_choices())

    time_general_hours = models.PositiveIntegerField(default=0, null=True)

    time_specific_hours = models.PositiveIntegerField(default=0, null=True)

    #########################################################
    # RELATIONS
    #########################################################
    author = models.ForeignKey(
        User,
        related_name="authored_workflows",
        on_delete=models.SET_NULL,
        null=True,
    )

    user_permissions = GenericRelation(
        "ObjectPermission", related_query_name="workflow"
    )

    favourited_by = GenericRelation("Favourite", related_query_name="workflow")

    parent_workflow = models.ForeignKey(
        "Workflow", on_delete=models.SET_NULL, null=True
    )

    # this is probably a mistake, these are only at the project level
    disciplines = models.ManyToManyField("Discipline", blank=True)

    # these are called different things depending on which workflow type
    # parts in activities
    # terms in programs
    # this is a mistake, but maybe not worth fixing
    # what is reasoning for this being n2m
    weeks = models.ManyToManyField(Week, through="WeekWorkflow", blank=True)

    # what is reasoning for this being n2m
    columns = models.ManyToManyField(
        Column, through="ColumnWorkflow", blank=True
    )

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeWorkflow", blank=True
    )

    #########################################################
    # VISUAL CONFIGURATION
    #########################################################
    # TBD
    outcomes_type = models.PositiveIntegerField(
        choices=outcome_choices(), default=0
    )

    #  'view' config storage
    # see outcome table right sidebar
    outcomes_sort = models.PositiveIntegerField(
        choices=outcome_sorts(), default=0
    )

    # visual representation of the workspace
    # this is like a config option that is stored
    condensed = models.BooleanField(default=False)

    #########################################################
    # COURSE WORKFLOW TYPE ONLY
    #########################################################

    # the Unique course identifier, 'academic course number',
    # present in: course
    code = models.CharField(max_length=title_max_length, null=True, blank=True)

    # courses only
    ponderation_theory = models.PositiveIntegerField(default=0, null=True)

    # courses only
    ponderation_practical = models.PositiveIntegerField(default=0, null=True)

    # courses only
    ponderation_individual = models.PositiveIntegerField(default=0, null=True)

    #########################################################
    # PROPERTIES
    #########################################################
    # @todo this is wrong, should be in dedicated table
    @property
    def importing(self):
        return cache.get("workflow" + str(self.pk) + "importing", False)

    # @todo this is wrong, should not be method
    @property
    def type(self):
        for subclass in SUBCLASSES:
            try:
                return getattr(self, subclass).type
            except AttributeError as e:
                logger.exception("An error occurred")
                pass
        return "workflow"

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return self.type

    #########################################################
    # META
    #########################################################
    class Meta:
        verbose_name = _("Workflow")
        verbose_name_plural = _("Workflows")

    #########################################################
    # MODEL METHODS / GETTERS
    #########################################################
    # @todo this is wrong, no current n2m usecase
    def get_project(self):
        return self.project_set.first()

    # @todo this is wrong,
    def get_workflow(self):
        return Workflow.objects.get(pk=self.pk)

    # ...????
    def get_permission_objects(self):
        return [self.get_workflow()]

    # no more live project
    # def get_live_project(self):
    #     try:
    #         liveproject = self.get_project().liveproject
    #     except AttributeError as e:
    #                logger.exception("An error occurred")
    #         liveproject = None
    #     return liveproject

    # @todo NO...
    def get_subclass(self):
        subclass = self
        try:
            subclass = self.activity
        except AttributeError as e:
            # logger.exception("An error occurred")
            pass
        try:
            subclass = self.course
        except AttributeError as e:
            # logger.exception("An error occurred")
            pass
        try:
            subclass = self.program
        except AttributeError as e:
            # logger.exception("An error occurred")
            pass

        return subclass

    def get_all_outcome_ids(self):
        ids = []
        for outcome in self.outcomes.all():
            outcome.get_all_outcome_ids(ids)
        return ids
