#########################################################
#  Plain html routes
#########################################################
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.shortcuts import render

from course_flow.decorators import ignore_extra_args


#########################################################
# mixins
#########################################################
def is_teacher(user):
    return Group.objects.get(name=settings.TEACHER_GROUP) in user.groups.all()


@login_required
@ignore_extra_args
def default_react_view(request):
    context = {}
    return render(
        request, "course_flow/html/react_common_entrypoint.html", context
    )
