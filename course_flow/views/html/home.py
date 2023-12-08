from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def home_view(request):
    context = {"title": "Home", "path_id": "home"}
    return render(request, "course_flow/react/home.html", context)
