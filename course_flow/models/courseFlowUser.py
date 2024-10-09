from django.db import models
from django.utils.translation import gettext_lazy as _

from course_flow.models.common import User, title_max_length

# EN/FR language preferences
LANGUAGE_CHOICES = [
    ("en", _("English")),
    ("fr", _("French")),
]


class CourseFlowUser(models.Model):
    #########################################################
    # FIELDS
    #########################################################
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

    language = models.CharField(
        _("Language preferences"),
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default="en",
    )

    # Whether the user has had the opportunity to choose whether they receive notifications
    notifications_active = models.BooleanField(default=False)

    #########################################################
    # RELATIONS
    #########################################################
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="courseflow_user",
    )

    #########################################################
    # MODEL METHODS / GETTERS
    #########################################################
    def ensure_user(user):
        courseflow_user = CourseFlowUser.objects.filter(user=user).first()
        if courseflow_user is None:
            courseflow_user = CourseFlowUser.objects.create(
                first_name=user.first_name,
                last_name=user.last_name,
                user=user,
            )
        return courseflow_user
