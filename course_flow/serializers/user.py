from rest_framework import serializers

from course_flow.models import User
from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.serializers.mixin import bleach_sanitizer


class UserSerializer(serializers.ModelSerializer):
    """
    used prepare users as JSON payload responses
    """

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

    #########################################################
    # GETTERS
    #########################################################
    @staticmethod
    def get_first_name(instance):
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

    @staticmethod
    def get_last_name(instance):
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
        instance.first_name = validated_data.get(
            "first_name", instance.first_name
        )
        instance.last_name = validated_data.get(
            "last_name", instance.last_name
        )
        instance.language = validated_data.get("language", instance.language)
        instance.save()
        return instance
