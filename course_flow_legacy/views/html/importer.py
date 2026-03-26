from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def import_view(request):
    return render(request, "course_flow/react/import.html")
