from django.db import models
from django.utils.translation import gettext_lazy as _


class Discipline(models.Model):
    title = models.CharField(
        _("Discipline name"),
        unique=True,
        max_length=100,
        help_text=_("Enter the name of a new discipline."),
    )

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = _("Discipline")
        verbose_name_plural = _("Disciplines")
