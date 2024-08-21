from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.urls import reverse

from course_flow.decorators import ajax_login_required


@ajax_login_required
def logout_view(request):
    logout(request)
    return redirect(reverse("login"))


#########################################################
# DEV / UTILITY
# these routes are useful to dev or isolated courseflow
#########################################################
@login_required
def styleguide_home_view(request):
    context = {
        "title": "Styleguide",
        "path_id": "styleguide",
        "contextData": {},
    }

    return render(
        request, "course_flow/html/react_common_entrypoint.html", context
    )
