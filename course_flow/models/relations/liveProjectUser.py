from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from course_flow.models import LiveProject

User = get_user_model()


class LiveProjectUser(models.Model):
    liveproject = models.ForeignKey(LiveProject, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ROLE_NONE = 0
    ROLE_STUDENT = 1
    ROLE_TEACHER = 2
    ROLE_CHOICES = (
        (ROLE_NONE, _("None")),
        (ROLE_STUDENT, _("Student")),
        (ROLE_TEACHER, _("Instructor")),
    )
    role_type = models.PositiveIntegerField(
        choices=ROLE_CHOICES, default=ROLE_NONE
    )
