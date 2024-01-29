import json
import traceback

import bleach
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpRequest, JsonResponse
from rest_framework.renderers import JSONRenderer

from course_flow.decorators import user_can_comment, user_can_edit
from course_flow.models import Comment, Notification, User
from course_flow.serializers import CommentSerializer
from course_flow.utils import get_model_from_str, make_user_notification

#################################################
# API for comments
#################################################


@user_can_edit(False)
def json_api_post_remove_comment(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    comment_id = json.loads(request.POST.get("commentPk"))

    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        comment = model.comments.get(id=comment_id)
        comment.delete()

    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


@user_can_edit(False)
def json_api_post_remove_all_comments(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))

    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        model.comments.all().delete()

    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


@user_can_comment(False)
def json_api_post_add_comment(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    text = bleach.clean(json.loads(request.POST.get("text")))
    try:
        obj = get_model_from_str(object_type).objects.get(id=object_id)

        # check if we are notifying any users
        usernames = re.findall(r"@\w[@a-zA-Z0-9_.]{1,}", text)
        target_users = []
        if len(usernames) > 0:
            content_object = obj.get_workflow()
            for username in usernames:
                try:
                    target_user = User.objects.get(username=username[1:])
                    if check_object_permission(
                        content_object,
                        target_user,
                        ObjectPermission.PERMISSION_COMMENT,
                    ):
                        target_users += [target_user]
                    else:
                        raise ObjectDoesNotExist
                except ObjectDoesNotExist:
                    text = text.replace(username, username[1:])

        # create the comment
        comment = obj.comments.create(text=text, user=request.user)
        for target_user in target_users:
            make_user_notification(
                source_user=request.user,
                target_user=target_user,
                notification_type=Notification.TYPE_COMMENT,
                content_object=content_object,
                extra_text=text,
                comment=comment,
            )

    except ValidationError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})


@user_can_comment(False)
def json_api_post_get_comments_for_object(
    request: HttpRequest,
) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    try:
        comments = (
            get_model_from_str(object_type)
            .objects.get(id=object_id)
            .comments.all()
            .order_by("created_on")
        )
        Notification.objects.filter(
            comment__in=comments, user=request.user
        ).update(is_unread=False)
        data_package = CommentSerializer(comments, many=True).data
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})