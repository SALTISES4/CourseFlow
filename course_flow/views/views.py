from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseForbidden,
    JsonResponse,
)
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.translation import gettext as _
from django.views.generic import DetailView, ListView, TemplateView
from django.views.generic.edit import CreateView, UpdateView
from rest_framework.generics import ListAPIView
from rest_framework.renderers import JSONRenderer

from course_flow import export_functions
from course_flow.decorators import (
    ajax_login_required,
    check_object_enrollment,
    check_object_permission,
)
from course_flow.forms import RegistrationForm
from course_flow.models import (
    Activity,
    Course,
    CourseFlowUser,
    Discipline,
    LiveAssignment,
    LiveProject,
    LiveProjectUser,
    Notification,
    ObjectPermission,
    Program,
    Project,
    User,
    Workflow,
    WorkflowProject,
)
from course_flow.serializers import (
    DisciplineSerializer,
    InfoBoxSerializer,
    LiveAssignmentSerializer,
    LiveProjectSerializer,
    ProjectSerializerShallow,
)
from course_flow.utils import get_user_permission
from course_flow.view_utils import get_my_projects, get_workflow_context_data
from course_flow.views.json_api.search_api import get_explore_objects

# @todo not used?
# def get_my_shared(user):
#     data_package = {
#         "shared_projects": {
#             "title": _("Shared Projects"),
#             "sections": [
#                 {
#                     "title": _("Shared Projects"),
#                     "object_type": "project",
#                     "objects": InfoBoxSerializer(
#                         [
#                             user_permission.content_object
#                             for user_permission in ObjectPermission.objects.filter(
#                                 user=user,
#                                 content_type=ContentType.objects.get_for_model(
#                                     Project
#                                 ),
#                                 project__deleted=False,
#                             )
#                         ],
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "duplicate": "import",
#             "emptytext": _(
#                 "Projects shared with you by others (for which you have either view or edit permissions) will appear here."
#             ),
#         },
#         "shared_programs": {
#             "title": _("Shared Programs"),
#             "sections": [
#                 {
#                     "title": _("Shared Programs"),
#                     "object_type": "workflow",
#                     "objects": InfoBoxSerializer(
#                         [
#                             user_permission.content_object
#                             for user_permission in ObjectPermission.objects.filter(
#                                 user=user,
#                                 content_type=ContentType.objects.get_for_model(
#                                     Program
#                                 ),
#                                 program__deleted=False,
#                                 program__project__deleted=False,
#                             )
#                         ],
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "duplicate": "import",
#             "emptytext": _(
#                 "Programs shared with you by others (for which you have either view or edit permissions) will appear here."
#             ),
#         },
#         "shared_courses": {
#             "title": _("Shared Courses"),
#             "sections": [
#                 {
#                     "title": _("Shared Courses"),
#                     "object_type": "workflow",
#                     "objects": InfoBoxSerializer(
#                         [
#                             user_permission.content_object
#                             for user_permission in ObjectPermission.objects.filter(
#                                 user=user,
#                                 content_type=ContentType.objects.get_for_model(
#                                     Course
#                                 ),
#                                 course__deleted=False,
#                                 course__project__deleted=False,
#                             )
#                         ],
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "duplicate": "import",
#             "emptytext": _(
#                 "Courses shared with you by others (for which you have either view or edit permissions) will appear here."
#             ),
#         },
#         "shared_activities": {
#             "title": _("Shared Activities"),
#             "sections": [
#                 {
#                     "title": _("Shared Activities"),
#                     "object_type": "workflow",
#                     "objects": InfoBoxSerializer(
#                         [
#                             user_permission.content_object
#                             for user_permission in ObjectPermission.objects.filter(
#                                 user=user,
#                                 content_type=ContentType.objects.get_for_model(
#                                     Activity
#                                 ),
#                                 activity__deleted=False,
#                                 activity__project__deleted=False,
#                             )
#                         ],
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "duplicate": "import",
#             "emptytext": _(
#                 "Activities shared with you by others (for which you have either view or edit permissions) will appear here."
#             ),
#         },
#     }
#     return data_package

# @todo not used?
# def get_my_templates(user):
#     data_package = {
#         "owned_activity_templates": {
#             "title": _("My Activity Templates"),
#             "sections": [
#                 {
#                     "title": _("Add new"),
#                     "object_type": "activity",
#                     "is_strategy": True,
#                     "objects": InfoBoxSerializer(
#                         Activity.objects.filter(
#                             author=user, deleted=False, is_strategy=True
#                         ),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "add": True,
#             "duplicate": "copy",
#             "emptytext": _(
#                 "Activity templates, also known as Strategies, are reusable sections of activities you can drag and drop into your workflows. Click Add New above to get started."
#             ),
#         },
#         "owned_course_templates": {
#             "title": _("My Course Templates"),
#             "sections": [
#                 {
#                     "title": _("Add new"),
#                     "object_type": "course",
#                     "is_strategy": True,
#                     "objects": InfoBoxSerializer(
#                         Course.objects.filter(
#                             author=user, deleted=False, is_strategy=True
#                         ),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "add": True,
#             "duplicate": "copy",
#             "emptytext": _(
#                 "Course templates are reusable sections of courses you can drag and drop into your workflows. Click Add New above to get started."
#             ),
#         },
#         "edit_templates": {
#             "title": _("Shared With Me"),
#             "sections": [
#                 {
#                     "title": _("Templates I've Been Added To"),
#                     "object_type": "workflow",
#                     "is_strategy": True,
#                     "objects": InfoBoxSerializer(
#                         [
#                             user_permission.content_object
#                             for user_permission in ObjectPermission.objects.filter(
#                                 user=user,
#                                 activity__is_strategy=True,
#                                 activity__deleted=False,
#                             )
#                         ]
#                         + [
#                             user_permission.content_object
#                             for user_permission in ObjectPermission.objects.filter(
#                                 user=user,
#                                 course__is_strategy=True,
#                                 course__deleted=False,
#                             )
#                         ],
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "duplicate": "import",
#             "emptytext": _(
#                 "Templates shared with you by others (for which you have either view or edit permissions) will appear here."
#             ),
#         },
#         "restore_templates": {
#             "title": _("Restore Deleted"),
#             "sections": [
#                 {
#                     "title": _("Restore deleted"),
#                     "object_type": "workflow",
#                     "is_strategy": True,
#                     "objects": InfoBoxSerializer(
#                         list(
#                             Workflow.objects.filter(
#                                 Q(course__author=user)
#                                 | Q(activity__author=user),
#                                 is_strategy=True,
#                                 deleted=True,
#                             )
#                         )
#                         + [
#                             user_permission.content_object
#                             for user_permission in ObjectPermission.objects.filter(
#                                 user=user,
#                             )
#                             .filter(
#                                 Q(activity__is_strategy=True)
#                                 | Q(course__is_strategy=True)
#                             )
#                             .filter(
#                                 Q(activity__deleted=True)
#                                 | Q(course__deleted=True)
#                             )
#                         ],
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "duplicate": "import",
#             "emptytext": _(
#                 "Templates shared with you by others (for which you have either view or edit permissions) will appear here."
#             ),
#         },
#     }
#     return data_package

# @todo not used?
# def get_data_package_for_project(user, project):
#     data_package = {
#         "current_project": {
#             "title": _("All Workflows"),
#             "sections": [
#                 {
#                     "title": _("Add new"),
#                     "object_type": "workflow",
#                     "objects": InfoBoxSerializer(
#                         Program.objects.filter(project=project, deleted=False),
#                         many=True,
#                         context={"user": user},
#                     ).data
#                     + InfoBoxSerializer(
#                         Course.objects.filter(project=project, deleted=False),
#                         many=True,
#                         context={"user": user},
#                     ).data
#                     + InfoBoxSerializer(
#                         Activity.objects.filter(
#                             project=project, deleted=False
#                         ),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 },
#             ],
#             "add": True,
#             "duplicate": "copy",
#             "emptytext": _(
#                 "Workflows are the basic content object of CourseFlow, representing either a Program, Course, or Activity. Workflows you add to this project will be shown here. Click the button above to create a or import a workflow to get started."
#             ),
#         },
#         "current_activity": {
#             "title": _("Activities"),
#             "sections": [
#                 {
#                     "title": _("Add new"),
#                     "object_type": "activity",
#                     "objects": InfoBoxSerializer(
#                         Activity.objects.filter(
#                             project=project, deleted=False
#                         ),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 },
#             ],
#             "add": True,
#             "duplicate": "copy",
#             "emptytext": _(
#                 "Activities can be used to plan a single lesson/assessment, or multiple linked lessons/assessments. Click the button above to create or import an activity."
#             ),
#         },
#         "current_course": {
#             "title": _("Courses"),
#             "sections": [
#                 {
#                     "title": _("Add new"),
#                     "object_type": "course",
#                     "objects": InfoBoxSerializer(
#                         Course.objects.filter(project=project, deleted=False),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 },
#             ],
#             "add": True,
#             "duplicate": "copy",
#             "emptytext": _(
#                 "Courses can be used to plan a course and its related learning outcomes. Click the button above to create or import a course."
#             ),
#         },
#         "current_program": {
#             "title": _("Programs"),
#             "sections": [
#                 {
#                     "title": _("Add new"),
#                     "object_type": "program",
#                     "objects": InfoBoxSerializer(
#                         Program.objects.filter(project=project, deleted=False),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 },
#             ],
#             "add": True,
#             "duplicate": "copy",
#             "emptytext": _(
#                 "Programs can be used to plan a curriculum and its related learning outcomes. Click the button above to create or import a program."
#             ),
#         },
#         "deleted_workflows": {
#             "title": _("Restore Deleted"),
#             "sections": [
#                 {
#                     "title": _("Restore Deleted"),
#                     "object_type": "workflow",
#                     "objects": InfoBoxSerializer(
#                         Program.objects.filter(project=project, deleted=True),
#                         many=True,
#                         context={"user": user},
#                     ).data
#                     + InfoBoxSerializer(
#                         Course.objects.filter(project=project, deleted=True),
#                         many=True,
#                         context={"user": user},
#                     ).data
#                     + InfoBoxSerializer(
#                         Activity.objects.filter(project=project, deleted=True),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 },
#             ],
#             "emptytext": _("Deleted workflows can be restored here"),
#         },
#     }
#     return data_package
