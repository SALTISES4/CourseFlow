from django.db.models import Q
from rest_framework import serializers

from course_flow.models import User
from course_flow.models.node import Node
from course_flow.models.relations.columnWorkflow import ColumnWorkflow
from course_flow.models.relations.nodeLink import NodeLink
from course_flow.serializers.container import LinkedWorkflowSerializerShallow
from course_flow.serializers.mixin import (
    DescriptionSerializerMixin,
    TimeRequiredSerializerMixin,
    TitleSerializerMixin,
)
from course_flow.services import DAO, Utility


class RefreshSerializerNode(serializers.ModelSerializer):
    outcomenode_set = serializers.SerializerMethodField()
    outcomenode_unique_set = serializers.SerializerMethodField()

    class Meta:
        model = Node
        fields = [
            "id",
            "outcomenode_set",
            "outcomenode_unique_set",
        ]

    def get_outcomenode_set(self, instance):
        links = instance.outcomenode_set.exclude(
            Q(outcome__deleted=True)
            | Q(outcome__parent_outcomes__deleted=True)
            | Q(outcome__parent_outcomes__parent_outcomes__deleted=True)
        )
        return list(map(Utility.linkIDMap, links))

    @staticmethod
    def get_outcomenode_unique_set(instance):
        return list(
            map(Utility.linkIDMap, DAO.get_unique_outcomenodes(instance))
        )


class NodeLinkSerializerShallow(
    serializers.ModelSerializer, TitleSerializerMixin
):
    class Meta:
        model = NodeLink
        fields = [
            "deleted",
            "deleted_on",
            "id",
            "title",
            "source_node",
            "target_node",
            "source_port",
            "target_port",
            "dashed",
            "text_position",
        ]

    deleted_on = serializers.DateTimeField(format=Utility.dateTimeFormat())

    def create(self, validated_data):
        return Node.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.dashed = validated_data.get("dashed", instance.dashed)
        instance.text_position = validated_data.get(
            "text_position", instance.text_position
        )
        instance.save()
        return instance


class NodeSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
    TimeRequiredSerializerMixin,
):
    outgoing_links = serializers.SerializerMethodField()
    outcomenode_set = serializers.SerializerMethodField()
    outcomenode_unique_set = serializers.SerializerMethodField()
    columnworkflow = serializers.SerializerMethodField()
    column = serializers.SerializerMethodField()
    linked_workflow_data = serializers.SerializerMethodField()

    node_type_display = serializers.CharField(source="get_node_type_display")

    class Meta:
        model = Node
        fields = [
            "deleted",
            "deleted_on",
            "id",
            "title",
            "description",
            "column",
            "columnworkflow",
            "context_classification",
            "task_classification",
            "outcomenode_set",
            "outcomenode_unique_set",
            "outgoing_links",
            "node_type",
            "node_type_display",
            "has_autolink",
            "time_units",
            "time_required",
            "ponderation_theory",
            "ponderation_practical",
            "ponderation_individual",
            "time_general_hours",
            "time_specific_hours",
            "represents_workflow",
            "linked_workflow",
            "linked_workflow_data",
            # "is_dropped",
            "comments",
            "sets",
        ]

    deleted_on = serializers.DateTimeField(format=Utility.dateTimeFormat())

    def get_columnworkflow(self, instance):
        if instance.column is None:
            instance.column = (
                instance.get_workflow()
                .columns.filter(deleted=False)
                .order_by("columnworkflow__rank")
                .first()
            )
            instance.save()
        if instance.column.deleted:
            workflow = instance.get_workflow()
            return (
                ColumnWorkflow.objects.filter(
                    workflow=workflow, column__deleted=False
                )
                .order_by("rank")
                .first()
                .id
            )
        else:
            return instance.column.columnworkflow_set.get(
                column=instance.column
            ).id

    def get_column(self, instance):
        if instance.column is None:
            instance.column = (
                instance.get_workflow()
                .columns.filter(deleted=False)
                .order_by("columnworkflow__rank")
                .first()
            )
            instance.save()
        if instance.column.deleted:
            workflow = instance.get_workflow()
            return (
                ColumnWorkflow.objects.filter(
                    workflow=workflow, column__deleted=False
                )
                .order_by("rank")
                .first()
                .column.id
            )
        else:
            return instance.column.id

    def get_outcomenode_set(self, instance):
        links = instance.outcomenode_set.exclude(
            Q(outcome__deleted=True)
            | Q(outcome__parent_outcomes__deleted=True)
            | Q(outcome__parent_outcomes__parent_outcomes__deleted=True)
        )
        return list(map(Utility.linkIDMap, links))

    def get_outgoing_links(self, instance):
        links = instance.outgoing_links.exclude(
            Q(deleted=True)
            | Q(target_node__deleted=True)
            | Q(target_node__week__deleted=True)
        )
        return list(map(Utility.linkIDMap, links))

    @staticmethod
    def get_outcomenode_unique_set(instance):
        return list(
            map(Utility.linkIDMap, DAO.get_unique_outcomenodes(instance))
        )

    def get_linked_workflow_data(self, instance):
        linked_workflow = instance.linked_workflow
        if linked_workflow is not None:
            return LinkedWorkflowSerializerShallow(
                linked_workflow,
                context={"user": self.context.get("user", None)},
            ).data

    def create(self, validated_data):
        return Node.objects.create(
            author=User.objects.get(username=self.initial_data["author"]),
            **validated_data
        )

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description
        )
        instance.task_classification = validated_data.get(
            "task_classification", instance.task_classification
        )
        instance.context_classification = validated_data.get(
            "context_classification", instance.context_classification
        )
        instance.represents_workflow = validated_data.get(
            "represents_workflow", instance.represents_workflow
        )
        instance.has_autolink = validated_data.get(
            "has_autolink", instance.has_autolink
        )
        instance.time_required = validated_data.get(
            "time_required", instance.time_required
        )
        instance.time_units = validated_data.get(
            "time_units", instance.time_units
        )
        instance.ponderation_theory = validated_data.get(
            "ponderation_theory", instance.ponderation_theory
        )
        instance.ponderation_practical = validated_data.get(
            "ponderation_practical", instance.ponderation_practical
        )
        instance.ponderation_individual = validated_data.get(
            "ponderation_individual", instance.ponderation_individual
        )
        instance.time_general_hours = validated_data.get(
            "time_general_hours", instance.time_general_hours
        )
        instance.time_specific_hours = validated_data.get(
            "time_specific_hours", instance.time_specific_hours
        )
        # instance.is_dropped = validated_data.get(
        #     "is_dropped", instance.is_dropped
        # )
        instance.save()
        return instance
