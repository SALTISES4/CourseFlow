from django.db import models
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import (
    GenericForeignKey,
    GenericRelation,
)
import uuid
from django.db.models import Q

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


class Outcome(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

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
    OUT_CLASS = 0
    IN_CLASS_INSTRUCTOR = 1
    IN_CLASS_STUDENTS = 2
    NODE_TYPES = (
        (OUT_CLASS, "Out of Class"),
        (IN_CLASS_INSTRUCTOR, "In Class (Instructor)"),
        (IN_CLASS_STUDENTS, "In Class (Students)"),
    )
    classification = models.PositiveIntegerField(choices=NODE_TYPES, default=1)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    outcomes = models.ManyToManyField(Outcome, through="OutcomeNode", blank=True)

    def __unicode__(self):
        return self.title

class OutcomeNode(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > OutcomeNode.objects.filter(node=self.node)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if OutcomeNode.objects.filter(node=self.node):
                self.rank = (
                    OutcomeNode.objects.filter(node=self.node)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif OutcomeNode.objects.filter(
            node=self.node, rank=self.rank
        ):
            previous_rank = OutcomeNode.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(OutcomeNode, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in OutcomeNode.objects.filter(
                    Q(node=self.node),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in OutcomeNode.objects.filter(
                    Q(node=self.node),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(OutcomeNode, self).save(*args, **kwargs)



class Strategy(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    default = models.BooleanField(default=False)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    nodes = models.ManyToManyField(Node, through="NodeStrategy", blank=True)

    outcomes = models.ManyToManyField(Outcome, through="OutcomeStrategy", blank=True)

    def __unicode__(self):
        return self.title

class OutcomeStrategy(models.Model):
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > OutcomeStrategy.objects.filter(strategy=self.strategy)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if OutcomeStrategy.objects.filter(strategy=self.strategy):
                self.rank = (
                    OutcomeStrategy.objects.filter(strategy=self.strategy)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif OutcomeStrategy.objects.filter(
            strategy=self.strategy, rank=self.rank
        ):
            previous_rank = OutcomeStrategy.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(OutcomeStrategy, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in OutcomeStrategy.objects.filter(
                    Q(strategy=self.strategy),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in OutcomeStrategy.objects.filter(
                    Q(strategy=self.strategy),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(OutcomeStrategy, self).save(*args, **kwargs)


class NodeStrategy(models.Model):
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > NodeStrategy.objects.filter(strategy=self.strategy)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if NodeStrategy.objects.filter(strategy=self.strategy):
                self.rank = (
                    NodeStrategy.objects.filter(strategy=self.strategy)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif NodeStrategy.objects.filter(
            strategy=self.strategy, rank=self.rank
        ):
            previous_rank = NodeStrategy.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(NodeStrategy, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in NodeStrategy.objects.filter(
                    Q(strategy=self.strategy),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in NodeStrategy.objects.filter(
                    Q(strategy=self.strategy),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(NodeStrategy, self).save(*args, **kwargs)


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

    outcomes = models.ManyToManyField(Outcome, through="OutcomeActivity", blank=True)

    def __unicode__(self):
        return self.title

class OutcomeActivity(models.Model):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > OutcomeActivity.objects.filter(activity=self.activity)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if OutcomeActivity.objects.filter(activity=self.activity):
                self.rank = (
                    OutcomeActivity.objects.filter(activity=self.activity)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif OutcomeActivity.objects.filter(
            activity=self.activity, rank=self.rank
        ):
            previous_rank = OutcomeActivity.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(OutcomeActivity, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in OutcomeActivity.objects.filter(
                    Q(activity=self.activity),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in OutcomeActivity.objects.filter(
                    Q(activity=self.activity),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(OutcomeActivity, self).save(*args, **kwargs)


class StrategyActivity(models.Model):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE)
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > StrategyActivity.objects.filter(activity=self.activity)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if StrategyActivity.objects.filter(activity=self.activity):
                self.rank = (
                    StrategyActivity.objects.filter(activity=self.activity)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif StrategyActivity.objects.filter(
            activity=self.activity, rank=self.rank
        ):
            previous_rank = StrategyActivity.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(StrategyActivity, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in StrategyActivity.objects.filter(
                    Q(activity=self.activity),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in StrategyActivity.objects.filter(
                    Q(activity=self.activity),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(StrategyActivity, self).save(*args, **kwargs)


class Preparation(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    outcomes = models.ManyToManyField(Outcome, through="OutcomePreparation", blank=True)

    def __unicode__(self):
        return self.title

class OutcomePreparation(models.Model):
    preparation = models.ForeignKey(Preparation, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > OutcomePreparation.objects.filter(preparation=self.preparation)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if OutcomePreparation.objects.filter(preparation=self.preparation):
                self.rank = (
                    OutcomePreparation.objects.filter(preparation=self.preparation)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif OutcomePreparation.objects.filter(
            preparation=self.preparation, rank=self.rank
        ):
            previous_rank = OutcomePreparation.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(OutcomePreparation, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in OutcomePreparation.objects.filter(
                    Q(preparation=self.preparation),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in OutcomePreparation.objects.filter(
                    Q(preparation=self.preparation),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(OutcomePreparation, self).save(*args, **kwargs)


class Artifact(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    outcomes = models.ManyToManyField(Outcome, through="OutcomeArtifact", blank=True)

    def __unicode__(self):
        return self.title

class OutcomeArtifact(models.Model):
    artifact = models.ForeignKey(Artifact, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > OutcomeArtifact.objects.filter(artifact=self.artifact)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if OutcomeArtifact.objects.filter(artifact=self.artifact):
                self.rank = (
                    OutcomeArtifact.objects.filter(artifact=self.artifact)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif OutcomeArtifact.objects.filter(
            artifact=self.artifact, rank=self.rank
        ):
            previous_rank = OutcomeArtifact.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(OutcomeArtifact, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in OutcomeArtifact.objects.filter(
                    Q(artifact=self.artifact),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in OutcomeArtifact.objects.filter(
                    Q(artifact=self.artifact),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(OutcomeArtifact, self).save(*args, **kwargs)

class Assesment(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    outcomes = models.ManyToManyField(Outcome, through="OutcomeAssesment", blank=True)

    def __unicode__(self):
        return self.title

class OutcomeAssesment(models.Model):
    assesment = models.ForeignKey(Assesment, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > OutcomeAssesment.objects.filter(assesment=self.assesment)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if OutcomeAssesment.objects.filter(assesment=self.assesment):
                self.rank = (
                    OutcomeAssesment.objects.filter(assesment=self.assesment)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif OutcomeAssesment.objects.filter(
            assesment=self.assesment, rank=self.rank
        ):
            previous_rank = OutcomeAssesment.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(OutcomeAssesment, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in OutcomeAssesment.objects.filter(
                    Q(assesment=self.assesment),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in OutcomeAssesment.objects.filter(
                    Q(assesment=self.assesment),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(OutcomeAssesment, self).save(*args, **kwargs)


class Week(models.Model):
    title = models.CharField(max_length=30)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    components = models.ManyToManyField(
        "Component", through="ComponentWeek", blank=True
    )

    outcomes = models.ManyToManyField(Outcome, through="OutcomeWeek", blank=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __unicode__(self):
        return self.title

class OutcomeWeek(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > OutcomeWeek.objects.filter(week=self.week)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if OutcomeWeek.objects.filter(week=self.week):
                self.rank = (
                    OutcomeWeek.objects.filter(week=self.week)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif OutcomeWeek.objects.filter(
            week=self.week, rank=self.rank
        ):
            previous_rank = OutcomeWeek.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(OutcomeWeek, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in OutcomeWeek.objects.filter(
                    Q(week=self.week),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in OutcomeWeek.objects.filter(
                    Q(week=self.week),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(OutcomeWeek, self).save(*args, **kwargs)

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

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > ComponentWeek.objects.filter(week=self.week)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if ComponentWeek.objects.filter(week=self.week):
                self.rank = (
                    ComponentWeek.objects.filter(week=self.week)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif ComponentWeek.objects.filter(week=self.week, rank=self.rank):
            previous_rank = ComponentWeek.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(ComponentWeek, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in ComponentWeek.objects.filter(
                    Q(week=self.week),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in ComponentWeek.objects.filter(
                    Q(week=self.week),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(ComponentWeek, self).save(*args, **kwargs)


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

    weeks = models.ManyToManyField(Week, through="WeekCourse", blank=True)

    outcomes = models.ManyToManyField(Outcome, through="OutcomeCourse", blank=True)

    def __unicode__(self):
        return self.title

class OutcomeCourse(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > OutcomeCourse.objects.filter(course=self.course)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if OutcomeCourse.objects.filter(course=self.course):
                self.rank = (
                    OutcomeCourse.objects.filter(course=self.course)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif OutcomeCourse.objects.filter(
            course=self.course, rank=self.rank
        ):
            previous_rank = OutcomeCourse.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(OutcomeCourse, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in OutcomeCourse.objects.filter(
                    Q(course=self.course),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in OutcomeCourse.objects.filter(
                    Q(course=self.course),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(OutcomeCourse, self).save(*args, **kwargs)


class WeekCourse(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if (
            not self.pk
            or self.rank == 0
            or self.rank
            > WeekCourse.objects.filter(course=self.course)
            .order_by("-rank")
            .first()
            .rank
            + 1
        ):
            if WeekCourse.objects.filter(course=self.course):
                self.rank = (
                    WeekCourse.objects.filter(course=self.course)
                    .order_by("-rank")
                    .first()
                    .rank
                    + 1
                )
            else:
                self.rank = 1
        elif WeekCourse.objects.filter(course=self.course, rank=self.rank):
            previous_rank = WeekCourse.objects.get(pk=self.pk).rank
            target_rank = self.rank
            self.rank = 0
            super(WeekCourse, self).save(*args, **kwargs)
            if previous_rank - target_rank > 0:
                for link in WeekCourse.objects.filter(
                    Q(course=self.course),
                    Q(rank__gte=target_rank),
                    Q(rank__lt=previous_rank),
                ).order_by("-rank"):
                    link.rank += 1
                    link.save()

            elif previous_rank - target_rank < 0:
                for link in WeekCourse.objects.filter(
                    Q(course=self.course),
                    Q(rank__lte=target_rank),
                    Q(rank__gt=previous_rank),
                ).order_by("rank"):
                    link.rank -= 1
                    link.save()
            self.rank = target_rank
        super(WeekCourse, self).save(*args, **kwargs)
