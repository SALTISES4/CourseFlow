from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import DetailView
from rest_framework.renderers import JSONRenderer

from course_flow.models import LiveAssignment, LiveProjectUser
from course_flow.serializers import (
    LiveAssignmentSerializer,
    LiveProjectSerializer,
)
from course_flow.views.mixins import UserEnrolledAsTeacherMixin


class AssignmentDetailView(
    LoginRequiredMixin, UserEnrolledAsTeacherMixin, DetailView
):
    model = LiveAssignment
    fields = ["task__title"]
    template_name = "course_flow/react/live_assignment_update.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        assignment = self.object
        liveproject = assignment.liveproject
        context["assignment_data"] = (
            JSONRenderer()
            .render(
                LiveAssignmentSerializer(
                    assignment, context={"user": self.request.user}
                ).data
            )
            .decode("utf-8")
        )
        context["live_project_data"] = (
            JSONRenderer()
            .render(
                LiveProjectSerializer(
                    liveproject, context={"user": self.request.user}
                ).data
            )
            .decode("utf-8")
        )
        context["user_role"] = (
            JSONRenderer()
            .render(
                LiveProjectUser.objects.get(
                    user=self.request.user, liveproject=liveproject
                ).role_type
            )
            .decode("utf-8")
        )
        return context
