from django.contrib.auth.decorators import login_required
from django.shortcuts import render

@login_required
def profile_settings_view(request):
    context = {
        "title": "Profile Settings",
        "path_id": "profileSettings",
        "contextData": {}
    }
    return render(request, "course_flow/react/profile_settings.html", context)
