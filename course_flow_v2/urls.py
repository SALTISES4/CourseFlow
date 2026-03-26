from django.urls import path

from course_flow_v2.api.ninja_app import api

urlpatterns = [
    path("api/", api.urls),
]
