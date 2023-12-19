from django.db import models
from django.utils import timezone

from course_flow.management.commands.create_instances import User
from course_flow.models.liveProject import LiveProject
from course_flow.models.node import Node


def default_due_date():
    return timezone.now().replace(
        second=0, microsecond=0, minute=0, hour=0
    ) + timezone.timedelta(weeks=2)


def default_start_date():
    return timezone.now().replace(
        second=0, microsecond=0, minute=0, hour=0
    ) + timezone.timedelta(weeks=1)


class LiveAssignment(models.Model):
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    liveproject = models.ForeignKey(LiveProject, on_delete=models.CASCADE)
    self_reporting = models.BooleanField(default=True)
    single_completion = models.BooleanField(default=False)
    task = models.ForeignKey(Node, null=True, on_delete=models.SET_NULL)
    start_date = models.DateTimeField(default=default_start_date)
    end_date = models.DateTimeField(default=default_due_date)
    created_on = models.DateTimeField(default=timezone.now)

    @property
    def title(self):
        if self.task is not None:
            return self.task.title

    def get_live_project(self):
        return self.liveproject

    def get_permission_objects(self):
        return [self.liveproject]
