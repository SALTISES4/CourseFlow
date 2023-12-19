import datetime
import re

import bleach
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext as _
from html2text import html2text
from rest_framework import serializers

# from .decorators import check_object_permission
from course_flow.models.models import Project, User, title_max_length
from course_flow.models.relations.columnWorkflow import ColumnWorkflow
from course_flow.models.relations.liveProjectUser import LiveProjectUser
from course_flow.models.relations.nodeLink import NodeLink
from course_flow.models.relations.nodeWeek import NodeWeek
from course_flow.models.relations.outcomeHorizontalLink import (
    OutcomeHorizontalLink,
)
from course_flow.models.relations.outcomeNode import OutcomeNode
from course_flow.models.relations.outcomeOutcome import OutcomeOutcome
from course_flow.models.relations.outcomeWorkflow import OutcomeWorkflow
from course_flow.models.relations.weekWorkflow import WeekWorkflow

from .models.activity import Activity
from .models.column import Column
from .models.comment import Comment
from .models.course import Course
from .models.courseFlowUser import CourseFlowUser
from .models.discipline import Discipline
from .models.favourite import Favourite
from .models.liveAssignment import LiveAssignment
from .models.liveProject import LiveProject
from .models.node import Node
from .models.objectPermission import ObjectPermission
from .models.objectset import ObjectSet
from .models.outcome import Outcome
from .models.program import Program
from .models.userAssignment import UserAssignment
from .models.week import Week
from .models.workflow import Workflow
from .utils import (
    dateTimeFormat,
    get_unique_outcomehorizontallinks,
    get_unique_outcomenodes,
    get_user_role,
    linkIDMap,
    user_project_url,
    user_workflow_url,
)

bleach_allowed_attributes_description = {
    "a": ["href", "title", "target"],
    "abbr": ["title"],
    "acronym": ["title"],
}
bleach_allowed_tags_description = [
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

bleach_allowed_tags_title = [
    "b",
    "u",
    "em",
    "i",
]


# timing_results = {}
# def timing(f):
#     @wraps(f)
#     def wrap(*args, **kw):
#         ts = time.time()
#         result = f(*args, **kw)
#         te = time.time()
#         #print(f'Function {f.__name__} took {te-ts:2.4f} seconds')
#         if timing_results.get(f.__name__) is None:
#             timing_results[f.__name__] = te - ts
#         else:
#             timing_results[f.__name__] = timing_results[f.__name__] + te - ts
#         print(f'Function {f.__name__} has taken {timing_results[f.__name__]:2.4f} seconds')
#         return result
#     return wrap


def bleach_sanitizer(value, **kwargs):
    if value is not None:
        return bleach.clean(value, **kwargs)
    else:
        return None


class AuthorSerializerMixin:
    author = serializers.SerializerMethodField()

    def get_author(self, instance):
        user = self.context.get("user", None)
        if user is not None:
            if instance.author is None:
                return ""
            return str(instance.author.username)
        else:
            return _("a CourseFlow user")


class DescriptionSerializerMixin:
    description = serializers.SerializerMethodField()

    def get_description(self, instance):
        return bleach_sanitizer(
            instance.description,
            tags=bleach_allowed_tags_description,
            attributes=bleach_allowed_attributes_description,
        )

    def validate_description(self, value):
        if value is None:
            return None
        return bleach_sanitizer(
            value,
            tags=bleach_allowed_tags_description,
            attributes=bleach_allowed_attributes_description,
        )


class TitleSerializerMixin:
    title = serializers.SerializerMethodField()

    def get_title(self, instance):
        return bleach_sanitizer(instance.title, tags=bleach_allowed_tags_title)

    def validate_title(self, value):
        return bleach_sanitizer(value, tags=bleach_allowed_tags_title)[
            :title_max_length
        ]


class DescriptionSerializerTextMixin(serializers.Serializer):
    description = serializers.SerializerMethodField()

    def get_description(self, instance):
        if instance.description is None:
            return None
        returnval = html2text(
            bleach_sanitizer(
                instance.description, tags=bleach_allowed_tags_description
            )
        )
        return re.sub("\n\n$", "", returnval)


class TitleSerializerTextMixin(serializers.Serializer):
    title = serializers.SerializerMethodField()

    def get_title(self, instance):
        title = instance.title

        if self.get_type(instance) == "node":
            if (
                instance.linked_workflow is not None
                and instance.represents_workflow
            ):
                title = instance.linked_workflow.title

        if title is None or title == "":
            if self.get_type(instance) == "week":
                return (
                    instance.get_week_type_display()
                    + " "
                    + str(
                        WeekWorkflow.objects.filter(week=instance)
                        .first()
                        .get_display_rank()
                        + 1
                    )
                )
            else:
                return _("Untitled")
        returnval = html2text(
            bleach_sanitizer(title, tags=bleach_allowed_tags_title)
        )
        return re.sub("\n\n$", "", returnval)


class TimeRequiredSerializerMixin:
    time_required = serializers.SerializerMethodField()

    def get_time_required(self, instance):
        return bleach_sanitizer(instance.time_required, tags=[])

    def validate_time_required(self, value):
        return bleach_sanitizer(value, tags=[])


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
        ]

    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()

    def get_first_name(self, instance):
        courseflow_user = CourseFlowUser.objects.filter(user=instance).first()
        if courseflow_user is None:
            courseflow_user = CourseFlowUser.objects.create(
                first_name=instance.first_name,
                last_name=instance.last_name,
                user=instance,
            )
        return bleach_sanitizer(
            courseflow_user.first_name,
            tags=[],
            attributes=[],
        )

    def validate_first_name(self, value):
        if value is None:
            return None
        return bleach_sanitizer(
            value,
            tags=[],
            attributes=[],
        )

    def get_last_name(self, instance):
        courseflow_user = CourseFlowUser.objects.filter(user=instance).first()
        if courseflow_user is None:
            courseflow_user = CourseFlowUser.objects.create(
                first_name=instance.first_name,
                last_name=instance.last_name,
                user=instance,
            )
        return bleach_sanitizer(
            courseflow_user.last_name,
            tags=[],
            attributes=[],
        )

    def validate_last_name(self, value):
        if value is None:
            return None
        return bleach_sanitizer(
            value,
            tags=[],
            attributes=[],
        )


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ["id", "title"]


class NodeLinkSerializerShallow(
    serializers.ModelSerializer, TitleSerializerMixin
):
    class Meta:
        model = NodeLink
        fields = [
            "deleted",
            "deleted_on",
            "id",
            "title",
            "source_node",
            "target_node",
            "source_port",
            "target_port",
            "dashed",
            "text_position",
        ]

    deleted_on = serializers.DateTimeField(format=dateTimeFormat())

    def create(self, validated_data):
        return Node.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.dashed = validated_data.get("dashed", instance.dashed)
        instance.text_position = validated_data.get(
            "text_position", instance.text_position
        )
        instance.save()
        return instance


class NodeSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
    TimeRequiredSerializerMixin,
):
    outgoing_links = serializers.SerializerMethodField()
    outcomenode_set = serializers.SerializerMethodField()
    outcomenode_unique_set = serializers.SerializerMethodField()
    columnworkflow = serializers.SerializerMethodField()
    column = serializers.SerializerMethodField()
    linked_workflow_data = serializers.SerializerMethodField()
    has_assignment = serializers.SerializerMethodField()

    node_type_display = serializers.CharField(source="get_node_type_display")

    class Meta:
        model = Node
        fields = [
            "deleted",
            "deleted_on",
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
            "time_units",
            "time_required",
            "ponderation_theory",
            "ponderation_practical",
            "ponderation_individual",
            "time_general_hours",
            "time_specific_hours",
            "represents_workflow",
            "linked_workflow",
            "linked_workflow_data",
            # "is_dropped",
            "comments",
            "sets",
            "has_assignment",
        ]

    deleted_on = serializers.DateTimeField(format=dateTimeFormat())

    def get_columnworkflow(self, instance):
        if instance.column is None:
            instance.column = (
                instance.get_workflow()
                .columns.filter(deleted=False)
                .order_by("columnworkflow__rank")
                .first()
            )
            instance.save()
        if instance.column.deleted:
            workflow = instance.get_workflow()
            return (
                ColumnWorkflow.objects.filter(
                    workflow=workflow, column__deleted=False
                )
                .order_by("rank")
                .first()
                .id
            )
        else:
            return instance.column.columnworkflow_set.get(
                column=instance.column
            ).id

    def get_column(self, instance):
        if instance.column is None:
            instance.column = (
                instance.get_workflow()
                .columns.filter(deleted=False)
                .order_by("columnworkflow__rank")
                .first()
            )
            instance.save()
        if instance.column.deleted:
            workflow = instance.get_workflow()
            return (
                ColumnWorkflow.objects.filter(
                    workflow=workflow, column__deleted=False
                )
                .order_by("rank")
                .first()
                .column.id
            )
        else:
            return instance.column.id

    def get_outcomenode_set(self, instance):
        links = instance.outcomenode_set.exclude(
            Q(outcome__deleted=True)
            | Q(outcome__parent_outcomes__deleted=True)
            | Q(outcome__parent_outcomes__parent_outcomes__deleted=True)
        )
        return list(map(linkIDMap, links))

    def get_outgoing_links(self, instance):
        links = instance.outgoing_links.exclude(
            Q(deleted=True)
            | Q(target_node__deleted=True)
            | Q(target_node__week__deleted=True)
        )
        return list(map(linkIDMap, links))

    def get_outcomenode_unique_set(self, instance):
        return list(map(linkIDMap, get_unique_outcomenodes(instance)))

    def get_linked_workflow_data(self, instance):
        linked_workflow = instance.linked_workflow
        if linked_workflow is not None:
            return LinkedWorkflowSerializerShallow(
                linked_workflow,
                context={"user": self.context.get("user", None)},
            ).data

    def get_has_assignment(self, instance):
        user = self.context.get("user", None)
        if user is None or not user.is_authenticated:
            return False
        assignments = instance.liveassignment_set.all()
        if assignments.exists():
            return instance.liveassignment_set.filter(
                Q(userassignment__user=user)
                | Q(
                    liveproject__liveprojectuser__role_type=LiveProjectUser.ROLE_TEACHER
                )
            ).exists()
        return False

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
        instance.ponderation_theory = validated_data.get(
            "ponderation_theory", instance.ponderation_theory
        )
        instance.ponderation_practical = validated_data.get(
            "ponderation_practical", instance.ponderation_practical
        )
        instance.ponderation_individual = validated_data.get(
            "ponderation_individual", instance.ponderation_individual
        )
        instance.time_general_hours = validated_data.get(
            "time_general_hours", instance.time_general_hours
        )
        instance.time_specific_hours = validated_data.get(
            "time_specific_hours", instance.time_specific_hours
        )
        # instance.is_dropped = validated_data.get(
        #     "is_dropped", instance.is_dropped
        # )
        instance.save()
        return instance


class LinkedWorkflowSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = Workflow
        fields = [
            "id",
            "deleted",
            "deleted_on",
            "title",
            "description",
            "code",
            "time_required",
            "time_units",
            "ponderation_theory",
            "ponderation_practical",
            "ponderation_individual",
            "time_general_hours",
            "time_specific_hours",
            "type",
            "created_on",
            "url",
        ]

    deleted_on = serializers.DateTimeField(format=dateTimeFormat())
    url = serializers.SerializerMethodField()

    def get_url(self, instance):
        user = self.context.get("user", None)
        return user_workflow_url(instance, user)


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
            "deleted",
            "deleted_on",
            "id",
            "title",
            "icon",
            "column_type",
            "column_type_display",
            "colour",
            "visible",
            "comments",
        ]

    deleted_on = serializers.DateTimeField(format=dateTimeFormat())

    def create(self, validated_data):
        return Column.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.colour = validated_data.get("colour", instance.colour)
        instance.icon = validated_data.get("icon", instance.icon)
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
            "deleted",
            "deleted_on",
            "id",
            "title",
            "description",
            "default",
            "nodeweek_set",
            "week_type",
            "week_type_display",
            "is_strategy",
            "strategy_classification",
            "comments",
            # "is_dropped",
        ]

    deleted_on = serializers.DateTimeField(format=dateTimeFormat())

    def get_nodeweek_set(self, instance):
        links = instance.nodeweek_set.filter(node__deleted=False).order_by(
            "rank"
        )
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
        # instance.is_dropped = validated_data.get(
        #     "is_dropped", instance.is_dropped
        # )
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
    AuthorSerializerMixin,
):
    class Meta:
        model = Project
        fields = [
            "deleted",
            "deleted_on",
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
            "object_sets",
            "favourite",
            "liveproject",
            "object_permission",
        ]

    created_on = serializers.DateTimeField(format=dateTimeFormat())
    last_modified = serializers.DateTimeField(format=dateTimeFormat())
    workflowproject_set = serializers.SerializerMethodField()
    object_sets = serializers.SerializerMethodField()
    favourite = serializers.SerializerMethodField()
    deleted_on = serializers.DateTimeField(format=dateTimeFormat())
    author = serializers.SerializerMethodField()
    object_permission = serializers.SerializerMethodField()

    def get_favourite(self, instance):
        user = self.context.get("user")
        if user is None or not user.is_authenticated:
            return False
        if Favourite.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.id,
        ):
            return True
        else:
            return False

    def get_object_sets(self, instance):
        return [
            {
                "id": object_set.id,
                "term": object_set.term,
                "title": object_set.title,
                "translation_plural": object_set.translation_plural,
            }
            for object_set in instance.object_sets.all()
        ]

    def get_workflowproject_set(self, instance):
        links = instance.workflowproject_set.filter(
            workflow__deleted=False
        ).order_by("rank")
        return list(map(linkIDMap, links))

    def get_object_permission(self, instance):
        user = self.context.get("user")
        if user is None or not user.is_authenticated:
            return 0
        object_permission = ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.id,
        ).first()
        if object_permission is None:
            return None
        return {
            "permission_type": object_permission.permission_type,
            "last_viewed": object_permission.last_viewed,
        }

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
            "deleted",
            "deleted_on",
            "id",
            "title",
            "code",
            "description",
            "child_outcome_links",
            "outcome_horizontal_links",
            "outcome_horizontal_links_unique",
            # "is_dropped",
            "depth",
            "type",
            "comments",
            "sets",
        ]

        # read_only_fields = [
        #     "id",
        #     "child_outcome_links",
        #     "outcome_horizontal_links",
        #     "outcome_horizontal_links_unique",
        #     "depth",
        #     "type",
        #     "comments",
        #     "sets",
        # ]

    child_outcome_links = serializers.SerializerMethodField()
    outcome_horizontal_links = serializers.SerializerMethodField()
    outcome_horizontal_links_unique = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    deleted_on = serializers.DateTimeField(format=dateTimeFormat())

    def get_type(self, instance):
        my_type = self.context.get("type", None)
        if my_type is None:
            my_type = instance.get_workflow().type + " outcome"
        return my_type

    def get_outcome_horizontal_links(self, instance):
        if len(instance.outcome_horizontal_links.all()) == 0:
            return []
        return list(
            map(
                linkIDMap,
                instance.outcome_horizontal_links.exclude(
                    Q(parent_outcome__deleted=True)
                    | Q(parent_outcome__parent_outcomes__deleted=True)
                    | Q(
                        parent_outcome__parent_outcomes__parent_outcomes__deleted=True
                    )
                ),
            )
        )

    def get_outcome_horizontal_links_unique(self, instance):
        if len(instance.outcome_horizontal_links.all()) == 0:
            return []
        return list(
            map(linkIDMap, get_unique_outcomehorizontallinks(instance))
        )

    def get_child_outcome_links(self, instance):
        links = instance.child_outcome_links.filter(child__deleted=False)
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
        # instance.is_dropped = validated_data.get(
        #     "is_dropped", instance.is_dropped
        # )
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


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["id", "user", "created_on", "text"]

    user = serializers.SerializerMethodField()
    created_on = serializers.DateTimeField(format=dateTimeFormat())

    def get_user(self, instance):
        return UserSerializer(instance.user).data

    def update(self, instance, validated_data):
        instance.text = validated_data.get("text", instance.text)
        instance.save()
        return instance


class WorkflowSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
    AuthorSerializerMixin,
):
    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Workflow
        fields = [
            "deleted",
            "deleted_on",
            "id",
            "title",
            "description",
            "code",
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
            "time_required",
            "time_units",
            "ponderation_theory",
            "ponderation_practical",
            "ponderation_individual",
            "time_general_hours",
            "time_specific_hours",
            "edit_count",
            "favourite",
            "condensed",
            "importing",
            "public_view",
            "url",
        ]

    created_on = serializers.DateTimeField(format=dateTimeFormat())
    last_modified = serializers.DateTimeField(format=dateTimeFormat())
    weekworkflow_set = serializers.SerializerMethodField()
    columnworkflow_set = serializers.SerializerMethodField()
    outcomeworkflow_set = serializers.SerializerMethodField()
    favourite = serializers.SerializerMethodField()
    deleted_on = serializers.DateTimeField(format=dateTimeFormat())
    author = serializers.SerializerMethodField()
    outcomes_sort = serializers.SerializerMethodField()

    strategy_icon = serializers.SerializerMethodField()

    url = serializers.SerializerMethodField()

    # Although we'll hang onto outcomes_sort as a field for now, this should just reset to 0
    def get_outcomes_sort(self, instance):
        return 0

    def get_url(self, instance):
        user = self.context.get("user", None)
        return user_workflow_url(instance, user)

    def get_author_id(self, instance):
        if instance.author is not None:
            return instance.author.id
        return None

    def get_favourite(self, instance):
        user = self.context.get("user", None)
        if user is None or not user.is_authenticated:
            return False
        if user is None:
            return False
        if Favourite.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(
                instance.get_subclass()
            ),
            object_id=instance.id,
        ):
            return True
        else:
            return False

    def get_strategy_icon(self, instance):
        if instance.is_strategy:
            return instance.weeks.first().strategy_classification
        else:
            return None

    def get_weekworkflow_set(self, instance):
        links = instance.weekworkflow_set.filter(week__deleted=False).order_by(
            "rank"
        )
        return list(map(linkIDMap, links))

    def get_columnworkflow_set(self, instance):
        links = instance.columnworkflow_set.filter(
            column__deleted=False
        ).order_by("rank")
        return list(map(linkIDMap, links))

    def get_outcomeworkflow_set(self, instance):
        links = instance.outcomeworkflow_set.filter(
            outcome__deleted=False
        ).order_by("rank")
        return list(map(linkIDMap, links))

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.code = validated_data.get("code", instance.code)
        instance.outcomes_type = validated_data.get(
            "outcomes_type", instance.outcomes_type
        )
        instance.outcomes_sort = validated_data.get(
            "outcomes_sort", instance.outcomes_sort
        )
        instance.published = validated_data.get(
            "published", instance.published
        )
        instance.time_required = validated_data.get(
            "time_required", instance.time_required
        )
        instance.time_units = validated_data.get(
            "time_units", instance.time_units
        )
        instance.ponderation_theory = validated_data.get(
            "ponderation_theory", instance.ponderation_theory
        )
        instance.ponderation_practical = validated_data.get(
            "ponderation_practical", instance.ponderation_practical
        )
        instance.ponderation_individual = validated_data.get(
            "ponderation_individual", instance.ponderation_individual
        )
        instance.time_general_hours = validated_data.get(
            "time_general_hours", instance.time_general_hours
        )
        instance.time_specific_hours = validated_data.get(
            "time_specific_hours", instance.time_specific_hours
        )
        instance.condensed = validated_data.get(
            "condensed", instance.condensed
        )
        instance.public_view = validated_data.get(
            "public_view", instance.public_view
        )
        instance.save()
        return instance


class ProgramSerializerShallow(WorkflowSerializerShallow):
    author_id = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = [
            "deleted",
            "deleted_on",
            "id",
            "title",
            "description",
            "code",
            "author",
            "author_id",
            "created_on",
            "last_modified",
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
            "time_required",
            "time_units",
            "ponderation_theory",
            "ponderation_practical",
            "ponderation_individual",
            "time_general_hours",
            "time_specific_hours",
            "favourite",
            "condensed",
            "importing",
            "public_view",
            "url",
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
            "deleted",
            "deleted_on",
            "id",
            "title",
            "description",
            "code",
            "author",
            "author_id",
            "created_on",
            "last_modified",
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
            "time_required",
            "time_units",
            "ponderation_theory",
            "ponderation_practical",
            "ponderation_individual",
            "time_general_hours",
            "time_specific_hours",
            "favourite",
            "condensed",
            "importing",
            "public_view",
            "url",
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
            "deleted",
            "deleted_on",
            "id",
            "title",
            "description",
            "code",
            "author",
            "author_id",
            "created_on",
            "last_modified",
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
            "time_required",
            "time_units",
            "ponderation_theory",
            "ponderation_practical",
            "ponderation_individual",
            "time_general_hours",
            "time_specific_hours",
            "favourite",
            "condensed",
            "importing",
            "public_view",
            "url",
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


class ObjectSetSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
):
    class Meta:
        model = ObjectSet
        fields = ["id", "title", "translation_plural", "term"]

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.translation_plural = validated_data.get(
            "translation_plural", instance.translation_plural
        )
        instance.save()
        return instance


class FavouriteSerializer(
    serializers.Serializer,
    TitleSerializerMixin,
):
    title = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    def get_url(self, instance):
        user = self.context.get("user", None)
        if instance.type in ["project", "liveproject"]:
            return user_project_url(instance, user)
        return user_workflow_url(instance, user)

    def get_title(self, instance):
        title = super().get_title(instance)
        if title is None or title == "":
            return _("Untitled ") + instance._meta.verbose_name
        return title


class InfoBoxSerializer(
    serializers.Serializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
    AuthorSerializerMixin,
):
    deleted = serializers.ReadOnlyField()
    id = serializers.ReadOnlyField()
    created_on = serializers.DateTimeField(format=dateTimeFormat())
    last_modified = serializers.DateTimeField(format=dateTimeFormat())
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    type = serializers.ReadOnlyField()
    favourite = serializers.SerializerMethodField()
    is_owned = serializers.SerializerMethodField()
    is_strategy = serializers.ReadOnlyField()
    published = serializers.ReadOnlyField()
    author = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    project_title = serializers.SerializerMethodField()
    # url = serializers.SerializerMethodField()
    # can_edit = serializers.SerializerMethodField()
    object_permission = serializers.SerializerMethodField()
    has_liveproject = serializers.SerializerMethodField()
    workflow_count = serializers.SerializerMethodField()
    is_linked = serializers.SerializerMethodField()
    is_visible = serializers.SerializerMethodField()

    def get_workflow_count(self, instance):
        if instance.type == "project":
            return instance.workflows.all().count()
        return None

    def get_url(self, instance):
        if instance.type in ["project", "liveproject"]:
            return None
        user = self.context.get("user", None)
        return user_workflow_url(instance, user)

    def get_project_title(self, instance):
        if instance.type in ["project", "liveproject"]:
            return None
        if instance.get_project() is None:
            return None
        return instance.get_project().title

    def get_is_owned(self, instance):
        user = self.context.get("user")
        if user == instance.author:
            return True
        else:
            return False

    def get_favourite(self, instance):
        user = self.context.get("user")
        if user is None or not user.is_authenticated:
            return False
        if Favourite.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(
                instance.get_permission_objects()[0]
            ),
            object_id=instance.id,
        ):
            return True
        else:
            return False

    def get_object_permission(self, instance):
        user = self.context.get("user")
        if user is None or not user.is_authenticated:
            return 0
        object_permission = ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(
                instance.get_permission_objects()[0]
            ),
            object_id=instance.id,
        ).first()
        object_role = get_user_role(instance, user)
        if object_permission is None:
            return {
                "permission_type": ObjectPermission.PERMISSION_VIEW,
                "last_viewed": None,
                "role_type": object_role,
            }
        return {
            "permission_type": object_permission.permission_type,
            "last_viewed": object_permission.last_viewed,
            "role_type": object_role,
        }

    def get_has_liveproject(self, instance):
        if instance.type == "project":
            if LiveProject.objects.filter(project=instance).count() > 0:
                return True
        return False

    def get_is_linked(self, instance):
        if instance.type not in ["project", "liveproject"]:
            return len(Node.objects.filter(linked_workflow=instance)) > 0
        return False

    def get_is_visible(self, instance):
        if instance.type in ["project", "liveproject"]:
            return False
        return len(LiveProject.objects.filter(visible_workflows=instance)) > 0


def analyticsDateTimeFormat():
    return "%Y %m"


class AnalyticsSerializer(
    serializers.Serializer,
):
    created_on = serializers.DateTimeField(format=analyticsDateTimeFormat())
    type = serializers.ReadOnlyField()
    User = serializers.SerializerMethodField()
    nodes = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    def get_nodes(self, instance):
        if instance.type == "project":
            return Node.objects.filter(
                week__workflow__project__id=instance.id
            ).count()
        else:
            return Node.objects.filter(week__workflow=instance.id).count()
        return 0

    def get_User(self, instance):
        if instance.author is not None:
            active = " (active)"
            if (
                timezone.now() - instance.author.last_login
                > datetime.timedelta(days=31)
            ):
                active = " (inactive)"
            return str(instance.author.pk) + active

    def get_email(self, instance):
        if instance.author is not None:
            return instance.author.email


# class RefreshSerializerWeek(serializers.Serializer):
#    class Meta:
#        model = Week
#        fields = [
#            "id",
#            "nodeweek_set",
#        ]
#
#    nodeweek_set = serializers.SerializerMethodField()
#
#    def get_nodeweek_set(self, instance):
#        links = instance.nodeweek_set.filter(node__deleted=False).order_by("rank")
#        return list(map(linkIDMap, links))
#
#
#
# class RefreshSerializerWorkflow(serializers.ModelSerializer):
#
#    author_id = serializers.SerializerMethodField()
#
#    class Meta:
#        model = Workflow
#        fields = [
#            "id",
#            "columnworkflow_set",
#            "weekworkflow_set",
#            "outcomeworkflow_set",
#        ]
#
#    weekworkflow_set = serializers.SerializerMethodField()
#    columnworkflow_set = serializers.SerializerMethodField()
#    outcomeworkflow_set = serializers.SerializerMethodField()
#
#
#
#    def get_weekworkflow_set(self, instance):
#        links = instance.weekworkflow_set.filter(week__deleted=False).order_by("rank")
#        return list(map(linkIDMap, links))
#
#    def get_columnworkflow_set(self, instance):
#        links = instance.columnworkflow_set.filter(column__deleted=False).order_by("rank")
#        return list(map(linkIDMap, links))
#
#    def get_outcomeworkflow_set(self, instance):
#        links = instance.outcomeworkflow_set.filter(outcome__deleted=False).order_by("rank")
#        return list(map(linkIDMap, links))
#
#


class RefreshSerializerOutcome(serializers.ModelSerializer):
    class Meta:
        model = Outcome
        fields = [
            "id",
            "outcome_horizontal_links",
            "outcome_horizontal_links_unique",
        ]

    outcome_horizontal_links = serializers.SerializerMethodField()
    outcome_horizontal_links_unique = serializers.SerializerMethodField()

    def get_outcome_horizontal_links(self, instance):
        if len(instance.outcome_horizontal_links.all()) == 0:
            return []
        return list(
            map(
                linkIDMap,
                instance.outcome_horizontal_links.exclude(
                    Q(parent_outcome__deleted=True)
                    | Q(parent_outcome__parent_outcomes__deleted=True)
                    | Q(
                        parent_outcome__parent_outcomes__parent_outcomes__deleted=True
                    )
                ),
            )
        )

    def get_outcome_horizontal_links_unique(self, instance):
        if len(instance.outcome_horizontal_links.all()) == 0:
            return []
        return list(
            map(linkIDMap, get_unique_outcomehorizontallinks(instance))
        )


class RefreshSerializerNode(serializers.ModelSerializer):
    outcomenode_set = serializers.SerializerMethodField()
    outcomenode_unique_set = serializers.SerializerMethodField()

    class Meta:
        model = Node
        fields = [
            "id",
            "outcomenode_set",
            "outcomenode_unique_set",
        ]

    def get_outcomenode_set(self, instance):
        links = instance.outcomenode_set.exclude(
            Q(outcome__deleted=True)
            | Q(outcome__parent_outcomes__deleted=True)
            | Q(outcome__parent_outcomes__parent_outcomes__deleted=True)
        )
        return list(map(linkIDMap, links))

    def get_outcomenode_unique_set(self, instance):
        return list(map(linkIDMap, get_unique_outcomenodes(instance)))


class OutcomeExportSerializer(
    serializers.ModelSerializer,
    TitleSerializerTextMixin,
    DescriptionSerializerTextMixin,
):
    class Meta:
        model = Outcome
        fields = [
            "id",
            "title",
            "code",
            "description",
            "depth",
        ]

    code = serializers.SerializerMethodField()

    def get_code(self, instance):
        if instance.depth == 0:
            outcomeworkflow = OutcomeWorkflow.objects.filter(
                outcome=instance
            ).first()
            if instance.code is None or instance.code == "":
                return str(outcomeworkflow.get_display_rank() + 1)
            else:
                return instance.code
        else:
            outcomeoutcome = OutcomeOutcome.objects.filter(
                child=instance
            ).first()
            if instance.code is None or instance.code == "":
                return (
                    self.get_code(outcomeoutcome.parent)
                    + "."
                    + str(outcomeoutcome.get_display_rank() + 1)
                )
            else:
                return (
                    self.get_code(outcomeoutcome.parent) + "." + instance.code
                )

    def get_type(self, instance):
        return "outcome"


class WeekExportSerializer(
    serializers.ModelSerializer,
    TitleSerializerTextMixin,
    DescriptionSerializerTextMixin,
):
    class Meta:
        model = Week
        fields = [
            "id",
            "title",
            "description",
            "type",
        ]

    objectType = "week"

    type = serializers.SerializerMethodField()

    def get_type(self, instance):
        return "week"


class NodeExportSerializer(
    serializers.ModelSerializer,
    TitleSerializerTextMixin,
    DescriptionSerializerTextMixin,
):
    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "column_order",
            "type",
        ]

    column_order = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    def get_column_order(self, instance):
        return str(ColumnWorkflow.objects.get(column=instance.column).rank)

    def get_type(self, instance):
        return "node"


class NodeExportSerializerWithTime(NodeExportSerializer):
    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "column_order",
            "type",
            "code",
            "ponderation_theory",
            "ponderation_individual",
            "ponderation_practical",
            "time_required",
        ]

    code = serializers.SerializerMethodField()
    ponderation_theory = serializers.SerializerMethodField()
    ponderation_individual = serializers.SerializerMethodField()
    ponderation_practical = serializers.SerializerMethodField()
    time_required = serializers.SerializerMethodField()

    def get_code(self, instance):
        if (
            instance.represents_workflow
            and instance.linked_workflow is not None
        ):
            return instance.linked_workflow.code
        else:
            return None

    def get_ponderation_theory(self, instance):
        if (
            instance.represents_workflow
            and instance.linked_workflow is not None
        ):
            return instance.linked_workflow.ponderation_theory
        else:
            return instance.ponderation_theory

    def get_ponderation_individual(self, instance):
        if (
            instance.represents_workflow
            and instance.linked_workflow is not None
        ):
            return instance.linked_workflow.ponderation_individual
        else:
            return instance.ponderation_individual

    def get_ponderation_practical(self, instance):
        if (
            instance.represents_workflow
            and instance.linked_workflow is not None
        ):
            return instance.linked_workflow.ponderation_practical
        else:
            return instance.ponderation_practical

    def get_time_required(self, instance):
        if (
            instance.represents_workflow
            and instance.linked_workflow is not None
        ):
            return instance.linked_workflow.time_required
        else:
            return instance.time_required


class WorkflowExportSerializer(
    serializers.ModelSerializer,
    TitleSerializerTextMixin,
    DescriptionSerializerTextMixin,
):
    class Meta:
        model = Workflow
        fields = [
            "id",
            "title",
            "description",
            "type",
        ]

    type = serializers.SerializerMethodField()

    def get_type(self, instance):
        return "workflow"


class UpdateNotificationSerializer(
    serializers.ModelSerializer,
    TitleSerializerMixin,
):
    class Meta:
        model = Workflow
        fields = [
            "id",
            "title",
        ]


"""
Live Project Serializers
"""


class LiveProjectSerializer(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):
    class Meta:
        model = LiveProject
        fields = [
            "title",
            "description",
            "pk",
            "type",
            "created_on",
            "default_self_reporting",
            "default_assign_to_all",
            "default_single_completion",
            "default_all_workflows_visible",
            "registration_hash",
            "id",
        ]

    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField()

    created_on = serializers.DateTimeField(format=dateTimeFormat())

    registration_hash = serializers.SerializerMethodField()

    def get_registration_hash(self, instance):
        user = self.context.get("user", None)
        if user is None:
            return None
        if instance.project.author == user:
            return instance.project.registration_hash()
        return None

    def get_title(self, instance):
        return super().get_title(instance.project)

    def get_description(self, instance):
        return super().get_description(instance.project)

    def get_id(self, instance):
        return instance.pk

    def update(self, instance, validated_data):
        instance.default_self_reporting = validated_data.get(
            "default_self_reporting", instance.default_self_reporting
        )
        instance.default_assign_to_all = validated_data.get(
            "default_assign_to_all", instance.default_assign_to_all
        )
        instance.default_single_completion = validated_data.get(
            "default_single_completion", instance.default_single_completion
        )
        instance.default_all_workflows_visible = validated_data.get(
            "default_all_workflows_visible",
            instance.default_all_workflows_visible,
        )

        instance.save()
        return instance


class LiveAssignmentSerializer(
    serializers.ModelSerializer,
    AuthorSerializerMixin,
):
    class Meta:
        model = LiveAssignment
        fields = [
            "id",
            "author",
            "created_on",
            "self_reporting",
            "single_completion",
            "task",
            "start_date",
            "end_date",
            "parent_workflow_id",
            "workflow_access",
            "linked_workflow_access",
            "user_assignment",
            "liveproject",
        ]

    task = serializers.SerializerMethodField()
    user_assignment = serializers.SerializerMethodField()
    workflow_access = serializers.SerializerMethodField()
    linked_workflow_access = serializers.SerializerMethodField()
    parent_workflow_id = serializers.SerializerMethodField()
    created_on = serializers.DateTimeField(format=dateTimeFormat())

    def get_task(self, instance):
        node = instance.task
        if node is not None:
            return NodeSerializerForAssignments(
                node, context={"user": self.context.get("user", None)}
            ).data

    def get_workflow_access(self, instance):
        try:
            workflow = instance.task.get_workflow()
            if workflow in instance.liveproject.visible_workflows.all():
                return True
        except AttributeError:
            return False
        return False

    def get_linked_workflow_access(self, instance):
        try:
            linked_workflow = instance.task.linked_workflow
            if linked_workflow in instance.liveproject.visible_workflows.all():
                return True
        except AttributeError:
            return False
        return False

    def get_parent_workflow_id(self, instance):
        try:
            parent_workflow = instance.task.get_workflow()
            return parent_workflow.id
        except AttributeError:
            return False
        return False

    def get_user_assignment(self, instance):
        if instance.single_completion:
            if instance.userassignment_set.filter(completed=True).count() > 0:
                userassignment = (
                    instance.userassignment_set.filter(completed=True)
                    .order_by("completed_on")
                    .first()
                )
                return UserAssignmentSerializerWithUser(userassignment).data
        try:
            userassignment = UserAssignment.objects.filter(
                user=self.context["user"], assignment=instance
            ).first()
            if userassignment is not None:
                return UserAssignmentSerializerWithUser(userassignment).data
        except AttributeError:
            return None
        return None

    def update(self, instance, validated_data):
        instance.self_reporting = validated_data.get(
            "self_reporting", instance.self_reporting
        )
        instance.single_completion = validated_data.get(
            "single_completion", instance.single_completion
        )
        instance.start_date = validated_data.get(
            "start_date", instance.start_date
        )
        instance.end_date = validated_data.get("end_date", instance.end_date)
        instance.save()
        return instance


class LiveAssignmentWithCompletionSerializer(LiveAssignmentSerializer):
    class Meta:
        model = LiveAssignment
        fields = [
            "id",
            "author",
            "created_on",
            "self_reporting",
            "single_completion",
            "task",
            "start_date",
            "end_date",
            "parent_workflow_id",
            "workflow_access",
            "linked_workflow_access",
            "liveproject",
            "completion_info",
        ]

    completion_info = serializers.SerializerMethodField()

    def get_completion_info(self, instance):
        userassignments = UserAssignment.objects.filter(assignment=instance)
        num_total = userassignments.count()
        num_completed = userassignments.filter(completed=True).count()
        if instance.single_completion and num_completed > 0:
            return str(num_total) + "/" + str(num_total)
        return str(num_completed) + "/" + str(num_total)


class UserAssignmentSerializer(
    serializers.ModelSerializer,
):
    class Meta:
        model = UserAssignment
        fields = [
            "id",
            "user",
            "assignment",
            "completed",
        ]


class UserAssignmentSerializerWithUser(
    serializers.ModelSerializer,
):
    class Meta:
        model = UserAssignment
        fields = [
            "id",
            "liveprojectuser",
            "assignment",
            "completed",
            "completed_on",
        ]

    liveprojectuser = serializers.SerializerMethodField()

    def get_liveprojectuser(self, instance):
        return LiveProjectUserSerializer(
            LiveProjectUser.objects.filter(
                user=instance.user, liveproject=instance.assignment.liveproject
            ).first()
        ).data


class LiveProjectUserSerializer(
    serializers.ModelSerializer,
):
    class Meta:
        model = LiveProjectUser
        fields = [
            "id",
            "user",
            "role_type",
            "role_type_display",
        ]

    role_type_display = serializers.CharField(source="get_role_type_display")
    user = serializers.SerializerMethodField()

    def get_user(self, instance):
        return UserSerializer(instance.user).data


class LiveProjectUserSerializerWithCompletion(
    LiveProjectUserSerializer,
):
    class Meta:
        model = LiveProjectUser
        fields = [
            "id",
            "user",
            "role_type",
            "role_type_display",
            "completion",
        ]

    completion = serializers.SerializerMethodField()

    def get_completion(self, instance):
        assignments = UserAssignment.objects.filter(
            assignment__liveproject=instance.liveproject,
            user=instance.user,
        )
        return (
            str(
                assignments.filter(
                    Q(completed=True)
                    | Q(
                        assignment__single_completion=True,
                        assignment__userassignment__completed=True,
                    )
                )
                .distinct()
                .count()
            )
            + "/"
            + str(assignments.count())
        )


class WorkflowSerializerForAssignments(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
    AuthorSerializerMixin,
):
    class Meta:
        model = Workflow
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "code",
            "type",
            "deleted",
            "weeks",
            "url",
        ]

    created_on = serializers.DateTimeField(format=dateTimeFormat())
    author = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    weeks = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    def get_url(self, instance):
        user = self.context.get("user", None)
        return user_workflow_url(instance, user)

    def get_type(self, instance):
        return instance.type

    def get_weeks(self, instance):
        return WeekSerializerForAssignments(
            Week.objects.filter(workflow=instance, deleted=False).order_by(
                "weekworkflow__rank"
            ),
            context={"user": self.context.get("user", None)},
            many=True,
        ).data


class WeekSerializerForAssignments(
    serializers.ModelSerializer,
    TitleSerializerMixin,
):
    class Meta:
        model = Week
        fields = [
            "id",
            "title",
            "deleted",
            "nodes",
            "week_type",
            "week_type_display",
        ]

    title = serializers.SerializerMethodField()
    nodes = serializers.SerializerMethodField()
    week_type_display = serializers.CharField(source="get_week_type_display")

    def get_type(self, instance):
        return instance.type

    def get_nodes(self, instance):
        return NodeSerializerForAssignments(
            Node.objects.filter(week=instance, deleted=False).order_by(
                "nodeweek__rank"
            ),
            context={"user": self.context.get("user", None)},
            many=True,
        ).data


class NodeSerializerForAssignments(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):
    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "deleted",
            "linked_workflow",
            "linked_workflow_data",
            "colour",
            "column_type",
        ]

    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    linked_workflow_data = serializers.SerializerMethodField()
    colour = serializers.SerializerMethodField()
    column_type = serializers.SerializerMethodField()

    def get_colour(self, instance):
        return instance.column.colour

    def get_column_type(self, instance):
        return instance.column.column_type

    def get_type(self, instance):
        return instance.type

    def get_linked_workflow_data(self, instance):
        linked_workflow = instance.linked_workflow
        if linked_workflow is not None:
            return LinkedWorkflowSerializerShallow(
                linked_workflow,
                context={"user": self.context.get("user", None)},
            ).data


class FormFieldsSerializer:
    def __init__(self, form_instance):
        self.form_instance = form_instance

    # figure out the appropriate html element input type
    # based on combination of field and widget type
    def get_field_type(self, field):
        field_type = field.__class__.__name__
        widget_type = field.widget.__class__.__name__

        if field_type == "CharField":
            if getattr(field, "choices", None):
                return "select" if widget_type == "Select" else "radio"
        elif field_type == "TypedChoiceField":
            return "radio" if widget_type == "RadioSelect" else "select"
        elif field_type == "IntegerField":
            return "number"
        elif field_type == "ChoiceField":
            if widget_type == "Select":
                return "select"
            elif widget_type == "RadioSelect":
                return "radio"
        elif field_type == "BooleanField":
            if widget_type == "CheckboxInput":
                return "checkbox"

        return "text"

    # generate the list of choices for fields which have them
    def get_field_choices(self, field):
        choices = []
        if hasattr(field, "choices"):
            for choice in field.choices:
                choices.append({"label": str(choice[1]), "value": choice[0]})
        return choices if len(choices) > 0 else None

    def prepare_fields(self):
        fields = []

        # have to check if the form instance is valid
        # in order for cleaned_data to become available
        if self.form_instance.is_valid():
            for field_name, field in self.form_instance.fields.items():
                fields.append(
                    {
                        "name": field_name,
                        "label": field.label
                        if hasattr(field, "label")
                        else None,
                        "type": self.get_field_type(field),
                        "required": field.required,
                        "options": self.get_field_choices(field),
                        "max_length": field.max_length
                        if hasattr(field, "max_length")
                        else None,
                        "help_text": field.help_text
                        if hasattr(field, "help_text")
                        else None,
                        "value": self.form_instance.cleaned_data.get(
                            field_name, None
                        ),
                    }
                )
        return fields


# serializer_lookups = {
#    "node": NodeSerializer,
#    "week": WeekSerializer,
#    "column": ColumnSerializer,
#    "activity": ActivitySerializer,
#    "course": CourseSerializer,
#    "program": ProgramSerializer,
# }


serializer_lookups_shallow = {
    "nodelink": NodeLinkSerializerShallow,
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
    "objectset": ObjectSetSerializerShallow,
    "liveassignment": LiveAssignmentSerializer,
    "liveproject": LiveProjectSerializer,
}
