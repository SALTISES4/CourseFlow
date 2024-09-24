import json
import logging

from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.http import HttpRequest, JsonResponse
from django.utils.translation import gettext as _

from course_flow.apps import logger
from course_flow.decorators import user_can_edit, user_can_view
from course_flow.models import User
from course_flow.models.notification import Notification
from course_flow.models.objectPermission import ObjectPermission, Permission
from course_flow.services import DAO


# change permissions on an object for a user
@user_can_edit(False)
def json_api_post_set_permission(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    object_id = body.get("objectId")
    objectType = body.get("objectType")
    if objectType in ["activity", "course", "program"]:
        objectType = "workflow"
    user_id = body.get("permission_user")
    permission_type = body.get("permission_type")
    response = {}
    try:
        user = User.objects.get(id=user_id)
        if (
            permission_type
            in [
                Permission.PERMISSION_EDIT.value,
                Permission.PERMISSION_VIEW.value,
                Permission.PERMISSION_COMMENT.value,
            ]
            and Group.objects.get(name=settings.TEACHER_GROUP)
            not in user.groups.all()
        ):
            return JsonResponse(
                {"action": "error", "error": _("User is not a teacher.")}
            )
        item = DAO.get_model_from_str(objectType).objects.get(id=object_id)
        # if hasattr(item, "get_subclass"):
        #     item = item.get_subclass()

        project = item.get_project()
        if permission_type != Permission.PERMISSION_EDIT.value:
            if item.author == user or (
                project is not None and project.author == user
            ):
                response = JsonResponse(
                    {
                        "action": "error",
                        "error": _("This user's role cannot be changed."),
                    }
                )
                # response.status_code = 403
                return response

        # Not currently enabled
        if permission_type == Permission.PERMISSION_STUDENT.value:
            raise ValidationError

        ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(item),
            object_id=object_id,
        ).delete()
        if permission_type != Permission.PERMISSION_NONE.value:
            ObjectPermission.objects.create(
                user=user, content_object=item, permission_type=permission_type
            )
            DAO.make_user_notification(
                source_user=request.user,
                target_user=user,
                notification_type=Notification.TYPE_SHARED,
                content_object=item,
            )
        response["action"] = "posted"

    except ValidationError as e:
        logger.exception("An error occurred")
        response["action"] = "error"

    return JsonResponse(response)
