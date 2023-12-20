from typing import List

import pytest
from django.contrib.auth.models import User

from course_flow.lti import generate_password
from course_flow.models.course import Course
from course_flow.models.node import Node


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    pass


@pytest.fixture
def user() -> User:
    return User.objects.create_user(
        username="test", password=generate_password("test")
    )


@pytest.fixture
def users() -> List[User]:
    return [
        User.objects.create_user(
            username=f"test{i}", password=generate_password(f"test{i}")
        )
        for i in range(3)
    ]


@pytest.fixture
def courses(users):
    return [
        Course.objects.create(
            title=f"test{i}", description="test", author=users[i % len(users)]
        )
        for i in range(10)
    ]


@pytest.fixture
def node(user) -> Node:
    return Node.objects.create(author=user)
