from rest_framework import serializers


class DeleteRequestSerializer(serializers.Serializer):
    object_type = serializers.CharField()


class ObjectTypeSerializer(serializers.Serializer):
    object_type = serializers.CharField()


class SearchSerializer(serializers.Serializer):
    filter = serializers.CharField(required=False, default="")
    args = serializers.DictField(required=False, default={})
    results_per_page = serializers.IntegerField(source="args.results_per_page", default=10)
