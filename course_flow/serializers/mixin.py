import re

import bleach
from django.utils.translation import gettext as _
from html2text import html2text
from rest_framework import serializers

from course_flow.models.common import title_max_length
from course_flow.models.relations.weekWorkflow import WeekWorkflow

bleach_allowed_attributes_description = {
    "a": ["href", "title", "target"],
    "abbr": ["title"],
    "acronym": ["title"],
}

bleach_allowed_tags_description = [
    "b",
    "u",
    "em",
    "i",
    "ul",
    "ol",
    "li",
    "br",
    "p",
    "a",
    "strong",
    "sub",
    "sup",
]

bleach_allowed_tags_title = [
    "b",
    "u",
    "em",
    "i",
]


def bleach_sanitizer(value, **kwargs):
    if value is not None:
        return bleach.clean(value, **kwargs)
    else:
        return None


class AuthorSerializerMixin:
    author = serializers.SerializerMethodField()

    def get_author(self, instance):
        user = self.context.get("user", None)
        if user is not None:
            if instance.author is None:
                return ""
            return str(instance.author.username)
        else:
            return _("a CourseFlow user")


class DescriptionSerializerMixin:
    description = serializers.SerializerMethodField()

    def get_description(self, instance):
        return bleach_sanitizer(
            instance.description,
            tags=bleach_allowed_tags_description,
            attributes=bleach_allowed_attributes_description,
        )

    def validate_description(self, value):
        if value is None:
            return None
        return bleach_sanitizer(
            value,
            tags=bleach_allowed_tags_description,
            attributes=bleach_allowed_attributes_description,
        )


class TitleSerializerMixin:
    title = serializers.SerializerMethodField()

    def get_title(self, instance):
        return bleach_sanitizer(instance.title, tags=bleach_allowed_tags_title)

    def validate_title(self, value):
        return bleach_sanitizer(value, tags=bleach_allowed_tags_title)[
            :title_max_length
        ]


class DescriptionSerializerTextMixin(serializers.Serializer):
    description = serializers.SerializerMethodField()

    def get_description(self, instance):
        if instance.description is None:
            return None
        returnval = html2text(
            bleach_sanitizer(
                instance.description, tags=bleach_allowed_tags_description
            )
        )
        return re.sub("\n\n$", "", returnval)


class TitleSerializerTextMixin(serializers.Serializer):
    title = serializers.SerializerMethodField()

    def get_title(self, instance):
        title = instance.title

        if self.get_type(instance) == "node":
            if (
                instance.linked_workflow is not None
                and instance.represents_workflow
            ):
                title = instance.linked_workflow.title

        if title is None or title == "":
            if self.get_type(instance) == "week":
                return (
                    instance.get_week_type_display()
                    + " "
                    + str(
                        WeekWorkflow.objects.filter(week=instance)
                        .first()
                        .get_display_rank()
                        + 1
                    )
                )
            else:
                return _("Untitled")
        returnval = html2text(
            bleach_sanitizer(title, tags=bleach_allowed_tags_title)
        )
        return re.sub("\n\n$", "", returnval)


class TimeRequiredSerializerMixin:
    time_required = serializers.SerializerMethodField()

    def get_time_required(self, instance):
        return bleach_sanitizer(instance.time_required, tags=[])

    def validate_time_required(self, value):
        return bleach_sanitizer(value, tags=[])
