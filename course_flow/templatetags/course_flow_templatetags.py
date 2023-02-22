import calendar

from django import template
from django.conf import settings
from django.db.models import Count, Q
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html

from course_flow import models
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
    original_month = 1
    original_year = 2021
    current_month = timezone.now().month
    current_year = timezone.now().year
    projects = models.Project.objects
    activities = models.Activity.objects
    courses = models.Course.objects
    programs = models.Program.objects
    nodes = models.Node.objects
    projects_nodes = filter_project_by_nodes(models.Project.objects)
    activities_nodes = filter_workflow_by_nodes(models.Activity.objects)
    courses_nodes = filter_workflow_by_nodes(models.Course.objects)
    programs_nodes = filter_workflow_by_nodes(models.Program.objects)
    rows = [
        "<tr>"
        + "<th>Month</th>"
        + "<th>Projects</th>"
        + "<th>Activities</th>"
        + "<th>Courses</th>"
        + "<th>Programs</th>"
        + "<th>Nodes</th>"
        + "</tr>"
    ]
    for year in range(original_year, current_year + 1):
        first_month = 1
        last_month = 12
        if year == original_year:
            first_month = original_month
        if year == current_year:
            last_month = current_month
        for month in range(first_month, last_month + 1):
            rows += [
                (
                    "<tr>"
                    + "<td>{} {}</td>"
                    + "<td>{} ({})</td>"
                    + "<td>{} ({})</td>"
                    + "<td>{} ({})</td>"
                    + "<td>{} ({})</td>"
                    + "<td>{}</td>"
                    + "</tr>"
                ).format(
                    calendar.month_name[month],
                    year,
                    get_queryset_by_created_month(projects, month, year),
                    get_queryset_by_created_month(projects_nodes, month, year),
                    get_queryset_by_created_month(activities, month, year),
                    get_queryset_by_created_month(
                        activities_nodes, month, year
                    ),
                    get_queryset_by_created_month(courses, month, year),
                    get_queryset_by_created_month(courses_nodes, month, year),
                    get_queryset_by_created_month(programs, month, year),
                    get_queryset_by_created_month(programs_nodes, month, year),
                    get_queryset_by_created_month(nodes, month, year),
                )
            ]
    rows += [
        (
            "<tr>"
            + "<td>{}</td>"
            + "<td>{} ({})</td>"
            + "<td>{} ({})</td>"
            + "<td>{} ({})</td>"
            + "<td>{} ({})</td>"
            + "<td>{}</td>"
            + "</tr>"
        ).format(
            "Total",
            projects.all().count(),
            projects_nodes.count(),
            activities.all().count(),
            activities_nodes.count(),
            courses.all().count(),
            courses_nodes.count(),
            programs.all().count(),
            programs_nodes.count(),
            nodes.all().count(),
        )
    ]
    table = "\n".join(rows)
    return format_html("<table>" + table + "</table>")


def get_annoted_users_for_objects_by_month(type, month, year):

    return models.User.objects.filter(
        **{
            "authored_" + type + "__created_on__month": month,
            "authored_" + type + "__created_on__year": year,
        }
    ).annotate(
        num_authored=Count("authored_" + type),
    )


def get_users_for_object(queryset):
    return queryset.filter(num_authored__gte=1).count()


@register.simple_tag
def get_saltise_admin_users():
    original_month = 1
    original_year = 2021
    current_month = timezone.now().month
    current_year = timezone.now().year
    rows = [
        "<tr>"
        + "<th>Month</th>"
        + "<th>Project Authors</th>"
        + "<th>Activity Authors</th>"
        + "<th>Course Authors</th>"
        + "<th>Program Authors</th>"
        + "<th>Node Authors</th>"
        + "</tr>"
    ]
    for year in range(original_year, current_year + 1):
        first_month = 1
        last_month = 12
        if year == original_year:
            first_month = original_month
        if year == current_year:
            last_month = current_month
        for month in range(first_month, last_month + 1):
            annotated_activities = get_annoted_users_for_objects_by_month(
                "activities", month, year
            )
            annotated_courses = get_annoted_users_for_objects_by_month(
                "courses", month, year
            )
            annotated_programs = get_annoted_users_for_objects_by_month(
                "programs", month, year
            )
            annotated_projects = get_annoted_users_for_objects_by_month(
                "projects", month, year
            )
            annotated_nodes = get_annoted_users_for_objects_by_month(
                "nodes", month, year
            )
            rows += [
                (
                    "<tr>"
                    + "<td>{} {}</td>"
                    + "<td>{}</td>"
                    + "<td>{}</td>"
                    + "<td>{}</td>"
                    + "<td>{}</td>"
                    + "<td>{}</td>"
                    + "</tr>"
                ).format(
                    calendar.month_name[month],
                    year,
                    get_users_for_object(annotated_projects),
                    get_users_for_object(annotated_activities),
                    get_users_for_object(annotated_courses),
                    get_users_for_object(annotated_programs),
                    get_users_for_object(annotated_nodes),
                )
            ]
    rows += [
        (
            "<tr>"
            + "<td>Total</td>"
            + "<td>{}</td>"
            + "<td>{}</td>"
            + "<td>{}</td>"
            + "<td>{}</td>"
            + "<td>{}</td>"
            + "</tr>"
        ).format(
            get_users_for_object(
                models.User.objects.all().annotate(
                    num_authored=Count("authored_projects")
                )
            ),
            get_users_for_object(
                models.User.objects.all().annotate(
                    num_authored=Count("authored_activities")
                )
            ),
            get_users_for_object(
                models.User.objects.all().annotate(
                    num_authored=Count("authored_courses")
                )
            ),
            get_users_for_object(
                models.User.objects.all().annotate(
                    num_authored=Count("authored_programs")
                )
            ),
            get_users_for_object(
                models.User.objects.all().annotate(
                    num_authored=Count("authored_nodes")
                )
            ),
        )
    ]
    table = "\n".join(rows)
    return format_html("<table>" + table + "</table>")


@register.simple_tag
def get_saltise_admin_user_details():
    return format_html("<table></table>")
