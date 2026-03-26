from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow_legacy.models import Project


class WorkflowProject(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    workflow = models.ForeignKey("Workflow", on_delete=models.CASCADE)

    # @todo use case?
    added_on = models.DateTimeField(default=timezone.now)

    # @todo use case?
    rank = models.PositiveIntegerField(default=0)

    def get_permission_objects(self):
        return [self.project, self.get_workflow().get_permission_objects()[0]]

    class Meta:
        verbose_name = _("Workflow-Project Link")
        verbose_name_plural = _("Workflow-Project Links")
