from rest_framework import serializers

from course_flow.models.column import Column
from course_flow.models.relations.nodeWeek import NodeWeek
from course_flow.models.week import Week
from course_flow.models.workflow import Workflow
from course_flow.serializers.mixin import (
    DescriptionSerializerMixin,
    TitleSerializerMixin,
)
from course_flow.utils import dateTimeFormat, linkIDMap, user_workflow_url


class LinkedWorkflowSerializerShallow(serializers.ModelSerializer):
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

    deleted_on = serializers.DateTimeField(format=dateTimeFormat())
    url = serializers.SerializerMethodField()

    def get_url(self, instance):
        user = self.context.get("user", None)
        return user_workflow_url(instance, user)


class NodeWeekSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = NodeWeek
        fields = ["week", "node", "added_on", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class ColumnSerializerShallow(
    serializers.ModelSerializer, TitleSerializerMixin
):
    column_type_display = serializers.CharField(
        source="get_column_type_display"
    )

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

    deleted_on = serializers.DateTimeField(format=dateTimeFormat())

    def create(self, validated_data):
        return Column.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
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
    nodeweek_set = serializers.SerializerMethodField()

    week_type_display = serializers.CharField(source="get_week_type_display")

    class Meta:
        model = Week
        fields = [
            "deleted",
            "deleted_on",
            "id",
            "title",
            "description",
            "default",
            "nodeweek_set",
            "week_type",
            "week_type_display",
            "is_strategy",
            "strategy_classification",
            "comments",
            # "is_dropped",
        ]

    deleted_on = serializers.DateTimeField(format=dateTimeFormat())

    def get_nodeweek_set(self, instance):
        links = instance.nodeweek_set.filter(node__deleted=False).order_by(
            "rank"
        )
        return list(map(linkIDMap, links))

    def create(self, validated_data):
        return Week.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.strategy_classification = validated_data.get(
            "strategy_classification", instance.strategy_classification
        )
        # instance.is_dropped = validated_data.get(
        #     "is_dropped", instance.is_dropped
        # )
        instance.save()
        return instance
