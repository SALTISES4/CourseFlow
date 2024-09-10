from rest_framework import serializers

from course_flow.models.objectset import ObjectSet
from course_flow.serializers.mixin import TitleSerializerMixin


class ObjectSetSerializerShallow(
    serializers.ModelSerializer,
    TitleSerializerMixin,
):
    class Meta:
        model = ObjectSet
        fields = ["id", "title", "translation_plural", "term"]

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.translation_plural = validated_data.get(
            "translation_plural", instance.translation_plural
        )
        instance.save()
        return instance
