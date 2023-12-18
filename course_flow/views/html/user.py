import json
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.urls import reverse
from course_flow.decorators import ajax_login_required
from course_flow.models import CourseFlowUser

@ajax_login_required
def logout_view(request):
    logout(request)
    return redirect(reverse("login"))


@login_required
def notifications_view(request):
    context = {
        "title": "Notifications",
        "path_id": "notifications",
        "contextData": {}
    }
    return render(request, "course_flow/react/notifications.html", context)


@login_required
def notifications_settings_view(request):
    user = CourseFlowUser.objects.filter(user=request.user).first()
    context = {
        "title": "Notifications Settings",
        "path_id": "notificationsSettings",
        "contextData": json.dumps({
            "formData": {
                "receiveNotifications": user.notifications
            }
        })
    }
    return render(request, "course_flow/react/notifications_settings.html", context)


@login_required
def profile_settings_view(request):
    context = {
        "title": "Profile Settings",
        "path_id": "profileSettings",
        "contextData": {}
    }
    return render(request, "course_flow/react/profile_settings.html", context)
