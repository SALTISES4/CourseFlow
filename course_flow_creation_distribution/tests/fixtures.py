from django.contrib.auth.models import User
from django.conf import settings
from lti import ToolConsumer
import pytest

from course_flow_creation_distribution.lti import generate_password


@pytest.fixture
def user():
    return User.objects.create_user(
        username="test", password=generate_password("test")
    )


@pytest.fixture
def lti_consumer(user):
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
