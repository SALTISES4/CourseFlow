import uuid

from django.db import models
from django.utils import timezone

from course_flow.models.common import title_max_length


class AbstractCourseFlowModel(models.Model):
    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    deleted = models.BooleanField(default=False)

    deleted_on = models.DateTimeField(default=timezone.now)

    created_on = models.DateTimeField(default=timezone.now)

    last_modified = models.DateTimeField(auto_now=True)

    title = models.CharField(max_length=title_max_length, null=True, blank=True)

    description = models.TextField(null=True, blank=True)

    class Meta:
        abstract = True


class AbstractWorkspaceModel(AbstractCourseFlowModel):
    is_strategy = models.BooleanField(default=False)

    from_saltise = models.BooleanField(default=False)

    is_template = models.BooleanField(default=False)

    published = models.BooleanField(default=False)

    # this is probably a mistake, these are only at the project level
    disciplines = models.ManyToManyField("Discipline", blank=True)

    class Meta:
        abstract = True
