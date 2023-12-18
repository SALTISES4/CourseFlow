from django.contrib.auth.decorators import login_required
from django.shortcuts import render

@login_required
def notifications_view(request):
    context = {
        "title": "Notifications",
        "path_id": "notifications",
        "contextData": {}
    }
    return render(request, "course_flow/react/notifications.html", context)
