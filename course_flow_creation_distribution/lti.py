import hashlib
import logging
from typing import Optional

from django.conf import settings
from django.contrib.auth import authenticate as authenticate_
from django.contrib.auth import login
from django.contrib.auth.models import User
from django.db.utils import IntegrityError
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.urls import reverse
from django_lti_tool_provider import AbstractApplicationHookManager

from .decorators import ajax_login_required
from .models import Course

logger = logging.getLogger("courseflow")


class ApplicationHookManager(AbstractApplicationHookManager):
    LTI_KEYS = ["custom_course_id", "course_list"]

    def authenticated_redirect_to(self, request, lti_data):
        course_id = lti_data.get("custom_course_id")
        course_list = lti_data.get("custom_course_list", "0") == "1"

        if course_list:
            redirect_url = reverse("course-list")
        elif course_id is None:
            redirect_url = reverse("home")
        else:
            redirect_url = reverse(
                "course-detail-view", kwargs={"pk": course_id}
            )
        return redirect_url

    def authentication_hook(  # pylint: disable=signature-differs,too-many-arguments
        self,
        request,
        user_id: str,
        username: None = None,
        email: None = None,
        extra_params: None = None,
    ) -> None:

        user = authenticate(user_id)

        if not isinstance(user, User):
            try:
                user = create(user_id)
            except IntegrityError:
                logger.error(
                    "Lti tried to create a new user with username "
                    f"{user_id}, but there already exists a user with "
                    "that username."
                )
                return
        login(request, user)

    def vary_by_key(self, lti_data):
        return ":".join(
            str(lti_data[k]) for k in self.LTI_KEYS if k in lti_data
        )


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
    return authenticate_(
        username=username, password=generate_password(username)
    )


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
    return hashlib.sha3_256(
        f"{username}.{settings.PASSWORD_KEY}".encode()
    ).hexdigest()


@ajax_login_required
def get_course_list(req: HttpRequest) -> HttpResponse:
    """
    Returns all available courses for the currently logged in user.

    Parameters
    ----------
    req : HttpRequest
        Request with a logged in user

    Returns
    -------
    JsonResponse with data:
        courses: [{
            id : int
                Pk of the course
            title : str
                Title of the course
        }]
    """
    return JsonResponse(
        {
            "courses": [
                {"id": course.pk, "title": course.title}
                for course in Course.objects.filter(author=req.user)
            ]
        }
    )
