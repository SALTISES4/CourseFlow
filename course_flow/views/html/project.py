from typing import List

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.urls import reverse
from django.views.generic import DetailView
from rest_framework.renderers import JSONRenderer

from course_flow.models import Discipline, LiveProjectUser, Project
from course_flow.serializers import (
    DisciplineSerializer,
    ProjectSerializerShallow,
)
from course_flow.utils import get_user_permission, get_user_role
from course_flow.view_utils import get_my_projects
from course_flow.views.HTTP.HTTP import CreateView_No_Autocomplete
from course_flow.views.mixins import UserCanViewMixin


class ProjectDetailView(LoginRequiredMixin, UserCanViewMixin, DetailView):
    model: Project = Project
    # how are these fields being used?
    fields = ["title", "description", "published"]

    template_name: str = "course_flow/unified/project_update.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        project = self.object
        current_user = self.request.user

        project_data = ProjectSerializerShallow(
            project, context={"user": self.request.user}
        ).data

        if hasattr(project, "liveproject") and project.liveproject is not None:
            user_role = get_user_role(project.liveproject, self.request.user)
        else:
            user_role = LiveProjectUser.ROLE_NONE

        user_permission = get_user_permission(project, self.request.user)
        title = project.title

        disciplines = DisciplineSerializer(
            Discipline.objects.order_by("title"), many=True
        ).data

        # todo, how to get the context data for current user id?
        context_data = {
            "project_data": project_data,
            "user_role": user_role,
            "user_permission": user_permission,
            "title": title,
            "disciplines": disciplines,
            "user_id": current_user.id if current_user else 0,
        }

        context["contextData"] = (
            JSONRenderer().render(context_data).decode("utf-8")
        )

        return context


class ProjectCreateView(
    LoginRequiredMixin, UserPassesTestMixin, CreateView_No_Autocomplete
):
    model = Project
    fields = ["title", "description"]
    template_name = "course_flow/workflow_create.html"

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


class ProjectComparisonView(LoginRequiredMixin, UserCanViewMixin, DetailView):
    model = Project
    fields: List[str] = ["title", "description", "published"]
    template_name = "course_flow/react/comparison.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        user = self.request.user
        project = self.object
        context["project_data"] = (
            JSONRenderer()
            .render(
                ProjectSerializerShallow(project, context={"user": user}).data
            )
            .decode("utf-8")
        )
        context["is_strategy"] = JSONRenderer().render(False).decode("utf-8")

        user_permission = get_user_permission(project, user)
        user_role = get_user_role(project, user)
        context["user_permission"] = (
            JSONRenderer().render(user_permission).decode("utf-8")
        )
        context["user_role"] = JSONRenderer().render(user_role).decode("utf-8")

        return context


@login_required
def myprojects_view(request):
    context = {
        "project_data_package": JSONRenderer()
        .render(get_my_projects(request.user, True))
        .decode("utf-8")
    }
    return render(request, "course_flow/myprojects.html", context)
