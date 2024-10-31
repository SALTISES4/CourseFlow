from rest_framework import serializers


class DeleteRequestSerializer(serializers.Serializer):
    object_type = serializers.CharField()


class ObjectTypeSerializer(serializers.Serializer):
    object_type = serializers.CharField()
