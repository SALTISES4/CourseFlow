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
from course_flow.models.liveProject import LiveProject
from course_flow.models.models import Project
from course_flow.models.objectPermission import ObjectPermission
from course_flow.models.relations.liveProjectUser import LiveProjectUser
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
    current_user = request.user
    context = {}
    context_data = {
        "user_id": current_user.id if current_user else 0,
        "project_data_package": get_my_live_projects(request.user),
    }

    context["contextData"] = (
        JSONRenderer().render(context_data).decode("utf-8")
    )
    context["path_id"] = "my_live_projects"
    context["title"] = "My Live Projects"
    return render(request, "course_flow/react/my_live_projects.html", context)


class LiveProjectDetailView(LoginRequiredMixin, UserEnrolledMixin, DetailView):
    model = Project
    fields = ["title", "description"]
    template_name = "course_flow/react/common_entrypoint.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        project = self.object
        liveproject = project.liveproject
        current_user = self.request.user

        context_data = {
            "live_project_data": LiveProjectSerializer(
                liveproject, context={"user": self.request.user}
            ).data,
            "project_data": ProjectSerializerShallow(
                project, context={"user": self.request.user}
            ).data,
            "user_role": LiveProjectUser.objects.get(
                user=self.request.user, liveproject=liveproject
            ).role_type,
            "user_permission": get_user_permission(project, self.request.user),
            "user_id": current_user.id if current_user else 0,
        }

        context["contextData"] = (
            JSONRenderer().render(context_data).decode("utf-8")
        )
        context["path_id"] = "liveProjectDetail"
        context["title"] = project.title
        return context
