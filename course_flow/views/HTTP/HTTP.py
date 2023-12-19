from django.conf import settings
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import Group
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseForbidden,
    JsonResponse,
)
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.generic.edit import CreateView

from course_flow import export_functions
from course_flow.decorators import ajax_login_required
from course_flow.forms import RegistrationForm
from course_flow.models.models import Project
from course_flow.models.relations.liveProjectUser import LiveProjectUser


def registration_view(request):
    if request.method == "POST":
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get("username")
            raw_password = form.cleaned_data.get("password1")
            user = authenticate(username=username, password=raw_password)
            teacher_group, _ = Group.objects.get_or_create(
                name=settings.TEACHER_GROUP
            )
            user.groups.add(teacher_group)
            login(request, user)
            return redirect("course_flow:home")
    else:
        form = RegistrationForm()
    return render(
        request, "course_flow/registration/registration.html", {"form": form}
    )


# @todo camel case
class CreateView_No_Autocomplete(CreateView):
    def get_form(self, *args, **kwargs):
        form = super(CreateView, self).get_form()
        form.fields["title"].widget.attrs.update({"autocomplete": "off"})
        form.fields["description"].widget.attrs.update({"autocomplete": "off"})
        return form


def ratelimited_view(request, exception):
    return HttpResponse(
        "Error: too many requests to public page. Please wait at least one minute then try again.",
        status=429,
    )


@ajax_login_required
def register_as_student(request: HttpRequest, project_hash) -> HttpResponse:
    project = Project.get_from_hash(project_hash)
    if project is None:
        return HttpResponseForbidden(
            "Couldn't find a classroom associated with that link"
        )
    if project.liveproject is not None and not project.deleted:
        user = request.user
        if (
            LiveProjectUser.objects.filter(
                liveproject=project.liveproject, user=user
            ).count()
            == 0
        ):
            if project.author == user:
                LiveProjectUser.objects.create(
                    user=user,
                    liveproject=project.liveproject,
                    role_type=LiveProjectUser.ROLE_TEACHER,
                )
            else:
                LiveProjectUser.objects.create(
                    user=user,
                    liveproject=project.liveproject,
                    role_type=LiveProjectUser.ROLE_STUDENT,
                )
        return redirect(
            reverse(
                "course_flow:live-project-update", kwargs={"pk": project.pk}
            )
        )
    else:
        return HttpResponseForbidden(
            "The selected classroom has been deleted or does not exist"
        )


@ajax_login_required
def get_saltise_download(request: HttpRequest) -> HttpResponse:
    if (
        Group.objects.get(name="SALTISE_Staff")
        not in request.user.groups.all()
    ):
        return JsonResponse({"action": "error"})

    file_ext = "xlsx"

    filename = "saltise-analytics-data" + "." + file_ext
    file = export_functions.get_saltise_analytics()
    file_data = (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response = HttpResponse(file, content_type=file_data)
    response["Content-Disposition"] = "attachment; filename=%s" % filename
    return response
