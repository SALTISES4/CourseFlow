from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models import Outcome


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
        verbose_name = _("Outcome-Outcome Link")
        verbose_name_plural = _("Outcome-Outcome Links")
