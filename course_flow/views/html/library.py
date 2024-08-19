#########################################################
#  Plain html routes
#########################################################
from pprint import pprint

from django.conf import settings
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import Group
from django.shortcuts import render

from course_flow.decorators import ignore_extra_args


#########################################################
# mixins
#########################################################
def is_teacher(user):
    return Group.objects.get(name=settings.TEACHER_GROUP) in user.groups.all()


#########################################################
# LIBRARY
#########################################################
# @ignore_extra_args
@login_required
def default_react_view(request, title, path_id, _):
    context = {"title": title, "path_id": path_id}
    return render(request, "course_flow/react/common_entrypoint.html", context)


@login_required
@user_passes_test(is_teacher)
def explore_view(request):
    context = {"path_id": "explore", "title": "Explore"}

    return render(request, "course_flow/react/common_entrypoint.html", context)
