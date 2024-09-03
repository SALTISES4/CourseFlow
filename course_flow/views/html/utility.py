from django.contrib.auth import logout
from django.shortcuts import redirect, render
from django.urls import reverse

from course_flow.decorators import ajax_login_required


@ajax_login_required
def logout_view(request):
    logout(request)
    return redirect(reverse("login"))
