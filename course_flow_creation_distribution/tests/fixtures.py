from typing import List

import pytest
from django.conf import settings
from django.contrib.auth.models import User
from lti import ToolConsumer

from course_flow_creation_distribution.lti import generate_password
from course_flow_creation_distribution.models import Course


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
def lti_consumer(user) -> ToolConsumer:
    url = "http://testserver/lti/"
    return ToolConsumer(
        consumer_key=settings.LTI_CLIENT_KEY,
        consumer_secret=settings.LTI_CLIENT_SECRET,
        launch_url=url,
        params={
            "lti_message_type": "basic-lti-launch-request",
            "lti_version": "1.0",
            "resource_link_id": "0",
            "context_id": "test",
            "context_title": "test",
            "lis_outcome_service_url": url,
            "lis_result_sourcedid": url,
            "user_id": user.username,
        },
    )


@pytest.fixture
def courses(users):
    return [
        Course.objects.create(
            title=f"test{i}", description="test", author=users[i % len(users)]
        )
        for i in range(10)
    ]
