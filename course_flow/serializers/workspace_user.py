from pprint import pprint

from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext as _
from rest_framework import serializers

from course_flow import settings
from course_flow.apps import logger
from course_flow.models import User
from course_flow.models.objectPermission import ObjectPermission, Permission
from course_flow.services import DAO


class ObjectPermissionDeleteSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    type = serializers.CharField(max_length=255)

    def validate(self, data):
        """
        Custom validation to ensure that the user and object exist and
        the permission entry is found before attempting deletion.
        """
        user_id = data.get("user_id")
        object_type = data.get("type")

        # Ensure object type matches expected values
        if object_type in ["activity", "course", "program", "workflow"]:
            object_type = "workflow"

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user_id": _("User not found.")})

        # Retrieve the object using pk from the context
        try:
            object_model = DAO.get_model_from_str(object_type)
            obj = object_model.objects.get(id=self.context["pk"])
        except object_model.DoesNotExist:
            raise serializers.ValidationError({"object_id": _("Object not found.")})

        # Check if the permission exists for this user and object
        try:
            object_permission = ObjectPermission.objects.get(
                user=user,
                content_type=ContentType.objects.get_for_model(obj),
                object_id=obj.id,
            )
        except ObjectPermission.DoesNotExist:
            raise serializers.ValidationError({"permission": _("Permission not found.")})

        # Add the permission instance to context for deletion
        self.context["object_permission"] = object_permission
        return data

    def delete(self):
        """
        Deletes the ObjectPermission instance found during validation.
        """
        object_permission = self.context["object_permission"]
        object_permission.delete()


class ObjectPermissionCreateSerializer(serializers.Serializer):
    type = serializers.CharField(max_length=255)
    user_id = serializers.IntegerField()
    role = serializers.CharField(max_length=255)

    def validate(self, data):
        object_type = data.get("type")
        permission_user_id = data.get("user_id")
        permission_type = data.get("role")
        object_id = self.context["pk"]

        # Check if object_type needs to be mapped to workflow
        if object_type in ["activity", "course", "program"]:
            object_type = "workflow"

        pprint("asdf")

        # Retrieve user and check if user exists
        try:
            user = User.objects.get(id=permission_user_id)
        except User.DoesNotExist:
            logger.exception("errors")
            raise serializers.ValidationError({"permission_user": _("User not found.")})

        # Check if user is in the teacher group for specific permission types
        if permission_type in [
            Permission.PERMISSION_EDIT.value,
            Permission.PERMISSION_VIEW.value,
            Permission.PERMISSION_COMMENT.value,
        ]:
            if Group.objects.get(name=settings.TEACHER_GROUP) not in user.groups.all():
                raise serializers.ValidationError({"permission_user": _("User is not a teacher.")})

        # Retrieve the object
        try:
            object_model = DAO.get_model_from_str(object_type)
            item = object_model.objects.get(id=object_id)
        except object_model.DoesNotExist:
            logger.exception("errors")
            raise serializers.ValidationError({"object_id": _("Object not found.")})

        # Check if user is the author of the object or the project
        project = item.get_project()
        if permission_type != Permission.PERMISSION_EDIT.value:
            if item.author == user or (project and project.author == user):
                raise serializers.ValidationError(
                    {"permission_user": _("This user's role cannot be changed.")}
                )

        # Save the item and user for use in the create method
        self.context["user"] = user
        self.context["item"] = item

        return data

    def create(self, validated_data):
        user = self.context["user"]
        item = self.context["item"]
        permission_type = validated_data.get("permission_type")

        pprint("validated_data")
        pprint(validated_data)

        # Check if the permission already exists
        permission_exists = ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(item),
            object_id=item.id,
        ).exists()

        # If permission doesn't exist, create a new one
        if not permission_exists and permission_type != Permission.PERMISSION_NONE.value:
            return ObjectPermission.objects.create(
                user=user,
                content_object=item,
                permission_type=2,
            )

        elif permission_exists:
            raise serializers.ValidationError(
                {"permission": _("This user already has a permission for this object.")}
            )

        # Return None if the permission_type is PERMISSION_NONE or no action is needed
        return None


class ObjectPermissionUpdateSerializer(serializers.Serializer):
    object_id = serializers.IntegerField()
    object_type = serializers.CharField(max_length=255)
    permission_user = serializers.IntegerField()
    permission_type = serializers.IntegerField()

    def validate(self, data):
        object_id = data.get("object_id")
        object_type = data.get("object_type")
        user_id = data.get("permission_user")
        permission_type = data.get("permission_type")

        # Check if object_type needs to be mapped to workflow
        if object_type in ["activity", "course", "program"]:
            object_type = "workflow"

        # Retrieve user and check if user exists
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"permission_user": _("User not found.")})

        # Retrieve the object
        try:
            object_model = DAO.get_model_from_str(object_type)
            item = object_model.objects.get(id=object_id)
        except object_model.DoesNotExist:
            raise serializers.ValidationError({"object_id": _("Object not found.")})

        # Check if the ObjectPermission already exists
        try:
            object_permission = ObjectPermission.objects.get(
                user=user,
                content_type=ContentType.objects.get_for_model(item),
                object_id=object_id,
            )
        except ObjectPermission.DoesNotExist:
            raise serializers.ValidationError(
                {"permission": _("Permission not found for the user and object.")}
            )

        # Save the user, item, and object_permission in context for the update method
        self.context["user"] = user
        self.context["item"] = item
        self.context["object_permission"] = object_permission

        return data

    def update(self, instance, validated_data):
        permission_type = validated_data.get("permission_type")

        # Update the existing permission with the new permission_type
        instance.permission_type = permission_type
        instance.save()

        return instance
