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
)


class UserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=100)


class NodeSerializer(serializers.ModelSerializer):

    author = UserSerializer()

    class Meta:
        model = Strategy
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
            "author",
        ]


class StrategySerializer(serializers.ModelSerializer):

    author = UserSerializer()

    nodes = NodeSerializer(many=True)

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
            "nodes",
        ]


class ActivitySerializer(serializers.ModelSerializer):

    author = UserSerializer()

    strategies = StrategySerializer(many=True)

    class Meta:
        model = Strategy
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
        model = Strategy
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
        model = Strategy
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
        model = Strategy
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
        ]


class ComponentSerializer(serializers.ModelSerializer):

    if type(instance) == Activity:
        content_object = ActivitySerializer()
    elif type(instance) == Preparation:
        content_object = PreparationSerializer()
    elif type(instance) == Assesment:
        content_object = AssesmentSerializer()
    else:
        content_object = ArtifactSerializer()

    class Meta:
        model = Component
        fields = ["content_object"]


class WeekSerializer(serializers.ModelSerializer):

    components = ComponentSerializer(many=True)

    class Meta:
        model = Strategy
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
        model = Strategy
        fields = [
            "id",
            "title",
            "description",
            "created_on",
            "last_modified",
            "hash",
            "weeks",
        ]
