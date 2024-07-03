from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.renderers import JSONRenderer

from course_flow.models.objectPermission import ObjectPermission
from course_flow.models.project import Project
from course_flow.models.workflow import Workflow
from course_flow.serializers import InfoBoxSerializer
from course_flow.templatetags.course_flow_templatetags import has_group


@login_required
def home_view(request):
    user = request.user
    if Group.objects.get(name=settings.TEACHER_GROUP) not in user.groups.all():
        projects_serialized = []
    else:
        projects = [
            op.content_object
            for op in ObjectPermission.objects.filter(
                project__deleted=False, user=user
            ).order_by("-last_viewed")[:2]
        ]
        templates = list(
            Project.objects.filter(
                deleted=False, published=True, is_template=True
            )
        ) + list(
            Workflow.objects.filter(
                deleted=False, published=True, is_template=True
            )
        )
        projects_serialized = InfoBoxSerializer(
            projects, many=True, context={"user": user}
        ).data
        templates_serialized = InfoBoxSerializer(
            templates, many=True, context={"user": user}
        ).data

    context = {
        "title": "Home",
        "path_id": "home",
        "contextData": JSONRenderer()
        .render(
            {
                "isTeacher": has_group(user, "Teacher"),
                "projects": projects_serialized,
                "templates": templates_serialized,
                # TODO: Figure out how to handle the templates
                # "templates": [
                #     {
                #         "title": "A project title",
                #         "caption": "Owned by someone",
                #         "isFavourite": True,
                #         "chips": [
                #             { "type": 'project', "label": 'Project' },
                #             { "type": 'template', "label": 'Template' },
                #             { "type": 'default', "label": '23 workflows' }
                #         ]
                #     },
                #     {
                #         "title": "A program title",
                #         "caption": "Owned by someone",
                #         "isFavourite": False,
                #         "chips": [
                #             { "type": 'program', "label": 'Program' },
                #             { "type": 'template', "label": 'Template' },
                #             { "type": 'default', "label": '23 workflows' }
                #         ]
                #     },
                #     {
                #         "title": "A course title",
                #         "caption": "Owned by someone",
                #         "isFavourite": False,
                #         "chips": [
                #             { "type": 'course', "label": 'Course' },
                #             { "type": 'template', "label": 'Template' },
                #             { "type": 'default', "label": '23 workflows' }
                #         ]
                #     },
                #     {
                #         "title": "An activity title",
                #         "caption": "Owned by someone",
                #         "isFavourite": True,
                #         "chips": [
                #             { "type": 'activity', "label": 'Activity' },
                #             { "type": 'template', "label": 'Template' },
                #             { "type": 'default', "label": '23 workflows' }
                #         ]
                #     }
                # ]
            }
        )
        .decode("utf-8"),
    }

    return render(request, "course_flow/react/common_entrypoint.html", context)


@login_required
def get_home_context(request):
    user = request.user
    if Group.objects.get(name=settings.TEACHER_GROUP) not in user.groups.all():
        projects_serialized = []
    else:
        projects = [
            op.content_object
            for op in ObjectPermission.objects.filter(
                project__deleted=False, user=user
            ).order_by("-last_viewed")[:2]
        ]
        templates = list(
            Project.objects.filter(
                deleted=False, published=True, is_template=True
            )
        ) + list(
            Workflow.objects.filter(
                deleted=False, published=True, is_template=True
            )
        )
        projects_serialized = InfoBoxSerializer(
            projects, many=True, context={"user": user}
        ).data
        templates_serialized = InfoBoxSerializer(
            templates, many=True, context={"user": user}
        ).data

    context = {
        "title": "Home",
        "path_id": "home",
        "contextData": JSONRenderer()
        .render(
            {
                "isTeacher": has_group(user, "Teacher"),
                "projects": projects_serialized,
                "templates": templates_serialized,
                # TODO: Figure out how to handle the templates
                # "templates": [
                #     {
                #         "title": "A project title",
                #         "caption": "Owned by someone",
                #         "isFavourite": True,
                #         "chips": [
                #             { "type": 'project', "label": 'Project' },
                #             { "type": 'template', "label": 'Template' },
                #             { "type": 'default', "label": '23 workflows' }
                #         ]
                #     },
                #     {
                #         "title": "A program title",
                #         "caption": "Owned by someone",
                #         "isFavourite": False,
                #         "chips": [
                #             { "type": 'program', "label": 'Program' },
                #             { "type": 'template', "label": 'Template' },
                #             { "type": 'default', "label": '23 workflows' }
                #         ]
                #     },
                #     {
                #         "title": "A course title",
                #         "caption": "Owned by someone",
                #         "isFavourite": False,
                #         "chips": [
                #             { "type": 'course', "label": 'Course' },
                #             { "type": 'template', "label": 'Template' },
                #             { "type": 'default', "label": '23 workflows' }
                #         ]
                #     },
                #     {
                #         "title": "An activity title",
                #         "caption": "Owned by someone",
                #         "isFavourite": True,
                #         "chips": [
                #             { "type": 'activity', "label": 'Activity' },
                #             { "type": 'template', "label": 'Template' },
                #             { "type": 'default', "label": '23 workflows' }
                #         ]
                #     }
                # ]
            }
        )
        .decode("utf-8"),
    }
    return JsonResponse({"data": context})
