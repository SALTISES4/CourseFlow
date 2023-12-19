from django.utils.translation import gettext_lazy as _

from course_flow.models.workflow import Workflow


class Course(Workflow):
    DEFAULT_CUSTOM_COLUMN = 10
    DEFAULT_COLUMNS = [11, 12, 13, 14]
    WORKFLOW_TYPE = 1

    @property
    def type(self):
        return "course"

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return self.type

    class Meta:
        verbose_name = _("Course")
        verbose_name_plural = _("Courses")
