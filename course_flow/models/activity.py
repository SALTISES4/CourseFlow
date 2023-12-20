from django.utils.translation import gettext_lazy as _

from .workflow import Workflow


class Activity(Workflow):
    DEFAULT_CUSTOM_COLUMN = 0
    DEFAULT_COLUMNS = [1, 2, 3, 4]
    WORKFLOW_TYPE = 0

    @property
    def type(self):
        return "activity"

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return self.type

    class Meta:
        verbose_name = _("Activity")
        verbose_name_plural = _("Activities")
