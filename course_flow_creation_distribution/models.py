from django.db import models
from django.utils.translation import ugettext_lazy as _


class Node(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    left_node_icon = models.ForeignKey(LeftNodeIcon, on_delete=models.SET_NULL)
    right_node_icon = models.ForeignKey(
        RightNodeIcon, on_delete=models.SET_NULL
    )

    node_classification = models.ForeignKey(
        NodeClassification, on_delete=models.SET_NULL
    )

    def __unicode__(self):
        return self.title


class ThumbnailImage(models.Model):
    image = models.ImageField()


class LeftNodeIcon(models.Model):
    title = models.CharField(max_length=30)
    thumbnail_image = models.ForeignKey(
        ThumbnailImage, on_delete=models.SET_NULL
    )

    def __unicode__(self):
        return self.title


class RightNodeIcon(models.Model):
    title = models.CharField(max_length=30)
    thumbnail_image = models.ForeignKey(
        ThumbnailImage, on_delete=models.SET_NULL
    )

    def __unicode__(self):
        return self.title


class NodeClassification(models.Model):
    title = models.CharField(max_length=30, unique=True)
    thumbnail_image = models.ForeignKey(
        ThumbnailImage, on_delete=models.SET_NULL
    )

    def __unicode__(self):
        return self.title


class Strategy(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    nodes = models.ManyToManyField(Node, through="NodeStrategy")

    def __unicode__(self):
        return self.title


class NodeStrategy(models.Model):
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.IntegerField()


class Activity(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    strategies = models.ManyToManyField(Strategy, through="StrategyActivity")

    def __unicode__(self):
        return self.title


class StrategyActivity(models.Model):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE)
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.IntegerField()

    def __unicode__(self):
        return self.title


class Preparation(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    def __unicode__(self):
        return self.title


class Artifact(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    def __unicode__(self):
        return self.title


class Assesment(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    def __unicode__(self):
        return self.title


class Week(models.Model):
    preparations = models.ManyToManyField(Preparation, through="ComponentWeek")
    activities = models.ManyToManyField(Activity, through="ComponentWeek")
    artifacts = models.ManyToManyField(Artifact, through="ComponentWeek")
    assesments = models.ManyToManyField(Assesment, through="ComponentWeek")


class ComponentWeek(models.Model):
    component = models.GenericForeignKey(
        "content_type", on_delete=models.CASCADE
    )
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.IntegerField()


class Course(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    discipline = models.ForeignKey(Discipline, on_delete=models.SET_NULL)

    weeks = models.ManyToManyField(Week, through="WeekCourse")

    def __unicode__(self):
        return self.title


class WeekCourse(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.IntegerField()


class Discipline(models.Model):
    title = models.CharField(
        _("Discipline name"),
        unique=True,
        max_length=100,
        help_text=_("Enter the name of a new discipline."),
        validators=[no_hyphens],
    )

    def __unicode__(self):
        return self.title

    class Meta:
        verbose_name = _("discipline")
        verbose_name_plural = _("disciplines")
