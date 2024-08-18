#########################################################
#  Plain html routes
#########################################################

from django.conf import settings
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import Group
from django.shortcuts import render


# mixins
def is_teacher(user):
    return Group.objects.get(name=settings.TEACHER_GROUP) in user.groups.all()


#########################################################
# LIBRARY
#########################################################
@login_required
def home_view(request):
    context = {
        "title": "Home",
        "path_id": "home",
        "contextData": {},  # @todo if this is not set, page breaks, not sure why yet
    }
    return render(request, "course_flow/react/common_entrypoint.html", context)


@login_required
@user_passes_test(is_teacher)
def explore_view(request):
    context = {"path_id": "explore", "title": "Explore", "contextData": {}}

    return render(request, "course_flow/react/common_entrypoint.html", context)


@login_required
def favourites_view(request):
    context = {
        "title": "My Favourites",
        "path_id": "favourites",
        "contextData": {},
    }
    return render(request, "course_flow/react/common_entrypoint.html", context)


@login_required
def library_view(request):
    context = {"title": "My Library", "path_id": "library", "contextData": {}}
    return render(request, "course_flow/react/common_entrypoint.html", context)
