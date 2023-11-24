import json
import math
import re
import time

# import time
from functools import reduce
from itertools import chain
from operator import attrgetter

import bleach
import pandas as pd
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Count, ProtectedError, Q
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseForbidden,
    JsonResponse,
)
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST
from django.views.generic import DetailView, ListView, TemplateView
from django.views.generic.edit import CreateView, UpdateView
from rest_framework.generics import ListAPIView
from rest_framework.renderers import JSONRenderer

from course_flow import export_functions
from course_flow import redux_actions as actions
from course_flow import tasks
from course_flow.decorators import (
    ajax_login_required,
    check_object_enrollment,
    check_object_permission,
    from_same_workflow,
    public_model_access,
    user_can_comment,
    user_can_delete,
    user_can_edit,
    user_can_edit_or_none,
    user_can_view,
    user_can_view_or_enrolled_as_student,
    user_can_view_or_enrolled_as_teacher,
    user_can_view_or_none,
    user_enrolled_as_student,
    user_enrolled_as_teacher,
    user_is_author,
    user_is_teacher,
)
from course_flow.forms import RegistrationForm
from course_flow.models import (  # OutcomeProject,
    Activity,
    Column,
    ColumnWorkflow,
    Course,
    CourseFlowUser,
    Discipline,
    Favourite,
    LiveAssignment,
    LiveProject,
    LiveProjectUser,
    Node,
    NodeLink,
    NodeWeek,
    Notification,
    ObjectPermission,
    ObjectSet,
    Outcome,
    OutcomeHorizontalLink,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    Program,
    Project,
    User,
    UserAssignment,
    Week,
    WeekWorkflow,
    Workflow,
    WorkflowProject,
)
from course_flow.serializers import (  # OutcomeProjectSerializerShallow,
    ActivitySerializerShallow,
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    CommentSerializer,
    CourseSerializerShallow,
    DisciplineSerializer,
    InfoBoxSerializer,
    LinkedWorkflowSerializerShallow,
    LiveAssignmentSerializer,
    LiveAssignmentWithCompletionSerializer,
    LiveProjectSerializer,
    LiveProjectUserSerializer,
    LiveProjectUserSerializerWithCompletion,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    ObjectSetSerializerShallow,
    OutcomeHorizontalLinkSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    ProjectSerializerShallow,
    RefreshSerializerNode,
    RefreshSerializerOutcome,
    UserAssignmentSerializer,
    UserAssignmentSerializerWithUser,
    UserSerializer,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
    WorkflowSerializerForAssignments,
    WorkflowSerializerShallow,
    bleach_allowed_tags_description,
    bleach_allowed_tags_title,
    bleach_sanitizer,
    serializer_lookups_shallow,
)
from course_flow.utils import (  # dateTimeFormat,; get_parent_model,; get_parent_model_str,; get_unique_outcomehorizontallinks,; get_unique_outcomenodes,
    benchmark,
    check_possible_parent,
    dateTimeFormatNoSpace,
    get_all_outcomes_for_outcome,
    get_all_outcomes_for_workflow,
    get_descendant_outcomes,
    get_model_from_str,
    get_nondeleted_favourites,
    get_parent_nodes_for_workflow,
    get_relevance,
    get_user_permission,
    get_user_role,
    save_serializer,
)


class ContentPublicViewMixin(UserPassesTestMixin):
    def test_func(self):
        return self.get_object().public_view


class UserCanViewMixin(UserPassesTestMixin):
    def test_func(self):
        view_object = self.get_object()
        if Group.objects.get(
            name=settings.TEACHER_GROUP
        ) in self.request.user.groups.all() and (
            check_object_permission(
                view_object,
                self.request.user,
                ObjectPermission.PERMISSION_VIEW,
            )
        ):
            ObjectPermission.update_last_viewed(self.request.user, view_object)
            Notification.objects.filter(
                object_id=view_object.id,
                content_type=ContentType.objects.get_for_model(view_object),
                user=self.request.user,
                is_unread=True,
                notification_type=Notification.TYPE_SHARED,
            ).update(is_unread=False)
            return True
        return False


class UserCanViewOrEnrolledMixin(UserPassesTestMixin):
    def test_func(self):
        view_object = self.get_object()
        if Group.objects.get(
            name=settings.TEACHER_GROUP
        ) in self.request.user.groups.all() and (
            check_object_permission(
                view_object,
                self.request.user,
                ObjectPermission.PERMISSION_VIEW,
            )
        ):
            ObjectPermission.update_last_viewed(self.request.user, view_object)
            return True
        else:
            try:
                if check_object_enrollment(
                    view_object,
                    self.request.user,
                    LiveProjectUser.ROLE_STUDENT,
                ):
                    ObjectPermission.update_last_viewed(
                        self.request.user, view_object
                    )
                    return True
            except AttributeError:
                return False
        return False


class UserEnrolledMixin(UserPassesTestMixin):
    def test_func(self):
        liveproject = self.get_object().get_live_project()
        if liveproject is None:
            return False
        project = liveproject.project
        if liveproject is None:
            return False
        if (
            LiveProjectUser.objects.filter(
                user=self.request.user, liveproject=liveproject
            )
            .exclude(role_type=LiveProjectUser.ROLE_NONE)
            .count()
            > 0
        ):
            return True
        elif project.author == self.request.user:
            LiveProjectUser.objects.create(
                user=self.request.user,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_TEACHER,
            )
            return True
        return False


class UserEnrolledAsTeacherMixin(UserPassesTestMixin):
    def test_func(self):
        liveproject = self.get_object().get_live_project()

        project = liveproject.project
        if liveproject is None:
            return False
        if (
            LiveProjectUser.objects.filter(
                user=self.request.user,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_TEACHER,
            ).count()
            > 0
        ):
            return True
        elif project.author == self.request.user:
            LiveProjectUser.objects.create(
                user=self.request.user,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_TEACHER,
            )
            return True
        return False


class UserCanEditMixin(UserPassesTestMixin):
    def test_func(self):
        view_object = self.get_object()
        if Group.objects.get(
            name=settings.TEACHER_GROUP
        ) in self.request.user.groups.all() and (
            check_object_permission(
                view_object,
                self.request.user,
                ObjectPermission.PERMISSION_EDIT,
            )
        ):
            ObjectPermission.update_last_viewed(self.request.user, view_object)
            return True
        return False


class UserCanEditProjectMixin(UserPassesTestMixin):
    def test_func(self):
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        return Group.objects.get(
            name=settings.TEACHER_GROUP
        ) in self.request.user.groups.all() and (
            check_object_permission(
                project, self.request.user, ObjectPermission.PERMISSION_EDIT
            )
        )


class CreateView_No_Autocomplete(CreateView):
    def get_form(self, *args, **kwargs):
        form = super(CreateView, self).get_form()
        form.fields["title"].widget.attrs.update({"autocomplete": "off"})
        form.fields["description"].widget.attrs.update({"autocomplete": "off"})
        return form


def ratelimited_view(request, exception):
    return HttpResponse(
        "Error: too many requests to public page. Please wait at least one minute then try again.",
        status=429,
    )


def registration_view(request):
    if request.method == "POST":
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get("username")
            raw_password = form.cleaned_data.get("password1")
            user = authenticate(username=username, password=raw_password)
            teacher_group, _ = Group.objects.get_or_create(
                name=settings.TEACHER_GROUP
            )
            user.groups.add(teacher_group)
            login(request, user)
            return redirect("course_flow:home")
    else:
        form = RegistrationForm()
    return render(
        request, "course_flow/registration/registration.html", {"form": form}
    )


@ajax_login_required
def logout_view(request):
    logout(request)
    return redirect(reverse("login"))


class ExploreView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )

    template_name = "course_flow/explore.html"

    def get_context_data(self):
        initial_workflows, pages = get_explore_objects(
            self.request.user,
            "",
            20,
            True,
            {"sort": "created_on", "sort_reversed": True},
        )
        return {
            "initial_workflows": JSONRenderer()
            .render(
                InfoBoxSerializer(
                    initial_workflows,
                    context={"user": self.request.user},
                    many=True,
                ).data
            )
            .decode("utf-8"),
            "initial_pages": JSONRenderer().render(pages).decode("utf-8"),
            "disciplines": JSONRenderer()
            .render(
                DisciplineSerializer(Discipline.objects.all(), many=True).data
            )
            .decode("utf-8"),
        }


def get_my_projects(user, add, **kwargs):
    for_add = kwargs.get("for_add", False)
    permission_filter = {}
    if for_add:
        permission_filter["permission_type"] = ObjectPermission.PERMISSION_EDIT

    data_package = {
        "owned_projects": {
            "title": _("My Projects"),
            "sections": [
                {
                    "title": _("Add new"),
                    "object_type": "project",
                    "objects": InfoBoxSerializer(
                        Project.objects.filter(author=user, deleted=False),
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "add": add,
            "duplicate": "copy",
            "emptytext": _(
                "Projects are used to organize your Programs, Courses, and Activities. Projects you create will be shown here. Click the button above to create a or import a project to get started."
            ),
        },
        "edit_projects": {
            "title": _("Shared With Me"),
            "sections": [
                {
                    "title": _("Projects I've Been Added To"),
                    "object_type": "project",
                    "objects": InfoBoxSerializer(
                        [
                            user_permission.content_object
                            for user_permission in ObjectPermission.objects.filter(
                                user=user,
                                content_type=ContentType.objects.get_for_model(
                                    Project
                                ),
                                project__deleted=False,
                                **permission_filter,
                            )
                        ],
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Projects shared with you by others (for which you have either view or edit permissions) will appear here."
            ),
        },
    }
    if not for_add:
        data_package["deleted_projects"] = {
            "title": _("Restore Projects"),
            "sections": [
                {
                    "title": _("Restore Projects"),
                    "object_type": "project",
                    "objects": InfoBoxSerializer(
                        list(Project.objects.filter(author=user, deleted=True))
                        + [
                            user_permission.content_object
                            for user_permission in ObjectPermission.objects.filter(
                                user=user,
                                content_type=ContentType.objects.get_for_model(
                                    Project
                                ),
                                project__deleted=True,
                            )
                        ],
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "emptytext": _(
                "Projects you have deleted can be restored from here."
            ),
        }
    return data_package


def get_my_shared(user):
    data_package = {
        "shared_projects": {
            "title": _("Shared Projects"),
            "sections": [
                {
                    "title": _("Shared Projects"),
                    "object_type": "project",
                    "objects": InfoBoxSerializer(
                        [
                            user_permission.content_object
                            for user_permission in ObjectPermission.objects.filter(
                                user=user,
                                content_type=ContentType.objects.get_for_model(
                                    Project
                                ),
                                project__deleted=False,
                            )
                        ],
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Projects shared with you by others (for which you have either view or edit permissions) will appear here."
            ),
        },
        "shared_programs": {
            "title": _("Shared Programs"),
            "sections": [
                {
                    "title": _("Shared Programs"),
                    "object_type": "workflow",
                    "objects": InfoBoxSerializer(
                        [
                            user_permission.content_object
                            for user_permission in ObjectPermission.objects.filter(
                                user=user,
                                content_type=ContentType.objects.get_for_model(
                                    Program
                                ),
                                program__deleted=False,
                                program__project__deleted=False,
                            )
                        ],
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Programs shared with you by others (for which you have either view or edit permissions) will appear here."
            ),
        },
        "shared_courses": {
            "title": _("Shared Courses"),
            "sections": [
                {
                    "title": _("Shared Courses"),
                    "object_type": "workflow",
                    "objects": InfoBoxSerializer(
                        [
                            user_permission.content_object
                            for user_permission in ObjectPermission.objects.filter(
                                user=user,
                                content_type=ContentType.objects.get_for_model(
                                    Course
                                ),
                                course__deleted=False,
                                course__project__deleted=False,
                            )
                        ],
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Courses shared with you by others (for which you have either view or edit permissions) will appear here."
            ),
        },
        "shared_activities": {
            "title": _("Shared Activities"),
            "sections": [
                {
                    "title": _("Shared Activities"),
                    "object_type": "workflow",
                    "objects": InfoBoxSerializer(
                        [
                            user_permission.content_object
                            for user_permission in ObjectPermission.objects.filter(
                                user=user,
                                content_type=ContentType.objects.get_for_model(
                                    Activity
                                ),
                                activity__deleted=False,
                                activity__project__deleted=False,
                            )
                        ],
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Activities shared with you by others (for which you have either view or edit permissions) will appear here."
            ),
        },
    }
    return data_package


def get_my_templates(user):
    data_package = {
        "owned_activity_templates": {
            "title": _("My Activity Templates"),
            "sections": [
                {
                    "title": _("Add new"),
                    "object_type": "activity",
                    "is_strategy": True,
                    "objects": InfoBoxSerializer(
                        Activity.objects.filter(
                            author=user, deleted=False, is_strategy=True
                        ),
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "add": True,
            "duplicate": "copy",
            "emptytext": _(
                "Activity templates, also known as Strategies, are reusable sections of activities you can drag and drop into your workflows. Click Add New above to get started."
            ),
        },
        "owned_course_templates": {
            "title": _("My Course Templates"),
            "sections": [
                {
                    "title": _("Add new"),
                    "object_type": "course",
                    "is_strategy": True,
                    "objects": InfoBoxSerializer(
                        Course.objects.filter(
                            author=user, deleted=False, is_strategy=True
                        ),
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "add": True,
            "duplicate": "copy",
            "emptytext": _(
                "Course templates are reusable sections of courses you can drag and drop into your workflows. Click Add New above to get started."
            ),
        },
        "edit_templates": {
            "title": _("Shared With Me"),
            "sections": [
                {
                    "title": _("Templates I've Been Added To"),
                    "object_type": "workflow",
                    "is_strategy": True,
                    "objects": InfoBoxSerializer(
                        [
                            user_permission.content_object
                            for user_permission in ObjectPermission.objects.filter(
                                user=user,
                                activity__is_strategy=True,
                                activity__deleted=False,
                            )
                        ]
                        + [
                            user_permission.content_object
                            for user_permission in ObjectPermission.objects.filter(
                                user=user,
                                course__is_strategy=True,
                                course__deleted=False,
                            )
                        ],
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Templates shared with you by others (for which you have either view or edit permissions) will appear here."
            ),
        },
        "restore_templates": {
            "title": _("Restore Deleted"),
            "sections": [
                {
                    "title": _("Restore deleted"),
                    "object_type": "workflow",
                    "is_strategy": True,
                    "objects": InfoBoxSerializer(
                        list(
                            Workflow.objects.filter(
                                Q(course__author=user)
                                | Q(activity__author=user),
                                is_strategy=True,
                                deleted=True,
                            )
                        )
                        + [
                            user_permission.content_object
                            for user_permission in ObjectPermission.objects.filter(
                                user=user,
                            )
                            .filter(
                                Q(activity__is_strategy=True)
                                | Q(course__is_strategy=True)
                            )
                            .filter(
                                Q(activity__deleted=True)
                                | Q(course__deleted=True)
                            )
                        ],
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Templates shared with you by others (for which you have either view or edit permissions) will appear here."
            ),
        },
    }
    return data_package


# def get_my_favourites(user):
#     favourites = get_nondeleted_favourites(user)

#     def get_content_objects(favourite_list):
#         return list(map(lambda x: x.content_object, favourite_list))

#     data_package = {
#         "favourites_all": {
#             "title": _("My Favourites"),
#             "sections": [
#                 {
#                     "title": "",
#                     "object_type": "project",
#                     "objects": InfoBoxSerializer(
#                         get_content_objects(favourites),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "duplicate": "import",
#             "emptytext": _(
#                 "Your favourite projects, workflows, or templates by other users will appear here. You can find published content from other users using the Explore feature in the top toolbar."
#             ),
#         },
#         "favourites_project": {
#             "title": _("Projects"),
#             "sections": [
#                 {
#                     "title": "",
#                     "object_type": "project",
#                     "objects": InfoBoxSerializer(
#                         get_content_objects(
#                             favourites.filter(
#                                 project__pk__gt=0, project__deleted=False
#                             )
#                         ),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "duplicate": "import",
#             "emptytext": _(
#                 "Your favourite activities by other users will appear here. You can find published content from other users using the Explore feature in the top toolbar."
#             ),
#         },
#         "favourites_activity": {
#             "title": _("Activities"),
#             "sections": [
#                 {
#                     "title": "",
#                     "object_type": "activity",
#                     "objects": InfoBoxSerializer(
#                         get_content_objects(
#                             favourites.filter(
#                                 activity__pk__gt=0, activity__deleted=False
#                             )
#                         ),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "duplicate": "import",
#             "emptytext": _(
#                 "Your favourite activities by other users will appear here. You can find published content from other users using the Explore feature in the top toolbar."
#             ),
#         },
#         "favourites_course": {
#             "title": _("Courses"),
#             "sections": [
#                 {
#                     "title": "",
#                     "object_type": "course",
#                     "objects": InfoBoxSerializer(
#                         get_content_objects(
#                             favourites.filter(
#                                 course__pk__gt=0, course__deleted=False
#                             )
#                         ),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "duplicate": "import",
#             "emptytext": _(
#                 "Your favourite courses by other users will appear here. You can find published content from other users using the Explore feature in the top toolbar."
#             ),
#         },
#         "favourites_program": {
#             "title": _("Program"),
#             "sections": [
#                 {
#                     "title": "",
#                     "object_type": "program",
#                     "objects": InfoBoxSerializer(
#                         get_content_objects(
#                             favourites.filter(
#                                 program__pk__gt=0, program__deleted=False
#                             )
#                         ),
#                         many=True,
#                         context={"user": user},
#                     ).data,
#                 }
#             ],
#             "duplicate": "import",
#             "emptytext": _(
#                 "Your favourite programs by other users will appear here. You can find published content from other users using the Explore feature in the top toolbar."
#             ),
#         },
#     }
#     return data_package


def get_data_package_for_project(user, project):
    data_package = {
        "current_project": {
            "title": _("All Workflows"),
            "sections": [
                {
                    "title": _("Add new"),
                    "object_type": "workflow",
                    "objects": InfoBoxSerializer(
                        Program.objects.filter(project=project, deleted=False),
                        many=True,
                        context={"user": user},
                    ).data
                    + InfoBoxSerializer(
                        Course.objects.filter(project=project, deleted=False),
                        many=True,
                        context={"user": user},
                    ).data
                    + InfoBoxSerializer(
                        Activity.objects.filter(
                            project=project, deleted=False
                        ),
                        many=True,
                        context={"user": user},
                    ).data,
                },
            ],
            "add": True,
            "duplicate": "copy",
            "emptytext": _(
                "Workflows are the basic content object of CourseFlow, representing either a Program, Course, or Activity. Workflows you add to this project will be shown here. Click the button above to create a or import a workflow to get started."
            ),
        },
        "current_activity": {
            "title": _("Activities"),
            "sections": [
                {
                    "title": _("Add new"),
                    "object_type": "activity",
                    "objects": InfoBoxSerializer(
                        Activity.objects.filter(
                            project=project, deleted=False
                        ),
                        many=True,
                        context={"user": user},
                    ).data,
                },
            ],
            "add": True,
            "duplicate": "copy",
            "emptytext": _(
                "Activities can be used to plan a single lesson/assessment, or multiple linked lessons/assessments. Click the button above to create or import an activity."
            ),
        },
        "current_course": {
            "title": _("Courses"),
            "sections": [
                {
                    "title": _("Add new"),
                    "object_type": "course",
                    "objects": InfoBoxSerializer(
                        Course.objects.filter(project=project, deleted=False),
                        many=True,
                        context={"user": user},
                    ).data,
                },
            ],
            "add": True,
            "duplicate": "copy",
            "emptytext": _(
                "Courses can be used to plan a course and its related learning outcomes. Click the button above to create or import a course."
            ),
        },
        "current_program": {
            "title": _("Programs"),
            "sections": [
                {
                    "title": _("Add new"),
                    "object_type": "program",
                    "objects": InfoBoxSerializer(
                        Program.objects.filter(project=project, deleted=False),
                        many=True,
                        context={"user": user},
                    ).data,
                },
            ],
            "add": True,
            "duplicate": "copy",
            "emptytext": _(
                "Programs can be used to plan a curriculum and its related learning outcomes. Click the button above to create or import a program."
            ),
        },
        "deleted_workflows": {
            "title": _("Restore Deleted"),
            "sections": [
                {
                    "title": _("Restore Deleted"),
                    "object_type": "workflow",
                    "objects": InfoBoxSerializer(
                        Program.objects.filter(project=project, deleted=True),
                        many=True,
                        context={"user": user},
                    ).data
                    + InfoBoxSerializer(
                        Course.objects.filter(project=project, deleted=True),
                        many=True,
                        context={"user": user},
                    ).data
                    + InfoBoxSerializer(
                        Activity.objects.filter(project=project, deleted=True),
                        many=True,
                        context={"user": user},
                    ).data,
                },
            ],
            "emptytext": _("Deleted workflows can be restored here"),
        },
    }
    return data_package


def get_workflow_info_boxes(user, workflow_type, **kwargs):
    project = kwargs.get("project", None)
    this_project = kwargs.get("this_project", True)
    get_strategies = kwargs.get("get_strategies", False)
    get_favourites = kwargs.get("get_favourites", False)
    model = get_model_from_str(workflow_type)
    permissions_view = {
        "user_permissions__user": user,
        "user_permissions__permission_type": ObjectPermission.PERMISSION_EDIT,
    }
    permissions_edit = {
        "user_permissions__user": user,
        "user_permissions__permission_type": ObjectPermission.PERMISSION_EDIT,
    }
    items = []
    if project is not None:
        # Add everything from the current project
        if this_project:
            items += model.objects.filter(
                project=project, is_strategy=False, deleted=False
            )
        # Add everything from other projects that the user has access to
        else:
            items += (
                list(
                    model.objects.filter(
                        author=user, is_strategy=False, deleted=False
                    ).exclude(project=project)
                )
                + list(
                    model.objects.filter(**permissions_edit)
                    .exclude(
                        project=project,
                    )
                    .exclude(project=None)
                    .exclude(Q(deleted=True) | Q(project__deleted=True))
                )
                + list(
                    model.objects.filter(**permissions_view)
                    .exclude(
                        project=project, deleted=False, project__deleted=True
                    )
                    .exclude(project=None)
                    .exclude(Q(deleted=True) | Q(project__deleted=True))
                )
            )
    else:
        favourites_and_strategies = {}
        published_or_user = {}
        if get_strategies:
            favourites_and_strategies["is_strategy"] = True
        elif workflow_type != "project":
            favourites_and_strategies["is_strategy"] = False
        if get_favourites:
            favourites_and_strategies["favourited_by__user"] = user
            published_or_user["published"] = True
        else:
            published_or_user["author"] = user
        if workflow_type == "project":
            exclude = Q(deleted=True)
        else:
            exclude = Q(deleted=True) | Q(project__deleted=True)
        items += (
            list(
                model.objects.filter(
                    **published_or_user,
                    **favourites_and_strategies,
                ).exclude(exclude)
            )
            + list(
                model.objects.filter(
                    **permissions_edit,
                    **favourites_and_strategies,
                ).exclude(exclude)
            )
            + list(
                model.objects.filter(
                    **permissions_view,
                    **favourites_and_strategies,
                ).exclude(exclude)
            )
        )

    return InfoBoxSerializer(items, many=True, context={"user": user}).data


# Retrieves a package of workflows and projects matching the specifications.
def get_workflow_data_package(user, project, **kwargs):
    type_filter = kwargs.get("type_filter", "workflow")
    self_only = kwargs.get("self_only", False)
    get_strategies = kwargs.get("get_strategies", False)
    this_project_sections = []
    all_published_sections = []
    for this_type in ["program", "course", "activity"]:
        if type_filter == "workflow" or type_filter == this_type:
            this_project_sections.append(
                {
                    "title": "",
                    "object_type": this_type,
                    "is_strategy": get_strategies,
                    "objects": get_workflow_info_boxes(
                        user,
                        this_type,
                        project=project,
                        this_project=True,
                        get_strategies=get_strategies,
                    ),
                }
            )
            if not self_only:
                all_published_sections.append(
                    {
                        "title": "",
                        "object_type": this_type,
                        "is_strategy": get_strategies,
                        "objects": get_workflow_info_boxes(
                            user,
                            this_type,
                            get_strategies=get_strategies,
                            get_favourites=True,
                        ),
                    }
                )
    if type_filter == "project":
        this_project_sections.append(
            {
                "title": "",
                "object_type": type_filter,
                "is_strategy": get_strategies,
                "objects": get_workflow_info_boxes(user, type_filter),
            }
        )
        if not self_only:
            all_published_sections.append(
                {
                    "title": "",
                    "object_type": type_filter,
                    "is_strategy": get_strategies,
                    "objects": get_workflow_info_boxes(
                        user, type_filter, get_favourites=True
                    ),
                }
            )

    first_header = _("This Project")
    empty_text = _("There are no applicable workflows in this project.")
    if project is None:
        first_header = _("Owned By You")
        empty_text = _("You do not own any projects. Create a project first.")
    data_package = {
        "current_project": {
            "title": first_header,
            "sections": this_project_sections,
            "emptytext": _(empty_text),
        },
    }
    if not self_only:
        data_package["all_published"] = {
            "title": _("Your Favourites"),
            "sections": all_published_sections,
            "emptytext": _(
                "You have no relevant favourites. Use the Explore menu to find and favourite content by other users."
            ),
        }
    return data_package


@login_required
def home_view(request):
    return render(request, "course_flow/home.html")


@login_required
def myprojects_view(request):
    context = {
        "project_data_package": JSONRenderer()
        .render(get_my_projects(request.user, True))
        .decode("utf-8")
    }
    return render(request, "course_flow/myprojects.html", context)


@login_required
def mylibrary_view(request):
    return render(request, "course_flow/library.html")


@login_required
def myfavourites_view(request):
    return render(request, "course_flow/favourites.html")


# @login_required
# def myshared_view(request):
#     context = {
#         "project_data_package": JSONRenderer()
#         .render(get_my_shared(request.user))
#         .decode("utf-8")
#     }
#     return render(request, "course_flow/myshared.html", context)


# @login_required
# def mytemplates_view(request):
#     context = {
#         "project_data_package": JSONRenderer()
#         .render(get_my_templates(request.user))
#         .decode("utf-8")
#     }
#     return render(request, "course_flow/mytemplates.html", context)


# @login_required
# def myfavourites_view(request):
#     context = {
#         "project_data_package": JSONRenderer()
#         .render(get_my_favourites(request.user))
#         .decode("utf-8")
#     }
#     return render(request, "course_flow/mytemplates.html", context)


@login_required
def import_view(request):
    return render(request, "course_flow/import.html")


class SALTISEAnalyticsView(
    LoginRequiredMixin, UserPassesTestMixin, TemplateView
):
    template_name = "course_flow/saltise_analytics.html"

    def test_func(self):
        return (
            Group.objects.get(name="SALTISE_Staff")
            in self.request.user.groups.all()
        )

    def get_context_data(self, **kwargs):
        context = super(TemplateView, self).get_context_data(**kwargs)
        context["notified_users"] = User.objects.filter(
            courseflow_user__notifications=True
        )
        return context


class SALTISEAdminView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    template_name = "course_flow/saltise_admin.html"

    def test_func(self):
        return (
            Group.objects.get(name="SALTISE_Staff")
            in self.request.user.groups.all()
        )


class UserUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = CourseFlowUser
    fields = ["first_name", "last_name", "notifications"]
    template_name = "course_flow/courseflowuser_update.html"

    def test_func(self):
        user = self.request.user
        courseflow_user = CourseFlowUser.objects.filter(user=user).first()
        if courseflow_user is None:
            courseflow_user = CourseFlowUser.objects.create(
                first_name=user.first_name, last_name=user.last_name, user=user
            )
        self.kwargs["pk"] = courseflow_user.pk
        return True

    def get_form(self, *args, **kwargs):
        form = super(UpdateView, self).get_form()
        return form

    def get_success_url(self):
        return reverse("course_flow:user-update")


class UserNotificationsView(LoginRequiredMixin, ListView):
    model = Notification
    paginate_by = 25
    template_name = "course_flow/notifications.html"

    def get_queryset(self, **kwargs):
        return self.request.user.notifications.all()

    def get_form(self, *args, **kwargs):
        form = super(UpdateView, self).get_form()
        return form


@ajax_login_required
def select_notifications(request: HttpRequest) -> HttpResponse:
    notifications = json.loads(request.POST.get("notifications"))
    try:
        courseflowuser = CourseFlowUser.ensure_user(request.user)
        courseflowuser.notifications = notifications
        courseflowuser.notifications_active = True
        courseflowuser.save()
    except ObjectDoesNotExist:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})


class ProjectCreateView(
    LoginRequiredMixin, UserPassesTestMixin, CreateView_No_Autocomplete
):
    model = Project
    fields = ["title", "description"]
    template_name = "course_flow/workflow_create.html"

    def workflow_type(self):
        return "project"

    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super(ProjectCreateView, self).form_valid(form)

    def get_success_url(self):
        return reverse(
            "course_flow:project-update", kwargs={"pk": self.object.pk}
        )


class ProjectDetailView(LoginRequiredMixin, UserCanViewMixin, DetailView):
    model = Project
    fields = ["title", "description", "published"]
    template_name = "course_flow/project_update.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        project = self.object
        context["project_data"] = (
            JSONRenderer()
            .render(
                ProjectSerializerShallow(
                    project, context={"user": self.request.user}
                ).data
            )
            .decode("utf-8")
        )
        context["disciplines"] = (
            JSONRenderer()
            .render(
                DisciplineSerializer(
                    Discipline.objects.order_by("title"), many=True
                ).data
            )
            .decode("utf-8")
        )
        if hasattr(project, "liveproject") and project.liveproject is not None:
            context["user_role"] = (
                JSONRenderer()
                .render(get_user_role(project.liveproject, self.request.user))
                .decode("utf-8")
            )
        else:
            context["user_role"] = (
                JSONRenderer()
                .render(LiveProjectUser.ROLE_NONE)
                .decode("utf-8")
            )
        context["user_permission"] = (
            JSONRenderer()
            .render(get_user_permission(project, self.request.user))
            .decode("utf-8")
        )

        return context


class ProjectComparisonView(LoginRequiredMixin, UserCanViewMixin, DetailView):
    model = Project
    fields = ["title", "description", "published"]
    template_name = "course_flow/comparison.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        user = self.request.user
        project = self.object
        context["project_data"] = (
            JSONRenderer()
            .render(
                ProjectSerializerShallow(project, context={"user": user}).data
            )
            .decode("utf-8")
        )
        context["is_strategy"] = JSONRenderer().render(False).decode("utf-8")

        user_permission = get_user_permission(project, user)
        user_role = get_user_role(project, user)
        context["user_permission"] = (
            JSONRenderer().render(user_permission).decode("utf-8")
        )
        context["user_role"] = JSONRenderer().render(user_role).decode("utf-8")

        return context


def get_parent_outcome_data(workflow, user):
    outcomes, outcomeoutcomes = get_all_outcomes_for_workflow(workflow)
    parent_nodes = get_parent_nodes_for_workflow(workflow)
    parent_workflows = list(map(lambda x: x.get_workflow(), parent_nodes))
    parent_outcomeworkflows = OutcomeWorkflow.objects.filter(
        workflow__in=parent_workflows
    )
    parent_outcomenodes = OutcomeNode.objects.filter(node__in=parent_nodes)

    parent_outcomes = []
    parent_outcomeoutcomes = []
    for parent_workflow in parent_workflows:
        new_outcomes, new_outcomeoutcomes = get_all_outcomes_for_workflow(
            parent_workflow
        )
        parent_outcomes += new_outcomes
        parent_outcomeoutcomes += new_outcomeoutcomes

    outcomehorizontallinks = OutcomeHorizontalLink.objects.filter(
        outcome__in=outcomes, parent_outcome__in=parent_outcomes
    )
    if len(parent_workflows) > 0:
        outcome_type = parent_workflows[0].type + " outcome"
    else:
        outcome_type = workflow.type + " outcome"
    return {
        "parent_workflow": WorkflowSerializerShallow(
            parent_workflows, many=True, context={"user": user}
        ).data,
        "outcomeworkflow": OutcomeWorkflowSerializerShallow(
            parent_outcomeworkflows, many=True
        ).data,
        "parent_node": NodeSerializerShallow(
            parent_nodes, many=True, context={"user": user}
        ).data,
        "outcomenode": OutcomeNodeSerializerShallow(
            parent_outcomenodes, many=True
        ).data,
        "outcome": OutcomeSerializerShallow(
            parent_outcomes, many=True, context={"type": outcome_type}
        ).data,
        "outcomeoutcome": OutcomeOutcomeSerializerShallow(
            parent_outcomeoutcomes, many=True
        ).data,
        "outcomehorizontallink": OutcomeHorizontalLinkSerializerShallow(
            outcomehorizontallinks, many=True
        ).data,
    }


def get_child_outcome_data(workflow, user, parent_workflow):
    nodes = Node.objects.filter(
        week__workflow=parent_workflow, linked_workflow=workflow
    )
    linked_workflows = [workflow]
    child_workflow_outcomeworkflows = []
    child_workflow_outcomes = []
    child_workflow_outcomeoutcomes = []
    for linked_workflow in linked_workflows:
        child_workflow_outcomeworkflows += (
            linked_workflow.outcomeworkflow_set.all()
        )
        (
            new_child_workflow_outcomes,
            new_child_workflow_outcomeoutcomes,
        ) = get_all_outcomes_for_workflow(linked_workflow)
        child_workflow_outcomes += new_child_workflow_outcomes
        child_workflow_outcomeoutcomes += new_child_workflow_outcomeoutcomes

    outcomehorizontallinks = []
    for child_outcome in child_workflow_outcomes:
        outcomehorizontallinks += child_outcome.outcome_horizontal_links.all()

    if len(linked_workflows) > 0:
        outcome_type = linked_workflows[0].type + " outcome"
    else:
        outcome_type = workflow.type + " outcome"

    response_data = {
        "node": NodeSerializerShallow(
            nodes, many=True, context={"user": user}
        ).data,
        "child_workflow": WorkflowSerializerShallow(
            linked_workflows, many=True, context={"user": user}
        ).data,
        "outcomeworkflow": OutcomeWorkflowSerializerShallow(
            child_workflow_outcomeworkflows, many=True
        ).data,
        "outcome": OutcomeSerializerShallow(
            child_workflow_outcomes,
            many=True,
            context={"type": outcome_type},
        ).data,
        "outcomeoutcome": OutcomeOutcomeSerializerShallow(
            child_workflow_outcomeoutcomes, many=True
        ).data,
        "outcomehorizontallink": OutcomeHorizontalLinkSerializerShallow(
            outcomehorizontallinks, many=True
        ).data,
    }

    return response_data


def get_workflow_data_flat(workflow, user):
    SerializerClass = serializer_lookups_shallow[workflow.type]
    columnworkflows = workflow.columnworkflow_set.all()
    weekworkflows = workflow.weekworkflow_set.all()
    columns = workflow.columns.all()
    weeks = workflow.weeks.all()
    nodeweeks = NodeWeek.objects.filter(week__workflow=workflow)
    nodes = Node.objects.filter(week__workflow=workflow).prefetch_related(
        "outcomenode_set",
        "liveassignment_set",
    )
    nodelinks = NodeLink.objects.filter(source_node__in=nodes)

    if not workflow.is_strategy:
        outcomeworkflows = workflow.outcomeworkflow_set.all()
        outcomes, outcomeoutcomes = get_all_outcomes_for_workflow(workflow)
        outcomenodes = OutcomeNode.objects.filter(
            node__week__workflow=workflow
        )
        objectsets = ObjectSet.objects.filter(project__workflows=workflow)

    # data_flat = {
    #     "workflow": SerializerClass(workflow, context={"user": user}).data,
    #     "columnworkflow": ColumnWorkflowSerializerShallow(
    #         columnworkflows, many=True
    #     ).data,
    #     "column": ColumnSerializerShallow(columns, many=True).data,
    #     "weekworkflow": WeekWorkflowSerializerShallow(
    #         weekworkflows, many=True
    #     ).data,
    #     "week": WeekSerializerShallow(weeks, many=True).data,
    #     "nodeweek": NodeWeekSerializerShallow(nodeweeks, many=True).data,
    #     "node": NodeSerializerShallow(
    #         nodes, many=True, context={"user": user}
    #     ).data,
    #     "nodelink": NodeLinkSerializerShallow(nodelinks, many=True).data,
    # }
    data_flat = {
        "workflow": SerializerClass(workflow, context={"user": user}).data,
        "columnworkflow": ColumnWorkflowSerializerShallow(
            columnworkflows, many=True
        ).data,
        "column": ColumnSerializerShallow(columns, many=True).data,
        "weekworkflow": WeekWorkflowSerializerShallow(
            weekworkflows, many=True
        ).data,
        "week": WeekSerializerShallow(weeks, many=True).data,
        "nodeweek": NodeWeekSerializerShallow(nodeweeks, many=True).data,
        "nodelink": NodeLinkSerializerShallow(nodelinks, many=True).data,
    }

    data_flat["node"] = NodeSerializerShallow(
        nodes, many=True, context={"user": user}
    ).data

    if not workflow.is_strategy:
        data_flat["outcomeworkflow"] = OutcomeWorkflowSerializerShallow(
            outcomeworkflows, many=True
        ).data
        data_flat["outcome"] = OutcomeSerializerShallow(
            outcomes, many=True, context={"type": workflow.type + " outcome"}
        ).data
        data_flat["outcomeoutcome"] = OutcomeOutcomeSerializerShallow(
            outcomeoutcomes, many=True
        ).data
        data_flat["outcomenode"] = OutcomeNodeSerializerShallow(
            outcomenodes, many=True
        ).data
        data_flat["objectset"] = ObjectSetSerializerShallow(
            objectsets, many=True
        ).data
        if (
            workflow.type == "course"
            and user is not None
            and user.is_authenticated
        ):
            data_flat["strategy"] = WorkflowSerializerShallow(
                Course.objects.filter(
                    author=user, is_strategy=True, deleted=False
                ),
                many=True,
                context={"user": user},
            ).data
            data_flat["saltise_strategy"] = WorkflowSerializerShallow(
                Course.objects.filter(
                    from_saltise=True,
                    is_strategy=True,
                    published=True,
                    deleted=False,
                ),
                many=True,
                context={"user": user},
            ).data
        elif (
            workflow.type == "activity"
            and user is not None
            and user.is_authenticated
        ):
            data_flat["strategy"] = WorkflowSerializerShallow(
                Activity.objects.filter(
                    author=user, is_strategy=True, deleted=False
                ),
                many=True,
                context={"user": user},
            ).data
            data_flat["saltise_strategy"] = WorkflowSerializerShallow(
                Activity.objects.filter(
                    from_saltise=True,
                    is_strategy=True,
                    published=True,
                    deleted=False,
                ),
                many=True,
                context={"user": user},
            ).data

    if user.pk is not None:
        data_flat["unread_comments"] = [
            x.comment.id
            for x in Notification.objects.filter(
                user=user,
                content_type=ContentType.objects.get_for_model(Workflow),
                object_id=workflow.pk,
                is_unread=True,
            ).exclude(comment=None)
        ]

    return data_flat


def get_workflow_context_data(workflow, context, user):
    if not workflow.is_strategy:
        project = WorkflowProject.objects.get(workflow=workflow).project
    data_package = {}

    column_choices = [
        {"type": choice[0], "name": choice[1]}
        for choice in Column._meta.get_field("column_type").choices
    ]
    context_choices = [
        {"type": choice[0], "name": choice[1]}
        for choice in Node._meta.get_field("context_classification").choices
    ]
    task_choices = [
        {"type": choice[0], "name": choice[1]}
        for choice in Node._meta.get_field("task_classification").choices
    ]
    time_choices = [
        {"type": choice[0], "name": choice[1]}
        for choice in Node._meta.get_field("time_units").choices
    ]
    outcome_type_choices = [
        {"type": choice[0], "name": choice[1]}
        for choice in Workflow._meta.get_field("outcomes_type").choices
    ]
    outcome_sort_choices = [
        {"type": choice[0], "name": choice[1]}
        for choice in Workflow._meta.get_field("outcomes_sort").choices
    ]
    strategy_classification_choices = [
        {"type": choice[0], "name": choice[1]}
        for choice in Week._meta.get_field("strategy_classification").choices
    ]
    if not workflow.is_strategy:
        parent_project = ProjectSerializerShallow(
            project, context={"user": user}
        ).data

    data_package["is_strategy"] = workflow.is_strategy
    data_package["column_choices"] = column_choices
    data_package["context_choices"] = context_choices
    data_package["task_choices"] = task_choices
    data_package["time_choices"] = time_choices
    data_package["outcome_type_choices"] = outcome_type_choices
    data_package["outcome_sort_choices"] = outcome_sort_choices

    data_package[
        "strategy_classification_choices"
    ] = strategy_classification_choices
    if not workflow.is_strategy:
        data_package["project"] = parent_project
    context["is_strategy"] = (
        JSONRenderer().render(workflow.is_strategy).decode("utf-8")
    )
    context["data_package"] = (
        JSONRenderer().render(data_package).decode("utf-8")
    )
    user_permission = get_user_permission(workflow, user)
    user_role = get_user_role(workflow, user)
    context["user_permission"] = (
        JSONRenderer().render(user_permission).decode("utf-8")
    )
    context["user_role"] = JSONRenderer().render(user_role).decode("utf-8")

    return context


class WorkflowDetailView(
    LoginRequiredMixin, UserCanViewOrEnrolledMixin, DetailView
):
    model = Workflow
    fields = ["id", "title", "description", "type"]
    template_name = "course_flow/workflow_update.html"

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
        )

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        workflow = self.get_object()

        context = get_workflow_context_data(
            workflow, context, self.request.user
        )
        context["public_view"] = JSONRenderer().render(False).decode("utf-8")

        return context


class WorkflowPublicDetailView(ContentPublicViewMixin, DetailView):
    model = Workflow
    fields = ["id", "title", "description"]
    template_name = "course_flow/workflow_update.html"

    def get_queryset(self):
        return self.model.objects.select_subclasses()

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
        )

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        workflow = self.get_object()

        context = get_workflow_context_data(
            workflow, context, self.request.user
        )
        context["public_view"] = JSONRenderer().render(True).decode("utf-8")

        return context


class ProgramCreateView(
    LoginRequiredMixin, UserCanEditProjectMixin, CreateView_No_Autocomplete
):
    model = Program
    fields = ["title", "description"]
    template_name = "course_flow/workflow_create.html"

    def workflow_type(self):
        return "program"

    def form_valid(self, form):
        form.instance.author = self.request.user
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        response = super(CreateView, self).form_valid(form)
        WorkflowProject.objects.create(project=project, workflow=form.instance)
        form.instance.published = project.published
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )


class CourseCreateView(
    LoginRequiredMixin, UserCanEditProjectMixin, CreateView_No_Autocomplete
):
    model = Course
    fields = ["title", "description"]
    template_name = "course_flow/workflow_create.html"

    def workflow_type(self):
        return "course"

    def form_valid(self, form):
        form.instance.author = self.request.user
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        response = super(CreateView, self).form_valid(form)
        WorkflowProject.objects.create(project=project, workflow=form.instance)
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )


class CourseStrategyCreateView(
    LoginRequiredMixin, UserPassesTestMixin, CreateView_No_Autocomplete
):
    model = Course
    fields = ["title", "description"]
    template_name = "course_flow/workflow_create.html"

    def workflow_type(self):
        return "course"

    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )

    def form_valid(self, form):
        form.instance.author = self.request.user
        form.instance.is_strategy = True
        response = super(CreateView, self).form_valid(form)
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )


class ActivityCreateView(
    LoginRequiredMixin, UserCanEditProjectMixin, CreateView_No_Autocomplete
):
    model = Activity
    fields = ["title", "description"]
    template_name = "course_flow/workflow_create.html"

    def workflow_type(self):
        return "activity"

    def form_valid(self, form):
        form.instance.author = self.request.user
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        response = super(CreateView, self).form_valid(form)
        WorkflowProject.objects.create(project=project, workflow=form.instance)
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )


class ActivityStrategyCreateView(
    LoginRequiredMixin, UserPassesTestMixin, CreateView_No_Autocomplete
):
    model = Activity
    fields = ["title", "description"]
    template_name = "course_flow/workflow_create.html"

    def workflow_type(self):
        return "activity"

    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )

    def form_valid(self, form):
        form.instance.author = self.request.user
        form.instance.is_strategy = True
        response = super(CreateView, self).form_valid(form)
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )


# def get_owned_courses(user: User):
#    return Course.objects.filter(author=user, static=False).order_by(
#        "-last_modified"
#    )[:10]
#
#
# def setup_link_to_group(course_pk, students) -> Course:
#
#    course = Course.objects.get(pk=course_pk)
#
#    clone = duplicate_course(course, course.author)
#    clone.static = True
#    clone.title += " -- Live"
#    clone.save()
#    clone.students.add(*students)
#    for week in clone.weeks.all():
#        for component in week.components.exclude(
#            content_type=ContentType.objects.get_for_model(Activity)
#        ):
#            component.students.add(*students)
#        for component in week.components.filter(
#            content_type=ContentType.objects.get_for_model(Activity)
#        ):
#            activity = component.content_object
#            activity.static = True
#            activity.save()
#            activity.students.add(*students)
#            for week in activity.weeks.all():
#                for node in week.nodes.all():
#                    node.students.add(*students)
#    return clone
#
#
# def setup_unlink_from_group(course_pk):
#    Course.objects.get(pk=course_pk).delete()
#    return "done"
#
#
# def remove_student_from_group(student, course):
#    course.students.remove(student)
#    for week in course.weeks.all():
#        for component in week.components.exclude(
#            content_type=ContentType.objects.get_for_model(Activity)
#        ):
#            ComponentCompletionStatus.objects.get(
#                student=student, component=component
#            ).delete()
#        for component in week.components.filter(
#            content_type=ContentType.objects.get_for_model(Activity)
#        ):
#            activity = component.content_object
#            activity.students.remove(student)
#            for week in activity.weeks.all():
#                for node in week.nodes.all():
#                    NodeCompletionStatus.objects.get(
#                        student=student, node=node
#                    ).delete()
#
#
# def add_student_to_group(student, course):
#    course.students.add(student)
#    for week in course.weeks.all():
#        for component in week.components.exclude(
#            content_type=ContentType.objects.get_for_model(Activity)
#        ):
#            ComponentCompletionStatus.objects.create(
#                student=student, component=component
#            )
#        for component in week.components.filter(
#            content_type=ContentType.objects.get_for_model(Activity)
#        ):
#            activity = component.content_object
#            activity.students.add(student)
#            for week in activity.weeks.all():
#                for node in week.nodes.all():
#                    NodeCompletionStatus.objects.create(
#                        student=student, node=node
#                    )
#
#
# @require_POST
# @ajax_login_required
# def switch_node_completion_status(request: HttpRequest) -> HttpResponse:
#    node = Node.objects.get(pk=request.POST.get("pk"))
#    is_completed = request.POST.get("isCompleted")
#
#    status = NodeCompletionStatus.objects.get(node=node, student=request.user)
#
#    try:
#        if is_completed == "true":
#            status.is_completed = True
#        else:
#            status.is_completed = False
#
#        status.save()
#    except ValidationError:
#        return JsonResponse({"action": "error"})
#
#    return JsonResponse({"action": "posted"})


# @ajax_login_required
# def get_node_completion_status(request: HttpRequest) -> HttpResponse:
#
#    status = NodeCompletionStatus.objects.get(
#        node=Node.objects.get(pk=request.GET.get("nodePk")),
#        student=request.user,
#    )
#
#    return JsonResponse(
#        {"action": "got", "completion_status": status.is_completed}
#    )
#
#
# @ajax_login_required
# def get_node_completion_count(request: HttpRequest) -> HttpResponse:
#
#    statuses = NodeCompletionStatus.objects.filter(
#        node=Node.objects.get(pk=request.GET.get("nodePk")), is_completed=True
#    )
#
#    return JsonResponse(
#        {"action": "got", "completion_status": statuses.count()}
#    )


"""
Import/Export  methods
"""


@user_can_edit(False)
def import_data(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    task_type = request.POST.get("importType")
    file = request.FILES.get("myFile")
    try:
        if file.size < 1024 * 1024:
            file_type = file.content_type
            if file.name.endswith(".csv"):
                file_type = "text/csv"
            if (
                file_type
                == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                or file_type == "application/vnd.ms-excel"
            ):
                df = pd.read_excel(file, keep_default_na=False)
            elif file_type == "text/csv":
                df = pd.read_csv(file, keep_default_na=False)
            if len(df.index) > 1000:
                raise ValidationError
            tasks.async_import_file_data(
                object_id,
                object_type,
                task_type,
                df.to_json(),
                request.user.id,
            )
        else:
            return JsonResponse({"action": "error"})
    except Exception:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})


@user_can_view(False)
def get_export(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    export_type = request.POST.get("export_type")
    export_format = request.POST.get("export_format")
    allowed_sets = request.POST.getlist("object_sets[]", [])
    try:
        subject = _("Your CourseFlow Export")
        text = _("Hi there! Here are the results of your recent export.")
        tasks.async_send_export_email(
            request.user.email,
            object_id,
            object_type,
            export_type,
            export_format,
            allowed_sets,
            subject,
            text,
        )

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})


@ajax_login_required
def get_saltise_download(request: HttpRequest) -> HttpResponse:
    if (
        Group.objects.get(name="SALTISE_Staff")
        not in request.user.groups.all()
    ):
        return JsonResponse({"action": "error"})

    file_ext = "xlsx"

    filename = "saltise-analytics-data" + "." + file_ext
    file = export_functions.get_saltise_analytics()
    file_data = (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response = HttpResponse(file, content_type=file_data)
    response["Content-Disposition"] = "attachment; filename=%s" % filename
    return response


# enable for testing/download
@user_can_view(False)
def get_export_download(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    export_type = request.POST.get("export_type")
    export_format = request.POST.get("export_format")
    allowed_sets = request.POST.getlist("object_sets[]", "[]")
    model_object = get_model_from_str(object_type).objects.get(pk=object_id)

    if object_type == "project":
        project_sets = ObjectSet.objects.filter(project=model_object)
    else:
        project_sets = ObjectSet.objects.filter(
            project=model_object.get_project()
        )
    allowed_sets = project_sets.filter(id__in=allowed_sets)
    if export_type == "outcome":
        file = export_functions.get_outcomes_export(
            model_object, object_type, export_format, allowed_sets
        )
    elif export_type == "framework":
        file = export_functions.get_course_frameworks_export(
            model_object, object_type, export_format, allowed_sets
        )
    elif export_type == "matrix":
        file = export_functions.get_program_matrix_export(
            model_object, object_type, export_format, allowed_sets
        )
    elif export_type == "node":
        file = export_functions.get_nodes_export(
            model_object, object_type, export_format, allowed_sets
        )
    if export_format == "excel":
        file_ext = "xlsx"
    elif export_format == "csv":
        file_ext = "csv"

    filename = (
        object_type
        + "_"
        + str(object_id)
        + "_"
        + timezone.now().strftime(dateTimeFormatNoSpace())
        + "."
        + file_ext
    )

    if export_format == "csv":
        file_data = "text/csv"
    elif export_format == "excel":
        file_data = (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    response = HttpResponse(file, content_type=file_data)
    response["Content-Disposition"] = "attachment; filename=%s" % filename
    return response


"""
Contextual information methods
"""


@user_can_view_or_enrolled_as_student("workflowPk")
def get_parent_workflow_info(request: HttpRequest) -> HttpResponse:
    workflow_id = json.loads(request.POST.get("workflowPk"))
    try:
        parent_workflows = [
            node.get_workflow()
            for node in Node.objects.filter(linked_workflow__id=workflow_id)
        ]
        data_package = InfoBoxSerializer(
            parent_workflows, many=True, context={"user": request.user}
        ).data
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "parent_workflows": data_package})


@public_model_access("workflow")
def get_public_parent_workflow_info(request: HttpRequest, pk) -> HttpResponse:
    try:
        parent_workflows = [
            node.get_workflow()
            for node in Node.objects.filter(linked_workflow__id=pk)
        ]
        data_package = InfoBoxSerializer(
            parent_workflows, many=True, context={"user": request.user}
        ).data
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "parent_workflows": data_package})


@user_can_comment(False)
def get_comments_for_object(request: HttpRequest) -> HttpResponse:
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


class DisciplineListView(LoginRequiredMixin, ListAPIView):
    queryset = Discipline.objects.order_by("title")
    serializer_class = DisciplineSerializer


@login_required
def get_library(request: HttpRequest) -> HttpResponse:
    user = request.user
    all_projects = list(Project.objects.filter(user_permissions__user=user))
    all_projects += list(
        Workflow.objects.filter(user_permissions__user=user, is_strategy=True)
    )
    projects_serialized = InfoBoxSerializer(
        all_projects, many=True, context={"user": user}
    ).data
    return JsonResponse({"data_package": projects_serialized})


@login_required
def get_favourites(request: HttpRequest) -> HttpResponse:
    projects_serialized = InfoBoxSerializer(
        get_nondeleted_favourites(request.user),
        many=True,
        context={"user": request.user},
    ).data
    return JsonResponse({"data_package": projects_serialized})


@login_required
def get_home(request: HttpRequest) -> HttpResponse:
    user = request.user
    if Group.objects.get(name=settings.TEACHER_GROUP) not in user.groups.all():
        projects = LiveProject.objects.filter(
            project__deleted=False,
            liveprojectuser__user=user,
        )
        projects_serialized = LiveProjectSerializer(
            projects, many=True, context={"user": user}
        ).data
        favourites_serialized = []
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
        favourites = [
            fav.content_object
            for fav in Favourite.objects.filter(user=user).filter(
                Q(workflow__deleted=False, workflow__project__deleted=False)
                | Q(project__deleted=False)
                | Q(workflow__deleted=False, workflow__is_strategy=True)
            )
        ]
        favourites_serialized = InfoBoxSerializer(
            favourites, many=True, context={"user": user}
        ).data
    return JsonResponse(
        {"projects": projects_serialized, "favourites": favourites_serialized}
    )


@user_can_view("projectPk")
def get_workflows_for_project(request: HttpRequest) -> HttpResponse:
    user = request.user
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    workflows_serialized = InfoBoxSerializer(
        project.workflows.all(), many=True, context={"user": user}
    ).data
    return JsonResponse({"data_package": workflows_serialized})


@user_can_view_or_enrolled_as_student("workflowPk")
def get_workflow_parent_data(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        data_package = get_parent_outcome_data(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@user_can_view_or_enrolled_as_student("nodePk")
def get_workflow_child_data(request: HttpRequest) -> HttpResponse:
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    try:
        data_package = get_child_outcome_data(
            node.linked_workflow, request.user, node.get_workflow()
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@user_can_view_or_enrolled_as_student("workflowPk")
def get_workflow_data(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        data_package = get_workflow_data_flat(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@public_model_access("workflow")
def get_public_workflow_data(request: HttpRequest, pk) -> HttpResponse:
    workflow = Workflow.objects.get(pk=pk)
    try:
        data_package = get_workflow_data_flat(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@public_model_access("node", rate=50)
def get_public_workflow_child_data(request: HttpRequest, pk) -> HttpResponse:
    node = Node.objects.get(pk=pk)
    try:
        data_package = get_child_outcome_data(
            node.linked_workflow, request.user, node.get_workflow()
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@public_model_access("workflow")
def get_public_workflow_parent_data(request: HttpRequest, pk) -> HttpResponse:
    workflow = Workflow.objects.get(pk=pk)
    try:
        data_package = get_parent_outcome_data(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@user_can_view("projectPk")
def get_project_data(request: HttpRequest) -> HttpResponse:
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        project_data = (
            JSONRenderer()
            .render(
                ProjectSerializerShallow(
                    project, context={"user": request.user}
                ).data
            )
            .decode("utf-8")
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "project_data": project_data,
        }
    )


@user_is_teacher()
def get_target_projects(request: HttpRequest) -> HttpResponse:
    try:
        workflow_id = Workflow.objects.get(
            pk=request.POST.get("workflowPk")
        ).id
    except ObjectDoesNotExist:
        workflow_id = 0
    try:
        data_package = get_my_projects(request.user, False, for_add=True)
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
            "workflow_id": workflow_id,
        }
    )


@user_can_view_or_none("projectPk")
def get_possible_added_workflows(request: HttpRequest) -> HttpResponse:
    type_filter = json.loads(request.POST.get("type_filter"))
    get_strategies = json.loads(request.POST.get("get_strategies", "false"))
    projectPk = request.POST.get("projectPk", False)
    self_only = json.loads(request.POST.get("self_only", "false"))
    if projectPk:
        project = Project.objects.get(pk=request.POST.get("projectPk"))
    else:
        project = None
    try:
        data_package = get_workflow_data_package(
            request.user,
            project,
            type_filter=type_filter,
            get_strategies=get_strategies,
            self_only=self_only,
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
            "project_id": projectPk,
        }
    )


@user_can_view("workflowPk")
def get_workflow_context(request: HttpRequest) -> HttpResponse:
    workflowPk = request.POST.get("workflowPk", False)
    try:
        workflow = Workflow.objects.get(pk=workflowPk)
        data_package = get_workflow_context_data(
            workflow,
            {},
            request.user,
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
            "workflow_id": workflowPk,
        }
    )


@user_can_edit("nodePk")
def get_possible_linked_workflows(request: HttpRequest) -> HttpResponse:
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    try:
        project = node.get_workflow().get_project()
        data_package = get_workflow_data_package(
            request.user,
            project,
            type_filter=Workflow.SUBCLASSES[node.node_type - 1],
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {"action": "posted", "data_package": data_package, "node_id": node.id}
    )


"""
Duplication methods
"""


def duplicate_nodelink(
    nodelink: NodeLink, author: User, source_node: Node, target_node: Node
) -> NodeLink:
    new_nodelink = NodeLink.objects.create(
        title=nodelink.title,
        author=author,
        source_node=source_node,
        target_node=target_node,
        source_port=nodelink.source_port,
        target_port=nodelink.target_port,
        dashed=nodelink.dashed,
        is_original=False,
        deleted=nodelink.deleted,
    )

    return new_nodelink


def duplicate_node(
    node: Node, author: User, new_workflow: Workflow, outcome_ids
) -> Node:
    if new_workflow is not None:
        for new_column in new_workflow.columns.all():
            if (
                new_column == node.column
                or new_column.parent_column == node.column
            ):
                column = new_column
                break
    else:
        column = node.column
    new_node = Node.objects.create(
        title=node.title,
        description=node.description,
        author=author,
        node_type=node.node_type,
        column=column,
        task_classification=node.task_classification,
        context_classification=node.context_classification,
        has_autolink=node.has_autolink,
        represents_workflow=node.represents_workflow,
        time_required=node.time_required,
        time_units=node.time_units,
        is_original=False,
        parent_node=node,
        linked_workflow=node.linked_workflow,
        deleted=node.deleted,
    )

    for object_set in node.sets.all():
        if new_workflow is None:
            new_node.sets.add(object_set)

    for outcome in node.outcomes.all():
        if new_workflow is not None:
            new_outcome = Outcome.objects.get(
                parent_outcome=outcome, id__in=outcome_ids
            )
        else:
            new_outcome = outcome
        OutcomeNode.objects.create(
            outcome=new_outcome,
            node=new_node,
            rank=OutcomeNode.objects.get(node=node, outcome=outcome).rank,
        )

    return new_node


def duplicate_week(
    week: Week, author: User, new_workflow: Workflow, outcome_ids
) -> Week:
    new_week = Week.objects.create(
        title=week.title,
        description=week.description,
        author=author,
        is_original=False,
        parent_week=week,
        week_type=week.week_type,
        is_strategy=week.is_strategy,
        original_strategy=week.original_strategy,
        strategy_classification=week.strategy_classification,
        deleted=week.deleted,
    )

    for node in week.nodes.all():
        NodeWeek.objects.create(
            node=duplicate_node(node, author, new_workflow, outcome_ids),
            week=new_week,
            rank=NodeWeek.objects.get(node=node, week=week).rank,
        )

    return new_week


def duplicate_column(column: Column, author: User) -> Column:
    new_column = Column.objects.create(
        title=column.title,
        author=author,
        is_original=False,
        parent_column=column,
        column_type=column.column_type,
        deleted=column.deleted,
        colour=column.colour,
    )

    return new_column


def fast_column_copy(column, author, now):
    return Column(
        title=column.title,
        author=author,
        is_original=False,
        parent_column=column,
        column_type=column.column_type,
        created_on=now,
        deleted=column.deleted,
        colour=column.colour,
    )


def fast_week_copy(week, author, now):
    return Week(
        title=week.title,
        description=week.description,
        author=author,
        is_original=False,
        parent_week=week,
        week_type=week.week_type,
        is_strategy=week.is_strategy,
        original_strategy=week.original_strategy,
        strategy_classification=week.strategy_classification,
        created_on=now,
        deleted=week.deleted,
    )


def fast_node_copy(node, column, author, now, **kwargs):
    workflow_dict = kwargs.get("workflow_dict", None)
    linked_workflow = node.linked_workflow
    if linked_workflow is not None and workflow_dict is not None:
        linked_workflow = workflow_dict[linked_workflow.id]

    return Node(
        title=node.title,
        description=node.description,
        author=author,
        node_type=node.node_type,
        column=column,
        task_classification=node.task_classification,
        context_classification=node.context_classification,
        has_autolink=node.has_autolink,
        represents_workflow=node.represents_workflow,
        time_required=node.time_required,
        time_units=node.time_units,
        time_general_hours=node.time_general_hours,
        time_specific_hours=node.time_specific_hours,
        ponderation_theory=node.ponderation_theory,
        ponderation_individual=node.ponderation_individual,
        ponderation_practical=node.ponderation_practical,
        is_original=False,
        parent_node=node,
        linked_workflow=linked_workflow,
        created_on=now,
        deleted=node.deleted,
    )


def fast_nodelink_copy(nodelink, author, source_node, target_node):
    return NodeLink(
        title=nodelink.title,
        author=author,
        source_node=source_node,
        target_node=target_node,
        source_port=nodelink.source_port,
        target_port=nodelink.target_port,
        dashed=nodelink.dashed,
        is_original=False,
        deleted=nodelink.deleted,
    )


def fast_outcomenode_copy(outcomenode, node, outcome):
    return OutcomeNode(
        node=node,
        outcome=outcome,
        degree=outcomenode.degree,
        rank=outcomenode.rank,
    )


def fast_outcome_copy(outcome, author, now):
    return Outcome(
        title=outcome.title,
        description=outcome.description,
        author=author,
        is_original=False,
        parent_outcome=outcome,
        depth=outcome.depth,
        created_on=now,
        code=outcome.code,
        deleted=outcome.deleted,
    )


def fast_activity_copy(workflow, author, now):
    return Activity.objects.create(
        title=workflow.title,
        description=workflow.description,
        outcomes_type=workflow.outcomes_type,
        outcomes_sort=workflow.outcomes_sort,
        author=author,
        is_original=False,
        parent_workflow=workflow,
        is_strategy=workflow.is_strategy,
        time_required=workflow.time_required,
        time_units=workflow.time_units,
        ponderation_theory=workflow.ponderation_theory,
        ponderation_practical=workflow.ponderation_practical,
        ponderation_individual=workflow.ponderation_individual,
        time_general_hours=workflow.time_general_hours,
        time_specific_hours=workflow.time_specific_hours,
        code=workflow.code,
        deleted=workflow.deleted,
        condensed=workflow.condensed,
    )


def fast_course_copy(workflow, author, now):
    return Course.objects.create(
        title=workflow.title,
        description=workflow.description,
        outcomes_type=workflow.outcomes_type,
        outcomes_sort=workflow.outcomes_sort,
        author=author,
        is_original=False,
        parent_workflow=workflow,
        is_strategy=workflow.is_strategy,
        time_required=workflow.time_required,
        time_units=workflow.time_units,
        ponderation_theory=workflow.ponderation_theory,
        ponderation_practical=workflow.ponderation_practical,
        ponderation_individual=workflow.ponderation_individual,
        time_general_hours=workflow.time_general_hours,
        time_specific_hours=workflow.time_specific_hours,
        code=workflow.code,
        deleted=workflow.deleted,
        condensed=workflow.condensed,
    )


def fast_program_copy(workflow, author, now):
    return Program.objects.create(
        title=workflow.title,
        description=workflow.description,
        outcomes_type=workflow.outcomes_type,
        outcomes_sort=workflow.outcomes_sort,
        author=author,
        is_original=False,
        parent_workflow=workflow,
        is_strategy=workflow.is_strategy,
        time_required=workflow.time_required,
        time_units=workflow.time_units,
        ponderation_theory=workflow.ponderation_theory,
        ponderation_practical=workflow.ponderation_practical,
        ponderation_individual=workflow.ponderation_individual,
        time_general_hours=workflow.time_general_hours,
        time_specific_hours=workflow.time_specific_hours,
        code=workflow.code,
        deleted=workflow.deleted,
        condensed=workflow.condensed,
    )


def fast_duplicate_week(week: Week, author: User) -> Week:
    try:
        # Duplicate the week
        new_week = Week.objects.create(
            title=week.title,
            description=week.description,
            author=author,
            is_original=False,
            parent_week=week,
            week_type=week.week_type,
            is_strategy=week.is_strategy,
            original_strategy=week.original_strategy,
            strategy_classification=week.strategy_classification,
            deleted=week.deleted,
        )

        # Retrieve all data.
        # Speed is critical here. querying through __ has come out much faster (by a factor of up to 100) in testing than moving vertically through the heirarchy, even when prefetc_related is used.
        # In order to speed the creation of the throughmodels, select_related is used for any foreignkeys that need to be traversed

        nodeweeks = NodeWeek.objects.filter(week=week).select_related("node")
        nodes = Node.objects.filter(week=week).select_related(
            "column", "linked_workflow"
        )

        outcomenodes = OutcomeNode.objects.filter(
            node__week=week
        ).select_related("node", "outcome")
        nodelinks = NodeLink.objects.filter(
            source_node__week=week, target_node__week=week
        ).select_related("source_node", "target_node")

        # Create the new content, and keep track of old_id:new_instance pairs in a dict
        id_dict = {}
        now = timezone.now()

        Node.objects.bulk_create(
            [fast_node_copy(node, node.column, author, now) for node in nodes]
        )
        new_nodes = Node.objects.filter(author=author, created_on=now)
        id_dict["node"] = {
            nodes[i].id: new_node for i, new_node in enumerate(new_nodes)
        }

        # Link everything up

        NodeWeek.objects.bulk_create(
            [
                NodeWeek(
                    rank=nodeweek.rank,
                    node=id_dict["node"][nodeweek.node.id],
                    week=new_week,
                )
                for nodeweek in nodeweeks
            ]
        )

        NodeLink.objects.bulk_create(
            [
                fast_nodelink_copy(
                    nodelink,
                    author,
                    id_dict["node"][nodelink.source_node.id],
                    id_dict["node"][nodelink.target_node.id],
                )
                for nodelink in nodelinks
            ]
        )

        OutcomeNode.objects.bulk_create(
            [
                fast_outcomenode_copy(
                    outcomenode,
                    id_dict["node"][outcomenode.node.id],
                    outcomenode.outcome,
                )
                for outcomenode in outcomenodes
            ]
        )

        # Add the sets

        for node in nodes:
            if node.sets.all().count() > 0:
                for set in node.sets.all():
                    id_dict["node"][node.id].sets.add(set)
                node.save()

    except IndexError:
        return None

    return new_week


def fast_duplicate_outcome(outcome: Outcome, author: User) -> Outcome:
    try:
        # Duplicate the workflow
        new_outcome = Outcome.objects.create(
            title=outcome.title,
            description=outcome.description,
            author=author,
            is_original=False,
            parent_outcome=outcome,
            depth=outcome.depth,
            code=outcome.code,
            deleted=outcome.deleted,
        )

        # Retrieve all data.
        # Speed is critical here. querying through __ has come out much faster (by a factor of up to 100) in testing than moving vertically through the heirarchy, even when prefetc_related is used.
        # In order to speed the creation of the throughmodels, select_related is used for any foreignkeys that need to be traversed

        outcomes, outcomeoutcomes = get_all_outcomes_for_outcome(outcome)

        # Create the new content, and keep track of old_id:new_instance pairs in a dict
        id_dict = {}
        now = timezone.now()

        Outcome.objects.bulk_create(
            [fast_outcome_copy(outcome, author, now) for outcome in outcomes]
        )
        new_outcomes = Outcome.objects.filter(author=author, created_on=now)
        id_dict["outcome"] = {
            outcomes[i].id: new_outcome
            for i, new_outcome in enumerate(new_outcomes)
        }

        # We need to add in the original outcome
        id_dict["outcome"][outcome.id] = new_outcome

        # Link everything up
        OutcomeOutcome.objects.bulk_create(
            [
                OutcomeOutcome(
                    rank=outcomeoutcome.rank,
                    child=id_dict["outcome"][outcomeoutcome.child.id],
                    parent=id_dict["outcome"][outcomeoutcome.parent.id],
                )
                for outcomeoutcome in outcomeoutcomes
            ]
        )

        # Add the sets

        for outcome_inst in [outcome] + list(outcomes):
            if outcome_inst.sets.all().count() > 0:
                for set in outcome_inst.sets.all():
                    id_dict["outcome"][outcome_inst.id].sets.add(set)
                outcome_inst.save()

    except IndexError:
        return None

    return new_outcome


def fast_create_strategy(
    week: Week, workflow: Workflow, author: User
) -> Workflow:
    model = get_model_from_str(workflow.type)

    try:
        # Duplicate the workflow
        new_strategy = model.objects.create(
            title=workflow.title,
            author=author,
            is_strategy=True,
            is_original=False,
            parent_workflow=workflow,
        )

        # Retrieve all data.
        # Speed is critical here. querying through __ has come out much faster (by a factor of up to 100) in testing than moving vertically through the heirarchy, even when prefetc_related is used.
        # In order to speed the creation of the throughmodels, select_related is used for any foreignkeys that need to be traversed

        columnworkflows = ColumnWorkflow.objects.filter(
            workflow=workflow
        ).select_related("column")
        columns = Column.objects.filter(workflow=workflow)

        nodeweeks = NodeWeek.objects.filter(
            week__workflow=workflow, week=week
        ).select_related("node", "week")
        nodes = Node.objects.filter(
            week__workflow=workflow, week=week
        ).select_related("column", "linked_workflow")

        nodelinks = NodeLink.objects.filter(
            source_node__week__workflow=workflow,
            source_node__week=week,
            target_node__week=week,
        ).select_related("source_node", "target_node")

        # Create the new content, and keep track of old_id:new_instance pairs in a dict
        id_dict = {}
        now = timezone.now()

        Column.objects.bulk_create(
            [fast_column_copy(column, author, now) for column in columns]
        )
        new_columns = Column.objects.filter(author=author, created_on=now)
        id_dict["column"] = {
            columns[i].id: new_col for i, new_col in enumerate(new_columns)
        }

        weeks = [week]
        Week.objects.bulk_create([fast_week_copy(week, author, now)])
        new_weeks = Week.objects.filter(author=author, created_on=now)
        new_weeks.update(is_strategy=True)
        id_dict["week"] = {
            weeks[i].id: new_week for i, new_week in enumerate(new_weeks)
        }

        Node.objects.bulk_create(
            [
                fast_node_copy(
                    node, id_dict["column"][node.column.id], author, now
                )
                for node in nodes
            ]
        )
        new_nodes = Node.objects.filter(author=author, created_on=now)
        new_nodes.update(linked_workflow=None)
        id_dict["node"] = {
            nodes[i].id: new_node for i, new_node in enumerate(new_nodes)
        }

        # Link everything up
        ColumnWorkflow.objects.bulk_create(
            [
                ColumnWorkflow(
                    rank=columnworkflow.rank,
                    column=id_dict["column"][columnworkflow.column.id],
                    workflow=new_strategy,
                )
                for columnworkflow in columnworkflows
            ]
        )

        WeekWorkflow.objects.create(workflow=new_strategy, week=new_weeks[0])

        NodeWeek.objects.bulk_create(
            [
                NodeWeek(
                    rank=nodeweek.rank,
                    node=id_dict["node"][nodeweek.node.id],
                    week=id_dict["week"][nodeweek.week.id],
                )
                for nodeweek in nodeweeks
            ]
        )

        NodeLink.objects.bulk_create(
            [
                fast_nodelink_copy(
                    nodelink,
                    author,
                    id_dict["node"][nodelink.source_node.id],
                    id_dict["node"][nodelink.target_node.id],
                )
                for nodelink in nodelinks
            ]
        )

    except IndexError:
        return None

    return new_strategy


def fast_duplicate_workflow(
    workflow: Workflow, author: User, project
) -> Workflow:
    model = get_model_from_str(workflow.type)

    try:
        # Duplicate the workflow
        new_workflow = model.objects.create(
            title=workflow.title,
            description=workflow.description,
            outcomes_type=workflow.outcomes_type,
            outcomes_sort=workflow.outcomes_sort,
            author=author,
            is_original=False,
            parent_workflow=workflow,
            is_strategy=workflow.is_strategy,
            time_required=workflow.time_required,
            time_units=workflow.time_units,
            ponderation_theory=workflow.ponderation_theory,
            ponderation_practical=workflow.ponderation_practical,
            ponderation_individual=workflow.ponderation_individual,
            time_general_hours=workflow.time_general_hours,
            time_specific_hours=workflow.time_specific_hours,
            code=workflow.code,
            deleted=workflow.deleted,
            condensed=workflow.condensed,
        )

        # Retrieve all data.
        # Speed is critical here. querying through __ has come out much faster (by a factor of up to 100) in testing than moving vertically through the heirarchy, even when prefetc_related is used.
        # In order to speed the creation of the throughmodels, select_related is used for any foreignkeys that need to be traversed

        outcomeworkflows = OutcomeWorkflow.objects.filter(
            workflow=workflow
        ).select_related("outcome")
        outcomes, outcomeoutcomes = get_all_outcomes_for_workflow(workflow)

        columnworkflows = ColumnWorkflow.objects.filter(
            workflow=workflow
        ).select_related("column")
        columns = Column.objects.filter(workflow=workflow)

        weekworkflows = WeekWorkflow.objects.filter(
            workflow=workflow
        ).select_related("week")
        weeks = Week.objects.filter(workflow=workflow)

        nodeweeks = NodeWeek.objects.filter(
            week__workflow=workflow
        ).select_related("node", "week")
        nodes = Node.objects.filter(week__workflow=workflow).select_related(
            "column", "linked_workflow"
        )

        outcomenodes = OutcomeNode.objects.filter(
            node__week__workflow=workflow
        ).select_related("node", "outcome")
        nodelinks = NodeLink.objects.filter(
            source_node__week__workflow=workflow
        ).select_related("source_node", "target_node")

        # Create the new content, and keep track of old_id:new_instance pairs in a dict
        id_dict = {}
        now = timezone.now()

        Column.objects.bulk_create(
            [fast_column_copy(column, author, now) for column in columns]
        )
        new_columns = Column.objects.filter(author=author, created_on=now)
        id_dict["column"] = {
            columns[i].id: new_col for i, new_col in enumerate(new_columns)
        }

        Week.objects.bulk_create(
            [fast_week_copy(week, author, now) for week in weeks]
        )
        new_weeks = Week.objects.filter(author=author, created_on=now)
        id_dict["week"] = {
            weeks[i].id: new_week for i, new_week in enumerate(new_weeks)
        }

        Node.objects.bulk_create(
            [
                fast_node_copy(
                    node, id_dict["column"][node.column.id], author, now
                )
                for node in nodes
            ]
        )
        new_nodes = Node.objects.filter(author=author, created_on=now)
        id_dict["node"] = {
            nodes[i].id: new_node for i, new_node in enumerate(new_nodes)
        }

        Outcome.objects.bulk_create(
            [fast_outcome_copy(outcome, author, now) for outcome in outcomes]
        )
        new_outcomes = Outcome.objects.filter(author=author, created_on=now)
        id_dict["outcome"] = {
            outcomes[i].id: new_outcome
            for i, new_outcome in enumerate(new_outcomes)
        }

        # Link everything up
        ColumnWorkflow.objects.bulk_create(
            [
                ColumnWorkflow(
                    rank=columnworkflow.rank,
                    column=id_dict["column"][columnworkflow.column.id],
                    workflow=new_workflow,
                )
                for columnworkflow in columnworkflows
            ]
        )

        WeekWorkflow.objects.bulk_create(
            [
                WeekWorkflow(
                    rank=weekworkflow.rank,
                    week=id_dict["week"][weekworkflow.week.id],
                    workflow=new_workflow,
                )
                for weekworkflow in weekworkflows
            ]
        )

        NodeWeek.objects.bulk_create(
            [
                NodeWeek(
                    rank=nodeweek.rank,
                    node=id_dict["node"][nodeweek.node.id],
                    week=id_dict["week"][nodeweek.week.id],
                )
                for nodeweek in nodeweeks
            ]
        )

        NodeLink.objects.bulk_create(
            [
                fast_nodelink_copy(
                    nodelink,
                    author,
                    id_dict["node"][nodelink.source_node.id],
                    id_dict["node"][nodelink.target_node.id],
                )
                for nodelink in nodelinks
            ]
        )

        OutcomeNode.objects.bulk_create(
            [
                fast_outcomenode_copy(
                    outcomenode,
                    id_dict["node"][outcomenode.node.id],
                    id_dict["outcome"][outcomenode.outcome.id],
                )
                for outcomenode in outcomenodes
            ]
        )

        OutcomeWorkflow.objects.bulk_create(
            [
                OutcomeWorkflow(
                    rank=outcomeworkflow.rank,
                    outcome=id_dict["outcome"][outcomeworkflow.outcome.id],
                    workflow=new_workflow,
                )
                for outcomeworkflow in outcomeworkflows
            ]
        )

        OutcomeOutcome.objects.bulk_create(
            [
                OutcomeOutcome(
                    rank=outcomeoutcome.rank,
                    child=id_dict["outcome"][outcomeoutcome.child.id],
                    parent=id_dict["outcome"][outcomeoutcome.parent.id],
                )
                for outcomeoutcome in outcomeoutcomes
            ]
        )

        # Add the sets
        old_project = workflow.get_project()
        if (
            old_project is not None
            and project is not None
            and old_project.id == project.id
        ):
            for node in nodes:
                if node.sets.all().count() > 0:
                    for set in node.sets.all():
                        id_dict["node"][node.id].sets.add(set)
                    node.save()

            for outcome in outcomes:
                if outcome.sets.all().count() > 0:
                    for set in outcome.sets.all():
                        id_dict["outcome"][outcome.id].sets.add(set)
                    outcome.save()

    except IndexError:
        return None

    return new_workflow


def fast_duplicate_project(project: Project, author: User) -> Project:
    try:
        # Duplicate the project
        new_project = Project.objects.create(
            title=project.title,
            description=project.description,
            author=author,
            is_original=False,
            parent_project=project,
            deleted=project.deleted,
        )

        # Retrieve all data.
        # Speed is critical here. querying through __ has come out much faster (by a factor of up to 100) in testing than moving vertically through the heirarchy, even when prefetc_related is used.
        # In order to speed the creation of the throughmodels, select_related is used for any foreignkeys that need to be traversed

        workflowprojects = WorkflowProject.objects.filter(
            project=project
        ).select_related("workflow")
        activities = Activity.objects.filter(project=project)
        courses = Course.objects.filter(project=project)
        programs = Program.objects.filter(project=project)

        outcomeworkflows = OutcomeWorkflow.objects.filter(
            workflow__project=project
        ).select_related("outcome", "workflow")
        outcomes = Outcome.objects.filter(
            Q(workflow__project=project)
            | Q(parent_outcomes__workflow__project=project)
            | Q(parent_outcomes__parent_outcomes__workflow__project=project)
        )
        outcomeoutcomes = OutcomeOutcome.objects.filter(
            Q(parent__workflow__project=project)
            | Q(parent__parent_outcomes__workflow__project=project)
        ).select_related("child", "parent")

        outcomehorizontallinks = OutcomeHorizontalLink.objects.filter(
            Q(outcome__workflow__project=project)
            | Q(outcome__parent_outcomes__workflow__project=project)
            | Q(
                outcome__parent_outcomes__parent_outcomes__workflow__project=project
            )
        ).select_related("outcome", "parent_outcome")

        columnworkflows = ColumnWorkflow.objects.filter(
            workflow__project=project
        ).select_related("column", "workflow")
        columns = Column.objects.filter(workflow__project=project)

        weekworkflows = WeekWorkflow.objects.filter(
            workflow__project=project
        ).select_related("week", "workflow")
        weeks = Week.objects.filter(workflow__project=project)

        nodeweeks = NodeWeek.objects.filter(
            week__workflow__project=project
        ).select_related("node", "week")
        nodes = Node.objects.filter(
            week__workflow__project=project
        ).select_related("column", "linked_workflow")

        outcomenodes = OutcomeNode.objects.filter(
            node__week__workflow__project=project
        ).select_related("node", "outcome")
        nodelinks = NodeLink.objects.filter(
            source_node__week__workflow__project=project
        ).select_related("source_node", "target_node")

        object_sets = project.object_sets.all()

        # Create the new content, and keep track of old_id:new_instance pairs in a dict
        id_dict = {"workflow": {}}
        now = timezone.now()

        # Workflows have multi-table inheritance, and therefore cannot be bulk created
        for workflow in activities:
            new_workflow = fast_activity_copy(workflow, author, now)
            id_dict["workflow"][workflow.id] = new_workflow
        for workflow in courses:
            new_workflow = fast_course_copy(workflow, author, now)
            id_dict["workflow"][workflow.id] = new_workflow
        for workflow in programs:
            new_workflow = fast_program_copy(workflow, author, now)
            id_dict["workflow"][workflow.id] = new_workflow

        Column.objects.bulk_create(
            [fast_column_copy(column, author, now) for column in columns]
        )
        new_columns = Column.objects.filter(author=author, created_on=now)
        id_dict["column"] = {
            columns[i].id: new_col for i, new_col in enumerate(new_columns)
        }

        Week.objects.bulk_create(
            [fast_week_copy(week, author, now) for week in weeks]
        )
        new_weeks = Week.objects.filter(author=author, created_on=now)
        id_dict["week"] = {
            weeks[i].id: new_week for i, new_week in enumerate(new_weeks)
        }

        Node.objects.bulk_create(
            [
                fast_node_copy(
                    node,
                    id_dict["column"][node.column.id],
                    author,
                    now,
                    workflow_dict=id_dict["workflow"],
                )
                for node in nodes
            ]
        )
        new_nodes = Node.objects.filter(author=author, created_on=now)
        id_dict["node"] = {
            nodes[i].id: new_node for i, new_node in enumerate(new_nodes)
        }

        Outcome.objects.bulk_create(
            [fast_outcome_copy(outcome, author, now) for outcome in outcomes]
        )
        new_outcomes = Outcome.objects.filter(author=author, created_on=now)
        id_dict["outcome"] = {
            outcomes[i].id: new_outcome
            for i, new_outcome in enumerate(new_outcomes)
        }

        new_object_sets = []
        for object_set in object_sets:
            new_object_set = ObjectSet.objects.create(
                term=object_set.term,
                title=object_set.title,
                translation_plural=object_set.translation_plural,
            )
            new_object_sets += [new_object_set]
            new_project.object_sets.add(new_object_set)
        id_dict["objectset"] = {
            object_sets[i].id: object_set
            for i, object_set in enumerate(new_object_sets)
        }

        # Link everything up.

        # DO NOT bulk create workflowprojects, as then the
        # necessary permissions won't be created for the author
        [
            WorkflowProject.objects.create(
                rank=workflowproject.rank,
                workflow=id_dict["workflow"][workflowproject.workflow.id],
                project=new_project,
            )
            for workflowproject in workflowprojects
        ]

        ColumnWorkflow.objects.bulk_create(
            [
                ColumnWorkflow(
                    rank=columnworkflow.rank,
                    column=id_dict["column"][columnworkflow.column.id],
                    workflow=id_dict["workflow"][columnworkflow.workflow.id],
                )
                for columnworkflow in columnworkflows
            ]
        )

        WeekWorkflow.objects.bulk_create(
            [
                WeekWorkflow(
                    rank=weekworkflow.rank,
                    week=id_dict["week"][weekworkflow.week.id],
                    workflow=id_dict["workflow"][weekworkflow.workflow.id],
                )
                for weekworkflow in weekworkflows
            ]
        )

        NodeWeek.objects.bulk_create(
            [
                NodeWeek(
                    rank=nodeweek.rank,
                    node=id_dict["node"][nodeweek.node.id],
                    week=id_dict["week"][nodeweek.week.id],
                )
                for nodeweek in nodeweeks
            ]
        )

        NodeLink.objects.bulk_create(
            [
                fast_nodelink_copy(
                    nodelink,
                    author,
                    id_dict["node"][nodelink.source_node.id],
                    id_dict["node"][nodelink.target_node.id],
                )
                for nodelink in nodelinks
            ]
        )

        OutcomeNode.objects.bulk_create(
            [
                fast_outcomenode_copy(
                    outcomenode,
                    id_dict["node"][outcomenode.node.id],
                    id_dict["outcome"][outcomenode.outcome.id],
                )
                for outcomenode in outcomenodes
            ]
        )

        OutcomeWorkflow.objects.bulk_create(
            [
                OutcomeWorkflow(
                    rank=outcomeworkflow.rank,
                    outcome=id_dict["outcome"][outcomeworkflow.outcome.id],
                    workflow=id_dict["workflow"][outcomeworkflow.workflow.id],
                )
                for outcomeworkflow in outcomeworkflows
            ]
        )

        OutcomeOutcome.objects.bulk_create(
            [
                OutcomeOutcome(
                    rank=outcomeoutcome.rank,
                    child=id_dict["outcome"][outcomeoutcome.child.id],
                    parent=id_dict["outcome"][outcomeoutcome.parent.id],
                )
                for outcomeoutcome in outcomeoutcomes
            ]
        )

        OutcomeHorizontalLink.objects.bulk_create(
            [
                OutcomeHorizontalLink(
                    rank=outcomehorizontallink.rank,
                    outcome=id_dict["outcome"][
                        outcomehorizontallink.outcome.id
                    ],
                    parent_outcome=id_dict["outcome"][
                        outcomehorizontallink.parent_outcome.id
                    ],
                )
                for outcomehorizontallink in outcomehorizontallinks
            ]
        )

        # Add the sets
        for node in nodes:
            if node.sets.all().count() > 0:
                for set in node.sets.all():
                    id_dict["node"][node.id].sets.add(
                        id_dict["objectset"][set.id]
                    )
                node.save()

        for outcome in list(outcomes):
            if outcome.sets.all().count() > 0:
                for set in outcome.sets.all():
                    id_dict["outcome"][outcome.id].sets.add(
                        id_dict["objectset"][set.id]
                    )
                outcome.save()

    except IndexError:
        return None

    for discipline in project.disciplines.all():
        new_project.disciplines.add(discipline)

    return new_project


def duplicate_workflow(workflow: Workflow, author: User) -> Workflow:
    model = get_model_from_str(workflow.type)

    new_workflow = model.objects.create(
        title=workflow.title,
        description=workflow.description,
        outcomes_type=workflow.outcomes_type,
        outcomes_sort=workflow.outcomes_sort,
        author=author,
        is_original=False,
        parent_workflow=workflow,
        is_strategy=workflow.is_strategy,
        deleted=workflow.deleted,
        condensed=workflow.condensed,
    )
    for outcome in workflow.outcomes.all():
        OutcomeWorkflow.objects.create(
            outcome=duplicate_outcome(outcome, author),
            workflow=new_workflow,
            rank=OutcomeWorkflow.objects.get(
                outcome=outcome, workflow=workflow
            ).rank,
        )

    for column in workflow.columns.all():
        ColumnWorkflow.objects.create(
            column=duplicate_column(column, author),
            workflow=new_workflow,
            rank=ColumnWorkflow.objects.get(
                column=column, workflow=workflow
            ).rank,
        )

    for week in workflow.weeks.all():
        WeekWorkflow.objects.create(
            week=duplicate_week(
                week, author, new_workflow, new_workflow.get_all_outcome_ids()
            ),
            workflow=new_workflow,
            rank=WeekWorkflow.objects.get(week=week, workflow=workflow).rank,
        )

    # Handle all the nodelinks. These need to be handled here because they
    # potentially span weeks
    for week in new_workflow.weeks.all():
        for node in week.nodes.all():
            for node_link in NodeLink.objects.filter(
                source_node=node.parent_node
            ):
                for week2 in new_workflow.weeks.all():
                    if (
                        week2.nodes.filter(
                            parent_node=node_link.target_node
                        ).count()
                        > 0
                    ):
                        duplicate_nodelink(
                            node_link,
                            author,
                            node,
                            week2.nodes.get(parent_node=node_link.target_node),
                        )

    return new_workflow


@user_can_view("workflowPk")
@user_can_edit("projectPk")
def duplicate_workflow_ajax(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    project = Project.objects.get(pk=request.POST.get("projectPk"))

    try:
        with transaction.atomic():
            clone = fast_duplicate_workflow(workflow, request.user, project)
            try:
                clone.title = clone.title + _("(copy)")
                clone.save()
            except (ValidationError, TypeError):
                pass

            WorkflowProject.objects.create(project=project, workflow=clone)

            if workflow.get_project() != project:
                cleanup_workflow_post_duplication(clone, project)

    except ValidationError:
        return JsonResponse({"action": "error"})

    linked_workflows = Workflow.objects.filter(
        linked_nodes__week__workflow=clone
    )
    for wf in linked_workflows:
        actions.dispatch_parent_updated(wf)

    return JsonResponse(
        {
            "action": "posted",
            "new_item": InfoBoxSerializer(
                clone, context={"user": request.user}
            ).data,
            "type": clone.type,
        }
    )


@user_can_view("workflowPk")
def duplicate_strategy_ajax(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        with transaction.atomic():
            clone = fast_duplicate_workflow(workflow, request.user, None)
            try:
                clone.title = clone.title + _("(copy)")
                clone.save()
            except (ValidationError, TypeError):
                pass
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "new_item": InfoBoxSerializer(
                clone, context={"user": request.user}
            ).data,
            "type": clone.type,
        }
    )


def duplicate_outcome(outcome: Outcome, author: User) -> Outcome:
    new_outcome = Outcome.objects.create(
        title=outcome.title,
        description=outcome.description,
        author=author,
        is_original=False,
        parent_outcome=outcome,
        depth=outcome.depth,
        code=outcome.code,
        deleted=outcome.deleted,
    )

    for child in outcome.children.all():
        OutcomeOutcome.objects.create(
            child=duplicate_outcome(child, author),
            parent=new_outcome,
            rank=OutcomeOutcome.objects.get(child=child, parent=outcome).rank,
        )

    return new_outcome


# @user_can_view("outcomePk")
# @user_can_edit("workflowPk")
# def duplicate_outcome_ajax(request: HttpRequest) -> HttpResponse:
#    outcome = Outcome.objects.get(pk=request.POST.get("outcomePk"))
#    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
#    try:
#        clone = duplicate_outcome(outcome, request.user)
#        OutcomeWorkflow.objects.create(workflow=workflow, outcome=clone)
#    except ValidationError:
#        return JsonResponse({"action": "error"})
#
#    return JsonResponse(
#        {
#            "action": "posted",
#            "new_item": InfoBoxSerializer(
#                clone, context={"user": request.user}
#            ).data,
#            "type": "outcome",
#        }
#    )

#
# def duplicate_project(project: Project, author: User) -> Project:
#
#    new_project = Project.objects.create(
#        title=project.title,
#        description=project.description,
#        author=author,
#        is_original=False,
#        parent_project=project,
#    )
#
#    #    for outcome in project.outcomes.all():
#    #        OutcomeProject.objects.create(
#    #            outcome=duplicate_outcome(outcome, author),
#    #            project=new_project,
#    #            rank=OutcomeProject.objects.get(
#    #                outcome=outcome, project=project
#    #            ).rank,
#    #        )
#
#    for workflow in project.workflows.all():
#        WorkflowProject.objects.create(
#            workflow=duplicate_workflow(workflow, author),
#            project=new_project,
#            rank=WorkflowProject.objects.get(
#                workflow=workflow, project=project
#            ).rank,
#        )
#
#    for discipline in project.disciplines.all():
#        new_project.disciplines.add(discipline)
#
#    for workflow in new_project.workflows.all():
#        cleanup_workflow_post_duplication(workflow, new_project)
#
#    return new_project


@user_can_view("projectPk")
def duplicate_project_ajax(request: HttpRequest) -> HttpResponse:
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        with transaction.atomic():
            clone = fast_duplicate_project(project, request.user)
            try:
                clone.title = clone.title + _("(copy)")
                clone.save()
            except (ValidationError, TypeError):
                pass
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "new_item": InfoBoxSerializer(
                clone, context={"user": request.user}
            ).data,
            "type": "project",
        }
    )


# post-duplication cleanup. Setting the linked workflows.
# This must be done after the fact because the workflows have not
# necessarily been duplicated by the time the nodes are
def cleanup_workflow_post_duplication(workflow, project):
    for node in Node.objects.filter(week__workflow=workflow).exclude(
        linked_workflow=None
    ):
        new_linked_workflow = project.workflows.filter(
            parent_workflow=node.linked_workflow
        ).last()
        node.linked_workflow = new_linked_workflow
        node.save()


"""
Creation methods
"""


@user_can_edit("projectPk")
def add_terminology(request: HttpRequest) -> HttpResponse:
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    term = json.loads(request.POST.get("term"))
    title = json.loads(request.POST.get("title"))
    translation_plural = json.loads(request.POST.get("translation_plural"))
    try:
        project.object_sets.create(
            term=term,
            title=title,
            translation_plural=translation_plural,
        )
    except ValidationError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "new_dict": ProjectSerializerShallow(project).data["object_sets"],
        }
    )


@user_can_comment(False)
def add_comment(request: HttpRequest) -> HttpResponse:
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


@user_can_edit("weekPk")
@user_can_view_or_none("columnPk")
def new_node(request: HttpRequest) -> HttpResponse:
    week_id = json.loads(request.POST.get("weekPk"))
    column_id = json.loads(request.POST.get("columnPk"))
    column_type = json.loads(request.POST.get("columnType"))
    position = json.loads(request.POST.get("position"))
    week = Week.objects.get(pk=week_id)
    try:
        if column_id is not None and column_id >= 0:
            column = Column.objects.get(pk=column_id)
            columnworkflow = ColumnWorkflow.objects.get(column=column)
        elif column_type is not None and column_type >= 0:
            column = Column.objects.create(
                column_type=column_type, author=week.author
            )
            columnworkflow = ColumnWorkflow.objects.create(
                column=column,
                workflow=week.get_workflow(),
                rank=week.get_workflow().columns.count(),
            )
        else:
            columnworkflow = ColumnWorkflow.objects.filter(
                workflow=WeekWorkflow.objects.get(week=week).workflow
            ).first()
            column = columnworkflow.column
        if position < 0 or position > week.nodes.count():
            position = week.nodes.count()
        node = Node.objects.create(
            author=week.author, node_type=week.week_type, column=column
        )
        node_week = NodeWeek.objects.create(
            week=week, node=node, rank=position
        )
    except ValidationError:
        return JsonResponse({"action": "error"})
    response_data = {
        "new_model": NodeSerializerShallow(node).data,
        "new_through": NodeWeekSerializerShallow(node_week).data,
        "index": position,
        "parentID": week_id,
        "columnworkflow": ColumnWorkflowSerializerShallow(columnworkflow).data,
        "column": ColumnSerializerShallow(column).data,
    }
    actions.dispatch_wf(
        week.get_workflow(), actions.newNodeAction(response_data)
    )
    return JsonResponse({"action": "posted"})


@user_can_edit("workflowPk")
def new_outcome_for_workflow(request: HttpRequest) -> HttpResponse:
    workflow_id = json.loads(request.POST.get("workflowPk"))
    workflow = Workflow.objects.get(pk=workflow_id)
    objectset_id_json = request.POST.get("objectsetPk")
    if objectset_id_json is not None:
        objectset_id = json.loads(objectset_id_json)
    else:
        objectset_id = None
    try:
        outcome = Outcome.objects.create(author=request.user)
        if objectset_id is not None:
            objectset = ObjectSet.objects.get(id=objectset_id)
            outcome.sets.add(objectset)
        outcome_workflow = OutcomeWorkflow.objects.create(
            workflow=workflow, outcome=outcome, rank=workflow.outcomes.count()
        )
    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "new_model": OutcomeSerializerShallow(outcome).data,
        "new_through": OutcomeWorkflowSerializerShallow(outcome_workflow).data,
        "parentID": workflow_id,
    }
    actions.dispatch_wf(workflow, actions.newOutcomeAction(response_data))
    actions.dispatch_to_parent_wf(
        workflow, actions.newOutcomeAction(response_data)
    )

    return JsonResponse({"action": "posted"})


@user_can_edit("workflowPk")
@user_can_view(False)
def add_strategy(request: HttpRequest) -> HttpResponse:
    workflow_id = json.loads(request.POST.get("workflowPk"))
    strategy_id = json.loads(request.POST.get("objectID"))
    strategy_type = json.loads(request.POST.get("objectType"))
    position = json.loads(request.POST.get("position"))
    workflow = Workflow.objects.get(pk=workflow_id)
    strategy = get_model_from_str(strategy_type).objects.get(pk=strategy_id)
    try:
        if strategy.author == request.user or strategy.published:
            # first, check compatibility between types (activity/course)
            if strategy.type != workflow.type:
                raise ValidationError("Mismatch between types")
            # create a copy of the strategy (the first/only week in the strategy
            # workflow). Note that all the nodes, at this point, are pointed at
            # the columns from the OLD workflow
            if position < 0 or position > workflow.weeks.count():
                position = workflow.weeks.count()
            old_week = strategy.weeks.first()
            week = fast_duplicate_week(old_week, request.user)
            week.title = strategy.title
            week.is_strategy = True
            week.original_strategy = strategy
            week.save()
            new_through = WeekWorkflow.objects.create(
                week=week, workflow=workflow, rank=position
            )
            # now, check for missing columns. We try to create a one to one
            # relationship between the columns, and then add in any that are
            # still missing
            old_columns = []
            for node in week.nodes.all():
                if node.column not in old_columns:
                    old_columns.append(node.column)
            new_columns = []
            columnworkflows_added = []
            columns_added = []
            for column in old_columns:
                # check for a new column with same type
                columns_type = workflow.columns.filter(
                    column_type=column.column_type
                ).exclude(id__in=map(lambda x: x.id, new_columns))
                if columns_type.count() == 1:
                    new_columns.append(columns_type.first())
                    continue
                if columns_type.count() == 0:
                    added_column = duplicate_column(column, request.user)
                    columnworkflows_added.append(
                        ColumnWorkflow.objects.create(
                            column=added_column,
                            workflow=workflow,
                            rank=workflow.columns.count(),
                        )
                    )
                    new_columns.append(added_column)
                    columns_added.append(added_column)
                    continue
                if columns_type.count() > 1:
                    # if we have multiple columns of that type, check to see if
                    # any have this one as their parent
                    columns_parent = columns_type.filter(parent_column=column)
                    if columns_parent.count() == 1:
                        new_columns.append(columns_parent.first())
                        continue
                    if columns_parent.count() > 1:
                        columns_type = columns_parent
                    # check to see if any have the same title
                    columns_title = columns_type.filter(title=column.title)
                    if columns_title.count() >= 1:
                        new_columns.append(columns_title.first())
                        continue
                    else:
                        new_columns.append(columns_type.first())
            # go through all the nodes and fill them in with our updated columns
            for node in week.nodes.all():
                column_index = old_columns.index(node.column)
                node.column = new_columns[column_index]
                node.save()
            # we have to copy all the nodelinks, since by default they are not
            # duplicated when a week is duplicated
            #            for node_link in NodeLink.objects.filter(
            #                source_node__in=old_week.nodes.all(),
            #                target_node__in=old_week.nodes.all(),
            #            ):
            #                duplicate_nodelink(
            #                    node_link,
            #                    request.user,
            #                    week.nodes.get(parent_node=node_link.source_node),
            #                    week.nodes.get(parent_node=node_link.target_node),
            #                )

            # return all this information to the user
            response_data = {
                "strategy": WeekSerializerShallow(week).data,
                "new_through": WeekWorkflowSerializerShallow(new_through).data,
                "index": position,
                "columns_added": ColumnSerializerShallow(
                    columns_added, many=True
                ).data,
                "columnworkflows_added": ColumnWorkflowSerializerShallow(
                    columnworkflows_added, many=True
                ).data,
                "nodeweeks_added": NodeWeekSerializerShallow(
                    week.nodeweek_set, many=True
                ).data,
                "nodes_added": NodeSerializerShallow(
                    week.nodes.all(), many=True
                ).data,
                "nodelinks_added": NodeLinkSerializerShallow(
                    NodeLink.objects.filter(
                        source_node__in=week.nodes.all(),
                        target_node__in=week.nodes.all(),
                    ),
                    many=True,
                ).data,
            }
            actions.dispatch_wf(
                workflow, actions.newStrategyAction(response_data)
            )
            return JsonResponse({"action": "posted"})

        else:
            raise ValidationError("User cannot access this strategy")
    except ValidationError:
        return JsonResponse({"action": "error"})


@user_can_edit("nodePk")
@user_can_edit(False)
def new_node_link(request: HttpRequest) -> HttpResponse:
    node_id = json.loads(request.POST.get("nodePk"))
    target_id = json.loads(request.POST.get("objectID"))
    target_type = json.loads(request.POST.get("objectType"))
    source_port = json.loads(request.POST.get("sourcePort"))
    target_port = json.loads(request.POST.get("targetPort"))
    node = Node.objects.get(pk=node_id)
    target = get_model_from_str(target_type).objects.get(pk=target_id)
    try:
        node_link = NodeLink.objects.create(
            author=node.author,
            source_node=node,
            target_node=target,
            source_port=source_port,
            target_port=target_port,
        )
    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "new_model": NodeLinkSerializerShallow(node_link).data,
    }
    actions.dispatch_wf(
        node.get_workflow(), actions.newNodeLinkAction(response_data)
    )
    return JsonResponse({"action": "posted"})


# Add a new child to a model
@user_can_edit(False)
def insert_child(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))

    try:
        if object_type == "outcome":
            model = Outcome.objects.get(id=object_id)
            newmodel = Outcome.objects.create(
                author=model.author, depth=model.depth + 1
            )
            newrank = model.children.count()
            newthroughmodel = OutcomeOutcome.objects.create(
                parent=model, child=newmodel, rank=newrank
            )
            newmodel.refresh_from_db()
            new_model_serialized = OutcomeSerializerShallow(newmodel).data
            new_through_serialized = OutcomeOutcomeSerializerShallow(
                newthroughmodel
            ).data
            outcomenodes = OutcomeNode.objects.filter(outcome=newmodel)
            outcomenodes_serialized = OutcomeNodeSerializerShallow(
                outcomenodes, many=True
            ).data
            node_updates = NodeSerializerShallow(
                [x.node for x in outcomenodes], many=True
            ).data
        else:
            raise ValidationError("Uknown component type")

    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "new_model": new_model_serialized,
        "new_through": new_through_serialized,
        "children": {
            "outcomenode": outcomenodes_serialized,
            "outcome": [],
            "outcomeoutcome": [],
        },
        "node_updates": node_updates,
        "parentID": model.id,
    }
    workflow = model.get_workflow()
    actions.dispatch_wf(
        workflow,
        actions.insertChildAction(response_data, object_type),
    )
    if object_type == "outcome":
        actions.dispatch_to_parent_wf(
            workflow, actions.insertChildAction(response_data, "outcome")
        )
    return JsonResponse({"action": "posted"})


# Add a new sibling to a through model
@user_can_view(False)
@user_can_edit(False, get_parent=True)
def insert_sibling(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))
    parent_type = json.loads(request.POST.get("parentType"))
    through_type = json.loads(request.POST.get("throughType"))
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        parent = get_model_from_str(parent_type).objects.get(id=parent_id)
        if parent_type == object_type:
            old_through_kwargs = {"child": model, "parent": parent}
        else:
            old_through_kwargs = {object_type: model, parent_type: parent}
        through = get_model_from_str(through_type).objects.get(
            **old_through_kwargs
        )

        if object_type == "week":
            defaults = {"week_type": model.week_type}
        elif object_type == "node":
            defaults = {"column": model.column, "node_type": model.node_type}
        elif object_type == "column":
            defaults = {"column_type": math.floor(model.column_type / 10) * 10}
        elif object_type == "outcome":
            defaults = {"depth": model.depth}
        else:
            defaults = {}

        new_model = get_model_from_str(object_type).objects.create(
            author=request.user, **defaults
        )
        if parent_type == object_type:
            new_through_kwargs = {"child": new_model, "parent": parent}
        else:
            new_through_kwargs = {object_type: new_model, parent_type: parent}
        new_through_model = get_model_from_str(through_type).objects.create(
            **new_through_kwargs, rank=through.rank + 1
        )
        new_model_serialized = serializer_lookups_shallow[object_type](
            new_model
        ).data
        new_through_serialized = serializer_lookups_shallow[through_type](
            new_through_model
        ).data
        if object_type == "outcome":
            outcomenodes = OutcomeNode.objects.filter(outcome=new_model)
            outcomenodes_serialized = OutcomeNodeSerializerShallow(
                outcomenodes, many=True
            ).data
            node_updates = NodeSerializerShallow(
                [x.node for x in outcomenodes], many=True
            ).data
            children = {
                "outcomenode": outcomenodes_serialized,
                "outcome": [],
                "outcomeoutcome": [],
            }
        else:
            children = None
            node_updates = []

    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "new_model": new_model_serialized,
        "new_through": new_through_serialized,
        "children": children,
        "node_updates": node_updates,
        "parentID": parent_id,
    }
    workflow = model.get_workflow()
    if object_type == "outcome" and through_type == "outcomeworkflow":
        object_type = "outcome_base"
    actions.dispatch_wf(
        workflow,
        actions.insertBelowAction(response_data, object_type),
    )
    if object_type == "outcome" or object_type == "outcome_base":
        actions.dispatch_to_parent_wf(
            workflow,
            actions.insertBelowAction(response_data, object_type),
        )
    return JsonResponse({"action": "posted"})


# Soft-duplicate the item
@user_can_view(False)
@user_can_edit(False, get_parent=True)
def duplicate_self(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))
    parent_type = json.loads(request.POST.get("parentType"))
    through_type = json.loads(request.POST.get("throughType"))  # noqa F841
    node_updates = []
    try:
        with transaction.atomic():
            if object_type == "week":
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                parent = get_model_from_str(parent_type).objects.get(
                    id=parent_id
                )
                through = WeekWorkflow.objects.get(week=model, workflow=parent)
                newmodel = fast_duplicate_week(model, request.user)
                newthroughmodel = WeekWorkflow.objects.create(
                    workflow=parent, week=newmodel, rank=through.rank + 1
                )
                try:
                    newmodel.title = newmodel.title + _("(copy)")
                    newmodel.save()
                except (ValidationError, TypeError):
                    pass
                new_model_serialized = WeekSerializerShallow(newmodel).data
                new_through_serialized = WeekWorkflowSerializerShallow(
                    newthroughmodel
                ).data
                new_children_serialized = {
                    "node": NodeSerializerShallow(
                        newmodel.nodes,
                        many=True,
                        context={"user": request.user},
                    ).data,
                    "nodeweek": NodeWeekSerializerShallow(
                        newmodel.nodeweek_set, many=True
                    ).data,
                    "outcomenode": OutcomeNodeSerializerShallow(
                        OutcomeNode.objects.filter(node__week=newmodel),
                        many=True,
                    ).data,
                    "nodelink": NodeLinkSerializerShallow(
                        NodeLink.objects.filter(source_node__week=newmodel),
                        many=True,
                    ).data,
                }
            elif object_type == "node":
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                parent = get_model_from_str(parent_type).objects.get(
                    id=parent_id
                )
                through = NodeWeek.objects.get(node=model, week=parent)
                newmodel = duplicate_node(model, request.user, None, None)
                newthroughmodel = NodeWeek.objects.create(
                    week=parent, node=newmodel, rank=through.rank + 1
                )
                try:
                    newmodel.title = newmodel.title + _("(copy)")
                    newmodel.save()
                except (ValidationError, TypeError):
                    pass
                new_model_serialized = NodeSerializerShallow(
                    newmodel, context={"user": request.user}
                ).data
                new_through_serialized = NodeWeekSerializerShallow(
                    newthroughmodel
                ).data
                new_children_serialized = {
                    "outcomenode": OutcomeNodeSerializerShallow(
                        OutcomeNode.objects.filter(node=newmodel), many=True
                    ).data,
                }
            elif object_type == "column":
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                parent = get_model_from_str(parent_type).objects.get(
                    id=parent_id
                )
                through = ColumnWorkflow.objects.get(
                    column=model, workflow=parent
                )
                newmodel = duplicate_column(model, request.user)
                newthroughmodel = ColumnWorkflow.objects.create(
                    workflow=parent, column=newmodel, rank=through.rank + 1
                )
                try:
                    newmodel.title = newmodel.title + _("(copy)")
                    newmodel.save()
                except (ValidationError, TypeError):
                    pass
                new_model_serialized = ColumnSerializerShallow(newmodel).data
                new_through_serialized = ColumnWorkflowSerializerShallow(
                    newthroughmodel
                ).data
                new_children_serialized = None
            elif object_type == "outcome":
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                newmodel = fast_duplicate_outcome(model, request.user)
                try:
                    newmodel.title = newmodel.title + _("(copy)")
                    newmodel.save()
                except (ValidationError, TypeError):
                    pass
                if parent_type == "outcome":
                    parent = get_model_from_str(parent_type).objects.get(
                        id=parent_id
                    )
                    through = OutcomeOutcome.objects.get(
                        child=model, parent=parent
                    )
                    newthroughmodel = OutcomeOutcome.objects.create(
                        parent=parent, child=newmodel, rank=through.rank + 1
                    )
                    new_through_serialized = OutcomeOutcomeSerializerShallow(
                        newthroughmodel
                    ).data
                elif parent_type == "workflow":
                    parent = get_model_from_str(parent_type).objects.get(
                        id=parent_id
                    )
                    through = OutcomeWorkflow.objects.get(
                        outcome=model, workflow=parent
                    )
                    newthroughmodel = OutcomeWorkflow.objects.create(
                        workflow=parent,
                        outcome=newmodel,
                        rank=through.rank + 1,
                    )
                    new_through_serialized = OutcomeWorkflowSerializerShallow(
                        newthroughmodel
                    ).data

                new_model_serialized = OutcomeSerializerShallow(newmodel).data
                outcomes, outcomeoutcomes = get_all_outcomes_for_outcome(
                    newmodel
                )
                outcomenodes = OutcomeNode.objects.filter(
                    outcome__id__in=[newmodel.id] + [x.id for x in outcomes]
                )
                node_updates = NodeSerializerShallow(
                    list(set([x.node for x in outcomenodes])),
                    many=True,
                ).data
                new_children_serialized = {
                    "outcome": OutcomeSerializerShallow(
                        outcomes, many=True
                    ).data,
                    "outcomeoutcome": OutcomeOutcomeSerializerShallow(
                        outcomeoutcomes, many=True
                    ).data,
                    "outcomenode": OutcomeNodeSerializerShallow(
                        outcomenodes, many=True
                    ).data,
                }
            else:
                raise ValidationError("Uknown component type")
    except ValidationError:
        return JsonResponse({"action": "error"})
    response_data = {
        "new_model": new_model_serialized,
        "new_through": new_through_serialized,
        "parentID": parent_id,
        "children": new_children_serialized,
        "node_updates": node_updates,
    }
    workflow = model.get_workflow()
    if object_type == "outcome" and through_type == "outcomeworkflow":
        object_type = "outcome_base"
    actions.dispatch_wf(
        workflow,
        actions.insertBelowAction(response_data, object_type),
    )
    if object_type == "outcome" or object_type == "outcome_base":
        actions.dispatch_to_parent_wf(
            workflow,
            actions.insertBelowAction(response_data, object_type),
        )

    linked_workflows = False
    if object_type == "node":
        linked_workflows = Workflow.objects.filter(linked_nodes=model)
    elif object_type == "week":
        linked_workflows = Workflow.objects.filter(linked_nodes__week=model)
    if linked_workflows:
        for wf in linked_workflows:
            actions.dispatch_parent_updated(wf)
    return JsonResponse({"action": "posted"})


# favourite/unfavourite a project or workflow for a user
@user_can_view(False)
def toggle_favourite(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    objectType = json.loads(request.POST.get("objectType"))
    favourite = json.loads(request.POST.get("favourite"))
    response = {}
    if objectType in ["activity", "course", "program"]:
        objectType = "workflow"
    try:
        item = get_model_from_str(objectType).objects.get(pk=object_id)
        Favourite.objects.filter(
            user=request.user,
            content_type=ContentType.objects.get_for_model(item),
            object_id=object_id,
        ).delete()
        if favourite:
            Favourite.objects.create(user=request.user, content_object=item)
        response["action"] = "posted"
    except ValidationError:
        response["action"] = "error"

    return JsonResponse(response)


# change permissions on an object for a user
@user_can_edit(False)
def set_permission(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    objectType = json.loads(request.POST.get("objectType"))
    if objectType in ["activity", "course", "program"]:
        objectType = "workflow"
    user_id = json.loads(request.POST.get("permission_user"))
    permission_type = json.loads(request.POST.get("permission_type"))
    response = {}
    try:
        user = User.objects.get(id=user_id)
        if (
            permission_type
            in [
                ObjectPermission.PERMISSION_EDIT,
                ObjectPermission.PERMISSION_VIEW,
                ObjectPermission.PERMISSION_COMMENT,
            ]
            and Group.objects.get(name=settings.TEACHER_GROUP)
            not in user.groups.all()
        ):
            return JsonResponse(
                {"action": "error", "error": _("User is not a teacher.")}
            )
        item = get_model_from_str(objectType).objects.get(id=object_id)
        # if hasattr(item, "get_subclass"):
        #     item = item.get_subclass()

        project = item.get_project()
        if permission_type != ObjectPermission.PERMISSION_EDIT:
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

        # if permission_type == ObjectPermission.PERMISSION_STUDENT:
        #     if objectType == "project":
        #         if item.liveproject is None:
        #             return JsonResponse(
        #                 {
        #                     "action": "error",
        #                     "error": _(
        #                         "Cannot add a student to a non-live project."
        #                     ),
        #                 }
        #             )
        #     else:
        #         project = item.get_project()
        #         if project is None:
        #             return JsonResponse(
        #                 {
        #                     "action": "error",
        #                     "error": _(
        #                         "Cannot add a student to this workflow type."
        #                     ),
        #                 }
        #             )
        #         elif project.liveproject is None:
        #             return JsonResponse(
        #                 {
        #                     "action": "error",
        #                     "error": _(
        #                         "Cannot add a student to a non-live project."
        #                     ),
        #                 }
        #             )

        ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(item),
            object_id=object_id,
        ).delete()
        if permission_type != ObjectPermission.PERMISSION_NONE:
            ObjectPermission.objects.create(
                user=user, content_object=item, permission_type=permission_type
            )
            make_user_notification(
                source_user=request.user,
                target_user=user,
                notification_type=Notification.TYPE_SHARED,
                content_object=item,
            )
        response["action"] = "posted"
    except ValidationError:
        response["action"] = "error"

    return JsonResponse(response)


@user_can_view(False)
def get_users_for_object(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    if object_type in ["activity", "course", "program"]:
        object_type = "workflow"
    content_type = ContentType.objects.get(model=object_type)
    this_object = get_model_from_str(object_type).objects.get(id=object_id)
    published = this_object.published
    public_view = False
    if object_type == "workflow":
        public_view = this_object.public_view
    try:
        this_object = get_model_from_str(object_type).objects.get(id=object_id)
        cannot_change = []
        if this_object.author is not None:
            cannot_change = [this_object.author.id]
            author = UserSerializer(this_object.author).data
            if object_type == "workflow" and not this_object.is_strategy:
                cannot_change.append(this_object.get_project().author.id)
        else:
            author = None
        editors = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_EDIT,
        ).select_related("user"):
            editors.add(object_permission.user)
        viewers = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_VIEW,
        ).select_related("user"):
            viewers.add(object_permission.user)
        commentors = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_COMMENT,
        ).select_related("user"):
            commentors.add(object_permission.user)
        students = set()
        for object_permission in ObjectPermission.objects.filter(
            content_type=content_type,
            object_id=object_id,
            permission_type=ObjectPermission.PERMISSION_STUDENT,
        ).select_related("user"):
            students.add(object_permission.user)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "author": author,
            "viewers": UserSerializer(viewers, many=True).data,
            "commentors": UserSerializer(commentors, many=True).data,
            "editors": UserSerializer(editors, many=True).data,
            "students": UserSerializer(students, many=True).data,
            "published": published,
            "public_view": public_view,
            "cannot_change": cannot_change,
        }
    )


@user_is_teacher()
def get_user_list(request: HttpRequest) -> HttpResponse:
    name_filter = json.loads(request.POST.get("filter"))
    names = name_filter.split(" ")
    length = len(names)
    filters = [[name_filter, ""], ["", name_filter]]
    for i, name in enumerate(names):
        if i < length - 1:
            filters += [
                [" ".join(names[0 : i + 1]), " ".join(names[i + 1 : length])]
            ]
    try:
        q_objects = Q(username__istartswith=name_filter)
        for q_filter in filters:
            q_objects |= Q(
                first_name__istartswith=q_filter[0],
                last_name__istartswith=q_filter[1],
            )

        teacher_group = Group.objects.get(name=settings.TEACHER_GROUP)

        user_list = User.objects.filter(q_objects, groups=teacher_group)[:10]
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
                User.objects.filter(q_objects, groups=teacher_group).exclude(
                    id__in=[user.id for user in user_list]
                )[: 10 - count]
            )

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "user_list": UserSerializer(user_list, many=True).data,
        }
    )


def get_library_objects(user, name_filter, nresults):
    all_objects = ObjectPermission.objects.filter(user=user).filter(
        Q(project__title__istartswith=name_filter, project__deleted=False)
        | Q(
            workflow__title__istartswith=name_filter,
            workflow__deleted=False,
        )
    )
    # add ordering

    if nresults > 0:
        all_objects = all_objects[:nresults]
    return_objects = [x.content_object for x in all_objects]
    count = len(return_objects)
    if nresults == 0 or count < nresults:
        extra_objects = ObjectPermission.objects.filter(user=user).filter(
            Q(
                project__title__icontains=" " + name_filter,
                project__deleted=False,
            )
            | Q(
                workflow__title__icontains=" " + name_filter,
                workflow__deleted=False,
            )
        )
        if nresults > 0:
            extra_objects = extra_objects[: nresults - count]
        return_objects += [x.content_object for x in extra_objects]
    return return_objects


def get_explore_objects(user, name_filter, nresults, published, data):
    keywords = name_filter.split(" ")
    types = data.get("types", [])
    disciplines = data.get("disciplines", [])
    sort = data.get("sort", None)
    from_saltise = data.get("from_saltise", False)
    content_rich = data.get("content_rich", False)
    sort_reversed = data.get("sort_reversed", False)
    page = data.get("page", 1)

    filter_kwargs = {}
    # Create filters for each keyword
    q_objects = Q()
    for keyword in keywords:
        q_objects &= (
            Q(author__first_name__icontains=keyword)
            | Q(author__username__icontains=keyword)
            | Q(author__last_name__icontains=keyword)
            | Q(title__icontains=keyword)
            | Q(description__icontains=keyword)
        )
    # Choose which types to search
    if len(types) == 0:
        types = ("project", "workflow")
    # Create disciplines filter
    if len(disciplines) > 0:
        filter_kwargs["disciplines__in"] = disciplines
    if content_rich:
        filter_kwargs["num_nodes__gte"] = 3
    if from_saltise:
        filter_kwargs["from_saltise"] = True

    if published:
        try:
            queryset = reduce(
                lambda x, y: chain(x, y),
                [
                    get_model_from_str(model_type)
                    .objects.filter(published=True)
                    .annotate(num_nodes=Count("workflows__weeks__nodes"))
                    .filter(**filter_kwargs)
                    .filter(q_objects)
                    .exclude(deleted=True)
                    .distinct()
                    if model_type == "project"
                    else get_model_from_str(model_type)
                    .objects.filter(published=True)
                    .annotate(num_nodes=Count("weeks__nodes"))
                    .filter(**filter_kwargs)
                    .filter(q_objects)
                    .exclude(Q(deleted=True) | Q(project__deleted=True))
                    .distinct()
                    for model_type in types
                ],
            )
            if sort is not None:
                if sort == "created_on" or sort == "title":
                    sort_key = attrgetter(sort)
                elif sort == "relevance":

                    def sort_key(x):
                        return get_relevance(x, name_filter, keywords)

                queryset = sorted(
                    queryset, key=sort_key, reverse=sort_reversed
                )
            queryset = list(queryset)

            total_results = len(queryset)
            return_objects = queryset[
                max((page - 1) * nresults, 0) : min(
                    page * nresults, total_results
                )
            ]
            page_number = math.ceil(float(total_results) / nresults)
            pages = {
                "total_results": total_results,
                "page_count": page_number,
                "current_page": page,
                "results_per_page": nresults,
            }
        except TypeError:
            return_objects = Project.objects.none()
            pages = {}
    else:
        return_objects = Project.objects.none()
        pages = {}
    return return_objects, pages


@user_is_teacher()
def search_all_objects(request: HttpRequest) -> HttpResponse:
    name_filter = json.loads(request.POST.get("filter")).lower()
    data = json.loads(request.POST.get("additional_data", "{}"))
    nresults = data.get("nresults", 10)
    full_search = data.get("full_search", False)
    published = data.get("published", False)
    # A full search of all objects, paginated
    if full_search:
        return_objects, pages = get_explore_objects(
            request.user, name_filter, nresults, published, data
        )
    # Small search for library
    else:
        return_objects = get_library_objects(
            request.user, name_filter, nresults
        )
        pages = {}

    return JsonResponse(
        {
            "action": "posted",
            "workflow_list": InfoBoxSerializer(
                return_objects, context={"user": request.user}, many=True
            ).data,
            "pages": pages,
        }
    )


"""
Reorder methods
"""


# Insert a model via its throughmodel
@user_can_edit(False)
@user_can_edit_or_none(False, get_parent=True)
@user_can_edit_or_none("columnPk")
@from_same_workflow(False, False, get_parent=True)
@from_same_workflow(False, "columnPk")
def inserted_at(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    inserted = json.loads(request.POST.get("inserted", "false"))
    column_change = json.loads(request.POST.get("columnChange", "false"))
    changing_workflow = False
    try:
        with transaction.atomic():
            if column_change:
                new_column_id = json.loads(request.POST.get("columnPk"))
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                new_column = Column.objects.get(id=new_column_id)
                model.column = new_column
                model.save()
            if inserted:
                parent_id = json.loads(request.POST.get("parentID"))
                parent_type = json.loads(request.POST.get("parentType"))
                new_position = json.loads(request.POST.get("newPosition"))
                through_type = json.loads(request.POST.get("throughType"))
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                parent = get_model_from_str(parent_type).objects.get(
                    id=parent_id
                )
                workflow1 = model.get_workflow()
                workflow2 = parent.get_workflow()
                if workflow1.pk != workflow2.pk:
                    changing_workflow = True
                    if (
                        workflow1.get_project().pk
                        == workflow2.get_project().pk
                    ):
                        if object_type == "node":
                            model.outcomenode_set.all().delete()
                            same_type_columns = workflow2.columns.filter(
                                column_type=model.column.column_type
                            )
                            if same_type_columns.count() > 0:
                                new_column = same_type_columns.first()
                            else:
                                new_column = workflow2.columns.all().first()
                            model.column = new_column
                            model.save()
                            linked_workflows = Workflow.objects.filter(
                                linked_nodes=model
                            )
                        elif (
                            object_type == "outcome"
                            or object_type == "outcome_base"
                        ):
                            OutcomeNode.objects.filter()
                            outcomes_list = [object_id] + list(
                                get_descendant_outcomes(model).values_list(
                                    "pk", flat=True
                                )
                            )
                            affected_nodes = (
                                Node.objects.filter(
                                    outcomes__in=outcomes_list
                                ).values_list("pk", flat=True),
                            )
                            linked_workflows = Workflow.objects.filter(
                                linked_nodes__outcomes__in=outcomes_list
                            )
                            OutcomeNode.objects.filter(
                                outcome__in=outcomes_list
                            ).delete()
                        else:
                            return JsonResponse({"action": "posted"})
                if object_type == parent_type:
                    creation_kwargs = {"child": model, "parent": parent}
                    search_kwargs = {"child": model}
                    index_kwargs = {"parent": parent, "child__deleted": False}
                else:
                    creation_kwargs = {object_type: model, parent_type: parent}
                    search_kwargs = {object_type: model}
                    index_kwargs = {
                        parent_type: parent,
                        object_type + "__deleted": False,
                    }
                # Adjust the new position, given the # of deleted items
                try:
                    all_throughs = (
                        get_model_from_str(through_type)
                        .objects.filter(**index_kwargs)
                        .order_by("rank")
                    )
                    if new_position < 0:
                        new_position = 0
                    elif new_position >= all_throughs.count():
                        new_position = all_throughs.count()
                    else:
                        new_position = (
                            get_model_from_str(through_type)
                            .objects.filter(**index_kwargs)
                            .order_by("rank")[new_position]
                            .rank
                        )
                except (IndexError, AttributeError):
                    print("had an error in inserted_at")

                old_through_id = (
                    get_model_from_str(through_type)
                    .objects.filter(**search_kwargs)
                    .first()
                    .id
                )
                new_through = get_model_from_str(through_type).objects.create(
                    rank=new_position, **creation_kwargs
                )

    except ValidationError:
        return JsonResponse({"action": "error"})
    workflow = model.get_workflow()
    if inserted:
        if changing_workflow:
            object_type_sent = object_type
            if object_type == "outcome" and through_type == "outcomeworkflow":
                object_type_sent = "outcome_base"
            # Send a signal to delete the object from its original workflow
            extra_data = {}
            new_children_serialized = None
            if object_type == "outcome" or object_type == "outcome_base":
                extra_data = RefreshSerializerNode(
                    Node.objects.filter(pk__in=affected_nodes),
                    many=True,
                ).data
                outcomes_to_update = RefreshSerializerOutcome(
                    Outcome.objects.filter(
                        horizontal_outcomes__in=outcomes_list
                    ),
                    many=True,
                ).data
                outcomes, outcomeoutcomes = get_all_outcomes_for_outcome(model)
                new_children_serialized = {
                    "outcome": OutcomeSerializerShallow(
                        outcomes, many=True
                    ).data,
                    "outcomeoutcome": OutcomeOutcomeSerializerShallow(
                        outcomeoutcomes, many=True
                    ).data,
                }

            delete_action = actions.deleteSelfAction(
                object_id, object_type_sent, old_through_id, extra_data
            )
            actions.dispatch_wf(
                workflow1,
                delete_action,
            )
            # Send a signal to add it to the new workflow
            new_model_serialized = serializer_lookups_shallow[object_type](
                model
            ).data
            new_through_serialized = serializer_lookups_shallow[through_type](
                new_through
            ).data
            response_data = {
                "new_model": new_model_serialized,
                "new_through": new_through_serialized,
                "parentID": parent_id,
                "children": new_children_serialized,
            }

            actions.dispatch_wf(
                workflow2,
                actions.insertBelowAction(response_data, object_type_sent),
            )
            # Send the relevant signals to parent and child workflows
            if object_type == "outcome" or object_type == "outcome_base":
                actions.dispatch_to_parent_wf(
                    workflow1,
                    delete_action,
                )
                if linked_workflows:
                    for wf in linked_workflows:
                        actions.dispatch_wf(wf, delete_action)
                        actions.dispatch_wf(
                            wf,
                            actions.updateHorizontalLinks(
                                {"data": outcomes_to_update}
                            ),
                        )
            if (
                object_type != "outcome"
                and object_type != "outcome_base"
                and linked_workflows
            ):
                for wf in linked_workflows:
                    actions.dispatch_parent_updated(wf)
        else:
            if object_type == "outcome":
                outcomes, outcomeoutcomes = get_all_outcomes_for_outcome(model)
                outcomenodes = OutcomeNode.objects.filter(
                    outcome__id__in=[model.id] + [x.id for x in outcomes]
                )
                node_updates = NodeSerializerShallow(
                    list(set([x.node for x in outcomenodes])),
                    many=True,
                ).data
                new_children_serialized = {
                    "outcome": [],
                    "outcomeoutcome": [],
                    "outcomenode": OutcomeNodeSerializerShallow(
                        outcomenodes, many=True
                    ).data,
                }
                extra_data = {
                    "children": new_children_serialized,
                    "node_updates": node_updates,
                }
            else:
                extra_data = {}

            actions.dispatch_wf(
                workflow,
                actions.changeThroughID(
                    through_type, old_through_id, new_through.id, extra_data
                ),
            )
            if object_type == "outcome":
                actions.dispatch_to_parent_wf(
                    workflow,
                    actions.changeThroughID(
                        through_type,
                        old_through_id,
                        new_through.id,
                        extra_data,
                    ),
                )
    actions.dispatch_wf_lock(workflow, actions.unlock(model.id, object_type))
    return JsonResponse({"action": "posted"})


"""
Update Methods
"""


# Updates an object's information using its serializer
@user_can_edit(False)
def update_value(request: HttpRequest) -> HttpResponse:
    try:
        object_id = json.loads(request.POST.get("objectID"))
        object_type = json.loads(request.POST.get("objectType"))
        data = json.loads(request.POST.get("data"))
        changeFieldID = request.POST.get("changeFieldID", False)
        if changeFieldID:
            changeFieldID = json.loads(changeFieldID)
        objects = get_model_from_str(object_type).objects
        if hasattr(objects, "get_subclass"):
            object_to_update = objects.get_subclass(pk=object_id)
        else:
            object_to_update = objects.get(pk=object_id)
        serializer = serializer_lookups_shallow[object_type](
            object_to_update, data=data, partial=True
        )
        save_serializer(serializer)
    except ValidationError:
        return JsonResponse({"action": "error"})
    try:
        workflow = object_to_update.get_workflow()
        actions.dispatch_wf(
            workflow,
            actions.changeField(object_id, object_type, data, changeFieldID),
        )
        if object_type == "outcome":
            actions.dispatch_to_parent_wf(
                workflow,
                actions.changeField(object_id, object_type, data),
            )
    except AttributeError:
        pass

    return JsonResponse({"action": "posted"})


@user_can_edit("nodePk")
@user_can_view("outcomePk")
@from_same_workflow("nodePk", "outcomePk")
def update_outcomenode_degree(request: HttpRequest) -> HttpResponse:
    node_id = json.loads(request.POST.get("nodePk"))
    outcome_id = json.loads(request.POST.get("outcomePk"))
    degree = json.loads(request.POST.get("degree"))

    try:
        node = Node.objects.get(id=node_id)
        workflow = node.get_workflow()
        if (
            OutcomeNode.objects.filter(
                node__id=node_id, outcome__id=outcome_id, degree=degree
            ).count()
            > 0
        ):
            return JsonResponse({"action": "posted", "outcomenode": -1})
        model = OutcomeNode.objects.create(
            node=node,
            outcome=Outcome.objects.get(id=outcome_id),
            degree=degree,
        )
        new_outcomenodes = OutcomeNodeSerializerShallow(
            [model]
            + model.check_parent_outcomes()
            + model.check_child_outcomes(),
            many=True,
        ).data
        OutcomeNode.objects.filter(node=model.node, degree=0).delete()
        new_node_data = NodeSerializerShallow(model.node).data
        new_outcomenode_set = new_node_data["outcomenode_set"]
        new_outcomenode_unique_set = new_node_data["outcomenode_unique_set"]
    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    response_data = {
        "data_package": new_outcomenodes,
        "new_outcomenode_set": new_outcomenode_set,
        "new_outcomenode_unique_set": new_outcomenode_unique_set,
    }
    update_action = actions.updateOutcomenodeDegreeAction(response_data)
    actions.dispatch_wf(
        workflow,
        update_action,
    )
    if node.linked_workflow is not None:
        actions.dispatch_wf(
            node.linked_workflow,
            update_action,
        )
    return JsonResponse({"action": "posted"})


# Add a parent outcome to an outcome
@user_can_edit("outcomePk")
@user_can_view(False)
def update_outcomehorizontallink_degree(request: HttpRequest) -> HttpResponse:
    outcome_id = json.loads(request.POST.get("outcomePk"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("objectID"))
    degree = json.loads(request.POST.get("degree"))
    try:
        outcome = Outcome.objects.get(id=outcome_id)
        parent_outcome = get_model_from_str(object_type).objects.get(
            id=parent_id
        )
        workflow = outcome.get_workflow()
        parent_workflow = parent_outcome.get_workflow()
        if not check_possible_parent(workflow, parent_workflow, True):
            raise ValidationError
        if (
            OutcomeHorizontalLink.objects.filter(
                parent_outcome=parent_outcome, outcome=outcome, degree=degree
            ).count()
            > 0
        ):
            return JsonResponse(
                {"action": "posted", "outcomehorizontallink": -1}
            )
        model = OutcomeHorizontalLink.objects.create(
            outcome=outcome, parent_outcome=parent_outcome, degree=degree
        )
        new_outcomehorizontallinks = OutcomeHorizontalLinkSerializerShallow(
            [model]
            + model.check_parent_outcomes()
            + model.check_child_outcomes(),
            many=True,
        ).data
        OutcomeHorizontalLink.objects.filter(
            outcome=outcome, degree=0
        ).delete()
        new_outcome_data = OutcomeSerializerShallow(model.outcome).data
        new_outcome_horizontal_links = new_outcome_data[
            "outcome_horizontal_links"
        ]
        new_outcome_horizontal_links_unique = new_outcome_data[
            "outcome_horizontal_links_unique"
        ]
    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "data_package": new_outcomehorizontallinks,
        "new_outcome_horizontal_links": new_outcome_horizontal_links,
        "new_outcome_horizontal_links_unique": new_outcome_horizontal_links_unique,
    }
    actions.dispatch_wf(
        workflow,
        actions.updateOutcomehorizontallinkDegreeAction(response_data),
    )
    actions.dispatch_to_parent_wf(
        workflow,
        actions.updateOutcomehorizontallinkDegreeAction(response_data),
    )
    return JsonResponse({"action": "posted"})


# Do not call if duplicating the parent workflow
def set_linked_workflow(node: Node, workflow):
    project = node.get_workflow().get_project()
    if WorkflowProject.objects.get(workflow=workflow).project == project:
        node.linked_workflow = workflow
        node.save()
    else:
        try:
            new_workflow = fast_duplicate_workflow(
                workflow, node.author, project
            )
            WorkflowProject.objects.create(
                workflow=new_workflow, project=project
            )
            node.linked_workflow = new_workflow
            node.save()
        except ValidationError:
            pass


# Sets the linked workflow for a node, adding it to the project if different.
@user_can_edit("nodePk")
@user_can_view_or_none("workflowPk")
def set_linked_workflow_ajax(request: HttpRequest) -> HttpResponse:
    # last_time = time.time()
    try:
        node_id = json.loads(request.POST.get("nodePk"))
        workflow_id = json.loads(request.POST.get("workflowPk"))
        node = Node.objects.get(pk=node_id)
        parent_workflow = node.get_workflow()
        original_workflow = node.linked_workflow
        workflow = None
        if workflow_id == -1:
            node.linked_workflow = None
            node.represents_workflow = False
            node.save()
            linked_workflow = None
            linked_workflow_data = None
        else:
            workflow = Workflow.objects.get_subclass(pk=workflow_id)
            if not check_possible_parent(workflow, parent_workflow, False):
                raise ValidationError
            set_linked_workflow(node, workflow)
            if node.linked_workflow is None:
                raise ValidationError("Project could not be found")
            linked_workflow = node.linked_workflow.id
            linked_workflow_data = LinkedWorkflowSerializerShallow(
                node.linked_workflow,
                context={"user": request.user},
            ).data

    except ValidationError:
        return JsonResponse({"action": "error"})
    response_data = {
        "id": node_id,
        "linked_workflow": linked_workflow,
        "linked_workflow_data": linked_workflow_data,
    }
    if original_workflow is not None:
        actions.dispatch_parent_updated(original_workflow)
    if workflow is not None:
        actions.dispatch_parent_updated(workflow)
    actions.dispatch_wf(
        parent_workflow, actions.setLinkedWorkflowAction(response_data)
    )
    return JsonResponse({"action": "posted"})


# Creates strategy from week or turns strategy into week
@user_can_edit("weekPk")
def week_toggle_strategy(request: HttpRequest) -> HttpResponse:
    try:
        object_id = json.loads(request.POST.get("weekPk"))
        is_strategy = json.loads(request.POST.get("is_strategy"))
        week = Week.objects.get(id=object_id)
        workflow = WeekWorkflow.objects.get(week=week).workflow
        # This check is to prevent people from spamming the button, which would
        # potentially create a bunch of superfluous strategies
        if week.is_strategy != is_strategy:
            raise ValidationError("Request has already been processed")
        if week.is_strategy:
            week.is_strategy = False
            strategy = week.original_strategy.get_subclass()
            week.original_strategy = None
            week.strategy_classification = 0
            week.save()
        else:
            strategy = fast_create_strategy(week, workflow, request.user)
            strategy.title = week.title
            strategy.save()
            week.is_strategy = True
            week.original_strategy = strategy
            week.save()
        if strategy.type == "course":
            strategy_serialized = CourseSerializerShallow(strategy).data
        elif strategy.type == "activity":
            strategy_serialized = ActivitySerializerShallow(strategy).data
        else:
            strategy_serialized = ""

    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "id": week.id,
        "is_strategy": week.is_strategy,
        "strategy": strategy_serialized,
    }

    actions.dispatch_wf(workflow, actions.toggleStrategyAction(response_data))

    return JsonResponse({"action": "posted"})


@user_can_edit(False)
@user_can_view("objectsetPk")
def update_object_set(request: HttpRequest) -> HttpResponse:
    try:
        object_id = json.loads(request.POST.get("objectID"))
        object_type = json.loads(request.POST.get("objectType"))
        objectset_id = json.loads(request.POST.get("objectsetPk"))
        add = json.loads(request.POST.get("add"))
        objects = get_model_from_str(object_type).objects
        if hasattr(objects, "get_subclass"):
            objects_to_update = [objects.get_subclass(pk=object_id)]
        else:
            objects_to_update = [objects.get(pk=object_id)]
            if object_type == "outcome":
                objects_to_update += list(
                    get_descendant_outcomes(objects_to_update[0])
                )
        objectset = ObjectSet.objects.get(id=objectset_id)
        if add:
            for object_to_update in objects_to_update:
                object_to_update.sets.add(objectset)
                object_to_update.save()
        else:
            for object_to_update in objects_to_update:
                object_to_update.sets.remove(objectset)
                object_to_update.save()

    except ValidationError:
        return JsonResponse({"action": "error"})
    try:
        workflow = objects_to_update[0].get_workflow()
        if len(objects_to_update) == 1:
            action = actions.changeField(
                object_id,
                object_type,
                {
                    "sets": [
                        object_set.id
                        for object_set in object_to_update.sets.all()
                    ]
                },
            )
        else:
            action = actions.changeFieldMany(
                [obj.id for obj in objects_to_update],
                object_type,
                {
                    "sets": [
                        object_set.id
                        for object_set in object_to_update.sets.all()
                    ]
                },
            )
        actions.dispatch_wf(workflow, action)
        if object_type == "outcome":
            actions.dispatch_to_parent_wf(workflow, action)
    except AttributeError:
        pass

    return JsonResponse({"action": "posted"})


"""
Delete methods
"""


@user_can_edit(False)
def remove_comment(request: HttpRequest) -> HttpResponse:
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
def remove_all_comments(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))

    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        model.comments.all().delete()

    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


@user_enrolled_as_teacher(False)
def delete_self_live(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)

        with transaction.atomic():
            model.delete()

    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})


@user_can_delete(False)
def delete_self(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        workflow = None
        extra_data = None
        parent_id = None
        # object_suffix = ""
        try:
            workflow = model.get_workflow()
        except AttributeError:
            pass
        # Check to see if we have any linked workflows that need to be updated
        linked_workflows = False
        if object_type == "node":
            linked_workflows = list(
                Workflow.objects.filter(linked_nodes=model)
            )
        elif object_type == "week":
            linked_workflows = list(
                Workflow.objects.filter(linked_nodes__week=model)
            )
        elif object_type in ["workflow", "activity", "course", "program"]:
            workflow = None
            linked_workflows = list(
                Workflow.objects.filter(
                    linked_nodes__week__workflow__id=model.id
                )
            )
            parent_workflows = [
                node.get_workflow()
                for node in Node.objects.filter(linked_workflow=model)
            ]

        elif object_type == "outcome":
            linked_workflows = list(
                Workflow.objects.filter(
                    Q(
                        linked_nodes__outcomes__in=[model.id]
                        + list(
                            get_descendant_outcomes(model).values_list(
                                "pk", flat=True
                            )
                        )
                    )
                )
            )
        if object_type == "outcome":
            affected_nodes = (
                Node.objects.filter(
                    outcomes__in=[object_id]
                    + list(
                        get_descendant_outcomes(model).values_list(
                            "pk", flat=True
                        )
                    )
                ).values_list("pk", flat=True),
            )
        if object_type == "week":
            parent_id = WeekWorkflow.objects.get(week=model).id
        elif object_type == "column":
            parent_id = ColumnWorkflow.objects.get(column=model).id
        elif object_type == "node":
            parent_id = NodeWeek.objects.get(node=model).id
        elif object_type == "nodelink":
            parent_id = Node.objects.get(outgoing_links=model).id
        elif object_type == "outcome" and model.depth == 0:
            parent_id = OutcomeWorkflow.objects.get(outcome=model).id
            object_type = "outcome_base"
        elif object_type == "outcome":
            parent_id = OutcomeOutcome.objects.get(child=model).id
        # Delete the object
        with transaction.atomic():
            model.delete()
        if object_type == "outcome" or object_type == "outcome_base":
            extra_data = RefreshSerializerNode(
                Node.objects.filter(pk__in=affected_nodes),
                many=True,
            ).data
        elif object_type == "column":
            extra_data = (
                workflow.columnworkflow_set.filter(column__deleted=False)
                .order_by("rank")
                .first()
                .column.id
            )
    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})
    if workflow is not None:
        action = actions.deleteSelfAction(
            object_id, object_type, parent_id, extra_data
        )
        actions.dispatch_wf(
            workflow,
            action,
        )
        if object_type == "outcome" or object_type == "outcome_base":
            actions.dispatch_to_parent_wf(
                workflow,
                action,
            )
            if linked_workflows:
                for wf in linked_workflows:
                    actions.dispatch_wf(wf, action)
    if (
        object_type != "outcome"
        and object_type != "outcome_base"
        and linked_workflows
    ):
        for wf in linked_workflows:
            actions.dispatch_parent_updated(wf)
    if object_type in ["workflow", "activity", "course", "program"]:
        for parent_workflow in parent_workflows:
            actions.dispatch_child_updated(
                parent_workflow, model.get_workflow()
            )
    return JsonResponse({"action": "posted"})


@user_can_delete(False)
def restore_self(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        workflow = None
        extra_data = None
        parent_id = None
        throughparent_id = None
        throughparent_index = None
        # object_suffix = ""

        # Restore the object
        with transaction.atomic():
            model.deleted = False
            model.save()

        try:
            workflow = model.get_workflow()
        except AttributeError:
            pass
        # Check to see if we have any linked workflows that need to be updated
        linked_workflows = False
        if object_type == "node":
            linked_workflows = list(
                Workflow.objects.filter(linked_nodes=model)
            )
        elif object_type == "week":
            linked_workflows = list(
                Workflow.objects.filter(linked_nodes__week=model)
            )
        elif object_type in ["workflow", "activity", "course", "program"]:
            linked_workflows = list(
                Workflow.objects.filter(
                    linked_nodes__week__workflow__id=model.id
                )
            )
            parent_workflows = [
                node.get_workflow()
                for node in Node.objects.filter(linked_workflow=model)
            ]
        elif object_type == "outcome":
            linked_workflows = list(
                Workflow.objects.filter(
                    Q(
                        linked_nodes__outcomes__in=[model.id]
                        + list(
                            get_descendant_outcomes(model).values_list(
                                "pk", flat=True
                            )
                        )
                    )
                )
            )
        if object_type == "outcome":
            outcomes_list = [object_id] + list(
                get_descendant_outcomes(model).values_list("pk", flat=True)
            )
            extra_data = RefreshSerializerNode(
                Node.objects.filter(outcomes__in=outcomes_list),
                many=True,
            ).data
            outcomes_to_update = RefreshSerializerOutcome(
                Outcome.objects.filter(horizontal_outcomes__in=outcomes_list),
                many=True,
            ).data
        if object_type == "week":
            throughparent = WeekWorkflow.objects.get(week=model)
            throughparent_id = throughparent.id
            parent_id = workflow.id
            throughparent_index = (
                workflow.weekworkflow_set.exclude(week__deleted=True)
                .filter(rank__lt=throughparent.rank)
                .count()
            )
        elif object_type == "column":
            throughparent = ColumnWorkflow.objects.get(column=model)
            throughparent_id = throughparent.id
            throughparent_index = (
                workflow.columnworkflow_set.exclude(column__deleted=True)
                .filter(rank__lt=throughparent.rank)
                .count()
            )
            extra_data = [x.id for x in Node.objects.filter(column=model)]
            parent_id = workflow.id
        elif object_type == "node":
            throughparent = NodeWeek.objects.get(node=model)
            throughparent_id = throughparent.id
            throughparent_index = (
                throughparent.week.nodeweek_set.exclude(node__deleted=True)
                .filter(rank__lt=throughparent.rank)
                .count()
            )
            parent_id = throughparent.week.id
        elif object_type == "nodelink":
            throughparent_id = None
            parent_id = Node.objects.get(outgoing_links=model).id
        elif object_type == "outcome" and model.depth == 0:
            throughparent = OutcomeWorkflow.objects.get(outcome=model)
            throughparent_id = throughparent.id
            throughparent_index = (
                workflow.outcomeworkflow_set.exclude(outcome__deleted=True)
                .filter(rank__lt=throughparent.rank)
                .count()
            )
            parent_id = workflow.id
            object_type = "outcome_base"
        elif object_type == "outcome":
            throughparent = OutcomeOutcome.objects.get(child=model)
            throughparent_id = throughparent.id
            throughparent_index = (
                throughparent.parent.child_outcome_links.exclude(
                    child__deleted=True
                )
                .filter(rank__lt=throughparent.rank)
                .count()
            )
            parent_id = throughparent.parent.id

    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})
    if workflow is not None:
        action = actions.restoreSelfAction(
            object_id,
            object_type,
            parent_id,
            throughparent_id,
            throughparent_index,
            extra_data,
        )
        actions.dispatch_wf(
            workflow,
            action,
        )
        if object_type == "outcome" or object_type == "outcome_base":
            actions.dispatch_to_parent_wf(
                workflow,
                action,
            )
            if linked_workflows:
                for wf in linked_workflows:
                    actions.dispatch_wf(wf, action)
                    actions.dispatch_wf(
                        wf,
                        actions.updateHorizontalLinks(
                            {"data": outcomes_to_update}
                        ),
                    )
    if (
        object_type != "outcome"
        and object_type != "outcome_base"
        and linked_workflows
    ):
        for wf in linked_workflows:
            actions.dispatch_parent_updated(wf)
    if object_type in ["workflow", "activity", "course", "program"]:
        for parent_workflow in parent_workflows:
            actions.dispatch_child_updated(
                parent_workflow, model.get_workflow()
            )
    return JsonResponse({"action": "posted"})


@user_can_delete(False)
def delete_self_soft(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        workflow = None
        extra_data = None
        parent_id = None
        # object_suffix = ""

        # Check to see if we have any linked workflows that need to be updated
        linked_workflows = False
        if object_type == "node":
            linked_workflows = list(
                Workflow.objects.filter(linked_nodes=model)
            )
        elif object_type == "week":
            linked_workflows = list(
                Workflow.objects.filter(linked_nodes__week=model)
            )
        elif object_type in ["workflow", "activity", "course", "program"]:
            linked_workflows = list(
                Workflow.objects.filter(
                    linked_nodes__week__workflow__id=model.id
                )
            )
            parent_workflows = [
                node.get_workflow()
                for node in Node.objects.filter(linked_workflow=model)
            ]
        elif object_type == "outcome":
            linked_workflows = list(
                Workflow.objects.filter(
                    Q(
                        linked_nodes__outcomes__in=[model.id]
                        + list(
                            get_descendant_outcomes(model).values_list(
                                "pk", flat=True
                            )
                        )
                    )
                )
            )
        if object_type == "week":
            parent_id = WeekWorkflow.objects.get(week=model).id
        elif object_type == "column":
            parent_id = ColumnWorkflow.objects.get(column=model).id

        elif object_type == "node":
            parent_id = NodeWeek.objects.get(node=model).id
        elif object_type == "nodelink":
            parent_id = Node.objects.get(outgoing_links=model).id
        elif object_type == "outcome" and model.depth == 0:
            parent_id = OutcomeWorkflow.objects.get(outcome=model).id
            object_type = "outcome_base"
        elif object_type == "outcome":
            parent_id = OutcomeOutcome.objects.get(child=model).id

        # Delete the object
        with transaction.atomic():
            model.deleted = True
            model.deleted_on = timezone.now()
            model.save()

        if object_type == "outcome" or object_type == "outcome_base":
            outcomes_list = [object_id] + list(
                get_descendant_outcomes(model).values_list("pk", flat=True)
            )
            extra_data = RefreshSerializerNode(
                Node.objects.filter(outcomes__in=outcomes_list),
                many=True,
            ).data
            outcomes_to_update = RefreshSerializerOutcome(
                Outcome.objects.filter(horizontal_outcomes__in=outcomes_list),
                many=True,
            ).data
        elif object_type == "column":
            extra_data = (
                model.get_workflow()
                .columnworkflow_set.filter(column__deleted=False)
                .order_by("rank")
                .first()
                .column.id
            )
    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    try:
        workflow = model.get_workflow()
    except AttributeError:
        pass
    if workflow is not None:
        action = actions.deleteSelfSoftAction(
            object_id, object_type, parent_id, extra_data
        )
        actions.dispatch_wf(
            workflow,
            action,
        )
        if object_type == "outcome" or object_type == "outcome_base":
            actions.dispatch_to_parent_wf(
                workflow,
                action,
            )
            if linked_workflows:
                for wf in linked_workflows:
                    actions.dispatch_wf(wf, action)
                    actions.dispatch_wf(
                        wf,
                        actions.updateHorizontalLinks(
                            {"data": outcomes_to_update}
                        ),
                    )
    if (
        object_type != "outcome"
        and object_type != "outcome_base"
        and linked_workflows
    ):
        for wf in linked_workflows:
            actions.dispatch_parent_updated(wf)
    if object_type in ["workflow", "activity", "course", "program"]:
        for parent_workflow in parent_workflows:
            actions.dispatch_child_updated(
                parent_workflow, model.get_workflow()
            )
    return JsonResponse({"action": "posted"})


"""
Import
"""


@require_POST
@ajax_login_required
def project_from_json(request: HttpRequest) -> HttpResponse:
    column_type_dict = {
        "OOCI": 1,
        "OOC": 2,
        "ICI": 3,
        "ICS": 4,
        "HW": 11,
        "AC": 12,
        "FA": 13,
        "SA": 14,
    }
    task_dict = {
        "research": 1,
        "discuss": 2,
        "problem": 3,
        "analyze": 4,
        "peerreview": 5,
        "debate": 6,
        "play": 7,
        "create": 8,
        "practice": 9,
        "reading": 10,
        "write": 11,
        "present": 12,
        "experiment": 13,
        "quiz": 14,
        "curation": 15,
        "orchestration": 16,
        "instrevaluate": 17,
        "jigsaw": 101,
        "peer-instruction": 102,
        "case-studies": 103,
        "gallery-walk": 104,
        "reflective-writing": 105,
        "two-stage-exam": 106,
        "toolkit": 107,
        "one-minute-paper": 108,
        "distributed-problem-solving": 109,
        "peer-assessment": 110,
    }
    context_dict = {
        "solo": 1,
        "group": 2,
        "class": 3,
        "exercise": 101,
        "test": 102,
        "exam": 103,
    }
    time_unit_dict = {
        "s": 1,
        "min": 2,
        "hr": 3,
        "day": 4,
        "week": 5,
        "month": 6,
        "yr": 7,
        "cr": 8,
    }

    try:
        json_data = json.loads(request.POST.get("jsonData"))
        id_dict = {
            "project": {},
            "workflow": {},
            "column": {},
            "week": {},
            "node": {},
            "outcome": {},
        }
        for project in json_data["project"]:
            new_project = Project.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    project["title"], tags=bleach_allowed_tags_title
                ),
            )
            id_dict["project"][project["id"]] = new_project
        #        for outcome in json_data["outcome"]:
        #            new_outcome = Outcome.objects.create(
        #                author=request.user,
        #                title=bleach_sanitizer(
        #                    outcome["title"], tags=bleach_allowed_tags_title
        #                ),
        #            )
        #            id_dict["outcome"][outcome["id"]] = new_outcome
        for activity in json_data["activity"]:
            new_activity = Activity.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    activity["title"], tags=bleach_allowed_tags_title
                ),
                description=bleach_sanitizer(
                    activity["description"],
                    tags=bleach_allowed_tags_description,
                ),
                outcomes_type=activity["outcomes_type"],
            )
            id_dict["workflow"][activity["id"]] = new_activity
            id_dict["column"][activity["id"]] = {}
            new_activity.weeks.all().delete()
            new_activity.columns.all().delete()
        for course in json_data["course"]:
            new_course = Course.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    course["title"], tags=bleach_allowed_tags_title
                ),
                description=bleach_sanitizer(
                    course["description"], tags=bleach_allowed_tags_description
                ),
                outcomes_type=course["outcomes_type"],
            )
            id_dict["workflow"][course["id"]] = new_course
            id_dict["column"][course["id"]] = {}
            new_course.weeks.all().delete()
            new_course.columns.all().delete()
        for program in json_data["program"]:
            new_program = Program.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    program["title"], tags=bleach_allowed_tags_title
                ),
                description=bleach_sanitizer(
                    program["description"],
                    tags=bleach_allowed_tags_description,
                ),
                outcomes_type=program["outcomes_type"],
            )
            id_dict["workflow"][program["id"]] = new_program
            id_dict["column"][program["id"]] = {}
            new_program.weeks.all().delete()
            new_program.columns.all().delete()
        for column in json_data["column"]:
            workflow = id_dict["workflow"][column["workflow"]]
            workflow = id_dict["workflow"][column["workflow"]]
            if column["id"][:3] == "CUS":
                column_type = workflow.get_subclass().WORKFLOW_TYPE * 10
            else:
                column_type = column_type_dict[column["id"]]
            new_column = Column.objects.create(
                author=request.user,
                title=column["title"],
                colour=int(column["colour"].replace("#", "0x"), 16),
                column_type=column_type,
            )
            id_dict["column"][column["workflow"]][column["id"]] = new_column

        for week in json_data["week"]:
            new_week = Week.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    week["title"], tags=bleach_allowed_tags_title
                ),
            )
            id_dict["week"][week["id"]] = new_week
        for node in json_data["node"]:
            new_node = Node.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    node["title"], tags=bleach_allowed_tags_title
                ),
                description=bleach_sanitizer(
                    node["description"], tags=bleach_allowed_tags_description
                ),
                task_classification=task_dict.get(node["task_classification"])
                or 0,
                context_classification=context_dict.get(
                    node["context_classification"]
                )
                or 0,
                time_units=time_unit_dict.get(node["time_units"]) or 0,
                time_required=bleach_sanitizer(node["time_required"], tags=[]),
            )
            try:
                new_node.has_autolink = node["has_autolink"]
                new_node.save()
            except KeyError:
                pass
            id_dict["node"][node["id"]] = new_node

        for project in json_data["project"]:
            project_model = id_dict["project"][project["id"]]
            for activity_id in project["activities"]:
                WorkflowProject.objects.create(
                    project=project_model,
                    workflow=id_dict["workflow"][activity_id],
                )
            for course_id in project["courses"]:
                WorkflowProject.objects.create(
                    project=project_model,
                    workflow=id_dict["workflow"][course_id],
                )
            for program_id in project["programs"]:
                WorkflowProject.objects.create(
                    project=project_model,
                    workflow=id_dict["workflow"][program_id],
                )
        #            for outcome_id in project["outcomes"]:
        #                OutcomeProject.objects.create(
        #                    project=project_model,
        #                    outcome=id_dict["outcome"][outcome_id],
        #                )

        #        for outcome in json_data["outcome"]:
        #            outcome_model = id_dict["outcome"][outcome["id"]]
        #            for i, child in enumerate(outcome["children"]):
        #                OutcomeOutcome.objects.create(
        #                    parent=outcome_model,
        #                    child=id_dict["outcome"][child],
        #                    rank=i,
        #                )

        for workflow in (
            json_data["activity"] + json_data["course"] + json_data["program"]
        ):
            workflow_model = id_dict["workflow"][workflow["id"]]
            for i, column in enumerate(id_dict["column"][workflow["id"]]):
                column_model = id_dict["column"][workflow["id"]][column]
                ColumnWorkflow.objects.create(
                    workflow=workflow_model, column=column_model, rank=i
                )

            for i, week_id in enumerate(workflow["weeks"]):
                WeekWorkflow.objects.create(
                    workflow=workflow_model,
                    week=id_dict["week"][week_id],
                    rank=i,
                )

        for week in json_data["week"]:
            week_model = id_dict["week"][week["id"]]
            for i, node_id in enumerate(week["nodes"]):
                NodeWeek.objects.create(
                    week=week_model, node=id_dict["node"][node_id], rank=i
                )

        for node in json_data["node"]:
            node_model = id_dict["node"][node["id"]]
            node_model.column = id_dict["column"][node["workflow"]][
                node["column"]
            ]
            if node["linked_workflow"] is not None:
                node_model.linked_workflow = id_dict["workflow"][
                    node["linked_workflow"]
                ]
            node_model.save()

        #        for outcomenode in json_data["outcomenode"]:
        #            OutcomeNode.objects.create(
        #                outcome=id_dict["outcome"][outcomenode["outcome"]],
        #                node=id_dict["node"][outcomenode["node"]],
        #                degree=outcomenode["degree"],
        #            )

        for nodelink in json_data["nodelink"]:
            nl = NodeLink.objects.create(
                source_node=id_dict["node"][nodelink["source"]],
                target_node=id_dict["node"][nodelink["target"]],
                title=bleach_sanitizer(
                    nodelink["title"], tags=bleach_allowed_tags_title
                ),
            )
            if nodelink["style"] == "dashed":
                nl.dashed = True
                nl.save()
            ports = nodelink.get("ports", None)
            if ports is not None:
                try:
                    port_data = ports.split(";")
                    if port_data[0].find("sourcePort="):
                        source_port = port_data[0][-1]
                        target_port = port_data[1][-1]
                    else:
                        source_port = port_data[0][-1]
                        target_port = port_data[1][-1]
                    if source_port == "e":
                        nl.source_port = nl.EAST
                    elif source_port == "w":
                        nl.source_port = nl.WEST
                    elif source_port == "s":
                        nl.source_port = nl.SOUTH
                    if target_port == "e":
                        nl.target_port = nl.EAST
                    elif target_port == "w":
                        nl.target_port = nl.WEST
                    elif target_port == "n":
                        nl.target_port = nl.NORTH
                    nl.save()
                except Exception:
                    pass

    except AttributeError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


"""
Live Views
"""


def get_my_live_projects(user):
    data_package = {}
    classrooms_teacher = []
    classrooms_student = []
    all_classrooms = LiveProject.objects.filter(
        project__deleted=False, liveprojectuser__user=user
    )
    for classroom in all_classrooms:
        if check_object_permission(
            classroom.project, user, ObjectPermission.PERMISSION_VIEW
        ):
            classrooms_teacher += [classroom.project]
        else:
            if check_object_enrollment(
                classroom, user, LiveProjectUser.ROLE_TEACHER
            ):
                classrooms_teacher += [classroom]
            else:
                classrooms_student += [classroom]

    if Group.objects.get(name=settings.TEACHER_GROUP) in user.groups.all():
        data_package["owned_liveprojects"] = {
            "title": _("My classrooms (teacher)"),
            "sections": [
                {
                    "title": _("My classrooms (teacher)"),
                    "object_type": "project",
                    "objects": InfoBoxSerializer(
                        classrooms_teacher,
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "emptytext": _(
                "You haven't created any classrooms yet. Create a project, then choose 'Create Classroom' to create a live classroom."
            ),
        }
    data_package["shared_liveprojects"] = {
        "title": _("My classrooms (student)"),
        "sections": [
            {
                "title": _("My classrooms (student)"),
                "object_type": "liveproject",
                "objects": InfoBoxSerializer(
                    classrooms_student,
                    many=True,
                    context={"user": user},
                ).data,
            }
        ],
        "emptytext": _("You aren't registered for any classrooms right now."),
    }
    return data_package


@login_required
def my_live_projects_view(request):
    context = {
        "project_data_package": JSONRenderer()
        .render(get_my_live_projects(request.user))
        .decode("utf-8")
    }
    return render(request, "course_flow/my_live_projects.html", context)


@user_is_author("projectPk")
def make_project_live(request: HttpRequest) -> HttpResponse:
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        liveproject = LiveProject.objects.create(project=project)
        LiveProjectUser.objects.create(
            liveproject=liveproject,
            user=request.user,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
        }
    )


class LiveProjectDetailView(LoginRequiredMixin, UserEnrolledMixin, DetailView):
    model = Project
    fields = ["title", "description"]
    template_name = "course_flow/live_project_update.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        project = self.object
        liveproject = project.liveproject
        context["live_project_data"] = (
            JSONRenderer()
            .render(
                LiveProjectSerializer(
                    liveproject, context={"user": self.request.user}
                ).data
            )
            .decode("utf-8")
        )
        context["project_data"] = (
            JSONRenderer()
            .render(
                ProjectSerializerShallow(
                    project, context={"user": self.request.user}
                ).data
            )
            .decode("utf-8")
        )
        context["user_role"] = (
            JSONRenderer()
            .render(
                LiveProjectUser.objects.get(
                    user=self.request.user, liveproject=liveproject
                ).role_type
            )
            .decode("utf-8")
        )
        context["user_permission"] = (
            JSONRenderer()
            .render(get_user_permission(project, self.request.user))
            .decode("utf-8")
        )
        return context


class AssignmentDetailView(
    LoginRequiredMixin, UserEnrolledAsTeacherMixin, DetailView
):
    model = LiveAssignment
    fields = ["task__title"]
    template_name = "course_flow/live_assignment_update.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        assignment = self.object
        liveproject = assignment.liveproject
        context["assignment_data"] = (
            JSONRenderer()
            .render(
                LiveAssignmentSerializer(
                    assignment, context={"user": self.request.user}
                ).data
            )
            .decode("utf-8")
        )
        context["live_project_data"] = (
            JSONRenderer()
            .render(
                LiveProjectSerializer(
                    liveproject, context={"user": self.request.user}
                ).data
            )
            .decode("utf-8")
        )
        context["user_role"] = (
            JSONRenderer()
            .render(
                LiveProjectUser.objects.get(
                    user=self.request.user, liveproject=liveproject
                ).role_type
            )
            .decode("utf-8")
        )
        return context


@user_enrolled_as_student("liveprojectPk")
def get_live_project_data_student(request: HttpRequest) -> HttpResponse:
    liveproject = LiveProject.objects.get(pk=request.POST.get("liveprojectPk"))
    data_type = json.loads(request.POST.get("data_type"))
    try:
        if data_type == "overview":
            data_package = {
                "workflows": InfoBoxSerializer(
                    liveproject.visible_workflows.filter(deleted=False),
                    many=True,
                    context={"user": request.user},
                ).data,
                "assignments": LiveAssignmentSerializer(
                    LiveAssignment.objects.filter(
                        userassignment__user=request.user,
                        liveproject=liveproject,
                    ).order_by("end_date"),
                    many=True,
                    context={"user": request.user},
                ).data,
            }
        elif data_type == "assignments":
            assignments = liveproject.liveassignment_set.filter(
                userassignment__user=request.user
            )
            assignments_upcoming = assignments.filter(
                end_date__gt=timezone.now()
            ).order_by("end_date")
            assignments_past = assignments.filter(
                end_date__lte=timezone.now()
            ).order_by("-end_date")

            data_package = {
                "assignments_upcoming": LiveAssignmentSerializer(
                    assignments_upcoming,
                    many=True,
                    context={"user": request.user},
                ).data,
                "assignments_past": LiveAssignmentSerializer(
                    assignments_past,
                    many=True,
                    context={"user": request.user},
                ).data,
            }
        elif data_type == "workflows":
            workflows_added = InfoBoxSerializer(
                liveproject.visible_workflows.filter(deleted=False),
                many=True,
                context={"user": request.user},
            ).data
            data_package = {
                "workflows_added": workflows_added,
            }
        else:
            raise AttributeError

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@user_enrolled_as_teacher("liveprojectPk")
def get_live_project_data(request: HttpRequest) -> HttpResponse:
    liveproject = LiveProject.objects.get(pk=request.POST.get("liveprojectPk"))
    data_type = json.loads(request.POST.get("data_type"))
    try:
        if data_type == "overview":
            data_package = {
                "workflows": InfoBoxSerializer(
                    liveproject.visible_workflows.filter(deleted=False),
                    many=True,
                    context={"user": request.user},
                ).data,
                "students": LiveProjectUserSerializerWithCompletion(
                    LiveProjectUser.objects.filter(
                        liveproject=liveproject,
                        role_type=LiveProjectUser.ROLE_STUDENT,
                    ),
                    many=True,
                ).data,
                "teachers": LiveProjectUserSerializerWithCompletion(
                    LiveProjectUser.objects.filter(
                        liveproject=liveproject,
                        role_type=LiveProjectUser.ROLE_TEACHER,
                    ),
                    many=True,
                ).data,
                "assignments": LiveAssignmentWithCompletionSerializer(
                    LiveAssignment.objects.filter(
                        liveproject=liveproject
                    ).order_by("end_date"),
                    many=True,
                ).data,
            }
        elif data_type == "completion_table":
            assignments = LiveAssignment.objects.filter(
                liveproject=liveproject
            ).order_by("end_date")
            users = (
                LiveProjectUser.objects.filter(liveproject=liveproject)
                .exclude(role_type=LiveProjectUser.ROLE_NONE)
                .order_by("-role_type")
            )

            table_rows = [
                {
                    "user": UserSerializer(user.user).data,
                    "assignments": UserAssignmentSerializer(
                        UserAssignment.objects.filter(
                            user=user.user, assignment__liveproject=liveproject
                        ),
                        many=True,
                    ).data,
                }
                for user in users
            ]
            data_package = {
                "table_rows": table_rows,
                "assignments": LiveAssignmentWithCompletionSerializer(
                    assignments, many=True
                ).data,
            }
        elif data_type == "students":
            data_package = {
                "liveproject": LiveProjectSerializer(
                    liveproject, context={"user": request.user}
                ).data
            }
        elif data_type == "assignments":
            data_package = {
                "workflows": InfoBoxSerializer(
                    liveproject.visible_workflows.filter(deleted=False),
                    many=True,
                    context={"user": request.user},
                ).data,
                "assignments": LiveAssignmentSerializer(
                    liveproject.liveassignment_set.all(),
                    many=True,
                    context={"user": request.user},
                ).data,
            }
        elif data_type == "workflows":
            workflows_added = InfoBoxSerializer(
                liveproject.visible_workflows.filter(deleted=False),
                many=True,
                context={"user": request.user},
            ).data
            workflows_not_added = InfoBoxSerializer(
                Workflow.objects.filter(
                    project=liveproject.project, deleted=False
                ).exclude(
                    pk__in=[x.pk for x in liveproject.visible_workflows.all()]
                ),
                many=True,
                context={"user": request.user},
            ).data
            data_package = {
                "workflows_added": workflows_added,
                "workflows_not_added": workflows_not_added,
            }
        elif data_type == "settings":
            data_package = {
                "liveproject": LiveProjectSerializer(
                    liveproject, context={"user": request.user}
                ).data
            }
        else:
            raise AttributeError

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@user_enrolled_as_teacher("liveprojectPk")
@user_can_view_or_enrolled_as_teacher("nodePk")
def create_live_assignment(request: HttpRequest) -> HttpResponse:
    liveproject = LiveProject.objects.get(pk=request.POST.get("liveprojectPk"))
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    if node.get_workflow().get_project() != liveproject.project:
        return JsonResponse({"action": "error"})
    try:
        assignment = LiveAssignment.objects.create(
            liveproject=liveproject,
            task=node,
            author=request.user,
        )
        # if liveproject.default_assign_to_all:
        #     students = LiveProjectUser.objects.filter(
        #         liveproject=liveproject, role_type=LiveProjectUser.ROLE_STUDENT
        #     )
        #     for student in students:
        #         UserAssignment.objects.create(
        #             user=student.user, assignment=assignment
        #         )

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "assignmentPk": assignment.pk})


@user_enrolled_as_student("liveassignmentPk")
def get_assignment_data_student(request: HttpRequest) -> HttpResponse:
    liveassignment = LiveAssignment.objects.get(
        pk=request.POST.get("liveassignmentPk")
    )
    data_type = json.loads(request.POST.get("data_type"))
    try:
        if data_type == "overview":
            data_package = {"data": liveassignment.id}
        else:
            raise AttributeError

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@user_enrolled_as_teacher("liveassignmentPk")
def get_assignment_data(request: HttpRequest) -> HttpResponse:
    liveassignment = LiveAssignment.objects.get(
        pk=request.POST.get("liveassignmentPk")
    )
    liveproject = liveassignment.liveproject
    data_type = json.loads(request.POST.get("data_type"))
    try:
        if data_type == "edit":
            assigned_users = LiveProjectUserSerializer(
                LiveProjectUser.objects.filter(
                    liveproject=liveproject,
                    user__userassignment__assignment=liveassignment,
                ).exclude(role_type=LiveProjectUser.ROLE_NONE),
                many=True,
            ).data
            other_users = LiveProjectUserSerializer(
                LiveProjectUser.objects.filter(liveproject=liveproject)
                .exclude(
                    role_type=LiveProjectUser.ROLE_NONE,
                )
                .exclude(user__userassignment__assignment=liveassignment),
                many=True,
            ).data

            node_workflow = liveassignment.task.get_workflow()
            parent_workflow = InfoBoxSerializer(
                node_workflow,
                context={"user": request.user},
            ).data
            data_package = {
                "assigned_users": assigned_users,
                "other_users": other_users,
                "parent_workflow": parent_workflow,
            }
        elif data_type == "report":
            userassignments = UserAssignment.objects.filter(
                assignment=liveassignment
            )
            data_package = {
                "userassignments": UserAssignmentSerializerWithUser(
                    userassignments, many=True
                ).data
            }
        else:
            raise AttributeError

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@user_can_view("workflowPk")
def get_workflow_nodes(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        data_package = WorkflowSerializerForAssignments(workflow).data
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@user_enrolled_as_student("nodePk")
def get_assignments_for_node(request: HttpRequest) -> HttpResponse:
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    try:
        user = request.user
        workflow = node.get_workflow()
        role_type = get_user_role(workflow, user)
        my_assignments = LiveAssignmentSerializer(
            LiveAssignment.objects.filter(
                task=node, userassignment__user=user
            ),
            many=True,
            context={"user": user},
        ).data
        if role_type == LiveProjectUser.ROLE_TEACHER:
            all_assignments = LiveAssignmentWithCompletionSerializer(
                LiveAssignment.objects.filter(task=node),
                many=True,
            ).data
        else:
            all_assignments = None
        data_package = {
            "my_assignments": my_assignments,
            "all_assignments": all_assignments,
        }
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@ajax_login_required
def register_as_student(request: HttpRequest, project_hash) -> HttpResponse:
    project = Project.get_from_hash(project_hash)
    if project is None:
        return HttpResponseForbidden(
            "Couldn't find a classroom associated with that link"
        )
    if project.liveproject is not None and not project.deleted:
        user = request.user
        if (
            LiveProjectUser.objects.filter(
                liveproject=project.liveproject, user=user
            ).count()
            == 0
        ):
            if project.author == user:
                LiveProjectUser.objects.create(
                    user=user,
                    liveproject=project.liveproject,
                    role_type=LiveProjectUser.ROLE_TEACHER,
                )
            else:
                LiveProjectUser.objects.create(
                    user=user,
                    liveproject=project.liveproject,
                    role_type=LiveProjectUser.ROLE_STUDENT,
                )
        return redirect(
            reverse(
                "course_flow:live-project-update", kwargs={"pk": project.pk}
            )
        )
    else:
        return HttpResponseForbidden(
            "The selected classroom has been deleted or does not exist"
        )


# change role on a liveproject for a user
@user_enrolled_as_teacher("liveprojectPk")
def set_liveproject_role(request: HttpRequest) -> HttpResponse:
    user_id = json.loads(request.POST.get("permission_user"))
    liveprojectPk = json.loads(request.POST.get("liveprojectPk"))
    role_type = json.loads(request.POST.get("role_type"))
    response = {}
    try:
        user = User.objects.get(id=user_id)
        liveproject = LiveProject.objects.get(pk=liveprojectPk)
        if liveproject.project.author == user:
            response = JsonResponse(
                {
                    "action": "error",
                    "error": _("This user's role cannot be changed."),
                }
            )
            # response.status_code = 403
            return response
        if (
            role_type == LiveProjectUser.ROLE_TEACHER
            and Group.objects.get(name=settings.TEACHER_GROUP)
            not in user.groups.all()
        ):
            response = JsonResponse(
                {
                    "action": "error",
                    "error": _(
                        "This user has a student account, and cannot be made a teacher."
                    ),
                }
            )
            # response.status_code = 403
            return response

        LiveProjectUser.objects.create(
            liveproject=liveproject, user=user, role_type=role_type
        )
        response["action"] = "posted"
    except ValidationError:
        response["action"] = "error"
        response.status_code = 401

    return JsonResponse(response)


# add or remove users from assignment
@user_enrolled_as_teacher("liveassignmentPk")
def add_users_to_assignment(request: HttpRequest) -> HttpResponse:
    user_list = json.loads(request.POST.get("user_list"))
    liveassignmentPk = json.loads(request.POST.get("liveassignmentPk"))
    add = json.loads(request.POST.get("add"))
    try:
        users = User.objects.filter(id__in=user_list)
        assignment = LiveAssignment.objects.get(pk=liveassignmentPk)
        liveproject = assignment.liveproject
        for user in users:
            if (
                LiveProjectUser.objects.filter(
                    user=user, liveproject=liveproject
                )
                .exclude(role_type=LiveProjectUser.ROLE_NONE)
                .count()
                > 0
            ):
                if add:
                    if (
                        UserAssignment.objects.filter(
                            user=user, assignment=assignment
                        ).count()
                        == 0
                    ):
                        UserAssignment.objects.create(
                            user=user, assignment=assignment
                        )
                else:
                    UserAssignment.objects.filter(
                        user=user, assignment=assignment
                    ).delete()

    except ValidationError:
        response = JsonResponse({"action": "error"})
        response.status_code = 401
        return response

    return JsonResponse({"action": "posted"})


# get the list of enrolled users for a project
@user_enrolled_as_teacher("liveprojectPk")
def get_users_for_liveproject(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("liveprojectPk"))
    try:
        liveproject = LiveProject.objects.get(pk=object_id)
        teachers = User.objects.filter(
            liveprojectuser__liveproject=liveproject,
            liveprojectuser__role_type=LiveProjectUser.ROLE_TEACHER,
        )
        students = User.objects.filter(
            liveprojectuser__liveproject=liveproject,
            liveprojectuser__role_type=LiveProjectUser.ROLE_STUDENT,
        )

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "author": UserSerializer(liveproject.project.author).data,
            "teachers": UserSerializer(teachers, many=True).data,
            "students": UserSerializer(students, many=True).data,
        }
    )


@user_enrolled_as_teacher("liveprojectPk")
@user_can_view("workflowPk")
def set_workflow_visibility(request: HttpRequest) -> HttpResponse:
    liveproject = LiveProject.objects.get(pk=request.POST.get("liveprojectPk"))
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    visible = json.loads(request.POST.get("visible"))
    try:
        if workflow.get_project().liveproject != liveproject:
            raise AttributeError
        count = liveproject.visible_workflows.filter(pk=workflow.pk).count()
        if visible and count == 0:
            liveproject.visible_workflows.add(workflow)
        elif not visible and count > 0:
            liveproject.visible_workflows.remove(workflow)
    except AttributeError:
        response = JsonResponse({"action": "error"})
        response.status_code = 403
        return response
    return JsonResponse(
        {
            "action": "posted",
        }
    )


# Updates an object's information using its serializer
@user_enrolled_as_teacher(False)
def update_liveproject_value(request: HttpRequest) -> HttpResponse:
    try:
        object_id = json.loads(request.POST.get("objectID"))
        object_type = json.loads(request.POST.get("objectType"))
        data = json.loads(request.POST.get("data"))
        changeFieldID = request.POST.get("changeFieldID", False)
        if changeFieldID:
            changeFieldID = json.loads(changeFieldID)
        objects = get_model_from_str(object_type).objects
        if hasattr(objects, "get_subclass"):
            object_to_update = objects.get_subclass(pk=object_id)
        else:
            object_to_update = objects.get(pk=object_id)
        serializer = serializer_lookups_shallow[object_type](
            object_to_update, data=data, partial=True
        )
        save_serializer(serializer)
    except ValidationError:
        return JsonResponse({"action": "error"})
    except AttributeError:
        pass

    return JsonResponse({"action": "posted"})


# sets the completion on a userassignment object
@user_enrolled_as_student("userassignmentPk")
def set_assignment_completion(request: HttpRequest) -> HttpResponse:
    try:
        userassignment = UserAssignment.objects.get(
            id=json.loads(request.POST.get("userassignmentPk"))
        )
        completed = json.loads(request.POST.get("completed"))
        if (
            userassignment.user != request.user
            or not userassignment.assignment.self_reporting
        ):
            if (
                LiveProjectUser.objects.filter(
                    liveproject=userassignment.get_live_project(),
                    user=request.user,
                    role_type=LiveProjectUser.ROLE_TEACHER,
                ).count()
                == 0
            ):
                response = JsonResponse({"action": "error"})
                response.status_code = 403
                return response
        userassignment.completed = completed
        userassignment.completed_on = timezone.now()
        userassignment.save()
    except ValidationError:
        response = JsonResponse({"action": "error"})
        response.status_code = 403
        return response
    except AttributeError:
        pass

    return JsonResponse({"action": "posted"})


def make_user_notification(
    source_user, target_user, notification_type, content_object, **kwargs
):
    if source_user is not target_user:
        extra_text = kwargs.get("extra_text", None)
        comment = kwargs.get("comment", None)
        text = ""
        if source_user is not None:
            text += source_user.username + " "
        else:
            text += _("Someone ")
        if notification_type == Notification.TYPE_SHARED:
            text += _("added you to the ")
        elif notification_type == Notification.TYPE_COMMENT:
            text += _("notified you in a comment in ")
        else:
            text += _(" notified you for ")
        text += _(content_object.type) + " " + content_object.__str__()
        if extra_text is not None:
            text += ": " + extra_text
        Notification.objects.create(
            user=target_user,
            source_user=source_user,
            notification_type=notification_type,
            content_object=content_object,
            text=text,
            comment=comment,
        )

        # clear any notifications older than two months
        target_user.notifications.filter(
            created_on__lt=timezone.now() - timezone.timedelta(days=60)
        ).delete()


@ajax_login_required
@require_POST
def mark_all_as_read(request):
    request.user.notifications.filter(is_unread=True).update(is_unread=False)
    return JsonResponse({"action": "posted"})
