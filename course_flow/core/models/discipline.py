from django.db import models


class Discipline(models.Model):
    code = models.SlugField(max_length=64, unique=True)

    class Meta:
        db_table = "cf_discipline"
