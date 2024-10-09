#########################################################
# @todo what is this file doing
#########################################################
from django.conf import settings
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.views.generic.edit import CreateView

from course_flow.forms import RegistrationForm
from course_flow.services.export_import import Exporter


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
        request,
        "course_flow/html/registration/registration.html",
        {"form": form},
    )


class CreateViewNoAutocomplete(CreateView):
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


#
# @login_required
# def register_as_student(request: HttpRequest, project_hash) -> HttpResponse:
#     project = Project.get_from_hash(project_hash)
#     if project is None:
#         return HttpResponseForbidden(
#             "Couldn't find a classroom associated with that link"
#         )
#     # @todo shouldn't this be gone?
#     if project.liveproject is not None and not project.deleted:
#         user = request.user
#         if (
#             LiveProjectUser.objects.filter(
#                 liveproject=project.liveproject, user=user
#             ).count()
#             == 0
#         ):
#             if project.author == user:
#                 LiveProjectUser.objects.create(
#                     user=user,
#                     liveproject=project.liveproject,
#                     role_type=LiveProjectUser.ROLE_TEACHER,
#                 )
#             else:
#                 LiveProjectUser.objects.create(
#                     user=user,
#                     liveproject=project.liveproject,
#                     role_type=LiveProjectUser.ROLE_STUDENT,
#                 )
#         return redirect(
#             reverse(
#                 "course_flow:live-project-update", kwargs={"pk": project.pk}
#             )
#         )
#     else:
#         return HttpResponseForbidden(
#             "The selected classroom has been deleted or does not exist"
#         )


@login_required
def get_saltise_download(request: HttpRequest) -> HttpResponse:
    if (
        Group.objects.get(name="SALTISE_Staff")
        not in request.user.groups.all()
    ):
        return JsonResponse({"action": "error"})

    file_ext = "xlsx"

    filename = "saltise-analytics-data" + "." + file_ext
    file = Exporter.get_saltise_analytics()
    file_data = (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response = HttpResponse(file, content_type=file_data)
    response["Content-Disposition"] = "attachment; filename=%s" % filename
    return response
