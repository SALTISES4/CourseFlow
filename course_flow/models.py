import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _


User = get_user_model()


class Outcome(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Outcome"
        verbose_name_plural = "Outcomes"


class Node(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    parent_node = models.ForeignKey(
        "Node", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    INDIVIDUAL = 1
    GROUPS = 2
    WHOLE_CLASS = 3
    WORK_TYPES = (
        (INDIVIDUAL, "Individual Work"),
        (GROUPS, "Work in Groups"),
        (WHOLE_CLASS, "Whole Class"),
    )
    work_classification = models.PositiveIntegerField(
        choices=WORK_TYPES, default=2
    )
    GATHER_INFO = 1
    DISCUSS = 2
    SOLVE = 3
    ANALYZE = 4
    EVAL_PAPERS = 5
    EVAL_PEERS = 6
    DEBATE = 7
    GAME_ROLEPLAY = 8
    CREATE_DESIGN = 9
    REVISE = 10
    READ = 11
    WRITE = 12
    PRESENT = 13
    EXPERIMENT = 14
    QUIZ_TEST = 15
    OTHER = 16
    ACTIVITY_TYPES = (
        (GATHER_INFO, "Gather Information"),
        (DISCUSS, "Discuss"),
        (SOLVE, "Solve"),
        (ANALYZE, "Analyze"),
        (EVAL_PAPERS, "Assess/Review Papers"),
        (EVAL_PEERS, "Evaluate Peers"),
        (DEBATE, "Debate"),
        (GAME_ROLEPLAY, "Game/Roleplay"),
        (CREATE_DESIGN, "Create/Design"),
        (REVISE, "Revise/Improve"),
        (READ, "Read"),
        (WRITE, "Write"),
        (PRESENT, "Present"),
        (EXPERIMENT, "Experiment/Inquiry"),
        (QUIZ_TEST, "Quiz/Test"),
        (OTHER, "Other"),
    )
    activity_classification = models.PositiveIntegerField(
        choices=ACTIVITY_TYPES, default=1
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

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeNode", blank=True
    )

    students = models.ManyToManyField(
        User, through="NodeCompletionStatus", blank=True
    )

    def __str__(self):
        return self.title


class NodeCompletionStatus(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Node Completion Status"
        verbose_name_plural = "Node Completion Statuses"


class OutcomeNode(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Node Link"
        verbose_name_plural = "Outcome-Node Links"


class Strategy(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    default = models.BooleanField(default=False)
    parent_strategy = models.ForeignKey(
        "Strategy", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    nodes = models.ManyToManyField(Node, through="NodeStrategy", blank=True)

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeStrategy", blank=True
    )

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Strategy"
        verbose_name_plural = "Strategies"


class OutcomeStrategy(models.Model):
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Strategy Link"
        verbose_name_plural = "Outcome-Strategy Links"


class NodeStrategy(models.Model):
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Node-Strategy Link"
        verbose_name_plural = "Node-Strategy Links"


class Activity(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    static = models.BooleanField(default=False)

    parent_activity = models.ForeignKey(
        "Activity", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    strategies = models.ManyToManyField(
        Strategy, through="StrategyActivity", blank=True
    )

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeActivity", blank=True
    )

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Activity"
        verbose_name_plural = "Activities"


class OutcomeActivity(models.Model):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Activity Link"
        verbose_name_plural = "Outcome-Activity Links"


class StrategyActivity(models.Model):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE)
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Strategy-Activity Link"
        verbose_name_plural = "Strategy-Activity Links"


class Preparation(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    parent_preparation = models.ForeignKey(
        "Preparation", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomePreparation", blank=True
    )

    def __str__(self):
        return self.title


class OutcomePreparation(models.Model):
    preparation = models.ForeignKey(Preparation, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Preparation Link"
        verbose_name_plural = "Outcome-Preparation Links"


class Artifact(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    parent_artifact = models.ForeignKey(
        "Artifact", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeArtifact", blank=True
    )

    def __str__(self):
        return self.title


class OutcomeArtifact(models.Model):
    artifact = models.ForeignKey(Artifact, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Artifact Link"
        verbose_name_plural = "Outcome-Artifact Links"


class Assesment(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    parent_assesment = models.ForeignKey(
        "Assesment", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeAssesment", blank=True
    )

    def __str__(self):
        return self.title


class OutcomeAssesment(models.Model):
    assesment = models.ForeignKey(Assesment, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Assesment Link"
        verbose_name_plural = "Outcome-Assesment Links"


class Week(models.Model):
    title = models.CharField(max_length=30)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    components = models.ManyToManyField(
        "Component", through="ComponentWeek", blank=True
    )

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeWeek", blank=True
    )

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return self.title


class OutcomeWeek(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Week Link"
        verbose_name_plural = "Outcome-Week Links"


class Component(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    def __str__(self):
        return (
            self.content_type.model_class()
            .objects.get(id=self.object_id)
            .title
        )


class ComponentCompletionStatus(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    component = models.ForeignKey(Component, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Component Completion Status"
        verbose_name_plural = "Component Completion Statuses"


class ComponentWeek(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    component = models.ForeignKey(Component, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Component-Week Link"
        verbose_name_plural = "Component-Week Links"


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

    static = models.BooleanField(default=False)

    parent_course = models.ForeignKey(
        "Course", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    weeks = models.ManyToManyField(Week, through="WeekCourse", blank=True)

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeCourse", blank=True
    )

    def __str__(self):
        return self.title


class WeekCourse(models.Model):
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Week-Course Link"
        verbose_name_plural = "Week-Course Links"


class OutcomeCourse(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Course Link"
        verbose_name_plural = "Outcome-Course Links"


class Program(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    components = models.ManyToManyField(
        Component, through="ComponentProgram", blank=True
    )

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeProgram", blank=True
    )

    def __str__(self):
        return self.title


class ComponentProgram(models.Model):
    component = models.ForeignKey(Component, on_delete=models.CASCADE)
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Component-Program Link"
        verbose_name_plural = "Component-Program Links"


class OutcomeProgram(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Program Link"
        verbose_name_plural = "Outcome-Program Links"


@receiver(pre_delete, sender=NodeStrategy)
def reorder_for_deleted_node_strategy(sender, instance, **kwargs):
    for out_of_order_link in NodeStrategy.objects.filter(
        strategy=instance.strategy, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=StrategyActivity)
def reorder_for_deleted_strategy_activity(sender, instance, **kwargs):
    for out_of_order_link in StrategyActivity.objects.filter(
        activity=instance.activity, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=ComponentWeek)
def reorder_for_deleted_component_week(sender, instance, **kwargs):
    for out_of_order_link in ComponentWeek.objects.filter(
        week=instance.week, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=WeekCourse)
def reorder_for_deleted_week_course(sender, instance, **kwargs):
    for out_of_order_link in WeekCourse.objects.filter(
        course=instance.course, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=ComponentProgram)
def reorder_for_deleted_component_program(sender, instance, **kwargs):
    for out_of_order_link in ComponentProgram.objects.filter(
        program=instance.program, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=Activity)
@receiver(pre_delete, sender=Assesment)
@receiver(pre_delete, sender=Artifact)
@receiver(pre_delete, sender=Preparation)
@receiver(pre_delete, sender=Course)
def delete_attached_component(sender, instance, **kwargs):
    Component.objects.filter(
        content_type=ContentType.objects.get_for_model(instance),
        object_id=instance.pk,
    ).delete()


model_lookups = {
    "node": Node,
    "strategy": Strategy,
    "activity": Activity,
    "assesment": Assesment,
    "preparation": Preparation,
    "artifact": Artifact,
    "week": Week,
    "course": Course,
    "program": Program,
}
model_keys = [
    "node",
    "strategy",
    "activity",
    "assesment",
    "preparation",
    "artifact",
    "week",
    "course",
    "program",
]
