from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def home_view(request):
    current_user = request.user
    context = {}
    context_data = {
        # this line is throwing an error
        # "is_teacher": current_user.groups.filter("Teacher").exists(),
        # "is_teacher": current_user.has_group("Teacher"),
        "is_teacher": "true",
    }
    context["contextData"] = context_data
    context["title"] = "Home"
    context["path_id"] = "home"

    return render(request, "course_flow/react/home.html", context)
