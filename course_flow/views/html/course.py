from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.urls import reverse
from django.views.generic.edit import CreateView

from course_flow.models import Project
from course_flow.models.course import Course
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.views.HTTP.HTTP import CreateViewNoAutocomplete
from course_flow.views.mixins import UserCanEditProjectMixin


class CourseCreateView(
    LoginRequiredMixin, UserCanEditProjectMixin, CreateViewNoAutocomplete
):
    model = Course
    fields = ["title", "description"]
    template_name = "course_flow/html/workflow_create.html"

    # this should be explicity defined as a getter, or a field prop
    def workflow_type(self):
        return "course"

    def form_valid(self, form):
        form.instance.author = self.request.user
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        response = super(CreateView, self).form_valid(form)
        WorkflowProject.objects.create(project=project, workflow=form.instance)
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
        )


class CourseStrategyCreateView(
    LoginRequiredMixin, UserPassesTestMixin, CreateViewNoAutocomplete
):
    model = Course
    fields = ["title", "description"]
    template_name = "course_flow/html/workflow_create.html"

    def workflow_type(self):
        return "course"

    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )

    def form_valid(self, form):
        form.instance.author = self.request.user
        form.instance.is_strategy = True
        response = super(CreateView, self).form_valid(form)
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
        )
