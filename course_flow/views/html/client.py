#########################################################
#  Plain html routes
#########################################################
from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from course_flow.decorators import ignore_extra_args


@login_required
@ignore_extra_args
def default_react_view(request):
    context = {}
    return render(
        request, "course_flow/html/react_common_entrypoint.html", context
    )
