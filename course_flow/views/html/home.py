from django.conf import settings
from course_flow.models.objectPermission import ObjectPermission
from django.contrib.auth.models import Group
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from course_flow.serializers import InfoBoxSerializer
from django.db.models import Q
from course_flow.templatetags.course_flow_templatetags import has_group
from rest_framework.renderers import JSONRenderer


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
        projects_serialized = InfoBoxSerializer(
            projects, many=True, context={"user": user}
        ).data

    context = {
        "title": "Home",
        "path_id": "home",
        "contextData": JSONRenderer().render(
            {
                "isTeacher": has_group(user, "Teacher"),
                "projects": projects_serialized,
                # TODO: Figure out how to handle the templates
                "templates": []
            }
        ).decode("utf-8")
    }

    return render(request, "course_flow/react/common_entrypoint.html", context)
