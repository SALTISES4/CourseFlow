from django.urls import path

from course_flow.api.ninja_app import api

urlpatterns = [
    path("api/", api.urls),
]
