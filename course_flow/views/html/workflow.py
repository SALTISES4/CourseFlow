from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse
from django.views.generic import DetailView
from rest_framework.renderers import JSONRenderer

from course_flow.models import Workflow
from course_flow.view_utils import get_workflow_context_data
from course_flow.views.mixins import (
    ContentPublicViewMixin,
    UserCanViewOrEnrolledMixin,
)


class WorkflowDetailView(
    LoginRequiredMixin, UserCanViewOrEnrolledMixin, DetailView
):
    model = Workflow
    fields = ["id", "title", "description", "type"]
    template_name = "course_flow/react/workflow_update.html"

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
        )

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        workflow = self.get_object()

        context = get_workflow_context_data(
            workflow, context, self.request.user
        )
        context["public_view"] = JSONRenderer().render(False).decode("utf-8")

        return context


class WorkflowPublicDetailView(ContentPublicViewMixin, DetailView):
    model = Workflow
    fields = ["id", "title", "description"]
    template_name = "course_flow/react/workflow_update.html"

    def get_queryset(self):
        return self.model.objects.select_subclasses()

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
        )

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        workflow = self.get_object()

        context = get_workflow_context_data(
            workflow, context, self.request.user
        )
        context["public_view"] = JSONRenderer().render(True).decode("utf-8")

        return context
