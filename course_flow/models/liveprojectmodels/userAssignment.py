# This model is part of a now-decomissioned Live Project mode.
# The tables are kept for backwards compatibility, in case
# the feature is once again needed.

from django.contrib.auth import get_user_model
from django.db import models

from .liveAssignment import LiveAssignment

User = get_user_model()


class UserAssignment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    assignment = models.ForeignKey(LiveAssignment, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_on = models.DateTimeField(null=True)

    def get_live_project(self):
        return self.assignment.liveproject

    def get_permission_objects(self):
        return [self.assignment.liveproject]
