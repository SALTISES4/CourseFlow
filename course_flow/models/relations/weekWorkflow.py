from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models import Workflow
from course_flow.models.workflow_objects.week import Week


class WeekWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_display_rank(self):
        if self.week.deleted:
            return -1
        return list(
            WeekWorkflow.objects.filter(workflow=self.workflow, week__deleted=False).order_by(
                "rank"
            )
        ).index(self)

    def get_workflow(self):
        return self.workflow

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

    class Meta:
        verbose_name = _("Week-Workflow Link")
        verbose_name_plural = _("Week-Workflow Links")
