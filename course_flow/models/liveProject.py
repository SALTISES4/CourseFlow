from django.db import models
from django.utils import timezone

from course_flow.models.project import Project
from course_flow.models.workflow import Workflow


class LiveProject(models.Model):
    created_on = models.DateTimeField(default=timezone.now)

    project = models.OneToOneField(
        Project, on_delete=models.CASCADE, primary_key=True
    )

    # Whether students are able to check tasks as complete themselves or
    # must have the instructor mark them as complete
    default_self_reporting = models.BooleanField(default=True)
    # Whether newly created assignments are assigned to all by default
    default_assign_to_all = models.BooleanField(default=True)
    # Whether it is enough for a single assigned user to complete the task,
    # or (when True) when any user completes the task it becomes complete for all users
    default_single_completion = models.BooleanField(default=False)
    # whether workflows are always all visible
    default_all_workflows_visible = models.BooleanField(default=False)
    # These workflows are always visible to all students
    visible_workflows = models.ManyToManyField(Workflow, blank=True)

    def get_permission_objects(self):
        return [self]

    def get_live_project(self):
        return self

    @property
    def type(self):
        return "liveproject"

    @property
    def last_modified(self):
        return self.project.last_modified

    @property
    def id(self):
        return self.pk

    @property
    def author(self):
        return self.project.author

    @property
    def title(self):
        return self.project.title

    @property
    def description(self):
        return self.project.description
