from django.contrib.auth import login
from django.contrib.auth.models import User
from django.urls import reverse
from django_lti_tool_provider import AbstractApplicationHookManager
from typing import Optional


class ApplicationHookManager(AbstractApplicationHookManager):
    LTI_KEYS = ["custom_course_id", "course_list"]

    def authenticated_redirect_to(self, request, lti_data):
        course_id = lti_data.get("custom_course_id")
        course_list = lti_data.get("course_list", "0") == "1"

        if course_list:
            redirect_url = reverse("course-list")
        elif course_id is None:
            redirect_url = reverse("home")
        else:
            redirect_url = reverse("course-detail-view", pk=course_id)
        return redirect_url

    def authentication_hook(self, request, username=None, email=None):

        user = authenticate(username)

        if not isinstance(user, User):
            try:
                user = create(username, email)
            except:  # todo
                pass
        login(request, user)

    def vary_by_key(self, lti_data):
        return ":".join(str(lti_data[k]) for k in self.LTI_KEYS)


def authenticate(username: str) -> Optional[User]:
    pass


def create(username: str, email: str) -> User:
    pass
