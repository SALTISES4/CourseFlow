import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models._common import title_max_length

User = get_user_model()


# Model to represent an outcome. Outcome are recursively nested with an
# "outcomeoutcome" (outcome to outcome link) as the throughmodel.
# This allows an outcome to be split into sub-outcomes. The outcome "depth"
# represents how far nested it is, with 0 corresponding to an outcome that is
# associated directly with a workflow, 1 with a sub-outcome, 2 with a sub-sub-outcome.
# The creation of outcomes of depth 3 or greater is prevented both in the front-end
# and in the back-end for performance reasons.
# Almost all front-end representations of an outcome necessarily follow this nested
# structure.
# Child outcomes are linked to this model in the "children" field.
# Note this is different to the "horizontal outcomes" field, which refer
# to the outcomes of a different workflow which have been associated with this one.
# The horizontal outcomes are used primarily to allow the association of program-level
# competencies with course-level learning outcomes. Thus a course-level learning outcome
# which has program-level competencies associated with it will have those competencies
# tagged onto it as its horizontal_outcomes.
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
        verbose_name = _("Outcome")
        verbose_name_plural = _("Outcomes")
