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
from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.humanize.templatetags import humanize
from django.db.models import Q
from django.http import HttpRequest, JsonResponse
from django.urls import reverse
from django.utils.translation import gettext as _
from rest_framework.renderers import JSONRenderer

from course_flow.forms import CreateProject
from course_flow.models import Discipline
from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.models.updateNotification import UpdateNotification
from course_flow.serializers import (
    DisciplineSerializer,
    FavouriteSerializer,
    FormFieldsSerializer,
    UpdateNotificationSerializer,
    UserSerializer,
)
from course_flow.templatetags.course_flow_templatetags import (
    course_flow_password_change_url,
    course_flow_return_title,
    course_flow_return_url,
    has_group,
)
from course_flow.view_utils import get_workflow_choices


def add_global_context(request: HttpRequest):
    """
    # global processors, not for common html content data
    :param request:
    :return:
    """
    return {
        "globalContextData": JSONRenderer()
        .render(
            {
                "sidebar": get_sidebar(request),
                "topbar": get_topbar(request),
                "notifications": get_update_notifications(request),
                "path": get_app_config(request)["path"],
                "strings": get_app_config(request)["strings"],
            }
        )
        .decode("utf-8")
    }


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
            "isTeacher": has_group(user, "Teacher"),
            "isAnonymous": user.is_anonymous,
            "favourites": favourites,
        }
    except Exception as e:
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

        form = CreateProject(
            {
                "title": "New project name",
                "description": "",
                "disciplines": [],
            }
        )

        return {
            "isTeacher": has_group(user, "Teacher"),
            "notifications": {
                "url": reverse("course_flow:user-notifications"),
                "unread": unread,
                "items": prepared_notifications,
            },
            "forms": {
                "createProject": {
                    # TODO: count the number of current user's projects
                    "showNoProjectsAlert": True,
                    "formFields": FormFieldsSerializer(form).prepare_fields(),
                }
            },
        }
    except Exception as e:
        print(f"An error occurred in get_topbar: {e}")
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
        print(f"An error occurred: {e}")
        pass

    return {
        "updateNotifications": {},
        "showNotificationRequest": False,
    }


def get_app_config(request: HttpRequest):
    disciplines = DisciplineSerializer(
        Discipline.objects.order_by("title"), many=True
    ).data
    app_config = {
        "disciplines": disciplines,
        "workflow_choices": get_workflow_choices(),
        "path": {
            "post_paths": {
                "get_possible_linked_workflows": reverse(
                    "json_api:json-api-post-get-possible-linked-workflows"
                ),
                "get_possible_added_workflows": reverse(
                    "json_api:json-api-post-get-possible-added-workflows"
                ),
                "get_workflow_context": reverse(
                    "json_api:json-api-post-get-workflow-context"
                ),
                "set_linked_workflow": reverse(
                    "json_api:json-api-post-set-linked-workflow"
                ),
                "duplicate_workflow_ajax": reverse(
                    "json_api:json-api-post-duplicate-workflow"
                ),
                "get_workflow_data": reverse(
                    "json_api:json-api-post-get-workflow-data"
                ),
                "get_workflow_parent_data": reverse(
                    "json_api:json-api-post-get-workflow-parent-data"
                ),
                "get_workflow_child_data": reverse(
                    "json_api:json-api-post-get-workflow-child-data"
                ),
                "get_parent_workflow_info": reverse(
                    "json_api:json-api-post-get-parent-workflow-info"
                ),
                "get_workflows_for_project": reverse(
                    "json_api:json-api-post-get-workflows-for-project"
                ),
                "get_target_projects": reverse(
                    "json_api:json-api-post-get-target-projects"
                ),
                "update_value": reverse("json_api:json-api-post-update-value"),
                "duplicate_project_ajax": reverse(
                    "json_api:json-api-post-duplicate-project"
                ),
                "get_project_data": reverse(
                    "json_api:json-api-post-get-project-data"
                ),
                "new_node": reverse("json_api:json-api-post-new-node"),
                "new_node_link": reverse(
                    "json_api:json-api-post-new-node-link"
                ),
                "new_outcome": reverse(
                    "json_api:json-api-post-new-outcome-for-workflow"
                ),
                "add_strategy": reverse("json_api:json-api-post-add-strategy"),
                "duplicate_strategy_ajax": reverse(
                    "json_api:json-api-post-duplicate-strategy"
                ),
                "toggle_strategy": reverse(
                    "json_api:json-api-post-toggle-strategy"
                ),
                "delete_self": reverse("json_api:json-api-post-delete-self"),
                "restore_self": reverse("json_api:json-api-post-restore-self"),
                "delete_self_soft": reverse(
                    "json_api:json-api-post-delete-self-soft"
                ),
                "duplicate_self": reverse(
                    "json_api:json-api-post-duplicate-self"
                ),
                "insert_sibling": reverse(
                    "json_api:json-api-post-insert-sibling"
                ),
                "insert_child": reverse("json_api:json-api-post-insert-child"),
                "inserted_at": reverse("json_api:json-api-post-inserted-at"),
                "update_outcomehorizontallink_degree": reverse(
                    "json_api:json-api-post-update-outcomehorizontallink-degree"
                ),
                "update_outcomenode_degree": reverse(
                    "json_api:json-api-post-update-outcomenode-degree"
                ),
                "get_users_for_object": reverse(
                    "json_api:json-api-post-get-users-for-object"
                ),
                "set_permission": reverse(
                    "json_api:json-api-post-set-permission"
                ),
                "add_terminology": reverse(
                    "json_api:json-api-post-add-object-set"
                ),
                "update_object_set": reverse(
                    "json_api:json-api-post-update-object-set"
                ),
                "get_export": reverse("json_api:json-api-post-get-export"),
                "import_data": reverse("json_api:json-api-post-import-data"),
            },
            "get_paths": {
                "import": reverse("course_flow:import"),
                "get_public_workflow_data": reverse(
                    "json_api:json-api-get-public-workflow-data",
                    kwargs={"pk": "0"},
                ),
                "get_public_workflow_parent_data": reverse(
                    "json_api:json-api-get-public-workflow-parent-data",
                    kwargs={"pk": "0"},
                ),
                "get_public_workflow_child_data": reverse(
                    "json_api:json-api-get-public-workflow-child-data",
                    kwargs={"pk": "0"},
                ),
                "get_public_parent_workflow_info": reverse(
                    "json_api:json-api-get-public-parent-workflow-info",
                    kwargs={"pk": "0"},
                ),
            },
            "create_path": {
                "activity": reverse(
                    "course_flow:activity-create", kwargs={"projectPk": "0"}
                ),
                "course": reverse(
                    "course_flow:course-create", kwargs={"projectPk": "0"}
                ),
                "program": reverse(
                    "course_flow:program-create", kwargs={"projectPk": "0"}
                ),
                "activity_strategy": reverse(
                    "course_flow:activity-strategy-create"
                ),
                "course_strategy": reverse(
                    "course_flow:course-strategy-create"
                ),
                "project": "https://legacy-project-create-url",  # Assuming this is a hardcoded URL as it is external
            },
            "logout_path": reverse("course_flow:logout"),
            "html": {
                "library": {
                    "home": reverse("course_flow:home"),
                    "explore": reverse("course_flow:explore"),
                    "library": reverse("course_flow:library"),
                    "favourites": reverse("course_flow:favourites"),
                },
                "project": reverse(
                    "course_flow:project-detail", kwargs={"pk": "path"}
                ),
                "update_path_temp": reverse(
                    "course_flow:workflow-detail", kwargs={"pk": "0"}
                ),
                "public_update_path_temp": reverse(
                    "course_flow:workflow-detail", kwargs={"pk": "0"}
                ),
                "account": {
                    "resetPasswordUrl": course_flow_password_change_url(),
                    "daliteUrl": course_flow_return_url(),
                    "daliteText": course_flow_return_title(),
                },
            },
            "json_api": {
                "library": {
                    "home": reverse("json_api:library--home"),
                    "explore": reverse("json_api:library--explore"),
                    "library__objects_search": reverse(
                        "json_api:library--library--objects-search--post"
                    ),
                    "library__favourites__projects": reverse(
                        "json_api:library--favourites--projects--get"
                    ),
                    "library__library__projects": reverse(
                        "json_api:library--library--projects--get"
                    ),
                    "library__toggle_favourite__post": reverse(
                        "json_api:library--toggle-favourite--post"
                    ),
                },
                "project": {
                    "detail": reverse("json_api:project--detail--get"),
                    "create": reverse("json_api:project--create--post"),
                    "discipline_list": reverse(
                        "json_api:project--discipline--list"
                    ),
                },
                "workflow": {
                    "detail": reverse("json_api:workflow--detail--get"),
                },
                "user": {
                    "list": reverse("json_api:user--list--post"),
                    "profile_settings": reverse(
                        "json_api:user--profile-settings--get"
                    ),
                    "profile_settings__update": reverse(
                        "json_api:user--profile-settings--update--post"
                    ),
                    "notification_settings": reverse(
                        "json_api:user--notification-settings--get"
                    ),
                    "notification_settings__update": reverse(
                        "json_api:user--notification-settings--update--post"
                    ),
                },
                "notification": {
                    "list": reverse("json_api:notification--list--get"),
                    "delete": reverse("json_api:notification--delete--post"),
                    "mark_all_as_read": reverse(
                        "json_api:notifications--mark-all-as-read--post"
                    ),
                    "select": reverse("json_api:notifications--select--post"),
                },
                "comment": {
                    "list_by_object": reverse(
                        "json_api:comment--list-by-object--post"
                    ),
                    "create": reverse("json_api:comment--create--post"),
                    "delete": reverse("json_api:comment--delete--post"),
                    "delete_all": reverse(
                        "json_api:comment--delete-all--post"
                    ),
                },
            },
            "static_assets": {
                "icon": request.build_absolute_uri(
                    "/static/course_flow/img/images_svg/"
                )
            },
        },
        "strings": {
            "confirm_email_updates": _(
                "Hi there! Would you like to receive emails about updates to CourseFlow? You can always change your mind by viewing your profile."
            ),
            "unsupported_device": _(
                "Your device is not supported. Please use a laptop or desktop for the best experience."
            ),
            "product_updates_agree": _(
                "I want to receive product updates emails"
            ),
            "notifications": _("Notifications"),
            "home": _("Home"),
            "my_library": _("My library"),
            "explore": _("Explore"),
            "my_classrooms": _("My classrooms"),
            "favourites": _("Favourites"),
            "see_all": _("See all"),
            "view_all": _("View all"),
            "help_support": _("Help and Support"),
            "cancel": _("Cancel"),
            "password_reset": _("Password reset"),
            "password_reset_msg": _(
                "By choosing to reset your password, you will be directed to the SALTISE lobby and will have to navigate to the myDALITE application to set a new password."
            ),
            "notification_settings": _("Notification settings"),
            "sign_out": _("Sign out"),
            "profile": _("Profile"),
            "project": _("Project"),
            "program": _("Program"),
            "course": _("Course"),
            "activity": _("Activity"),
            "delete": _("Delete"),
            "show_notifications_menu": _("Show notifications menu"),
            "notification_options": _("Notification options"),
            "mark_as_read": _("Mark as read"),
            "mark_all_as_read": _("Mark all as read"),
            "no_notifications_yet": _("You have no notifications yet."),
            "profile_settings": _("Profile settings"),
            "update_profile": _("Update profile"),
            "update_profile_success": _("User details updated!"),
            # API response messages
            "workflow_archive_success": _("The Workflow has been archived"),
            "project_archive_success": _("The Project has been archived"),
            "project_archive_failure": _(
                "There was an error archiving your project"
            ),
            "workflow_archive_failure": _(
                "There was an error archiving your workflow"
            ),
            "workflow_unarchive_failure": _(
                "There was an error unarchiving your workflow"
            ),
            "project_unarchive_failure": _(
                "There was an error unarchiving your project"
            ),
            "project_unarchive_success": _("The Project has been unarchived"),
            "workflow_unarchive_success": _(
                "The Workflow has been unarchived"
            ),
        },
    }
    return app_config
