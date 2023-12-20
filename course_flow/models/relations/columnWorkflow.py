from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models import Column, Workflow


class ColumnWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    column = models.ForeignKey(Column, on_delete=models.CASCADE)
    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_workflow(self):
        return self.workflow

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

    class Meta:
        verbose_name = _("Column-Workflow Link")
        verbose_name_plural = _("Column-Workflow Links")
