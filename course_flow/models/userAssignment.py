from django.db import models

from course_flow.management.commands.create_instances import User
from course_flow.models.liveAssignment import LiveAssignment


class UserAssignment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    assignment = models.ForeignKey(LiveAssignment, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_on = models.DateTimeField(null=True)

    def get_live_project(self):
        return self.assignment.liveproject

    def get_permission_objects(self):
        return [self.assignment.liveproject]
