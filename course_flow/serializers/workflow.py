from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers

from course_flow.models import (
    Activity,
    Course,
    Favourite,
    Program,
    User,
    Workflow,
)
from course_flow.serializers.mixin import (
    AuthorSerializerMixin,
    DescriptionSerializerMixin,
    TitleSerializerMixin,
)
from course_flow.services import DAO, Utility


class WorkflowSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
    AuthorSerializerMixin,
):
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
            "is_template",
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
            "user_permissions",
        ]

    author_id = serializers.SerializerMethodField()
    created_on = serializers.DateTimeField(format=Utility.dateTimeFormat())
    last_modified = serializers.DateTimeField(format=Utility.dateTimeFormat())
    weekworkflow_set = serializers.SerializerMethodField()
    columnworkflow_set = serializers.SerializerMethodField()
    outcomeworkflow_set = serializers.SerializerMethodField()
    favourite = serializers.SerializerMethodField()
    deleted_on = serializers.DateTimeField(format=Utility.dateTimeFormat())
    author = serializers.SerializerMethodField()
    outcomes_sort = serializers.SerializerMethodField()
    user_permissions = serializers.SerializerMethodField()
    strategy_icon = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    # Although we'll hang onto outcomes_sort as a field for now, this should just reset to 0
    def get_outcomes_sort(self, instance):
        return 0

    def get_url(self, instance):
        user = self.context.get("user", None)
        return DAO.user_workflow_url(instance, user)

    @staticmethod
    def get_author_id(instance):
        if instance.author is not None:
            return instance.author.id
        return None

    def get_favourite(self, instance):
        user = self.context.get("user", None)
        if user is None or not user.is_authenticated:
            return False

        if Favourite.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(Workflow),
            object_id=instance.id,
        ):
            return True

        return False

    @staticmethod
    def get_strategy_icon(instance):
        if instance.is_strategy:
            return instance.weeks.first().strategy_classification
        else:
            return None

    @staticmethod
    def get_weekworkflow_set(instance):
        links = instance.weekworkflow_set.filter(week__deleted=False).order_by(
            "rank"
        )
        return list(map(Utility.linkIDMap, links))

    @staticmethod
    def get_columnworkflow_set(instance):
        links = instance.columnworkflow_set.filter(
            column__deleted=False
        ).order_by("rank")
        return list(map(Utility.linkIDMap, links))

    @staticmethod
    def get_outcomeworkflow_set(instance):
        links = instance.outcomeworkflow_set.filter(
            outcome__deleted=False
        ).order_by("rank")
        return list(map(Utility.linkIDMap, links))

    def get_user_permissions(self, instance):
        user = self.context.get("user", None)
        user_permission = DAO.get_user_permission(instance, user)
        return user_permission

    def validate_is_template(self, value):
        user = self.context.get("user")
        try:
            if Group.objects.get(name="SALTISE_Staff") in user.groups.all():
                return value
            else:
                return False
        except ObjectDoesNotExist:
            return False

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
        instance.is_template = validated_data.get(
            "is_template", instance.is_template
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
            "is_template",
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
            "user_permissions",
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
            "is_template",
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
            "user_permissions",
        ]

    @staticmethod
    def get_outcomes_sort(instance):
        return 0

    @staticmethod
    def get_author_id(instance):
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
            "is_template",
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
            "user_permissions",
        ]

    def get_outcomes_sort(self, instance):
        return 0

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


class WorkflowUpdateSerializer(serializers.ModelSerializer):
    duration = serializers.CharField(
        write_only=True,
        required=False,
        allow_null=True,
        allow_blank=True,
        source="time_required",
    )
    units = serializers.IntegerField(
        write_only=True, required=False, source="time_units"
    )
    course_number = serializers.CharField(
        write_only=True, required=False, source="code", allow_null=True
    )
    ponderation = serializers.DictField(write_only=True, required=False)

    class Meta:
        model = Workflow
        fields = [
            "title",
            "description",
            "duration",
            "units",
            "course_number",
            "ponderation",
        ]

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.time_required = validated_data.get(
            "time_required", instance.time_required
        )
        instance.time_units = validated_data.get(
            "time_units", instance.time_units
        )

        # Check if the instance is of type Course before updating specific fields
        # @todo  i don't think we need this check unless we correct the schema, in which case, there
        # is a case that this should not be one serializer
        # if isinstance(instance, Course):
        instance.code = validated_data.get("code", instance.code)

        ponderation_data = validated_data.pop("ponderation", {})

        instance.ponderation_theory = ponderation_data.get(
            "theory", instance.ponderation_theory
        )
        instance.ponderation_practical = ponderation_data.get(
            "practice", instance.ponderation_practical
        )
        instance.ponderation_individual = ponderation_data.get(
            "individual", instance.ponderation_individual
        )

        instance.save()
        return instance
