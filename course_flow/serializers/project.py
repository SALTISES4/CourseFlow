from pprint import pprint

from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from rest_framework import serializers

from course_flow.models import Discipline, Favourite, ObjectSet, Project
from course_flow.serializers.mixin import (
    DescriptionSerializerMixin,
    TitleSerializerMixin,
)
from course_flow.serializers.user import UserSerializer
from course_flow.services import DAO, Utility


#########################################################
# RELATION SERIALIZERS
#########################################################
class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = "id"


class ObjectSetSerializer(serializers.ModelSerializer):
    # Explicitly ensure 'id' is not read-only, is this the best way to handle relation updates in django?
    id = serializers.IntegerField(read_only=False, required=False)

    class Meta:
        model = ObjectSet
        fields = ("term", "title", "id")


#########################################################
# PROJECT UPSERT
#########################################################
class ProjectUpsertSerializer(serializers.ModelSerializer):
    object_sets = ObjectSetSerializer(many=True, required=False)
    disciplines = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Discipline.objects.all(), required=False
    )

    class Meta:
        model = Project
        fields = ("id", "title", "description", "disciplines", "object_sets")
        extra_kwargs = {
            "title": {"required": True},
            "description": {"required": True},
        }

    def create(self, validated_data):
        with transaction.atomic():
            disciplines_data = validated_data.pop("disciplines", [])
            object_sets_data = validated_data.pop("object_sets", [])

            project = Project.objects.create(**validated_data)
            project.disciplines.set(disciplines_data)

            for os_data in object_sets_data:
                project.object_sets.create(**os_data)

            return project

    def update(self, instance, validated_data):
        with transaction.atomic():
            disciplines_data = validated_data.pop("disciplines", None)
            if disciplines_data is not None:
                instance.disciplines.set(disciplines_data)

            object_sets_data = validated_data.pop("object_sets", [])
            existing_ids = set(instance.object_sets.values_list("id", flat=True))
            incoming_ids = set()

            for os_data in object_sets_data:
                object_set_id = os_data.get("id", None)
                if object_set_id and object_set_id in existing_ids:
                    obj_set = instance.object_sets.get(id=object_set_id)
                    for key, value in os_data.items():
                        setattr(obj_set, key, value)
                    obj_set.save()
                else:
                    new_obj_set = instance.object_sets.create(**os_data)
                    incoming_ids.add(new_obj_set.id)

            # Delete old object sets
            object_sets_to_delete = existing_ids - incoming_ids
            instance.object_sets.filter(id__in=object_sets_to_delete).delete()

            # Update the simple fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            return instance


# class CreateProjectSerializer(serializers.ModelSerializer):
#     object_sets = ObjectSetSerializer(many=True, required=False)
#     disciplines = serializers.PrimaryKeyRelatedField(
#         many=True, queryset=Discipline.objects.all(), required=False
#     )
#
#     class Meta:
#         model = Project
#         fields = ("id", "title", "description", "disciplines", "object_sets")
#
#     def create(self, validated_data):
#         with transaction.atomic():
#             disciplines_data = validated_data.pop("disciplines", [])
#             object_sets_data = validated_data.pop("object_sets", [])
#
#             project = Project.objects.create(**validated_data)
#
#             # Set disciplines
#             project.disciplines.set(disciplines_data)
#
#             # Create and associate object sets
#             for os_data in object_sets_data:
#                 project.object_sets.create(**os_data)
#
#         return project
#
#
# class UpdateProjectSerializer(serializers.ModelSerializer):
#     object_sets = ObjectSetSerializer(many=True, required=False)
#     disciplines = serializers.PrimaryKeyRelatedField(
#         many=True, queryset=Discipline.objects.all(), required=False
#     )
#
#     class Meta:
#         model = Project
#         fields = ("id", "title", "description", "disciplines", "object_sets")
#         extra_kwargs = {
#             "title": {"required": True},
#             "description": {"required": True},
#         }
#
#     def update(self, instance, validated_data):
#         with transaction.atomic():
#             # Retrieve and optionally update disciplines data
#             disciplines_data = validated_data.pop("disciplines", None)
#             if disciplines_data is not None:
#                 instance.disciplines.set(disciplines_data)
#
#             # Prepare to handle object sets
#             object_sets_data = validated_data.pop("object_sets", [])
#             existing_ids = set(
#                 instance.object_sets.values_list("id", flat=True)
#             )
#             incoming_ids = set(
#                 os_data.get("id")
#                 for os_data in object_sets_data
#                 if os_data.get("id")
#             )
#
#             # Update or create new object sets
#             for os_data in object_sets_data:
#                 object_set_id = os_data.get("id", None)
#                 if object_set_id:
#                     obj_set = instance.object_sets.get(id=object_set_id)
#                     for key, value in os_data.items():
#                         setattr(obj_set, key, value)
#                     obj_set.save()
#                 else:
#                     new_obj_set = instance.object_sets.create(**os_data)
#                     incoming_ids.add(
#                         new_obj_set.id
#                     )  # Add new object set id to incoming ids
#
#             # Delete object sets that were not included in the incoming data
#             object_sets_to_delete = existing_ids - incoming_ids
#             instance.object_sets.filter(id__in=object_sets_to_delete).delete()
#
#             # Update the simple fields
#             for attr, value in validated_data.items():
#                 setattr(instance, attr, value)
#             instance.save()
#
#         return instance


#########################################################
# PROJECT GET
#########################################################
class ProjectSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
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
            "workflowproject_set",  # @todo define this
            "disciplines",  # @todo define this
            "type",  # @todo define this
            "object_sets",  # @todo define this
            "favourite",
            # "object_permission",  # @todo  define this
            "user_permissions",  # @todo  define this
        ]

    created_on = serializers.DateTimeField(format=Utility.dateTimeFormat())
    last_modified = serializers.DateTimeField(format=Utility.dateTimeFormat())
    workflowproject_set = serializers.SerializerMethodField()
    object_sets = serializers.SerializerMethodField()
    favourite = serializers.SerializerMethodField()
    deleted_on = serializers.DateTimeField(format=Utility.dateTimeFormat())
    #  object_permission = serializers.SerializerMethodField()
    user_permissions = serializers.SerializerMethodField()

    author = UserSerializer(read_only=True)

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
        links = instance.workflowproject_set.filter(workflow__deleted=False).order_by("rank")
        return list(map(Utility.linkIDMap, links))

    # def get_object_permission(self, instance):
    #     """
    #     wtf
    #
    #
    #     :param instance:
    #     :return:
    #     """
    #     user = self.context.get("user")
    #     if user is None or not user.is_authenticated:
    #         return 0
    #     object_permission = ObjectPermission.objects.filter(
    #         user=user,
    #         content_type=ContentType.objects.get_for_model(instance),
    #         object_id=instance.id,
    #     ).first()
    #
    #     if object_permission is None:
    #         return None
    #     return {
    #         "permission_type": object_permission.permission_type,
    #         "last_viewed": object_permission.last_viewed,
    #     }

    def get_user_permissions(self, instance):
        """
        Standard sitewide permission 'group' strategy
        :param instance:
        :return:
        """
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

    # what does update do?
    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.published = validated_data.get("published", instance.published)
        instance.disciplines.set(validated_data.get("disciplines", instance.disciplines.all()))
        instance.is_template = validated_data.get("is_template", instance.is_template)
        instance.save()
        return instance
