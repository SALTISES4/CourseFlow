from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.urls import reverse
from django.views.generic.edit import CreateView

from course_flow.models import Activity, Project, WorkflowProject
from course_flow.views.HTTP.HTTP import CreateView_No_Autocomplete
from course_flow.views.mixins import UserCanEditProjectMixin


class ActivityCreateView(
    LoginRequiredMixin, UserCanEditProjectMixin, CreateView_No_Autocomplete
):
    model = Activity
    fields = ["title", "description"]
    template_name = "course_flow/html/workflow_create.html"

    def workflow_type(self):
        return "activity"

    def form_valid(self, form):
        form.instance.author = self.request.user
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        response = super(CreateView, self).form_valid(form)
        WorkflowProject.objects.create(project=project, workflow=form.instance)
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )


class ActivityStrategyCreateView(
    LoginRequiredMixin, UserPassesTestMixin, CreateView_No_Autocomplete
):
    model = Activity
    fields = ["title", "description"]
    template_name = "course_flow/html/workflow_create.html"

    def workflow_type(self):
        return "activity"

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
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )
