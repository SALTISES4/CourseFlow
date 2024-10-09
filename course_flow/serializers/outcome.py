from django.db.models import Q
from rest_framework import serializers

from course_flow.models import (
    Outcome,
    OutcomeHorizontalLink,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
)
from course_flow.serializers.mixin import (
    DescriptionSerializerMixin,
    TitleSerializerMixin,
)
from course_flow.services import DAO, Utility


class RefreshSerializerOutcome(serializers.ModelSerializer):
    class Meta:
        model = Outcome
        fields = [
            "id",
            "outcome_horizontal_links",
            "outcome_horizontal_links_unique",
        ]

    outcome_horizontal_links = serializers.SerializerMethodField()
    outcome_horizontal_links_unique = serializers.SerializerMethodField()

    @staticmethod
    def get_outcome_horizontal_links(instance):
        if len(instance.outcome_horizontal_links.all()) == 0:
            return []
        return list(
            map(
                Utility.linkIDMap,
                instance.outcome_horizontal_links.exclude(
                    Q(parent_outcome__deleted=True)
                    | Q(parent_outcome__parent_outcomes__deleted=True)
                    | Q(
                        parent_outcome__parent_outcomes__parent_outcomes__deleted=True
                    )
                ),
            )
        )

    @staticmethod
    def get_outcome_horizontal_links_unique(instance):
        if len(instance.outcome_horizontal_links.all()) == 0:
            return []
        return list(
            map(
                Utility.linkIDMap,
                DAO.get_unique_outcomehorizontallinks(instance),
            )
        )


class OutcomeSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
    DescriptionSerializerMixin,
):
    class Meta:
        model = Outcome
        fields = [
            "deleted",
            "deleted_on",
            "id",
            "title",
            "code",
            "description",
            "child_outcome_links",
            "outcome_horizontal_links",
            "outcome_horizontal_links_unique",
            # "is_dropped",
            "depth",
            "type",
            "comments",
            "sets",
        ]

    child_outcome_links = serializers.SerializerMethodField()
    outcome_horizontal_links = serializers.SerializerMethodField()
    outcome_horizontal_links_unique = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    deleted_on = serializers.DateTimeField(format=Utility.dateTimeFormat())

    def get_type(self, instance):
        my_type = self.context.get("type", None)
        if my_type is None:
            my_type = instance.get_workflow().type + " outcome"
        return my_type

    @staticmethod
    def get_outcome_horizontal_links(instance):
        if len(instance.outcome_horizontal_links.all()) == 0:
            return []
        return list(
            map(
                Utility.linkIDMap,
                instance.outcome_horizontal_links.exclude(
                    Q(parent_outcome__deleted=True)
                    | Q(parent_outcome__parent_outcomes__deleted=True)
                    | Q(
                        parent_outcome__parent_outcomes__parent_outcomes__deleted=True
                    )
                ),
            )
        )

    @staticmethod
    def get_outcome_horizontal_links_unique(instance):
        if len(instance.outcome_horizontal_links.all()) == 0:
            return []
        return list(
            map(
                Utility.linkIDMap,
                DAO.get_unique_outcomehorizontallinks(instance),
            )
        )

    @staticmethod
    def get_child_outcome_links(instance):
        links = instance.child_outcome_links.filter(child__deleted=False)
        if len(links) == 0:
            return []
        links = links.order_by("rank")
        return list(map(Utility.linkIDMap, links))

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.code = validated_data.get("code", instance.code)
        instance.description = validated_data.get(
            "description", instance.description
        )
        # instance.is_dropped = validated_data.get(
        #     "is_dropped", instance.is_dropped
        # )
        instance.save()
        return instance


class OutcomeOutcomeSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = OutcomeOutcome
        fields = ["parent", "child", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class OutcomeNodeSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = OutcomeNode
        fields = ["node", "outcome", "rank", "id", "degree"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class OutcomeHorizontalLinkSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = OutcomeHorizontalLink
        fields = ["outcome", "parent_outcome", "rank", "degree", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance


class OutcomeWorkflowSerializerShallow(serializers.ModelSerializer):
    class Meta:
        model = OutcomeWorkflow
        fields = ["workflow", "outcome", "rank", "id"]

    def update(self, instance, validated_data):
        instance.rank = validated_data.get("rank", instance.rank)
        instance.save()
        return instance
