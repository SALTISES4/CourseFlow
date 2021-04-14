from django.conf.urls import url
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path

from . import urls, views

app_name = "course_flow"

urlpatterns = [
    url(r"^register/$", views.registration_view, name="registration"),
    url(
        r"^login/$",
        auth_views.LoginView.as_view(
            template_name="course_flow/registration/login.html"
        ),
        name="login",
    ),
    url(r"^logout/$", auth_views.LogoutView.as_view(), name="logout"),
    path(
        "", include((urls.urlpatterns, urls.app_name), namespace="course_flow")
    ),
    path(
        "feedback/", include("user_feedback.urls", namespace="user_feedback")
    ),
    path("admin/", admin.site.urls),
]
