from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models import Outcome


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
        verbose_name = _("Outcome-Outcome Link")
        verbose_name_plural = _("Outcome-Outcome Links")
