from rest_framework import serializers

from course_flow.models.comment import Comment
from course_flow.models.discipline import Discipline
from course_flow.models.relations.columnWorkflow import ColumnWorkflow
from course_flow.models.relations.weekWorkflow import WeekWorkflow
from course_flow.models.workspace.workflow import Workflow
from course_flow.serializers.mixin import TitleSerializerMixin
from course_flow.serializers.user import UserSerializer
from course_flow.services import Utility


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ["id", "title"]


class WeekWorkflowSerializerShallow(serializers.ModelSerializer):
    week_type = serializers.SerializerMethodField()

    class Meta:
        model = WeekWorkflow
        fields = ["workflow", "week", "rank", "id", "week_type"]

    #########################################################
    # GETTERS
    #########################################################
    @staticmethod
    def get_week_type(instance):
        return instance.week.week_type

    #########################################################
    # ACTIONS
    #########################################################
    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class ColumnWorkflowSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = ColumnWorkflow
        fields = ["workflow", "column", "rank", "id"]

    #########################################################
    # ACTIONS
    #########################################################
    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class WorkflowSerializerFinder(serializers.ModelSerializer):
    class Meta:
        model = Workflow
        fields = ["id", "type"]

    #########################################################
    # ACTIONS
    #########################################################
    def update(self, instance, validated_data):
        return instance


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["id", "user", "created_on", "text"]

    user = serializers.SerializerMethodField()
    created_on = serializers.DateTimeField(format=Utility.dateTimeFormat())

    #########################################################
    # GETTERS
    #########################################################
    @staticmethod
    def get_user(instance):
        return UserSerializer(instance.user).data

    #########################################################
    # ACTIONS
    #########################################################
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
