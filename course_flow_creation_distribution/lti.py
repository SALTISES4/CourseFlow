from django.contrib.auth import login, authenticate as authenticate_
from django.db.utils import IntegrityError
from django.conf import settings
import hashlib
from django.contrib.auth.models import User
from django.urls import reverse
from django_lti_tool_provider import AbstractApplicationHookManager
from typing import Optional
import logging

logger = logging.getLogger("courseflow")


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

    def authentication_hook(
        self, request, user_id: str, username: None = None, email: None = None
    ) -> None:

        user = authenticate(user_id)

        if not isinstance(user, User):
            try:
                user = create(username, email)
            except IntegrityError:  # todo
                logger.error(
                    f"Lti tried to create a new user with username {username}"
                    ", but there already exists a user with that username."
                )
                return
        login(request, user)

    def vary_by_key(self, lti_data):
        return ":".join(str(lti_data[k]) for k in self.LTI_KEYS)


def authenticate(username: str) -> Optional[User]:
    """
    Authenticates the user from the username and returns it if it exists. As
    the password is created from the username, this verifies that the user
    exists and they were created through the `create` function.

    Parameters
    ----------
    username : str
        Username

    Returns
    -------
    Optional[User]
        User if they exist and None if not
    """
    return authenticate_(username=username, password=generate_password(username))


def create(username: str) -> User:
    """
    Creates the user from the username and a password generated from it.

    Parameters
    ----------
    username : str
        Username

    Returns
    -------
    User
        Created user

    Raises
    ------
    IntegrityError
        If the user already exists
    """
    return User.objects.create_user(
        username=username, password=generate_password(username)
    )


def generate_password(username: str) -> str:
    """
    Generates the password created from the `username`. This will always be the
    same as long as `PASSWORD_KEY` doesn't change.

    Parameters
    ----------
    username : str
        Username used to create the password

    Returns
    -------
    str
        Password as a hashed string of length 64
    """
    return hashlib.sha3_256(f"{username}.{settings.PASSWORD_KEY}".encode()).hexdigest()
