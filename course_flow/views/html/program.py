from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse
from django.views.generic.edit import CreateView

from course_flow.models import Project
from course_flow.models.program import Program
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.views.HTTP.HTTP import CreateViewNoAutocomplete
from course_flow.views.mixins import UserCanEditProjectMixin


class ProgramCreateView(
    LoginRequiredMixin, UserCanEditProjectMixin, CreateViewNoAutocomplete
):
    model = Program
    fields = ["title", "description"]
    template_name = "course_flow/html/workflow_create.html"

    def workflow_type(self):
        return "program"

    def form_valid(self, form):
        form.instance.author = self.request.user
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        response = super(CreateView, self).form_valid(form)
        WorkflowProject.objects.create(project=project, workflow=form.instance)
        form.instance.published = project.published
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
        )
