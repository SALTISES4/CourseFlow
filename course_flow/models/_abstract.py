from django.db import models
from django.utils import timezone

from course_flow.models.common import title_max_length


class AbstractCourseFlowModel(models.Model):
    deleted = models.BooleanField(default=False)

    deleted_on = models.DateTimeField(default=timezone.now)

    created_on = models.DateTimeField(default=timezone.now)

    last_modified = models.DateTimeField(auto_now=True)

    title = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )

    description = models.TextField(null=True, blank=True)

    class Meta:
        abstract = True
