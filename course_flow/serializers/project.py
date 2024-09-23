from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from rest_framework import serializers

from course_flow.models import (
    Discipline,
    Favourite,
    ObjectPermission,
    ObjectSet,
    Project,
)
from course_flow.serializers.mixin import (
    AuthorSerializerMixin,
    DescriptionSerializerMixin,
    TitleSerializerMixin,
)
from course_flow.services import DAO, Utility


#########################################################
# PROJECT CREATE
#########################################################
class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = "id"  # Adjust fields based on what you want to expose


class ObjectSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObjectSet
        fields = ("term", "title")


class CreateProjectSerializer(serializers.ModelSerializer):
    objectSets = ObjectSetSerializer(many=True, required=False)
    disciplines = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Discipline.objects.all(), required=False
    )

    class Meta:
        model = Project
        fields = ("id", "title", "description", "disciplines", "objectSets")

    def create(self, validated_data):
        with transaction.atomic():
            disciplines_data = validated_data.pop("disciplines", [])
            object_sets_data = validated_data.pop("objectSets", [])
            project = Project.objects.create(**validated_data)

            # Set disciplines
            project.disciplines.set(disciplines_data)

            # Create and associate object sets
            for os_data in object_sets_data:
                project.object_sets.create(**os_data)

        return project


#########################################################
# PROJECT CREATE
#########################################################
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
            "is_template",
            "last_modified",
            "workflowproject_set",
            "disciplines",
            "type",
            "object_sets",
            "favourite",
            "object_permission",
        ]

    created_on = serializers.DateTimeField(format=Utility.dateTimeFormat())
    last_modified = serializers.DateTimeField(format=Utility.dateTimeFormat())
    workflowproject_set = serializers.SerializerMethodField()
    object_sets = serializers.SerializerMethodField()
    favourite = serializers.SerializerMethodField()
    deleted_on = serializers.DateTimeField(format=Utility.dateTimeFormat())
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
        return list(map(Utility.linkIDMap, links))

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

    def validate_is_template(self, value):
        user = self.context.get("user")
        try:
            if Group.objects.get(name="SALTISE_Staff") in user.groups.all():
                return value
            else:
                return False
        except ObjectDoesNotExist:
            return False

    # what does update do?
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
        instance.is_template = validated_data.get(
            "is_template", instance.is_template
        )
        instance.save()
        return instance
