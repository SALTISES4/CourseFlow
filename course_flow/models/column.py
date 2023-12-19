import uuid

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from course_flow.models._common import User, title_max_length


class Column(models.Model):
    deleted = models.BooleanField(default=False)
    deleted_on = models.DateTimeField(default=timezone.now)
    title = models.CharField(
        max_length=title_max_length, null=True, blank=True
    )
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    icon = models.CharField(max_length=50, null=True, blank=True)
    created_on = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)
    visible = models.BooleanField(default=True)
    colour = models.PositiveIntegerField(null=True)
    CUSTOM_ACTIVITY = 0
    OUT_OF_CLASS_INSTRUCTOR = 1
    OUT_OF_CLASS_STUDENT = 2
    IN_CLASS_INSTRUCTOR = 3
    IN_CLASS_STUDENT = 4
    CUSTOM_COURSE = 10
    PREPARATION = 11
    LESSON = 12
    ARTIFACT = 13
    ASSESSMENT = 14
    CUSTOM_PROGRAM = 20

    COLUMN_TYPES = (
        (CUSTOM_ACTIVITY, _("Custom Activity Column")),
        (OUT_OF_CLASS_INSTRUCTOR, _("Out of Class (Instructor)")),
        (OUT_OF_CLASS_STUDENT, _("Out of Class (Students)")),
        (IN_CLASS_INSTRUCTOR, _("In Class (Instructor)")),
        (IN_CLASS_STUDENT, _("In Class (Students)")),
        (CUSTOM_COURSE, _("Custom Course Column")),
        (PREPARATION, _("Preparation")),
        (LESSON, _("Lesson")),
        (ARTIFACT, _("Artifact")),
        (ASSESSMENT, _("Assessment")),
        (CUSTOM_PROGRAM, _("Custom Program Category")),
    )
    column_type = models.PositiveIntegerField(default=0, choices=COLUMN_TYPES)

    is_original = models.BooleanField(default=False)
    parent_column = models.ForeignKey(
        "Column", on_delete=models.SET_NULL, null=True
    )

    comments = models.ManyToManyField(
        "Comment", blank=True, related_name="column"
    )

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def get_permission_objects(self):
        return self.get_workflow().get_permission_objects()

    def get_workflow(self):
        return self.workflow_set.first()

    def get_display_title(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return self.get_column_type_display()

    def __str__(self):
        return self.get_column_type_display()

    class Meta:
        verbose_name = _("Column")
        verbose_name_plural = _("Columns")
