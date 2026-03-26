from django.db import models


class Discipline(models.Model):
    label = models.CharField(max_length=255)
    translation_plural = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cf2_discipline"
