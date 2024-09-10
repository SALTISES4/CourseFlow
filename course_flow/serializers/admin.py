import datetime

from django.utils import timezone
from rest_framework import serializers

from course_flow.models import Node


def analyticsDateTimeFormat():
    return "%Y %m"


class AnalyticsSerializer(
    serializers.Serializer,
):
    created_on = serializers.DateTimeField(format=analyticsDateTimeFormat())
    type = serializers.ReadOnlyField()
    User = serializers.SerializerMethodField()
    nodes = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    def get_nodes(self, instance):
        if instance.type == "project":
            return Node.objects.filter(
                week__workflow__project__id=instance.id
            ).count()
        else:
            return Node.objects.filter(week__workflow=instance.id).count()

    def get_User(self, instance):
        if instance.author is not None:
            active = " (active)"
            if (
                timezone.now() - instance.author.last_login
                > datetime.timedelta(days=31)
            ):
                active = " (inactive)"
            return str(instance.author.pk) + active

    def get_email(self, instance):
        if instance.author is not None:
            return instance.author.email
