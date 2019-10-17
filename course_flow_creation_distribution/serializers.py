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
)


class UserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=100)


class NodeSerializer(serializers.ModelSerializer):

    author = UserSerializer()

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
        ]


class NodeStrategySerializer(serializers.ModelSerializer):

    node = NodeSerializer()

    class Meta:
        model = NodeStrategy
        fields = ["strategy", "node", "added_on", "rank"]


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
            "node_strategy_set",
        ]

    def get_nodestrategy_set(self, instance):
        links = instance.nodestrategy_set.all().order_by("-rank")
        return NodeStrategySerializer(links, many=True).data


class ActivitySerializer(serializers.ModelSerializer):

    author = UserSerializer()

    strategies = StrategySerializer(many=True)

    class Meta:
        model = Activity
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
        ]


class PreparationSerializer(serializers.ModelSerializer):

    author = UserSerializer()

    class Meta:
        model = Preparation
        fields = [
            "id",
            "title",
            "description",
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


class WeekSerializer(serializers.ModelSerializer):

    components = ComponentSerializer(many=True)

    class Meta:
        model = Week
        fields = [
            "id",
            "title",
            "created_on",
            "last_modified",
            "hash",
            "components",
        ]


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = ["id", "title"]


class CourseSerializer(serializers.ModelSerializer):

    weeks = WeekSerializer(many=True)

    discipline = DisciplineSerializer()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
            "weeks",
        ]
