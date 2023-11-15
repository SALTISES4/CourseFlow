import logging
import json
from django import template
from django.conf import settings
from django.db.models import Count, Q
from django.contrib.humanize.templatetags import humanize
from django.urls import reverse
from django.utils.html import format_html

from course_flow import analytics
from course_flow.utils import get_classrooms_for_student

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


@register.simple_tag
def course_flow_password_change_url():
    if not hasattr(settings, "COURSE_FLOW_PASSWORD_CHANGE_URL"):
        return reverse("login")
    return reverse(settings.COURSE_FLOW_PASSWORD_CHANGE_URL)


@register.filter
def not_deleted(query):
    return query.filter(deleted=False)


@register.filter
def not_deleted_favourites(query):
    if query is None:
        return None
    return query.filter(
        Q(workflow__deleted=False, workflow__project__deleted=False)
        | Q(project__deleted=False)
    )


@register.filter
def has_group(user, group_name):
    return user.groups.filter(name=group_name).exists()


@register.filter
def fix_articles(string):
    ind_art = "an " if string[0] in "aeiou" else "a "
    return ind_art + " " + string


def get_classrooms(user):
    return get_classrooms_for_student(user)


def get_queryset_by_created_month(queryset, month, year):
    return queryset.filter(
        created_on__month=month, created_on__year=year
    ).count()


def filter_workflow_by_nodes(queryset):
    return queryset.annotate(num_nodes=Count("weeks__nodeweek")).filter(
        num_nodes__gte=3
    )


def filter_project_by_nodes(queryset):
    return queryset.annotate(
        num_nodes=Count("workflows__weekworkflow__week__nodeweek__node")
    ).filter(num_nodes__gte=3)


@register.simple_tag
def get_saltise_admin_workflows():
    return format_html(
        analytics.get_workflow_table().to_html(classes="analytics-workflows")
    )


@register.simple_tag
def get_saltise_admin_users():
    return format_html(
        analytics.get_user_table().to_html(classes="analytics-users")
    )


@register.simple_tag
def get_saltise_admin_user_details():
    return format_html(
        analytics.get_user_details_table().to_html(classes="analytics-details")
    )


@register.simple_tag
def get_saltise_admin_user_details():
    return format_html(
        analytics.get_user_details_table().to_html(classes="analytics-details")
    )
