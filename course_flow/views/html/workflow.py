from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse
from django.views.generic import DetailView
from rest_framework.renderers import JSONRenderer

from course_flow.models.workflow import Workflow
from course_flow.utils import get_user_permission
from course_flow.view_utils import get_workflow_context_data
from course_flow.views.mixins import ContentPublicViewMixin, UserCanViewMixin


class WorkflowDetailView(LoginRequiredMixin, UserCanViewMixin, DetailView):
    model = Workflow
    fields = ["id", "title", "description", "type"]
    template_name = "course_flow/html/react_common_entrypoint.html"

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
        )

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        current_user = self.request.user
        workflow = self.get_object()
        user_permission = get_user_permission(workflow, current_user)

        context = get_workflow_context_data(
            workflow, context, self.request.user
        )

        context_data = {
            "public_view": False,
            "user_id": current_user.id if current_user else 0,
            "user_name": current_user.username,
            "user_permission": user_permission,
            "workflow_data_package": context.get("data_package"),
            "workflow_type": workflow.type,
            "workflow_model_id": workflow.id,
        }
        context["contextData"] = (
            JSONRenderer().render(context_data).decode("utf-8")
        )
        context["path_id"] = "workflowDetailView"
        context["title"] = workflow.title
        return context


class WorkflowPublicDetailView(ContentPublicViewMixin, DetailView):
    model = Workflow
    fields = ["id", "title", "description"]
    template_name = "course_flow/html/react_common_entrypoint.html"

    def get_queryset(self):
        return self.model.objects.select_subclasses()

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
        )

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        current_user = self.request.user
        workflow = self.get_object()
        user_permission = get_user_permission(workflow, current_user)

        context = get_workflow_context_data(workflow, context, current_user)
        context_data = {
            "public_view": True,
            "user_id": current_user.id if current_user else 0,
            "user_name": current_user.username,
            "user_permission": user_permission,
            "workflow_data_package": context.data_package,
            "workflow_type": workflow.type,
            "workflow_model_id": workflow.id,
        }

        context["contextData"] = (
            JSONRenderer().render(context_data).decode("utf-8")
        )
        context["path_id"] = "workflowDetailView"
        context["title"] = workflow.title

        return context
