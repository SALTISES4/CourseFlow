from django.db import models


class Discipline(models.Model):
    code = models.SlugField(max_length=64, unique=True)
    label = models.CharField(max_length=255)
    translation_plural = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "cf_discipline"
