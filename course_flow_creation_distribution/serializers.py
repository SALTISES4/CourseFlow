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


class NodeSerializer(serializers.ModelSerializer):

    author = UserSerializer()

    left_node_icon = LeftNodeIconSerializer()

    right_node_icon = RightNodeIconSerializer()

    node_classification = NodeClassificationSerializer()

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
        ]


class NodeStrategySerializer(serializers.ModelSerializer):

    node = NodeSerializer()

    class Meta:
        model = NodeStrategy
        fields = ["strategy", "node", "added_on", "rank", "id"]


class StrategySerializer(serializers.ModelSerializer):

    author = UserSerializer()

    nodestrategy_set = serializers.SerializerMethodField()

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
        ]

    def get_nodestrategy_set(self, instance):
        links = instance.nodestrategy_set.all().order_by("rank")
        return NodeStrategySerializer(links, many=True).data


class StrategyActivitySerializer(serializers.ModelSerializer):

    node = StrategySerializer()

    class Meta:
        model = NodeStrategy
        fields = ["activity", "strategy", "added_on", "rank", "id"]


class ActivitySerializer(serializers.ModelSerializer):

    author = UserSerializer()

    strategyactivity_set = serializers.SerializerMethodField()

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
        ]

    def get_strategyactivity_set(self, instance):
        links = instance.strategyactivity_set.all().order_by("rank")
        return StrategyActivitySerializer(links, many=True).data


class PreparationSerializer(serializers.ModelSerializer):

    author = UserSerializer()

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
        ]


class AssesmentSerializer(serializers.ModelSerializer):

    author = UserSerializer()

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
        ]


class ArtifactSerializer(serializers.ModelSerializer):

    author = UserSerializer()

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
        ]


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


class WeekSerializer(serializers.ModelSerializer):

    componentweek_set = serializers.SerializerMethodField()

    author = UserSerializer()

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
        ]

    def get_componentweek_set(self, instance):
        links = instance.componentweek_set.all().order_by("rank")
        return ComponentWeekSerializer(links, many=True).data


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ["id", "title"]


class WeekCourseSerializer(serializers.ModelSerializer):

    week = WeekSerializer()

    class Meta:
        model = WeekCourse
        fields = ["course", "week", "added_on", "rank", "id"]


class CourseSerializer(serializers.ModelSerializer):

    weekcourse_set = serializers.SerializerMethodField()

    author = UserSerializer()

    discipline = DisciplineSerializer()

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
        ]

    def get_weekcourse_set(self, instance):
        links = instance.weekcourse_set.all().order_by("rank")
        return WeekCourseSerializer(links, many=True).data
