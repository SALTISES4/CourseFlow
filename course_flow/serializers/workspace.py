from pprint import pprint

from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext as _
from rest_framework import serializers

from course_flow.models import Favourite, Node
from course_flow.models.objectPermission import ObjectPermission, Permission
from course_flow.models.objectset import ObjectSet
from course_flow.serializers.mixin import (
    DescriptionSerializerMixin,
    TitleSerializerMixin,
)
from course_flow.serializers.user import UserSerializer
from course_flow.services import DAO, Utility


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
        if instance.type == "project":
            return DAO.user_project_url(instance, user)
        return DAO.user_workflow_url(instance, user)

    def get_title(self, instance):
        title = super().get_title(instance)
        if title is None or title == "":
            return _("Untitled ") + instance._meta.verbose_name
        return title


class LibraryObjectSerializer(
    serializers.Serializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):
    """
    Library: a mix of workflow and project objects with shared field properties
    see: class AbstractWorkspaceModel
    uncommon fields will need further review...
    """

    id = serializers.ReadOnlyField()
    deleted = serializers.ReadOnlyField()
    created_on = serializers.DateTimeField(format=Utility.dateTimeFormat())
    last_modified = serializers.DateTimeField(format=Utility.dateTimeFormat())
    published = serializers.ReadOnlyField()
    type = serializers.ReadOnlyField()
    is_strategy = serializers.ReadOnlyField()
    is_template = serializers.ReadOnlyField()
    title = serializers.SerializerMethodField()
    favourite = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    author = UserSerializer(read_only=True)
    is_owned = serializers.SerializerMethodField()
    project_title = serializers.SerializerMethodField()
    object_permission = serializers.SerializerMethodField()
    workflow_count = serializers.SerializerMethodField()
    is_linked = serializers.SerializerMethodField()

    @staticmethod
    def get_workflow_count(instance):
        if instance.type == "project":
            return instance.workflows.all().count()
        return None

    def get_url(self, instance):
        if instance.type == "project":
            return None
        user = self.context.get("user", None)
        if user is None:
            # Handle the scenario where user is not available
            return None  # Or raise an exception, based on your application's needs

        return DAO.user_workflow_url(instance, user)

    @staticmethod
    def get_project_title(instance):
        if instance.type == "project":
            return None
        if instance.get_project() is None:
            return None
        return instance.get_project().title

    def get_is_owned(self, instance):
        # Utility.print_model_instance(instance.author)
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
            content_type=ContentType.objects.get_for_model(instance.get_permission_objects()[0]),
            object_id=instance.id,
        ):
            return True

        return False

    def get_object_permission(self, instance):
        user = self.context.get("user")
        if user is None or not user.is_authenticated:
            return 0
        object_permission = ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(instance.get_permission_objects()[0]),
            object_id=instance.id,
        ).first()
        if object_permission is None:
            return {
                "permission_type": Permission.PERMISSION_VIEW.value,
                "last_viewed": None,
            }
        return {
            "permission_type": object_permission.permission_type,
            "last_viewed": object_permission.last_viewed,
        }

    @staticmethod
    def get_is_linked(instance):
        if instance.type != "project":
            return len(Node.objects.filter(linked_workflow=instance)) > 0
        return False
