from rest_framework import serializers

from course_flow.models import User
from course_flow.models.user import CourseFlowUser
from course_flow.serializers.mixin import bleach_sanitizer


class UserSerializer(serializers.ModelSerializer):
    """
    used prepare users as JSON payload responses
    @todo really need to understand why there is an entire other user table with redundant fields....
    """

    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "name"]

    @staticmethod
    def get_name(instance):
        return instance.first_name + " " + instance.last_name

    #########################################################
    # VALIDATORS
    #########################################################
    @staticmethod
    def validate_first_name(value):
        if value is None:
            return None
        return bleach_sanitizer(
            value,
            tags=[],
            attributes=[],
        )

    @staticmethod
    def validate_last_name(value):
        if value is None:
            return None
        return bleach_sanitizer(
            value,
            tags=[],
            attributes=[],
        )


class UserWithPermissionsSerializer(UserSerializer):
    group = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["group"]

    def get_group(self, obj):
        return self.context.get("permission_type")


#########################################################
# USER PROFILE AND SETTINGS
#########################################################
class NotificationsSettingsSerializer(serializers.ModelSerializer):
    """
    used to validate incoming changes to the notification settings
    """

    class Meta:
        model = CourseFlowUser
        fields = ("notifications",)


class ProfileSettingsSerializer(serializers.ModelSerializer):
    """
    used to validate incoming changes to the profile settings
    """

    first_name = serializers.CharField(max_length=300, required=True)
    last_name = serializers.CharField(max_length=300, required=True)

    class Meta:
        model = CourseFlowUser
        fields = ("first_name", "last_name", "language")
        extra_kwargs = {
            # If language should be write-only or has other specific serializer settings
            "language": {"write_only": True}
        }

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.language = validated_data.get("language", instance.language)
        instance.save()
        return instance
