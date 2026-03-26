from django.contrib.auth import get_user_model
from rest_framework import serializers

from course_flow_legacy.models.relations.nodeWeek import NodeWeek
from course_flow_legacy.models.workflow_objects.column import Column
from course_flow_legacy.models.workflow_objects.week import Week
from course_flow_legacy.models.workspace.workflow import Workflow
from course_flow_legacy.serializers.mixin import (
    DescriptionSerializerMixin,
    TitleSerializerMixin,
)
from course_flow_legacy.services import DAO, Utility

User = get_user_model()


class LinkedWorkflowSerializerShallow(serializers.ModelSerializer):
    deleted_on = serializers.DateTimeField(format=Utility.dateTimeFormat())
    url = serializers.SerializerMethodField()

    class Meta:
        model = Workflow
        fields = [
            "id",
            "deleted",
            "deleted_on",
            "title",
            "description",
            "code",
            "time_required",
            "time_units",
            "ponderation_theory",
            "ponderation_practical",
            "ponderation_individual",
            "time_general_hours",
            "time_specific_hours",
            "type",
            "created_on",
            "url",
        ]

    def get_url(self, instance):
        user = self.context.get("user", None)
        return DAO.user_workflow_url(instance, user)


class NodeWeekSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = NodeWeek
        fields = ["week", "node", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class ColumnSerializerShallow(serializers.ModelSerializer, TitleSerializerMixin):
    column_type_display = serializers.CharField(source="get_column_type_display")
    deleted_on = serializers.DateTimeField(format=Utility.dateTimeFormat())

    class Meta:
        model = Column
        fields = [
            "deleted",
            "deleted_on",
            "id",
            "title",
            "icon",
            "column_type",
            "column_type_display",
            "colour",
            "visible",
            "comments",
        ]

    def create(self, validated_data):
        return Column.objects.create(
            author=User.objects.get(username=self.initial_data["author"]), **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.colour = validated_data.get("colour", instance.colour)
        instance.icon = validated_data.get("icon", instance.icon)
        instance.save()
        return instance


class WeekSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):
    nodes = serializers.SerializerMethodField()
    week_type_display = serializers.CharField(source="get_week_type_display")
    deleted_on = serializers.DateTimeField(format=Utility.dateTimeFormat())
    order = serializers.SerializerMethodField()

    class Meta:
        model = Week
        fields = [
            "deleted",
            "deleted_on",
            "id",
            "title",
            "description",
            "default",
            "nodes",
            "week_type",
            "week_type_display",
            "is_strategy",
            "strategy_classification",
            "comments",
            "order",
            "is_dropped",
        ]

    # @todo 11/24
    # this is temporary until we fix the model (convert the n2M relationships)
    def get_order(self, obj):
        if obj.weekworkflow_set.exists():
            # this is the 'workaround' treating the first returned item as the only one
            weekworkflow = obj.weekworkflow_set.first()
            return weekworkflow.rank
        return None

    # @todo find out what this is for...
    @staticmethod
    def get_nodes(instance):
        nodeweeks = instance.nodeweek_set.filter(node__deleted=False).order_by("rank")
        return list(map(lambda item: item.node_id, nodeweeks))

    def create(self, validated_data):
        return Week.objects.create(
            author=User.objects.get(username=self.initial_data["author"]), **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.strategy_classification = validated_data.get(
            "strategy_classification", instance.strategy_classification
        )
        # instance.is_dropped = validated_data.get(
        #     "is_dropped", instance.is_dropped
        # )
        instance.save()
        return instance
