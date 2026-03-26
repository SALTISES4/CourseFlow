from django.utils.translation import gettext_lazy as _

from .workflow import Workflow


class Program(Workflow):
    DEFAULT_CUSTOM_COLUMN = 20
    DEFAULT_COLUMNS = [20, 20, 20]
    WORKFLOW_TYPE = 2

    @property
    def type(self):
        return "program"

    def __str__(self):
        if self.title is not None and self.title != "":
            return self.title
        else:
            return self.type

    class Meta:
        verbose_name = _("Program")
        verbose_name_plural = _("Programs")
