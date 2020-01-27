from django.contrib.auth.models import User
import pytest
from django.db.utils import IntegrityError
from course_flow_creation_distribution.lti import (
    generate_password,
    create,
    authenticate,
)


def test_authenticate(user):
    assert authenticate(user.username) == user


def test_authenticate__user_doesnt_exist():
    assert authenticate("test") is None


def test_create():
    username = "test"
    user = create(username)
    assert isinstance(user, User)
    assert user.username == username
    assert user.password


def test_create__already_exists(user):
    username = user.username
    with pytest.raises(IntegrityError):
        user = create(username)


def test_generate_password():
    username = "test"

    assert len(generate_password(username)) == 64
    assert generate_password(username) == generate_password(username)
    assert generate_password(username) != generate_password(username + "_")
