"""
CONTEXT PROCESSORS

Context processors in Django are functions that add specific
data to the context of every template across a project.
They help in making information like user details and settings
globally available to all templates.

Context processors are configured in the TEMPLATES settings.
where they are added to the context_processors list.

They should be used  judiciously due to potential performance impacts,
as they execute  for every template rendered.
"""
import logging

from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.humanize.templatetags import humanize
from django.db.models import Q
from django.http import HttpRequest
from django.urls import reverse

from course_flow.apps import logger
from course_flow.models import Discipline
from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.models.updateNotification import UpdateNotification
from course_flow.serializers import (
    DisciplineSerializer,
    FavouriteSerializer,
    UpdateNotificationSerializer,
    UserSerializer,
)
from course_flow.services.workflow import WorkflowService


def get_sidebar(request: HttpRequest):
    try:
        user = request.user

        # Prepare 5 most recent favourites, using a serializer that will give just the url and name
        favourites = FavouriteSerializer(
            [
                x.content_object
                for x in user.favourite_set.filter(
                    Q(
                        workflow__deleted=False,
                        workflow__project__deleted=False,
                    )
                    | Q(project__deleted=False)
                )[:5]
            ],
            many=True,
            context={"user": user},
        ).data

        return {
            "favourites": favourites,
        }
    except Exception as e:
        logger.exception("An error occurred")
        print(f"An error occurred in get_sidebar: {e}")
        pass

    return {}


def get_topbar(request: HttpRequest):
    try:
        user = request.user

        # get total count of unread notifications
        unread = user.notifications.filter(is_unread=True).count()

        # prepare notification data to be consumed by the frontend
        # show the recent 7 notifications
        prepared_notifications = []
        for notification in user.notifications.all()[:7]:
            if notification.content_object.type == "project":
                url = reverse(
                    "course_flow:project-detail",
                    kwargs={"pk": notification.content_object.pk},
                )
            else:
                url = reverse(
                    "course_flow:workflow-detail",
                    kwargs={"pk": notification.content_object.pk},
                )

            source_user = UserSerializer(notification.source_user).data
            source_user_name = source_user["username"]
            if source_user["first_name"]:
                source_user_name = source_user["first_name"]

            if source_user["first_name"] and source_user["last_name"]:
                source_user_name = (
                    f"{source_user['first_name']} {source_user['last_name']}"
                )

            prepared_notifications.append(
                {
                    "id": notification.id,
                    "unread": notification.is_unread,
                    "url": url,
                    "date": humanize.naturaltime(notification.created_on),
                    "text": notification.text,
                    "from": source_user_name,
                }
            )

        # form = CreateProject(
        #     {
        #         "title": "New project name",
        #         "description": "",
        #         "disciplines": [],
        #     }
        # )

        return {
            "notifications": {
                "url": reverse("course_flow:user-notifications"),
                "unread": unread,
                "items": prepared_notifications,
            },
            # "forms": {
            #     "createProject": {
            #         # TODO: count the number of current user's projects
            #         "showNoProjectsAlert": True,
            #         "formFields": FormFieldsSerializer(form).prepare_fields(),
            #     }
        }
    except Exception as e:
        logger.exception("An error occurred")
        pass

    return {}


def get_update_notifications(request: HttpRequest):
    try:
        if "course_flow" in request.resolver_match.namespace:
            last_update = UpdateNotification.objects.last()
            if last_update is not None:
                if (
                    Group.objects.get(name=settings.TEACHER_GROUP)
                    in request.user.groups.all()
                ):
                    courseflow_user = CourseFlowUser.ensure_user(request.user)
                    show_notification_request = (
                        not courseflow_user.notifications_active
                    )
                else:
                    show_notification_request = False
                return {
                    "updateNotifications": UpdateNotificationSerializer(
                        last_update
                    ).data,
                    "showNotificationRequest": show_notification_request,
                }
    except Exception as e:
        logger.exception("An error occurred")
        pass

    return {
        "updateNotifications": {},
        "showNotificationRequest": False,
    }


def get_app_config():
    disciplines = DisciplineSerializer(
        Discipline.objects.order_by("title"), many=True
    ).data

    app_config = {
        "disciplines": disciplines,
        "workflow_choices": WorkflowService.get_workflow_choices(),
        "path": {
            "post_paths": {
                "new_outcome": reverse(
                    "json_api:json-api-post-new-outcome-for-workflow"
                ),
                "insert_child": reverse("json_api:json-api-post-insert-child"),
                "inserted_at": reverse("json_api:json-api-post-inserted-at"),
                "update_outcomehorizontallink_degree": reverse(
                    "json_api:json-api-post-update-outcomehorizontallink-degree"
                ),
                "update_outcomenode_degree": reverse(
                    "json_api:json-api-post-update-outcomenode-degree"
                ),
                "update_object_set": reverse(
                    "json_api:json-api-post-update-object-set"
                ),
                # generic
                "insert_sibling": reverse(
                    "json_api:json-api-post-insert-sibling"
                ),
                "set_permission": reverse(
                    "json_api:json-api-post-set-permission"
                ),
            },
            "get_paths": {
                "get_public_workflow_child_data": reverse(
                    "json_api:json-api-get-public-workflow-child-data",
                    kwargs={"pk": "0"},
                ),
                "get_public_parent_workflow_info": reverse(
                    "json_api:json-api-get-public-parent-workflow-info",
                    kwargs={"pk": "0"},
                ),
            },
            # "create_path": {
            #     "activity": reverse(
            #         "course_flow:activity-create", kwargs={"projectPk": "0"}
            #     ),
            #     "course": reverse(
            #         "course_flow:course-create", kwargs={"projectPk": "0"}
            #     ),
            #     "program": reverse(
            #         "course_flow:program-create", kwargs={"projectPk": "0"}
            #     ),
            #     "activity_strategy": reverse(
            #         "course_flow:activity-strategy-create"
            #     ),
            #     "course_strategy": reverse(
            #         "course_flow:course-strategy-create"
            #     ),
            #     "project": "https://legacy-project-create-url",  # Assuming this is a hardcoded URL as it is external
            # },
            # "logout_path": reverse("course_flow:logout"),
        },
    }
    return app_config
