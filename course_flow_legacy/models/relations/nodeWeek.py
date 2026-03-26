from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow_legacy.models import Node, Week


class NodeWeek(models.Model):
    # if week is deleted, delete this nodeweek
    week = models.ForeignKey(Week, on_delete=models.CASCADE)

    # if node is deleted, delete this nodeweek
    node = models.ForeignKey(Node, on_delete=models.CASCADE)

    added_on = models.DateTimeField(default=timezone.now)
    rank = models.PositiveIntegerField(default=0)

    def get_workflow(self):
        return self.week.get_workflow()

    class Meta:
        verbose_name = _("Node-Week Link")
        verbose_name_plural = _("Node-Week Links")
