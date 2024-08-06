from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from rest_framework.renderers import JSONRenderer


@login_required
def styleguide_home(request):

    context = {
        "title": "Styleguide",
        "path_id": "styleguide",
        "contextData": JSONRenderer().render({}).decode("utf-8")
    }

    return render(request, "course_flow/react/common_entrypoint.html", context)
