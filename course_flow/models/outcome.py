import uuid

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models._common import User, title_max_length


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
