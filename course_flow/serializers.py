import bleach
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from .models import (  # OutcomeProject,
    Activity,
    Column,
    ColumnWorkflow,
    Course,
    Discipline,
    Favourite,
    Node,
    NodeCompletionStatus,
    NodeLink,
    NodeWeek,
    Outcome,
    OutcomeHorizontalLink,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    Program,
    Project,
    User,
    Week,
    WeekWorkflow,
    Workflow,
)
from .utils import (
    get_descendant_outcomes,
    get_model_from_str,
    get_unique_outcomehorizontallinks,
    get_unique_outcomenodes,
    linkIDMap,
)

bleach_allowed_tags = [
    "b",
    "u",
    "em",
    "i",
    "ul",
    "ol",
    "li",
    "br",
    "p",
    "a",
    "strong",
    "sub",
    "sup",
]


def bleach_sanitizer(value, **kwargs):
    if value is not None:
        return bleach.clean(value, **kwargs)
    else:
        return None


def dateTimeFormat():
    return "%Y/%m/%d"


class DescriptionSerializerMixin:
    description = serializers.SerializerMethodField()

    def get_description(self, instance):
        return bleach_sanitizer(instance.description, tags=bleach_allowed_tags)

    def validate_description(self, value):
        return bleach_sanitizer(value, tags=bleach_allowed_tags)


class TitleSerializerMixin:
    title = serializers.SerializerMethodField()

    def get_title(self, instance):
        return bleach_sanitizer(instance.title, tags=bleach_allowed_tags)

    def validate_title(self, value):
        return bleach_sanitizer(value, tags=bleach_allowed_tags)


class TimeRequiredSerializerMixin:
    time_required = serializers.SerializerMethodField()

    def get_time_required(self, instance):
        return bleach_sanitizer(
            instance.time_required, tags=bleach_allowed_tags
        )

    def validate_time_required(self, value):
        return bleach_sanitizer(value, tags=bleach_allowed_tags)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
        ]


class OutcomeSerializer(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    class Meta:
        model = Outcome
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
            "author",
            "depth",
        ]

    def create(self, validated_data):
        return Outcome.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.save()
        return instance


class OutcomeNodeSerializer(serializers.ModelSerializer):

    outcome = OutcomeSerializer(allow_null=True)

    class Meta:
        model = OutcomeNode
        fields = ["node", "outcome", "added_on", "rank", "id", "degree"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.title)
        outcome_data = self.initial_data.pop("outcome")
        outcome_serializer = OutcomeSerializer(
            Outcome.objects.get(id=outcome_data["id"]), outcome_data
        )
        outcome_serializer.is_valid()
        outcome_serializer.save()
        instance.save()
        return instance


class ParentNodeSerializer(serializers.ModelSerializer):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "last_modified",
            "hash",
            "author",
            "task_classification",
            "context_classification",
            "column",
        ]


class ParentWeekSerializer(serializers.ModelSerializer):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    class Meta:
        model = Week
        fields = [
            "id",
            "title",
            "description",
            "last_modified",
            "hash",
            "author",
        ]


class NodeLinkSerializer(serializers.ModelSerializer, TitleSerializerMixin):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    class Meta:
        model = NodeLink
        fields = [
            "id",
            "title",
            "source_node",
            "target_node",
            "source_port",
            "target_port",
            "created_on",
            "last_modified",
            "hash",
            "author",
        ]

    def create(self, validated_data):
        return Node.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.save()
        return instance


class NodeSerializer(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
    TimeRequiredSerializerMixin,
):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    outcomenode_set = serializers.SerializerMethodField()
    columnworkflow = serializers.SerializerMethodField()
    outgoing_links = serializers.SerializerMethodField()
    linked_workflow_title = serializers.SerializerMethodField()

    node_type_display = serializers.CharField(source="get_node_type_display")

    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "column",
            "columnworkflow",
            "hash",
            "author",
            "task_classification",
            "context_classification",
            "node_type",
            "outcomenode_set",
            "outgoing_links",
            "is_original",
            "parent_node",
            "node_type",
            "node_type_display",
            "has_autolink",
            "represents_workflow",
            "linked_workflow",
            "linked_workflow_title",
        ]

    def get_columnworkflow(self, instance):
        return instance.column.columnworkflow_set.get(
            column=instance.column
        ).id

    def get_outcomenode_set(self, instance):
        links = instance.outcomenode_set.all().order_by("rank")
        return OutcomeNodeSerializer(links, many=True).data

    def get_outgoing_links(self, instance):
        links = instance.outgoing_links.all()
        return NodeLinkSerializer(links, many=True).data

    def get_linked_workflow_title(self, instance):
        if instance.linked_workflow is not None:
            return instance.linked_workflow.title

    def create(self, validated_data):
        return Node.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.task_classification = validated_data.get(
            "task_classification", instance.task_classification
        )
        instance.context_classification = validated_data.get(
            "context_classification", instance.context_classification
        )
        instance.save()
        return instance


class NodeWeekSerializer(serializers.ModelSerializer):

    node = NodeSerializer()

    class Meta:
        model = NodeWeek
        fields = ["week", "node", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data["rank"]
        instance.save()
        return instance


class ColumnSerializer(serializers.ModelSerializer, TitleSerializerMixin):
    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    column_type_display = serializers.CharField(
        source="get_column_type_display"
    )

    class Meta:
        model = Column
        fields = [
            "id",
            "title",
            "author",
            "created_on",
            "last_modified",
            "column_type",
            "column_type_display",
        ]

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.save()
        return instance

    def create(self, validated_data):
        return Column.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )


class WeekSerializer(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    nodeweek_set = serializers.SerializerMethodField()
    week_type_display = serializers.CharField(source="get_week_type_display")

    class Meta:
        model = Week
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
            "default",
            "author",
            "nodeweek_set",
            "is_original",
            "parent_week",
            "week_type",
            "week_type_display",
        ]

    def get_nodeweek_set(self, instance):
        links = instance.nodeweek_set.all().order_by("rank")
        return NodeWeekSerializer(links, many=True).data

    def create(self, validated_data):
        return Week.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.save()
        return instance


class WeekWorkflowSerializer(serializers.ModelSerializer):

    week = WeekSerializer()

    class Meta:
        model = WeekWorkflow
        fields = ["workflow", "week", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class ColumnWorkflowSerializer(serializers.ModelSerializer):
    column = ColumnSerializer()

    class Meta:
        model = ColumnWorkflow
        fields = ["workflow", "column", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ["id", "title"]


class WorkflowSerializer(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):

    weekworkflow_set = serializers.SerializerMethodField()
    columnworkflow_set = serializers.SerializerMethodField()

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    def get_weekworkflow_set(self, instance):
        links = instance.weekworkflow_set.all().order_by("rank")
        return WeekWorkflowSerializer(links, many=True).data

    def get_columnworkflow_set(self, instance):
        links = instance.columnworkflow_set.all().order_by("rank")
        return ColumnWorkflowSerializer(links, many=True).data

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.outcomes_type = validated_data.get(
            "outcomes_type", instance.outcomes_type
        )
        instance.outcomes_sort = validated_data.get(
            "outcomes_sort", instance.outcomes_sort
        )
        instance.save()
        return instance


class ProgramSerializer(WorkflowSerializer):
    class Meta:
        model = Program
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "columnworkflow_set",
            "weekworkflow_set",
            "is_original",
            "parent_workflow",
            "outcomes_type",
            "outcomes_sort",
            "type",
        ]

    def create(self, validated_data):
        return Program.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )


class CourseSerializer(WorkflowSerializer):
    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "weekworkflow_set",
            "columnworkflow_set",
            "is_original",
            "parent_workflow",
            "outcomes_type",
            "outcomes_sort",
            "type",
        ]

    def create(self, validated_data):
        return Course.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )


class ActivitySerializer(WorkflowSerializer):
    class Meta:
        model = Activity
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "columnworkflow_set",
            "weekworkflow_set",
            "is_original",
            "parent_workflow",
            "outcomes_type",
            "outcomes_sort",
            "type",
        ]

    def create(self, validated_data):
        if User.objects.filter(username=self.initial_data["author"]).exists():
            author = User.objects.get(username=self.initial_data["author"])
        else:
            author = None
        activity = Activity.objects.create(author=author, **validated_data)

        return activity


class NodeLinkSerializerShallow(
    serializers.ModelSerializer, TitleSerializerMixin
):
    class Meta:
        model = NodeLink
        fields = [
            "id",
            "title",
            "source_node",
            "target_node",
            "source_port",
            "target_port",
        ]

    def create(self, validated_data):
        return Node.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.save()
        return instance


class NodeSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
    TimeRequiredSerializerMixin,
):

    outcomenode_set = serializers.SerializerMethodField()
    outcomenode_unique_set = serializers.SerializerMethodField()
    columnworkflow = serializers.SerializerMethodField()
    linked_workflow_title = serializers.SerializerMethodField()
    linked_workflow_description = serializers.SerializerMethodField()

    node_type_display = serializers.CharField(source="get_node_type_display")

    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "column",
            "columnworkflow",
            "context_classification",
            "task_classification",
            "outcomenode_set",
            "outcomenode_unique_set",
            "outgoing_links",
            "node_type",
            "node_type_display",
            "has_autolink",
            "represents_workflow",
            "linked_workflow",
            "linked_workflow_title",
            "linked_workflow_description",
            "time_units",
            "time_required",
            "is_dropped",
        ]

    def get_columnworkflow(self, instance):
        return instance.column.columnworkflow_set.get(
            column=instance.column
        ).id

    def get_outcomenode_set(self, instance):
        links = instance.outcomenode_set.all().order_by("rank")
        return list(map(linkIDMap, links))

    def get_outcomenode_unique_set(self, instance):
        return list(map(linkIDMap, get_unique_outcomenodes(instance)))

    def get_linked_workflow_title(self, instance):
        if instance.linked_workflow is not None:
            return instance.linked_workflow.title

    def get_linked_workflow_description(self, instance):
        if instance.linked_workflow is not None:
            return instance.linked_workflow.description

    def create(self, validated_data):
        return Node.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.task_classification = validated_data.get(
            "task_classification", instance.task_classification
        )
        instance.context_classification = validated_data.get(
            "context_classification", instance.context_classification
        )
        instance.represents_workflow = validated_data.get(
            "represents_workflow", instance.represents_workflow
        )
        instance.has_autolink = validated_data.get(
            "has_autolink", instance.has_autolink
        )
        instance.time_required = validated_data.get(
            "time_required", instance.time_required
        )
        instance.time_units = validated_data.get(
            "time_units", instance.time_units
        )
        instance.is_dropped = validated_data.get(
            "is_dropped", instance.is_dropped
        )
        instance.save()
        return instance


class NodeWeekSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = NodeWeek
        fields = ["week", "node", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class ColumnSerializerShallow(
    serializers.ModelSerializer, TitleSerializerMixin
):

    column_type_display = serializers.CharField(
        source="get_column_type_display"
    )

    class Meta:
        model = Column
        fields = [
            "id",
            "title",
            "column_type",
            "column_type_display",
            "visible",
        ]

    def create(self, validated_data):
        return Column.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.save()
        return instance


class WeekSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):

    nodeweek_set = serializers.SerializerMethodField()

    week_type_display = serializers.CharField(source="get_week_type_display")

    class Meta:
        model = Week
        fields = [
            "id",
            "title",
            "description",
            "default",
            "nodeweek_set",
            "week_type",
            "week_type_display",
            "is_strategy",
            "strategy_classification",
        ]

    def get_nodeweek_set(self, instance):
        links = instance.nodeweek_set.all().order_by("rank")
        return list(map(linkIDMap, links))

    def create(self, validated_data):
        return Week.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.strategy_classification = validated_data.get(
            "strategy_classification", instance.strategy_classification
        )
        instance.save()
        return instance


class WeekWorkflowSerializerShallow(serializers.ModelSerializer):

    week_type = serializers.SerializerMethodField()

    class Meta:
        model = WeekWorkflow
        fields = ["workflow", "week", "rank", "id", "week_type"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance

    def get_week_type(self, instance):
        return instance.week.week_type


class ColumnWorkflowSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = ColumnWorkflow
        fields = ["workflow", "column", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class OutcomeWorkflowSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = OutcomeWorkflow
        fields = ["workflow", "outcome", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class WorkflowSerializerFinder(serializers.ModelSerializer):
    class Meta:
        model = Workflow
        fields = ["id", "type"]

    def update(self, instance, validated_data):
        return instance


class ProjectSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):
    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "description",
            "author",
            "author_id",
            "published",
            "created_on",
            "last_modified",
            "workflowproject_set",
            "disciplines",
            "type",
        ]

    created_on = serializers.DateTimeField(format=dateTimeFormat())
    last_modified = serializers.DateTimeField(format=dateTimeFormat())
    workflowproject_set = serializers.SerializerMethodField()

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    def get_workflowproject_set(self, instance):
        links = instance.workflowproject_set.all().order_by("rank")
        return list(map(linkIDMap, links))

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.published = validated_data.get(
            "published", instance.published
        )
        instance.disciplines.set(
            validated_data.get("disciplines", instance.disciplines.all())
        )
        instance.save()
        return instance


class OutcomeSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):
    class Meta:
        model = Outcome
        fields = [
            "id",
            "title",
            "code",
            "description",
            "child_outcome_links",
            "outcome_horizontal_links",
            "outcome_horizontal_links_unique",
            "is_dropped",
            "depth",
            "type",
        ]

        read_only_fields = [
            "id",
            "child_outcome_links",
            "outcome_horizontal_links",
            "outcome_horizontal_links_unique",
            "depth",
            "type",
        ]

    child_outcome_links = serializers.SerializerMethodField()
    outcome_horizontal_links_unique = serializers.SerializerMethodField()

    def get_outcome_horizontal_links_unique(self, instance):
        if len(instance.outcome_horizontal_links.all()) == 0:
            return []
        return list(
            map(linkIDMap, get_unique_outcomehorizontallinks(instance))
        )

    def get_child_outcome_links(self, instance):
        links = instance.child_outcome_links.all()
        if len(links) == 0:
            return []
        links = links.order_by("rank")
        return list(map(linkIDMap, links))

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.code = validated_data.get("code", instance.code)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.is_dropped = validated_data.get(
            "is_dropped", instance.is_dropped
        )
        instance.save()
        return instance


class OutcomeOutcomeSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = OutcomeOutcome
        fields = ["parent", "child", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class OutcomeNodeSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = OutcomeNode
        fields = ["node", "outcome", "rank", "id", "degree"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class OutcomeHorizontalLinkSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = OutcomeHorizontalLink
        fields = ["outcome", "parent_outcome", "rank", "degree", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


#
# class OutcomeProjectSerializerShallow(serializers.ModelSerializer):
#    class Meta:
#        model = OutcomeProject
#        fields = ["project", "outcome", "added_on", "rank", "id"]
#
#    def update(self, instance, validated_data):
#        instance.rank = validated_data.get("rank", instance.rank)
#        instance.save()
#        return instance


class WorkflowSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):

    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Workflow
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "columnworkflow_set",
            "weekworkflow_set",
            "is_original",
            "parent_workflow",
            "outcomes_type",
            "outcomes_sort",
            "outcomeworkflow_set",
            "author_id",
            "is_strategy",
            "strategy_icon",
            "published",
        ]

    created_on = serializers.DateTimeField(format=dateTimeFormat())
    last_modified = serializers.DateTimeField(format=dateTimeFormat())
    weekworkflow_set = serializers.SerializerMethodField()
    columnworkflow_set = serializers.SerializerMethodField()
    outcomeworkflow_set = serializers.SerializerMethodField()

    strategy_icon = serializers.SerializerMethodField()

    author = serializers.SlugRelatedField(
        read_only=True, slug_field="username"
    )

    def get_author_id(self, instance):
        if instance.author is not None:
            return instance.author.id
        return None

    def get_strategy_icon(self, instance):
        if instance.is_strategy:
            return instance.weeks.first().strategy_classification
        else:
            return None

    def get_weekworkflow_set(self, instance):
        links = instance.weekworkflow_set.all().order_by("rank")
        return list(map(linkIDMap, links))

    def get_columnworkflow_set(self, instance):
        links = instance.columnworkflow_set.all().order_by("rank")
        return list(map(linkIDMap, links))

    def get_outcomeworkflow_set(self, instance):
        links = instance.outcomeworkflow_set.all().order_by("rank")
        return list(map(linkIDMap, links))

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.outcomes_type = validated_data.get(
            "outcomes_type", instance.outcomes_type
        )
        instance.outcomes_sort = validated_data.get(
            "outcomes_sort", instance.outcomes_sort
        )
        instance.published = validated_data.get(
            "published", instance.published
        )
        instance.save()
        return instance


class ProgramSerializerShallow(WorkflowSerializerShallow):

    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = [
            "id",
            "title",
            "description",
            "author",
            "author_id",
            "created_on",
            "last_modified",
            "hash",
            "columnworkflow_set",
            "weekworkflow_set",
            "is_original",
            "parent_workflow",
            "outcomes_type",
            "outcomes_sort",
            "outcomeworkflow_set",
            "is_strategy",
            "published",
            "type",
            "DEFAULT_COLUMNS",
            "DEFAULT_CUSTOM_COLUMN",
        ]

    def get_author_id(self, instance):
        if instance.author is not None:
            return instance.author.id
        return None

    def create(self, validated_data):
        return Program.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )


class CourseSerializerShallow(WorkflowSerializerShallow):

    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "author",
            "author_id",
            "created_on",
            "last_modified",
            "hash",
            "weekworkflow_set",
            "columnworkflow_set",
            "is_original",
            "parent_workflow",
            "outcomes_type",
            "outcomes_sort",
            "outcomeworkflow_set",
            "is_strategy",
            "published",
            "type",
            "DEFAULT_COLUMNS",
            "DEFAULT_CUSTOM_COLUMN",
        ]

    def get_author_id(self, instance):
        if instance.author is not None:
            return instance.author.id
        return None

    def create(self, validated_data):
        return Course.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )


class ActivitySerializerShallow(WorkflowSerializerShallow):

    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            "id",
            "title",
            "description",
            "author",
            "author_id",
            "created_on",
            "last_modified",
            "hash",
            "columnworkflow_set",
            "weekworkflow_set",
            "is_original",
            "parent_workflow",
            "outcomes_sort",
            "outcomes_type",
            "outcomeworkflow_set",
            "is_strategy",
            "published",
            "type",
            "DEFAULT_COLUMNS",
            "DEFAULT_CUSTOM_COLUMN",
        ]

    def get_author_id(self, instance):
        if instance.author is not None:
            return instance.author.id
        return None

    def create(self, validated_data):
        if User.objects.filter(username=self.initial_data["author"]).exists():
            author = User.objects.get(username=self.initial_data["author"])
        else:
            author = None
        activity = Activity.objects.create(author=author, **validated_data)

        return activity


class InfoBoxSerializer(
    serializers.Serializer, TitleSerializerMixin, DescriptionSerializerMixin
):

    id = serializers.ReadOnlyField()
    author = serializers.SerializerMethodField()
    created_on = serializers.DateTimeField(format=dateTimeFormat())
    last_modified = serializers.DateTimeField(format=dateTimeFormat())
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    favourite = serializers.SerializerMethodField()
    is_owned = serializers.SerializerMethodField()
    is_strategy = serializers.SerializerMethodField()
    published = serializers.ReadOnlyField()

    def get_is_owned(self, instance):
        user = self.context.get("user")
        if user == instance.author:
            return True
        else:
            return False

    def get_favourite(self, instance):
        user = self.context.get("user")
        if Favourite.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.id,
        ):
            return True
        else:
            return False

    def get_type(self, instance):
        return instance.type

    def get_is_strategy(self, instance):
        if hasattr(instance, "is_strategy"):
            return instance.is_strategy
        else:
            return False

    def get_author(self, instance):
        return str(instance.author)


serializer_lookups = {
    "node": NodeSerializer,
    "week": WeekSerializer,
    "column": ColumnSerializer,
    "activity": ActivitySerializer,
    "course": CourseSerializer,
    "program": ProgramSerializer,
}


serializer_lookups_shallow = {
    "node": NodeSerializerShallow,
    "nodeweek": NodeWeekSerializerShallow,
    "week": WeekSerializerShallow,
    "weekworkflow": WeekWorkflowSerializerShallow,
    "column": ColumnSerializerShallow,
    "columnworkflow": ColumnWorkflowSerializerShallow,
    "workflow": WorkflowSerializerShallow,
    "activity": ActivitySerializerShallow,
    "course": CourseSerializerShallow,
    "program": ProgramSerializerShallow,
    "project": ProjectSerializerShallow,
    "outcome": OutcomeSerializerShallow,
    "outcomeoutcome": OutcomeOutcomeSerializerShallow,
    "outcomeworkflow": OutcomeWorkflowSerializerShallow,
}
