import json
import re

import bleach
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db.models import ProtectedError
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.decorators import (
    check_object_permission,
    user_can_comment,
    user_can_edit,
)
from course_flow.models import Notification, User
from course_flow.models.notification import TypeChoices
from course_flow.models.objectPermission import Permission
from course_flow.serializers import CommentSerializer
from course_flow.utils import get_model_from_str, make_user_notification

#########################################################
# COMMENTS
#########################################################


##########################################################
# GET
#########################################################
class CommentEndpoint:
    @staticmethod
    @user_can_comment(False)
    @api_view(["GET"])
    def list_by_object(
        request: Request,
    ) -> Response:
        body = json.loads(request.body)
        object_id = body.get("objectID")
        object_type = body.get("objectType")
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
            return Response({"action": "error"})
        return Response({"action": "posted", "data_package": data_package})

    ##########################################################
    # CREATE
    #########################################################
    @staticmethod
    @user_can_comment(False)
    @api_view(["POST"])
    def create(request: Request) -> Response:
        body = json.loads(request.body)
        object_id = body.get("objectID")
        object_type = body.get("objectType")
        text = bleach.clean(body.get("text"))
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
                            Permission.PERMISSION_COMMENT.value,
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
                    notification_type=TypeChoices.TYPE_COMMENT.value,
                    content_object=content_object,
                    extra_text=text,
                    comment=comment,
                )

        except ValidationError:
            return Response({"action": "error"})
        return Response({"action": "posted"})

    ##########################################################
    # DELETE
    #########################################################

    @staticmethod
    @user_can_edit(False)
    @api_view(["POST"])
    def delete(request: Request, pk: int) -> Response:
        body = json.loads(request.body)
        object_type = body.get("objectType")
        comment_id = body.get("commentPk")

        try:
            model = get_model_from_str(object_type).objects.get(id=pk)
            comment = model.comments.get(id=comment_id)
            comment.delete()

        except (ProtectedError, ObjectDoesNotExist):
            return Response({"action": "error"})

        return Response({"action": "posted"})

    @staticmethod
    @user_can_edit(False)
    @api_view(["POST"])
    def delete_all(request: Request) -> Response:
        body = json.loads(request.body)
        object_id = body.get("objectID")
        object_type = body.get("objectType")

        try:
            model = get_model_from_str(object_type).objects.get(id=object_id)
            model.comments.all().delete()

        except (ProtectedError, ObjectDoesNotExist):
            return Response({"action": "error"})

        return Response({"action": "posted"})
