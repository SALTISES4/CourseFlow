from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import DetailView
from rest_framework.renderers import JSONRenderer

from course_flow.models.liveAssignment import LiveAssignment
from course_flow.models.relations.liveProjectUser import LiveProjectUser
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
        current_user = self.request.user

        liveproject = assignment.liveproject

        context_data = {
            "user_role": LiveProjectUser.objects.get(
                user=self.request.user, liveproject=liveproject
            ).role_type,
            "live_project_data": LiveProjectSerializer(
                liveproject, context={"user": self.request.user}
            ).data,
            "assignment_data": LiveAssignmentSerializer(
                assignment, context={"user": self.request.user}
            ).data,
            "user_id": current_user.id if current_user else 0,
        }

        context["contextData"] = (
            JSONRenderer().render(context_data).decode("utf-8")
        )
        context["path_id"] = "assignmentDetail"
        context["title"] = assignment.title
        return context
