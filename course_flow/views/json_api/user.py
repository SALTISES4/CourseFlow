import json
import logging

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.http import HttpRequest, JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.apps import logger
from course_flow.forms import ProfileSettings
from course_flow.models import User
from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.serializers import (
    FormFieldsSerializer,
    ProfileSettingsSerializer,
    UserSerializer,
)


class UserEndpoint:
    #########################################################
    # USER OBJECTS
    #########################################################
    @staticmethod
    @login_required
    @api_view(["GET"])
    def fetch__current(request: Request) -> Response:
        """ "
        there are two types of users, they need to be combined
        """
        user = CourseFlowUser.objects.filter(user=request.user).first()
        data_package = {
            "id": user.user.id,
            "first_name": user.user.first_name,
            "last_name": user.user.last_name,
            "user_name": user.user.username,
            "language": user.language,
        }
        return Response({"data_package": data_package})

    @staticmethod
    @api_view(["POST"])
    def list(request: HttpRequest) -> JsonResponse:
        body = json.loads(request.body)
        name_filter = body.get("filter")
        names = name_filter.split(" ")
        length = len(names)
        filters = [[name_filter, ""], ["", name_filter]]
        for i, name in enumerate(names):
            if i < length - 1:
                filters += [
                    [
                        " ".join(names[0 : i + 1]),
                        " ".join(names[i + 1 : length]),
                    ]
                ]
        try:
            q_objects = Q(username__istartswith=name_filter)
            for q_filter in filters:
                q_objects |= Q(
                    first_name__istartswith=q_filter[0],
                    last_name__istartswith=q_filter[1],
                )

            teacher_group = Group.objects.get(name=settings.TEACHER_GROUP)

            user_list = User.objects.filter(q_objects, groups=teacher_group)[
                :10
            ]
            count = len(user_list)
            if count < 10:
                user_list = list(user_list)
                q_objects = Q(username__icontains=name_filter)
                for q_filter in filters:
                    q_objects |= Q(
                        first_name__icontains=q_filter[0],
                        last_name__icontains=q_filter[1],
                    )
                user_list += list(
                    User.objects.filter(
                        q_objects, groups=teacher_group
                    ).exclude(id__in=[user.id for user in user_list])[
                        : 10 - count
                    ]
                )

        except ValidationError as e:
            logger.exception("An error occurred")
            return JsonResponse({"action": "error"})

        return JsonResponse(
            {
                "message": "success",
                "data_package": {
                    "user_list": UserSerializer(user_list, many=True).data,
                },
            },
            status=status.HTTP_200_OK,
        )

    #########################################################
    # PROFILE SETTINGS
    #########################################################
    @staticmethod
    @login_required
    @api_view(["GET"])
    def fetch_profile_settings(request: Request) -> Response:
        user = CourseFlowUser.objects.filter(user=request.user).first()
        form = ProfileSettings(
            {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "language": user.language,
            }
        )
        return Response(
            {
                "data_package": {
                    "formData": FormFieldsSerializer(form).prepare_fields()
                }
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    @login_required
    @api_view(["POST"])
    def update_profile_settings(
        request: Request,
    ) -> Response:
        user = CourseFlowUser.objects.filter(user=request.user).first()
        serializer = ProfileSettingsSerializer(user, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "success"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    #########################################################
    # NOTIFICATION SETTINGS
    #########################################################
    @staticmethod
    @login_required
    @api_view(["GET"])
    def fetch_notification_settings(request):
        user = CourseFlowUser.objects.filter(user=request.user).first()
        return JsonResponse(
            {
                "data_package": {
                    "formData": {"receiveNotifications": user.notifications}
                }
            }
        )

    @staticmethod
    @login_required
    @api_view(["POST"])
    def update_notification_settings(
        request: Request,
    ) -> Response:
        """

        :param request:
        :return:
        """
        user = CourseFlowUser.objects.filter(user=request.user).first()
        serializer = NotificationsSettingsSerializer(user, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "success"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
