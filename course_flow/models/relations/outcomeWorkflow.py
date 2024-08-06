from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class OutcomeWorkflow(models.Model):
    workflow = models.ForeignKey("Workflow", on_delete=models.CASCADE)
    outcome = models.ForeignKey("Outcome", on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_display_rank(self):
        if self.outcome.deleted:
            return -1
        return list(
            OutcomeWorkflow.objects.filter(
                workflow=self.workflow, outcome__deleted=False
            ).order_by("rank")
        ).index(self)

    def get_permission_objects(self):
        return [self.project, self.outcome]

    class Meta:
        verbose_name = _("Outcome-Workflow Link")
        verbose_name_plural = _("Outcome-Workflow Links")
