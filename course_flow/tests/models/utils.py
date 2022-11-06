from django.conf import settings
from django.contrib.auth.models import Group, User

from course_flow.utils import get_model_from_str


def make_object(model_key, author=None):
    if model_key == "column":
        return get_model_from_str(model_key).objects.create(
            title="test" + model_key + "title", author=author
        )
    else:
        return get_model_from_str(model_key).objects.create(
            title="test" + model_key + "title",
            description="test" + model_key + "description",
            author=author,
        )


def login(test_case):
    user = User.objects.create(username="testuser1")
    user.set_password("testpass1")
    user.save()
    teacher_group, _ = Group.objects.get_or_create(name=settings.TEACHER_GROUP)
    user.groups.add(teacher_group)
    logged_in = test_case.client.login(
        username="testuser1", password="testpass1"
    )
    test_case.assertTrue(logged_in)
    return user

def login_student(test_case):
    user = User.objects.create(username="testuser1")
    user.set_password("testpass1")
    user.save()
    logged_in = test_case.client.login(
        username="testuser1", password="testpass1"
    )
    test_case.assertTrue(logged_in)
    return user


def get_author():
    author = User.objects.create(username="testuser2")
    author.set_password("testpass2")
    author.save()
    teacher_group, _ = Group.objects.get_or_create(name=settings.TEACHER_GROUP)
    author.groups.add(teacher_group)
    return author


def check_order(test_case, object_links):
    sorted_links = object_links.order_by("rank")
    for i, link in enumerate(sorted_links):
        test_case.assertEqual(link.rank, i)
