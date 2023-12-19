from django.db import models
from django.utils.translation import gettext_lazy as _

from course_flow.management.commands.create_instances import User
from course_flow.models._common import title_max_length


class CourseFlowUser(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="courseflow_user",
    )

    first_name = models.CharField(
        max_length=title_max_length,
        null=True,
        blank=True,
    )

    last_name = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )

    # Whether the user wants to receive notifications
    notifications = models.BooleanField(
        default=False,
        help_text=_(
            "Check this box if you would like to receive emails from us about updates to CourseFlow."
        ),
    )

    # EN/FR kanguage preferences
    LANGUAGE_CHOICES = [
        ("en", _("English")),
        ("fr", _("French")),
    ]

    language = models.CharField(
        _("Language preferences"),
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default="en",
    )

    # Whether the user has had the opportunity to choose whether they receive notifications
    notifications_active = models.BooleanField(default=False)

    def ensure_user(user):
        courseflow_user = CourseFlowUser.objects.filter(user=user).first()
        if courseflow_user is None:
            courseflow_user = CourseFlowUser.objects.create(
                first_name=user.first_name,
                last_name=user.last_name,
                user=user,
            )
        return courseflow_user
