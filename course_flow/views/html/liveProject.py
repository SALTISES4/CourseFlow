from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import Group
from django.shortcuts import render
from django.utils.translation import gettext as _
from django.views.generic import DetailView
from rest_framework.renderers import JSONRenderer

from course_flow.decorators import (
    check_object_enrollment,
    check_object_permission,
)
from course_flow.models import (
    LiveProject,
    LiveProjectUser,
    ObjectPermission,
    Project,
)
from course_flow.serializers import (
    InfoBoxSerializer,
    LiveProjectSerializer,
    ProjectSerializerShallow,
)
from course_flow.utils import get_user_permission
from course_flow.views.mixins import UserEnrolledMixin


def get_my_live_projects(user):
    data_package = {}
    classrooms_teacher = []
    classrooms_student = []
    all_classrooms = LiveProject.objects.filter(
        project__deleted=False, liveprojectuser__user=user
    )
    for classroom in all_classrooms:
        if check_object_permission(
            classroom.project, user, ObjectPermission.PERMISSION_VIEW
        ):
            classrooms_teacher += [classroom.project]
        else:
            if check_object_enrollment(
                classroom, user, LiveProjectUser.ROLE_TEACHER
            ):
                classrooms_teacher += [classroom]
            else:
                classrooms_student += [classroom]

    if Group.objects.get(name=settings.TEACHER_GROUP) in user.groups.all():
        data_package["owned_liveprojects"] = {
            "title": _("My classrooms (teacher)"),
            "sections": [
                {
                    "title": _("My classrooms (teacher)"),
                    "object_type": "project",
                    "objects": InfoBoxSerializer(
                        classrooms_teacher,
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "emptytext": _(
                "You haven't created any classrooms yet. Create a project, then choose 'Create Classroom' to create a live classroom."
            ),
        }
    data_package["shared_liveprojects"] = {
        "title": _("My classrooms (student)"),
        "sections": [
            {
                "title": _("My classrooms (student)"),
                "object_type": "liveproject",
                "objects": InfoBoxSerializer(
                    classrooms_student,
                    many=True,
                    context={"user": user},
                ).data,
            }
        ],
        "emptytext": _("You aren't registered for any classrooms right now."),
    }
    return data_package


@login_required
def my_live_projects_view(request):
    context = {
        "project_data_package": JSONRenderer()
        .render(get_my_live_projects(request.user))
        .decode("utf-8")
    }
    return render(request, "course_flow/react/my_live_projects.html", context)


class LiveProjectDetailView(LoginRequiredMixin, UserEnrolledMixin, DetailView):
    model = Project
    fields = ["title", "description"]
    template_name = "course_flow/live_project_update.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        project = self.object
        liveproject = project.liveproject
        context["live_project_data"] = (
            JSONRenderer()
            .render(
                LiveProjectSerializer(
                    liveproject, context={"user": self.request.user}
                ).data
            )
            .decode("utf-8")
        )
        context["project_data"] = (
            JSONRenderer()
            .render(
                ProjectSerializerShallow(
                    project, context={"user": self.request.user}
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
        context["user_permission"] = (
            JSONRenderer()
            .render(get_user_permission(project, self.request.user))
            .decode("utf-8")
        )
        return context
