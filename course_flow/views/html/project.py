from typing import List

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.shortcuts import render
from django.urls import reverse
from django.views.generic import DetailView
from rest_framework.renderers import JSONRenderer

from course_flow.models import Project
from course_flow.models.discipline import Discipline
from course_flow.models.liveprojectmodels.liveProjectUser import (
    LiveProjectUser,
)
from course_flow.serializers import (
    DisciplineSerializer,
    ProjectSerializerShallow,
)
from course_flow.utils import get_user_permission
from course_flow.view_utils import get_my_projects
from course_flow.views.HTTP.HTTP import CreateView_No_Autocomplete
from course_flow.views.mixins import UserCanViewMixin


class ProjectDetailView(LoginRequiredMixin, UserCanViewMixin, DetailView):
    model: Project = Project
    # how are these fields being used?
    fields = ["title", "description", "published"]

    template_name: str = "course_flow/react/common_entrypoint.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        project = self.object
        current_user = self.request.user

        project_data = ProjectSerializerShallow(
            project, context={"user": self.request.user}
        ).data

        user_permission = get_user_permission(project, self.request.user)
        title = project.title

        disciplines = DisciplineSerializer(
            Discipline.objects.order_by("title"), many=True
        ).data

        context_data = {
            "project_data": project_data,
            "user_permission": user_permission,
            "disciplines": disciplines,
            "user_id": current_user.id if current_user else 0,
        }

        context["contextData"] = (
            JSONRenderer().render(context_data).decode("utf-8")
        )
        context["path_id"] = "projectDetail"
        context["title"] = title

        return context


class ProjectComparisonView(LoginRequiredMixin, UserCanViewMixin, DetailView):
    model = Project
    fields: List[str] = ["title", "description", "published"]
    template_name = "course_flow/react/common_entrypoint.html"

    def get_context_data(self, **kwargs):
        public_view = False  # moved from template layer
        is_strategy = False

        context = super(DetailView, self).get_context_data(**kwargs)
        current_user = self.request.user

        project = self.object
        user_permission = get_user_permission(project, current_user)

        context_data = {
            "project_data": ProjectSerializerShallow(
                project, context={"user": current_user}
            ).data,
            "is_strategy": is_strategy,
            "user_permission": user_permission,
            "public_view": public_view,
            "user_name": current_user.username,
            "user_id": current_user.id if current_user else 0,
        }

        context["contextData"] = (
            JSONRenderer().render(context_data).decode("utf-8")
        )
        context["path_id"] = "projectComparison"
        context["title"] = "Project Comparison"

        return context



# HTTP FRAGMENT REQUEST - TODO: Replaced by the Create Project modal
class ProjectCreateView(
    LoginRequiredMixin, UserPassesTestMixin, CreateView_No_Autocomplete
):
    model = Project
    fields = ["title", "description"]
    template_name = "course_flow/html/workflow_create.html"

    def workflow_type(self):
        return "project"

    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super(ProjectCreateView, self).form_valid(form)

    def get_success_url(self):
        return reverse(
            "course_flow:project-update", kwargs={"pk": self.object.pk}
        )
