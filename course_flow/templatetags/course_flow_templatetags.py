from django import template
from django.conf import settings
from django.db.models import Q
from django.urls import reverse

from course_flow import models
from course_flow.utils import get_nondeleted_favourites

register = template.Library()


@register.simple_tag
def course_flow_return_url():
    if not hasattr(settings, "COURSE_FLOW_RETURN_URL"):
        return reverse("course_flow:home")
    return reverse(
        settings.COURSE_FLOW_RETURN_URL.get("name", "course_flow:home")
    )


@register.simple_tag
def course_flow_return_title():
    if not hasattr(settings, "COURSE_FLOW_RETURN_URL"):
        return "Return Home"
    return settings.COURSE_FLOW_RETURN_URL.get("title", "Return Home")


@register.filter
def not_deleted(query):
    return query.filter(deleted=False)


@register.filter
def not_deleted_favourites(query):
    if query is None:
        return None
    print("IN THE FILTER")
    print(query)
    return query.filter(
        Q(program__deleted=False,program__project__deleted=False)
        | Q(course__deleted=False,course__project__deleted=False)
        | Q(activity__deleted=False,activity__project__deleted=False)
        | Q(project__deleted=False)
    )
