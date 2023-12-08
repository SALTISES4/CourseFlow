from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def myfavourites_view(request):
    return render(request, "course_flow/favourites.html")
