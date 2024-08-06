from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def home_view(request):
    current_user = request.user
    context = {
        "title": "Home",
        "path_id": "home",
        "contextData": {
            # TODO FIXME
            # this line is throwing an error
            # "is_teacher": current_user.groups.filter("Teacher").exists(),
            # "is_teacher": current_user.has_group("Teacher"),
            "is_teacher": "true",
        },
    }

    return render(request, "course_flow/react/common_entrypoint.html", context)
