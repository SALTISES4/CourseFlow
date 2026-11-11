from typing import TYPE_CHECKING

from django.db import models


class Discipline(models.Model):
    if TYPE_CHECKING:
        id: int

    code = models.SlugField(max_length=64, unique=True)

    class Meta:
        db_table = "cf_discipline"
