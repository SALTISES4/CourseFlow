from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def home_view(request):
    current_user = request.user

    context = {
        "title": "Home",
        "path_id": "home",
        "is_teacher": current_user.groups.filter("Teacher").exists(),
    }

    return render(request, "course_flow/react/home.html", context)
