from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def mylibrary_view(request):
    context = {"title": "My Library", "path_id": "library", "contextData": {}}
    return render(request, "course_flow/react/common_entrypoint.html", context)
