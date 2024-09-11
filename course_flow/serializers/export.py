from rest_framework import serializers

from course_flow.models.node import Node
from course_flow.models.outcome import Outcome
from course_flow.models.relations.columnWorkflow import ColumnWorkflow
from course_flow.models.relations.outcomeOutcome import OutcomeOutcome
from course_flow.models.relations.outcomeWorkflow import OutcomeWorkflow
from course_flow.models.week import Week
from course_flow.models.workflow import Workflow
from course_flow.serializers.mixin import (
    DescriptionSerializerTextMixin,
    TitleSerializerTextMixin,
)


class OutcomeExportSerializer(
    serializers.ModelSerializer,
    TitleSerializerTextMixin,
    DescriptionSerializerTextMixin,
):
    class Meta:
        model = Outcome
        fields = [
            "id",
            "title",
            "code",
            "description",
            "depth",
        ]

    code = serializers.SerializerMethodField()

    def get_code(self, instance):
        if instance.depth == 0:
            outcomeworkflow = OutcomeWorkflow.objects.filter(
                outcome=instance
            ).first()
            if instance.code is None or instance.code == "":
                return str(outcomeworkflow.get_display_rank() + 1)
            else:
                return instance.code
        else:
            outcomeoutcome = OutcomeOutcome.objects.filter(
                child=instance
            ).first()
            if instance.code is None or instance.code == "":
                return (
                    self.get_code(outcomeoutcome.parent)
                    + "."
                    + str(outcomeoutcome.get_display_rank() + 1)
                )
            else:
                return (
                    self.get_code(outcomeoutcome.parent) + "." + instance.code
                )

    def get_type(self, instance):
        return "outcome"


class WeekExportSerializer(
    serializers.ModelSerializer,
    TitleSerializerTextMixin,
    DescriptionSerializerTextMixin,
):
    class Meta:
        model = Week
        fields = [
            "id",
            "title",
            "description",
            "type",
        ]

    objectType = "week"

    type = serializers.SerializerMethodField()

    def get_type(self, instance):
        return "week"


class NodeExportSerializer(
    serializers.ModelSerializer,
    TitleSerializerTextMixin,
    DescriptionSerializerTextMixin,
):
    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "column_order",
            "type",
        ]

    column_order = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    def get_column_order(self, instance):
        return str(ColumnWorkflow.objects.get(column=instance.column).rank)

    def get_type(self, instance):
        return "node"


class NodeExportSerializerWithTime(NodeExportSerializer):
    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "column_order",
            "type",
            "code",
            "ponderation_theory",
            "ponderation_individual",
            "ponderation_practical",
            "time_required",
        ]

    code = serializers.SerializerMethodField()
    ponderation_theory = serializers.SerializerMethodField()
    ponderation_individual = serializers.SerializerMethodField()
    ponderation_practical = serializers.SerializerMethodField()
    time_required = serializers.SerializerMethodField()

    def get_code(self, instance):
        if (
            instance.represents_workflow
            and instance.linked_workflow is not None
        ):
            return instance.linked_workflow.code
        else:
            return None

    def get_ponderation_theory(self, instance):
        if (
            instance.represents_workflow
            and instance.linked_workflow is not None
        ):
            return instance.linked_workflow.ponderation_theory
        else:
            return instance.ponderation_theory

    def get_ponderation_individual(self, instance):
        if (
            instance.represents_workflow
            and instance.linked_workflow is not None
        ):
            return instance.linked_workflow.ponderation_individual
        else:
            return instance.ponderation_individual

    def get_ponderation_practical(self, instance):
        if (
            instance.represents_workflow
            and instance.linked_workflow is not None
        ):
            return instance.linked_workflow.ponderation_practical
        else:
            return instance.ponderation_practical

    def get_time_required(self, instance):
        if (
            instance.represents_workflow
            and instance.linked_workflow is not None
        ):
            return instance.linked_workflow.time_required
        else:
            return instance.time_required


class WorkflowExportSerializer(
    serializers.ModelSerializer,
    TitleSerializerTextMixin,
    DescriptionSerializerTextMixin,
):
    class Meta:
        model = Workflow
        fields = [
            "id",
            "title",
            "description",
            "type",
        ]

    type = serializers.SerializerMethodField()

    def get_type(self, instance):
        return "workflow"
