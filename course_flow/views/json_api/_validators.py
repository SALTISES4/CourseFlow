from rest_framework import serializers


class DeleteRequestSerializer(serializers.Serializer):
    object_type = serializers.CharField()


class SearchSerializer(serializers.Serializer):
    filter = serializers.CharField(required=False, default="")
    args = serializers.DictField(required=False, default={})
    results_per_page = serializers.IntegerField(
        source="args.results_per_page", default=10
    )
    full_search = serializers.BooleanField(
        source="args.full_search", default=False
    )
    published = serializers.BooleanField(
        source="args.published", default=False
    )
