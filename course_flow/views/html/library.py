#########################################################
#  Plain html routes
#########################################################
from pprint import pprint

from django.conf import settings
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import Group
from django.shortcuts import render


#########################################################
# mixins
#########################################################
def is_teacher(user):
    return Group.objects.get(name=settings.TEACHER_GROUP) in user.groups.all()


#########################################################
# LIBRARY
#########################################################
@login_required
def default_react_view(request, title, path_id):
    context = {"title": title, "path_id": path_id}
    pprint("this is my view")
    pprint(path_id)
    return render(request, "course_flow/react/common_entrypoint.html", context)


@login_required
@user_passes_test(is_teacher)
def explore_view(request):
    context = {"path_id": "explore", "title": "Explore"}

    return render(request, "course_flow/react/common_entrypoint.html", context)
