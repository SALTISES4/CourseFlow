from django.utils.translation import gettext as _
from rest_framework import serializers

from course_flow.models.comment import Comment
from course_flow.models.discipline import Discipline
from course_flow.models.relations.columnWorkflow import ColumnWorkflow
from course_flow.models.relations.weekWorkflow import WeekWorkflow
from course_flow.models.workflow import Workflow
from course_flow.serializers.mixin import TitleSerializerMixin
from course_flow.serializers.user import UserSerializer
from course_flow.utils import (
    dateTimeFormat,
    user_project_url,
    user_workflow_url,
)


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ["id", "title"]


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


class WorkflowSerializerFinder(serializers.ModelSerializer):
    class Meta:
        model = Workflow
        fields = ["id", "type"]

    def update(self, instance, validated_data):
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


class FavouriteSerializer(
    serializers.Serializer,
    TitleSerializerMixin,
):
    title = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()

    def get_url(self, instance):
        user = self.context.get("user", None)
        if instance.type == "project":
            return user_project_url(instance, user)
        return user_workflow_url(instance, user)

    def get_title(self, instance):
        title = super().get_title(instance)
        if title is None or title == "":
            return _("Untitled ") + instance._meta.verbose_name
        return title
