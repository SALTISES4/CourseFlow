from django.contrib.auth.models import User
import pytest

from course_flow_creation_distribution.lti import generate_password


@pytest.fixture
def user():
    return User.objects.create_user(username="test", password=generate_password("test"))
