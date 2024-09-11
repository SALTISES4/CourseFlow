from rest_framework import serializers

from course_flow.models import User
from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.serializers.mixin import bleach_sanitizer


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
