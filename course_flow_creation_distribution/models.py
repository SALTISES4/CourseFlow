from django.db import models
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import (
    GenericForeignKey,
    GenericRelation,
)
import uuid

User = get_user_model()


class ThumbnailImage(models.Model):
    image = models.ImageField()


class LeftNodeIcon(models.Model):
    title = models.CharField(max_length=30, unique=True)
    thumbnail_image = models.ForeignKey(
        ThumbnailImage, on_delete=models.SET_NULL, null=True
    )

    def __unicode__(self):
        return self.title


class RightNodeIcon(models.Model):
    title = models.CharField(max_length=30, unique=True)
    thumbnail_image = models.ForeignKey(
        ThumbnailImage, on_delete=models.SET_NULL, null=True
    )

    def __unicode__(self):
        return self.title


class NodeClassification(models.Model):
    title = models.CharField(max_length=30, unique=True)
    thumbnail_image = models.ForeignKey(
        ThumbnailImage, on_delete=models.SET_NULL, null=True
    )

    def __unicode__(self):
        return self.title


class Node(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    left_node_icon = models.ForeignKey(
        LeftNodeIcon, on_delete=models.SET_NULL, null=True
    )
    right_node_icon = models.ForeignKey(
        RightNodeIcon, on_delete=models.SET_NULL, null=True
    )
    node_classification = models.ForeignKey(
        NodeClassification, on_delete=models.SET_NULL, null=True
    )

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __unicode__(self):
        return self.title


class Strategy(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    default = models.BooleanField(default=False)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    nodes = models.ManyToManyField(Node, through="NodeStrategy", blank=True)

    def __unicode__(self):
        return self.title


class NodeStrategy(models.Model):
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["strategy", "rank"], name="ranking"
            )
        ]


class Activity(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    strategies = models.ManyToManyField(
        Strategy, through="StrategyActivity", blank=True
    )

    def __unicode__(self):
        return self.title


class StrategyActivity(models.Model):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE)
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["activity", "rank"], name="ranking"
            )
        ]


class Preparation(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __unicode__(self):
        return self.title


class Artifact(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __unicode__(self):
        return self.title


class Assesment(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __unicode__(self):
        return self.title


class Week(models.Model):
    title = models.CharField(max_length=30)
    components = models.ManyToManyField(
        "Component", through="ComponentWeek", blank=True
    )

    def __unicode__(self):
        return self.title


class Component(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    def __unicode__(self):
        return self.content_object


class ComponentWeek(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    component = models.ForeignKey(Component, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["week", "rank"], name="ranking")
        ]


class Discipline(models.Model):
    title = models.CharField(
        _("Discipline name"),
        unique=True,
        max_length=100,
        help_text=_("Enter the name of a new discipline."),
    )

    def __unicode__(self):
        return self.title

    class Meta:
        verbose_name = _("discipline")
        verbose_name_plural = _("disciplines")


class Course(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    discipline = models.ForeignKey(
        Discipline, on_delete=models.SET_NULL, null=True
    )

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    weeks = models.ManyToManyField(Week, through="WeekCourse")

    def __unicode__(self):
        return self.title


class WeekCourse(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["course", "rank"], name="ranking")
        ]
