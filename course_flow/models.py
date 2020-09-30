import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models.signals import pre_delete, post_save
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _
from model_utils.managers import InheritanceManager


User = get_user_model()


class Column(models.Model):
    title = models.CharField(max_length=50,null=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    CUS_ACT = 0
    OOCI=1
    OOCS=2
    ICI=3
    ICS=4
    CUS_CO=10
    PREP=11
    LESSON=12
    ARTIFACT=13
    ASSESS=14
    CUS_PROG=20
    
    COLUMN_TYPES = (
        (CUS_ACT,"Custom Activity Column"),
        (OOCI,"Out of Class (Instructor)"),
        (OOCS,"Out of Class (Students)"),
        (ICI,"In Class (Instructor)"),
        (ICS,"In Class (Students)"),
        (CUS_CO,"Custom Course Column"),
        (PREP,"Preparation"),
        (LESSON,"Lesson"),
        (ARTIFACT,"Artifact"),
        (ASSESS,"Assessment"),
        (CUS_PROG,"Custom Program Category"),
    )
    column_type = models.PositiveIntegerField(default=0,choices=COLUMN_TYPES)    
    
    default_columns = {
        'activity':[1,2,3,4],
        'course':[11,12,13,14],
        'program':[20,20,20],
    }

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return str(self.column_type)

    class Meta:
        verbose_name = "Column"
        verbose_name_plural = "Columns"


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
    author = models.ForeignKey(
        User,
        related_name="authored_nodes",
        on_delete=models.SET_NULL,
        null=True,
    )
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

    column = models.ForeignKey("Column", on_delete=models.PROTECT,null=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeNode", blank=True
    )

    students = models.ManyToManyField(
        User,
        related_name="assigned_nodes",
        through="NodeCompletionStatus",
        blank=True,
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

        
class Workflow(models.Model):
    objects = InheritanceManager()
    
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    static = models.BooleanField(default=False)

    parent_workflow = models.ForeignKey(
        "Workflow", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    strategies = models.ManyToManyField(
        Strategy, through="StrategyWorkflow", blank=True
    )

    columns = models.ManyToManyField(
        Column, through="ColumnWorkflow", blank=True
    )

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeWorkflow", blank=True
    )
    
    SUBCLASSES = ["activity","course","program"]
    
    @property
    def type(self):
        for subclass in SUBCLASSES:
            try:
                return self[subclass].type
            except Workflow[subclass].RelatedObjectDoesNotExist:
                pass
        return "workflow"

    def __str__(self):
        return self.title

class Activity(Workflow):
    author = models.ForeignKey(
        User,
        related_name="authored_activities",
        on_delete=models.SET_NULL,
        null=True,
    )
    
    students = models.ManyToManyField(
        User, related_name="assigned_activities", blank=True
    )
    
    @property
    def type(self):
        return "activity";

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Activity"
        verbose_name_plural = "Activities"

class Course(Workflow):
    author = models.ForeignKey(
        User,
        related_name="authored_courses",
        on_delete=models.SET_NULL,
        null=True,
    )
    
    discipline = models.ForeignKey(
        'Discipline', on_delete=models.SET_NULL, null=True
    )

    students = models.ManyToManyField(
        User, related_name="assigned_courses", blank=True
    )
    
    @property
    def type(self):
        return "course";
    
    def __str__(self):
        return self.title

class Program(Workflow):
    author = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True
    )
    
    @property
    def type(self):
        return "program";

    def __str__(self):
        return self.title


class ColumnWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    column = models.ForeignKey(Column, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Column-Workflow Link"
        verbose_name_plural = "Column-Workflow Links"


class OutcomeWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Workflow Link"
        verbose_name_plural = "Outcome-Workflow Links"


class StrategyWorkflow(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE)
    strategy = models.ForeignKey(Strategy, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Strategy-Workflow Link"
        verbose_name_plural = "Strategy-Workflow Links"


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


class Assessment(models.Model):
    title = models.CharField(max_length=30)
    description = models.TextField(max_length=400)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_on = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    parent_assessment = models.ForeignKey(
        "Assessment", on_delete=models.SET_NULL, null=True
    )
    is_original = models.BooleanField(default=True)

    hash = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    outcomes = models.ManyToManyField(
        Outcome, through="OutcomeAssessment", blank=True
    )

    def __str__(self):
        return self.title


class OutcomeAssessment(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    outcome = models.ForeignKey(Outcome, on_delete=models.CASCADE)
    added_on = models.DateTimeField(auto_now_add=True)
    rank = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Outcome-Assessment Link"
        verbose_name_plural = "Outcome-Assessment Links"


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

    students = models.ManyToManyField(
        User,
        related_name="assigned_componenets",
        through="ComponentCompletionStatus",
        blank=True,
    )

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


@receiver(pre_delete, sender=NodeStrategy)
def reorder_for_deleted_node_strategy(sender, instance, **kwargs):
    for out_of_order_link in NodeStrategy.objects.filter(
        strategy=instance.strategy, rank__gt=instance.rank
    ):
        out_of_order_link.rank -= 1
        out_of_order_link.save()


@receiver(pre_delete, sender=StrategyWorkflow)
def reorder_for_deleted_strategy_workflow(sender, instance, **kwargs):
    for out_of_order_link in StrategyWorkflow.objects.filter(
        workflow=instance.workflow, rank__gt=instance.rank
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



@receiver(pre_delete, sender=Activity)
@receiver(pre_delete, sender=Assessment)
@receiver(pre_delete, sender=Artifact)
@receiver(pre_delete, sender=Preparation)
@receiver(pre_delete, sender=Course)
def delete_attached_component(sender, instance, **kwargs):
    Component.objects.filter(
        content_type=ContentType.objects.get_for_model(instance),
        object_id=instance.pk,
    ).delete()


@receiver(pre_delete, sender=Workflow)
def delete_workflow_objects(sender, instance, **kwargs):
    instance.strategies.all().delete()
    instance.columns.all().delete()

@receiver(pre_delete, sender=Strategy)
def delete_strategy_objects(sender, instance, **kwargs):
    instance.nodes.all().delete()


@receiver(post_save, sender=NodeStrategy)
def switch_node_to_static(sender, instance, created, **kwargs):
    if created:
        activity = Activity.objects.filter(
            strategies=instance.strategy
        ).first()
        if activity:
            if activity.static:
                instance.node.students.add(*list(activity.students.all()))


@receiver(post_save, sender=Activity)
def create_default_activity_content(sender, instance, created, **kwargs):
    if created:
        # If the activity is newly created, add the default columns
        cols = Column.default_columns['activity']
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                column_type=col,
                author=instance.author,
            )

        instance.strategies.create(
            title="New Part",
            description="default part",
            author=instance.author,
        )
        instance.save()

@receiver(post_save, sender=Course)
def create_default_course_content(sender, instance, created, **kwargs):
    if created:
        # If the activity is newly created, add the default columns
        cols = Column.default_columns['course']
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                title=f"Default {col} column",
                author=instance.author,
            )

        instance.strategies.create(
            title="New Week",
            description="default week",
            author=instance.author,
        )
        instance.save()

@receiver(post_save, sender=Program)
def create_default_program_content(sender, instance, created, **kwargs):
    if created:
        # If the activity is newly created, add the default columns
        cols = Column.default_columns['program']
        for i, col in enumerate(cols):
            instance.columns.create(
                through_defaults={"rank": i},
                title=f"Default {col} column",
                author=instance.author,
            )

        instance.strategies.create(
            title="New Term",
            description="default term",
            author=instance.author,
        )
        instance.save()


@receiver(post_save, sender=StrategyWorkflow)
def switch_strategy_to_static(sender, instance, created, **kwargs):
    if created:
        if instance.workflow.static:
            for node in instance.strategy.nodes.all():
                node.students.add(*list(instance.workflow.students.all()))


@receiver(post_save, sender=ComponentWeek)
def switch_component_to_static(sender, instance, created, **kwargs):
    if created:
        course = Course.objects.filter(weeks=instance.week).first()
        if course:
            if course.static:
                if type(instance.component.content_object) != Activity:
                    instance.component.students.add(
                        *list(course.students.all())
                    )
                else:
                    activity = instance.component.content_object
                    activity.static = True
                    activity.save()
                    activity.students.add(*list(course.students.all()))
                    for strategy in activity.strategies.all():
                        for node in strategy.nodes.all():
                            node.students.add(*list(course.students.all()))


model_lookups = {
    "node": Node,
    "column": Column,
    "strategy": Strategy,
    "activity": Activity,
    "course": Course,
    "program": Program,
    "workflow": Workflow,
}
model_keys = [
    "node",
    "column",
    "strategy",
    "activity",
    "course",
    "program",
]
