from django.db import models

from course_flow.core.models.project import Project


class Tag(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tags",
    )
    label = models.CharField(max_length=255)
    translation_plural = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cf_tag"
