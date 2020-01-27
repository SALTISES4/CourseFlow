import pytest
from django.contrib.auth.models import User
from django.db.utils import IntegrityError
from django.urls import reverse

from course_flow_creation_distribution.lti import (
    authenticate,
    create,
    generate_password,
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


def test_lti(client, lti_consumer):
    resp = client.post(
        "http://testserver/lti/", data=lti_consumer.generate_launch_data()
    )
    assert resp.url == "/home/"


def test_lti__course(client, lti_consumer):
    course_id = 2
    lti_consumer.launch_params["custom_course_id"] = str(course_id)
    resp = client.post(
        "http://testserver/lti/", data=lti_consumer.generate_launch_data()
    )
    assert resp.url == f"/course/{course_id}/"


def test_lti__course_list(client, lti_consumer):
    lti_consumer.launch_params["custom_course_list"] = "1"
    resp = client.post(
        "http://testserver/lti/", data=lti_consumer.generate_launch_data()
    )
    assert resp.url == f"/course-list/"


def test_lti__new_user(client, lti_consumer):
    User.objects.get(username=lti_consumer.launch_params["user_id"]).delete()
    resp = client.post(
        "http://testserver/lti/", data=lti_consumer.generate_launch_data()
    )
    assert resp.url == "/home/"
    assert (
        User.objects.get(username=lti_consumer.launch_params["user_id"])
        is not None
    )


@pytest.mark.django_db(transaction=True)
def test_lti__user_already_exists_wrong_password(client, lti_consumer, caplog):
    User.objects.get(username=lti_consumer.launch_params["user_id"]).delete()
    User.objects.create_user(
        username=lti_consumer.launch_params["user_id"], password="wrong"
    )
    resp = client.post(
        "http://testserver/lti/", data=lti_consumer.generate_launch_data()
    )
    assert resp.status_code == 404
    assert caplog.records[0].getMessage() == (
        "Lti tried to create a new user with username "
        f"{lti_consumer.launch_params['user_id']}, but there already exists "
        "a user with that username."
    )


def test_get_course_list(client, users, courses):
    user = users[0]

    client.login(
        username=user.username, password=generate_password(user.username)
    )

    courses_ = [course for course in courses if course.author == user]

    resp = client.get(reverse("course-list"))
    data = resp.json()

    assert len(courses_) == len(data["courses"])
    assert all(
        course.id in (c["id"] for c in data["courses"]) for course in courses_
    )
