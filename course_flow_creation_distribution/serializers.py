from rest_framework import serializers
from .models import (
    Course,
    Preparation,
    Activity,
    Assesment,
    Artifact,
    Strategy,
    Node,
    LeftNodeIcon,
    RightNodeIcon,
    NodeClassification,
    NodeStrategy,
    StrategyActivity,
    ComponentWeek,
    WeekCourse,
    Component,
    Week,
    Discipline,
    ThumbnailImage,
    Outcome,
    OutcomeNode,
    OutcomeStrategy,
    OutcomePreparation,
    OutcomeActivity,
    OutcomeAssesment,
    OutcomeArtifact,
    OutcomeWeek,
    OutcomeCourse,
)


class UserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=100)


class ThumbnailImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThumbnailImage
        fields = ["image"]


class LeftNodeIconSerializer(serializers.ModelSerializer):

    thumbnail_image = ThumbnailImageSerializer()

    class Meta:
        model = LeftNodeIcon
        fields = ["title", "thumbnail_image"]


class RightNodeIconSerializer(serializers.ModelSerializer):

    thumbnail_image = ThumbnailImageSerializer()

    class Meta:
        model = RightNodeIcon
        fields = ["title", "thumbnail_image"]


class NodeClassificationSerializer(serializers.ModelSerializer):

    thumbnail_image = ThumbnailImageSerializer()

    class Meta:
        model = NodeClassification
        fields = ["title", "thumbnail_image"]

class OutcomeSerializer(serializers.ModelSerializer):

    author = UserSerializer()

    class Meta:
        model = Outcome
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
            "author",
        ]

class OutcomeNodeSerializer(serializers.ModelSerializer):

    outcome = OutcomeSerializer()

    class Meta:
        model = OutcomeNode
        fields = ["node", "outcome", "added_on", "rank", "id"]


class NodeSerializer(serializers.ModelSerializer):

    author = UserSerializer()

    left_node_icon = LeftNodeIconSerializer()

    right_node_icon = RightNodeIconSerializer()

    node_classification = NodeClassificationSerializer()

    outcomenode_set = serializers.SerializerMethodField()

    class Meta:
        model = Node
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
            "author",
            "left_node_icon",
            "right_node_icon",
            "node_classification",
            "outcomenode_set",
        ]

    def get_outcomenode_set(self, instance):
        links = instance.outcomenode_set.all().order_by("rank")
        return OutcomeNodeSerializer(links, many=True).data

class NodeStrategySerializer(serializers.ModelSerializer):

    node = NodeSerializer()

    class Meta:
        model = NodeStrategy
        fields = ["strategy", "node", "added_on", "rank", "id"]

class OutcomeStrategySerializer(serializers.ModelSerializer):

    outcome = OutcomeSerializer()

    class Meta:
        model = OutcomeStrategy
        fields = ["strategy", "outcome", "added_on", "rank", "id"]


class StrategySerializer(serializers.ModelSerializer):

    author = UserSerializer()

    nodestrategy_set = serializers.SerializerMethodField()

    outcomestrategy_set = serializers.SerializerMethodField()

    class Meta:
        model = Strategy
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
            "default",
            "author",
            "nodestrategy_set",
            "outcomestrategy_set",
        ]


    def get_nodestrategy_set(self, instance):
        links = instance.nodestrategy_set.all().order_by("rank")
        return NodeStrategySerializer(links, many=True).data

    def get_outcomestrategy_set(self, instance):
        links = instance.outcomestrategy_set.all().order_by("rank")
        return OutcomeStrategySerializer(links, many=True).data


class StrategyActivitySerializer(serializers.ModelSerializer):

    node = StrategySerializer()

    class Meta:
        model = NodeStrategy
        fields = ["activity", "strategy", "added_on", "rank", "id"]

class OutcomeActivitySerializer(serializers.ModelSerializer):

    outcome = OutcomeSerializer()

    class Meta:
        model = OutcomeActivity
        fields = ["activity", "outcome", "added_on", "rank", "id"]


class ActivitySerializer(serializers.ModelSerializer):

    author = UserSerializer()

    strategyactivity_set = serializers.SerializerMethodField()

    outcomeactivity_set = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "strategyactivity_set",
            "outcomeactivity_set",
        ]

    def get_strategyactivity_set(self, instance):
        links = instance.strategyactivity_set.all().order_by("rank")
        return StrategyActivitySerializer(links, many=True).data

    def get_outcomeactivity_set(self, instance):
        links = instance.outcomeactivity_set.all().order_by("rank")
        return OutcomeActivitySerializer(links, many=True).data


class OutcomePreparationSerializer(serializers.ModelSerializer):

    outcome = OutcomeSerializer()

    class Meta:
        model = OutcomeActivity
        fields = ["preparation", "outcome", "added_on", "rank", "id"]


class PreparationSerializer(serializers.ModelSerializer):

    author = UserSerializer()

    outcomepreparation_set = serializers.SerializerMethodField()

    class Meta:
        model = Preparation
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "outcomepreparation_set",
        ]

    def get_outcomepreparation_set(self, instance):
        links = instance.outcomepreparation_set.all().order_by("rank")
        return OutcomePreparationSerializer(links, many=True).data

class OutcomeAssesmentSerializer(serializers.ModelSerializer):

    outcome = OutcomeSerializer()

    class Meta:
        model = OutcomeAssesment
        fields = ["assesment", "outcome", "added_on", "rank", "id"]


class AssesmentSerializer(serializers.ModelSerializer):

    author = UserSerializer()

    outcomeassesment_set = serializers.SerializerMethodField()

    class Meta:
        model = Assesment
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "outcomeassesment_set",
            ]

    def get_outcomeassesment_set(self, instance):
        links = instance.outcomeassesment_set.all().order_by("rank")
        return OutcomeAssesmentSerializer(links, many=True).data


class OutcomeArtifactSerializer(serializers.ModelSerializer):

    outcome = OutcomeSerializer()

    class Meta:
        model = OutcomeArtifact
        fields = ["artifact", "outcome", "added_on", "rank", "id"]


class ArtifactSerializer(serializers.ModelSerializer):

    author = UserSerializer()

    outcomeartifact_set = serializers.SerializerMethodField()

    class Meta:
        model = Artifact
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "outcomeartifact_set",
        ]

    def get_outcomeartifact_set(self, instance):
        links = instance.outcomeartifact_set.all().order_by("rank")
        return OutcomeArtifactSerializer(links, many=True).data


class ComponentSerializer(serializers.ModelSerializer):

    content_object = serializers.SerializerMethodField()

    class Meta:
        model = Component
        fields = ["content_object"]

    def get_content_object(self, instance):
        if type(instace.content_object) == Activity:
            return ActivitySerializer(instace.content_object)
        elif type(instace.content_object) == Preparation:
            return PreparationSerializer(instace.content_object)
        elif type(instace.content_object) == Assesment:
            return AssesmentSerializer(instace.content_object)
        else:
            return ArtifactSerializer(instace.content_object)


class ComponentWeekSerializer(serializers.ModelSerializer):

    component = ComponentSerializer()

    class Meta:
        model = ComponentWeek
        fields = ["week", "component", "added_on", "rank", "id"]

class OutcomeWeekSerializer(serializers.ModelSerializer):

    outcome = OutcomeSerializer()

    class Meta:
        model = OutcomeWeek
        fields = ["week", "outcome", "added_on", "rank", "id"]


class WeekSerializer(serializers.ModelSerializer):

    componentweek_set = serializers.SerializerMethodField()

    author = UserSerializer()

    outcomeweek_set = serializers.SerializerMethodField()

    class Meta:
        model = Week
        fields = [
            "id",
            "title",
            "hash",
            "created_on",
            "last_modified",
            "author",
            "componentweek_set",
            "outcomeweek_set",
        ]

    def get_componentweek_set(self, instance):
        links = instance.componentweek_set.all().order_by("rank")
        return ComponentWeekSerializer(links, many=True).data

    def get_outcomeweek_set(self, instance):
        links = instance.outcomeweek_set.all().order_by("rank")
        return OutcomeWeekSerializer(links, many=True).data


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ["id", "title"]


class WeekCourseSerializer(serializers.ModelSerializer):

    week = WeekSerializer()

    class Meta:
        model = WeekCourse
        fields = ["course", "week", "added_on", "rank", "id"]

class OutcomeCourseSerializer(serializers.ModelSerializer):

    outcome = OutcomeSerializer()

    class Meta:
        model = OutcomeCourse
        fields = ["course", "outcome", "added_on", "rank", "id"]


class CourseSerializer(serializers.ModelSerializer):

    weekcourse_set = serializers.SerializerMethodField()

    author = UserSerializer()

    discipline = DisciplineSerializer()

    outcomecourse_set = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "author",
            "created_on",
            "last_modified",
            "hash",
            "weekcourse_set",
            "outcomecourse_set",
        ]

    def get_weekcourse_set(self, instance):
        links = instance.weekcourse_set.all().order_by("rank")
        return WeekCourseSerializer(links, many=True).data

    def get_outcomecourse_set(self, instance):
        links = instance.outcomecourse_set.all().order_by("rank")
        return OutcomeCourseSerializer(links, many=True).data
