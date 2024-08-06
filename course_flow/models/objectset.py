from django.db import models

from ._common import title_max_length
from .project import Project


class ObjectSet(models.Model):
    term = models.CharField(max_length=title_max_length)
    title = models.CharField(max_length=title_max_length)
    translation_plural = models.CharField(
        max_length=title_max_length, null=True
    )

    def get_permission_objects(self):
        return [Project.objects.filter(object_sets=self).first()]
