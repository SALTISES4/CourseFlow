from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from rest_framework import serializers

from course_flow.apps import logger
from course_flow.models import (
    Activity,
    Course,
    Favourite,
    Program,
    Project,
    User,
    Workflow,
    WorkflowProject,
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
            "author",
            "author_id",
            "code",
            "columnworkflow_set",
            "condensed",
            "created_on",
            "deleted",
            "deleted_on",
            "description",
            "edit_count",
            "favourite",
            "id",
            "importing",
            "is_original",
            "is_strategy",
            "is_template",
            "last_modified",
            "outcomes_sort",
            "outcomes_type",
            "outcomeworkflow_set",
            "parent_workflow",
            "ponderation_individual",
            "ponderation_practical",
            "ponderation_theory",
            "public_view",
            "published",
            "strategy_icon",
            "time_general_hours",
            "time_required",
            "time_specific_hours",
            "time_units",
            "title",
            "url",
            "user_permissions",
            "weekworkflow_set",
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

    @staticmethod
    def get_outcomes_sort(instance):
        """
        Although we'll hang onto outcomes_sort as a field for now, this should just reset to 0
        :param instance:
        :return:
        """
        return 0

    def get_url(self, instance):
        user = self.context.get("user", None)
        return DAO.user_workflow_url(instance, user)

    @staticmethod
    def get_author_id(instance):
        return instance.author.id if instance.author else None

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
        links = instance.weekworkflow_set.filter(week__deleted=False).order_by("rank")
        return list(map(Utility.linkIDMap, links))

    @staticmethod
    def get_columnworkflow_set(instance):
        links = instance.columnworkflow_set.filter(column__deleted=False).order_by("rank")
        return list(map(Utility.linkIDMap, links))

    @staticmethod
    def get_outcomeworkflow_set(instance):
        links = instance.outcomeworkflow_set.filter(outcome__deleted=False).order_by("rank")
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
        ### can this be replaace with ??
        # for attr, value in validated_data.items():
        #     setattr(instance, attr, value)
        # instance.save()
        # return instance

        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.code = validated_data.get("code", instance.code)
        instance.outcomes_type = validated_data.get("outcomes_type", instance.outcomes_type)
        instance.outcomes_sort = validated_data.get("outcomes_sort", instance.outcomes_sort)
        instance.published = validated_data.get("published", instance.published)
        instance.time_required = validated_data.get("time_required", instance.time_required)
        instance.time_units = validated_data.get("time_units", instance.time_units)
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
        instance.condensed = validated_data.get("condensed", instance.condensed)
        instance.public_view = validated_data.get("public_view", instance.public_view)
        instance.is_template = validated_data.get("is_template", instance.is_template)
        instance.save()
        return instance


class ProgramSerializerShallow(WorkflowSerializerShallow):
    class Meta(WorkflowSerializerShallow.Meta):
        model = Program
        fields = WorkflowSerializerShallow.Meta.fields + [
            "DEFAULT_COLUMNS",
            "DEFAULT_CUSTOM_COLUMN",
            "type",
        ]

    def create(self, validated_data):
        return Program.objects.create(**validated_data)


class CourseSerializerShallow(WorkflowSerializerShallow):
    class Meta(WorkflowSerializerShallow.Meta):
        model = Course
        fields = WorkflowSerializerShallow.Meta.fields + [
            "DEFAULT_COLUMNS",
            "DEFAULT_CUSTOM_COLUMN",
            "type",
        ]

    def create(self, validated_data):
        return Course.objects.create(**validated_data)


class ActivitySerializerShallow(WorkflowSerializerShallow):
    class Meta(WorkflowSerializerShallow.Meta):
        model = Activity
        fields = WorkflowSerializerShallow.Meta.fields + [
            "DEFAULT_COLUMNS",
            "DEFAULT_CUSTOM_COLUMN",
            "type",
        ]

    def create(self, validated_data):
        author = User.objects.filter(username=validated_data.get("author")).first()
        return Activity.objects.create(author=author, **validated_data)


#########################################################
# WORKFLOW UPSERT
#########################################################
class WorkflowUpsertSerializer(serializers.ModelSerializer):
    type = serializers.CharField(write_only=True)  # Field to determine the model type
    project_id = serializers.IntegerField(
        write_only=True, required=False
    )  # Default to not required
    duration = serializers.CharField(
        write_only=True,
        required=False,
        allow_null=True,
        allow_blank=True,
        source="time_required",
    )
    units = serializers.IntegerField(write_only=True, required=False, source="time_units")
    course_number = serializers.CharField(
        write_only=True,
        required=False,
        source="code",
        allow_null=True,
        allow_blank=True,
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
            "project_id",
            "type",
        ]

    def create(self, validated_data):
        model_type = validated_data.pop("type", None)
        project_id = validated_data.pop("project_id", None)
        ponderation_data = validated_data.pop(
            "ponderation", None
        )  # Pop this before creating the instance
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            raise serializers.ValidationError({"project_id": "No project found with this ID."})

        model_class_map = {"program": Program, "course": Course, "activity": Activity}

        model_class = model_class_map.get(model_type.lower())
        if not model_class:
            raise serializers.ValidationError({"type": "Invalid type specified"})

        if project is None:
            raise serializers.ValidationError({"project": "This field is required for creation."})

        try:
            with transaction.atomic():
                instance = model_class.objects.create(**validated_data)
                if "ponderation" in validated_data:
                    WorkflowUpsertSerializer._set_ponderation_fields(instance, ponderation_data)
                    instance.save()

                WorkflowProject.objects.create(project=project, workflow=instance)

                return instance

        except Exception as e:
            logger.exception("An error occurred")
            # Handle exceptions, possibly re-raising or logging as needed
            raise serializers.ValidationError(
                {"error": "Failed to create workflow: {}".format(str(e))}
            )

    def update(self, instance, validated_data):
        ponderation_data = validated_data.pop("ponderation", None)
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.time_required = validated_data.get("time_required", instance.time_required)
        instance.time_units = validated_data.get("time_units", instance.time_units)

        # Check if the instance is of type Course before updating specific fields
        # @todo  i don't think we need this check unless we correct the schema, in which case, there
        # is a case that this should not be one serializer
        # if isinstance(instance, Course):
        instance.code = validated_data.get("code", instance.code)

        WorkflowUpsertSerializer._set_ponderation_fields(instance, ponderation_data)

        instance.save()
        return instance

    @staticmethod
    def _set_ponderation_fields(instance, ponderation_data):
        instance.ponderation_theory = ponderation_data.get("theory", instance.ponderation_theory)
        instance.ponderation_practical = ponderation_data.get(
            "practice", instance.ponderation_practical
        )
        instance.ponderation_individual = ponderation_data.get(
            "individual", instance.ponderation_individual
        )
        instance.ponderation_general_edu = ponderation_data.get(
            "general_edu", instance.ponderation_general_edu
        )
        instance.ponderation_specific_edu = ponderation_data.get(
            "specific_edu", instance.ponderation_specific_edu
        )
