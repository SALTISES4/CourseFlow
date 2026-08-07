"""Safety tests for disposable Playwright account cleanup."""

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from course_flow.core.models import User


@pytest.mark.django_db
def test_delete_e2e_user_refuses_account_outside_disposable_namespace():
    user = User.objects.create_user(
        email="teacher@courseflow.com",
        password="password",
    )

    with pytest.raises(CommandError, match="Refusing to delete"):
        call_command("cf_delete_e2e_user", email=user.email)

    assert User.objects.filter(pk=user.pk).exists()


@pytest.mark.django_db
def test_delete_e2e_user_deletes_namespaced_disposable_account():
    user = User.objects.create_user(
        email="e2e-disposable-command-test@courseflow.test",
        password="password",
    )

    call_command("cf_delete_e2e_user", email=user.email)

    assert not User.objects.filter(pk=user.pk).exists()
