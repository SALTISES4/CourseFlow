import json
import math
import time
from functools import reduce
from itertools import chain, islice, tee

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from django.db.models import Count, ProtectedError, Q
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST
from django.views.generic import DetailView, ListView, TemplateView, UpdateView
from django.views.generic.edit import CreateView
from rest_framework import viewsets
from rest_framework.generics import ListAPIView
from rest_framework.renderers import JSONRenderer

from . import redux_actions as actions
from .decorators import (
    ajax_login_required,
    check_object_permission,
    user_can_delete,
    user_can_edit,
    user_can_edit_or_none,
    user_can_view,
    user_can_view_or_none,
    user_is_teacher,
)
from .forms import RegistrationForm
from .models import (  # OutcomeProject,
    Activity,
    Column,
    ColumnWorkflow,
    Comment,
    Course,
    CustomTerm,
    Discipline,
    Favourite,
    Node,
    NodeLink,
    NodeWeek,
    ObjectPermission,
    Outcome,
    OutcomeHorizontalLink,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    Program,
    Project,
    User,
    Week,
    WeekWorkflow,
    Workflow,
    WorkflowProject,
)
from .serializers import (  # OutcomeProjectSerializerShallow,
    ActivitySerializerShallow,
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    CommentSerializer,
    CourseSerializerShallow,
    DisciplineSerializer,
    InfoBoxSerializer,
    LinkedWorkflowSerializerShallow,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    OutcomeHorizontalLinkSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    ProjectSerializerShallow,
    RefreshSerializerNode,
    RefreshSerializerOutcome,
    UserSerializer,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
    WorkflowSerializerFinder,
    WorkflowSerializerShallow,
    bleach_allowed_tags,
    bleach_sanitizer,
    serializer_lookups_shallow,
)
from .utils import (
    benchmark,
    get_all_outcomes_for_outcome,
    get_all_outcomes_for_workflow,
    get_descendant_outcomes,
    get_model_from_str,
    get_nondeleted_favourites,
    get_parent_model,
    get_parent_model_str,
    get_unique_outcomenodes,
)


class UserCanViewMixin(UserPassesTestMixin):
    def test_func(self):
        return Group.objects.get(
            name=settings.TEACHER_GROUP
        ) in self.request.user.groups.all() and (
            check_object_permission(
                self.get_object(),
                self.request.user,
                ObjectPermission.PERMISSION_VIEW,
            )
        )


class UserCanEditMixin(UserPassesTestMixin):
    def test_func(self):
        return Group.objects.get(
            name=settings.TEACHER_GROUP
        ) in self.request.user.groups.all() and (
            check_object_permission(
                self.get_object(),
                self.request.user,
                ObjectPermission.PERMISSION_EDIT,
            )
        )


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
    def get_form(self):
        form = super(CreateView, self).get_form()
        form.fields["title"].widget.attrs.update({"autocomplete": "off"})
        form.fields["description"].widget.attrs.update({"autocomplete": "off"})
        return form


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
        types = self.request.GET.getlist("types[]", None)
        author = self.request.GET.get("auth", None)
        disciplines = self.request.GET.getlist("disc[]", None)
        title = self.request.GET.get("title", None)
        description = self.request.GET.get("des", None)
        sort = self.request.GET.get("sort", None)
        page = self.request.GET.get("page", 1)
        results = self.request.GET.get("results", 20)
        filter_kwargs = {}
        if title:
            filter_kwargs["title__icontains"] = title
        if description:
            filter_kwargs["description__icontains"] = description
        if author:
            filter_kwargs["author__username__icontains"] = author
        if page:
            page = int(page)
        else:
            page = 1
        if results:
            results = int(results)
        else:
            results = 10
        disciplines = Discipline.objects.filter(id__in=disciplines)
        if len(disciplines) > 0:
            filter_kwargs["disciplines__in"] = disciplines
        try:
            queryset = reduce(
                lambda x, y: chain(x, y),
                [
                    get_model_from_str(model_type)
                    .objects.filter(published=True)
                    .filter(**filter_kwargs)
                    .exclude(author=self.request.user)
                    .exclude(deleted=True)
                    .distinct()
                    if model_type == "project"
                    else get_model_from_str(model_type)
                    .objects.filter(published=True)
                    .filter(**filter_kwargs)
                    .exclude(author=self.request.user)
                    .exclude(Q(deleted=True) | Q(project__deleted=True))
                    .distinct()
                    for model_type in types
                ],
            )
        except TypeError:
            queryset = Project.objects.none()
        total_results = 0
        subqueryset = []
        for x in queryset:
            if (
                total_results >= (page - 1) * results
                and total_results < page * results
            ):
                subqueryset.append(x)
            total_results = total_results + 1
        page_number = math.ceil(float(total_results) / results)
        object_list = (
            JSONRenderer()
            .render(
                InfoBoxSerializer(
                    subqueryset, many=True, context={"user": self.request.user}
                ).data
            )
            .decode("utf-8")
        )
        return {
            "object_list": object_list,
            "pages": JSONRenderer()
            .render(
                {
                    "total_results": total_results,
                    "page_count": page_number,
                    "current_page": page,
                    "results_per_page": results,
                }
            )
            .decode("utf-8"),
            "disciplines": JSONRenderer()
            .render(
                DisciplineSerializer(Discipline.objects.all(), many=True).data
            )
            .decode("utf-8"),
        }


def get_my_projects(user, add):
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
        "deleted_projects": {
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


def get_my_favourites(user):
    favourites = get_nondeleted_favourites(user)

    def get_content_objects(favourite_list):
        return list(map(lambda x: x.content_object, favourite_list))

    data_package = {
        "favourites_all": {
            "title": _("My Favourites"),
            "sections": [
                {
                    "title": "",
                    "object_type": "project",
                    "objects": InfoBoxSerializer(
                        get_content_objects(favourites),
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Your favourite projects, workflows, or templates by other users will appear here. You can find published content from other users using the Explore feature in the top toolbar."
            ),
        },
        "favourites_project": {
            "title": _("Projects"),
            "sections": [
                {
                    "title": "",
                    "object_type": "project",
                    "objects": InfoBoxSerializer(
                        get_content_objects(
                            favourites.filter(
                                project__pk__gt=0, project__deleted=False
                            )
                        ),
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Your favourite activities by other users will appear here. You can find published content from other users using the Explore feature in the top toolbar."
            ),
        },
        "favourites_activity": {
            "title": _("Activities"),
            "sections": [
                {
                    "title": "",
                    "object_type": "activity",
                    "objects": InfoBoxSerializer(
                        get_content_objects(
                            favourites.filter(
                                activity__pk__gt=0, activity__deleted=False
                            )
                        ),
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Your favourite activities by other users will appear here. You can find published content from other users using the Explore feature in the top toolbar."
            ),
        },
        "favourites_course": {
            "title": _("Courses"),
            "sections": [
                {
                    "title": "",
                    "object_type": "course",
                    "objects": InfoBoxSerializer(
                        get_content_objects(
                            favourites.filter(
                                course__pk__gt=0, course__deleted=False
                            )
                        ),
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Your favourite courses by other users will appear here. You can find published content from other users using the Explore feature in the top toolbar."
            ),
        },
        "favourites_program": {
            "title": _("Program"),
            "sections": [
                {
                    "title": "",
                    "object_type": "program",
                    "objects": InfoBoxSerializer(
                        get_content_objects(
                            favourites.filter(
                                program__pk__gt=0, program__deleted=False
                            )
                        ),
                        many=True,
                        context={"user": user},
                    ).data,
                }
            ],
            "duplicate": "import",
            "emptytext": _(
                "Your favourite programs by other users will appear here. You can find published content from other users using the Explore feature in the top toolbar."
            ),
        },
    }
    return data_package


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
                    .exclude(project=project,)
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
                    **published_or_user, **favourites_and_strategies,
                ).exclude(exclude)
            )
            + list(
                model.objects.filter(
                    **permissions_edit, **favourites_and_strategies,
                ).exclude(exclude)
            )
            + list(
                model.objects.filter(
                    **permissions_view, **favourites_and_strategies,
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
    other_project_sections = []
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
                other_project_sections.append(
                    {
                        "title": "",
                        "object_type": this_type,
                        "is_strategy": get_strategies,
                        "objects": get_workflow_info_boxes(
                            user,
                            this_type,
                            project=project,
                            this_project=False,
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

    #    if project.author == user:
    #        current_copy_type = "copy"
    #        other_copy_type = "import"
    #    else:
    #        current_copy_type = False
    #        other_copy_type = False
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
            #            "add": (project.author == user),
            #            "duplicate": current_copy_type,
        },
    }
    if not self_only:
        if project is not None:
            data_package["other_projects"] = {
                "title": _("From Your Other Projects"),
                "sections": other_project_sections,
                #            "duplicate": other_copy_type,
                "emptytext": _(
                    "There are no applicable workflows outside this project."
                ),
            }
        data_package["all_published"] = {
            "title": _("Your Favourites"),
            "sections": all_published_sections,
            "emptytext": _(
                "You have no relevant favourites. Use the Explore menu to find and favourite content by other users."
            )
            #            "duplicate": other_copy_type,
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
def mytemplates_view(request):
    context = {
        "project_data_package": JSONRenderer()
        .render(get_my_templates(request.user))
        .decode("utf-8")
    }
    return render(request, "course_flow/mytemplates.html", context)


@login_required
def myfavourites_view(request):
    context = {
        "project_data_package": JSONRenderer()
        .render(get_my_favourites(request.user))
        .decode("utf-8")
    }
    return render(request, "course_flow/mytemplates.html", context)


@login_required
def import_view(request):
    return render(request, "course_flow/import.html")


class ProjectCreateView(
    LoginRequiredMixin, UserPassesTestMixin, CreateView_No_Autocomplete
):
    model = Project
    fields = ["title", "description"]
    template_name = "course_flow/project_create.html"

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
        context["workflow_data_package"] = (
            JSONRenderer()
            .render(get_data_package_for_project(self.request.user, project))
            .decode("utf-8")
        )
        context["project_data"] = (
            JSONRenderer()
            .render(ProjectSerializerShallow(project).data)
            .decode("utf-8")
        )
        context["read_only"] = JSONRenderer().render(True).decode("utf-8")
        if (
            project.author == self.request.user
            or ObjectPermission.objects.filter(
                user=self.request.user,
                permission_type=ObjectPermission.PERMISSION_EDIT,
            ).count()
            > 0
        ):
            context["read_only"] = JSONRenderer().render(False).decode("utf-8")

        return context


#
# class OutcomeCreateView(
#    LoginRequiredMixin, UserCanEditProjectMixin, CreateView
# ):
#    model = Outcome
#    fields = ["title"]
#    template_name = "course_flow/outcome_create.html"
#
#    def test_func(self):
#        project = Project.objects.get(pk=self.kwargs["projectPk"])
#        return (
#            Group.objects.get(name=settings.TEACHER_GROUP)
#            in self.request.user.groups.all()
#            and project.author == self.request.user
#        )
#
#    def form_valid(self, form):
#        form.instance.author = self.request.user
#        project = Project.objects.get(pk=self.kwargs["projectPk"])
#        response = super(CreateView, self).form_valid(form)
#        OutcomeProject.objects.create(project=project, outcome=form.instance)
#        return response
#
#    def get_success_url(self):
#        return reverse(
#            "course_flow:outcome-update", kwargs={"pk": self.object.pk}
#        )
#
#
#
#
# def get_outcome_context_data(outcome, context, user):
#    outcomes = get_all_outcomes(outcome, 0)
#    outcomeoutcomes = []
#    for oc in outcomes:
#        outcomeoutcomes += list(oc.child_outcome_links.all())
#
#    parent_project_pk = OutcomeProject.objects.get(outcome=outcome).project.pk
#
#    data_flat = {
#        "outcome": OutcomeSerializerShallow(outcomes, many=True).data,
#        "outcomeoutcome": OutcomeOutcomeSerializerShallow(
#            outcomeoutcomes, many=True
#        ).data,
#    }
#    context["data_flat"] = JSONRenderer().render(data_flat).decode("utf-8")
#    context["parent_project_pk"] = (
#        JSONRenderer().render(parent_project_pk).decode("utf-8")
#    )
#    return context
#
#
#
#
# class OutcomeDetailView(LoginRequiredMixin, UserCanViewMixin, DetailView):
#    model = Outcome
#    fields = ["title", "description"]
#    template_name = "course_flow/outcome_alignment.html"
#
#    def get_context_data(self, **kwargs):
#        context = super(DetailView, self).get_context_data(**kwargs)
#        context = get_outcome_context_data(
#            self.object, context, self.request.user
#        )
#
#        return context

#
# class WorkflowDetailView(LoginRequiredMixin, UserCanViewMixin, DetailView):
#    model = Workflow
#    fields = ["title", "description"]
#    template_name = "course_flow/workflow_update.html"
#
#    def get_queryset(self):
#        return self.model.objects.select_subclasses()
#
#    def get_object(self):
#        workflow = super().get_object()
#        return Workflow.objects.get_subclass(pk=workflow.pk)
#
#    def get_success_url(self):
#        return reverse(
#            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
#        )
#
#    def get_context_data(self, **kwargs):
#        context = super(DetailView, self).get_context_data(**kwargs)
#        workflow = self.get_object()
#
#        context = get_workflow_context_data(
#            workflow, context, self.request.user
#        )
#
#        return context


def get_parent_outcome_data(workflow, user):
    last_time = time.time()
    outcomes, outcomeoutcomes = get_all_outcomes_for_workflow(workflow)
    parent_nodes = (
        Node.objects.filter(linked_workflow=workflow)
        .exclude(
            Q(deleted=True)
            | Q(week__deleted=True)
            | Q(week__workflow__deleted=True)
        )
        .prefetch_related("outcomenode_set")
    )
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

    return {
        "parent_workflow": WorkflowSerializerShallow(
            parent_workflows, many=True
        ).data,
        "parent_outcomeworkflow": OutcomeWorkflowSerializerShallow(
            parent_outcomeworkflows, many=True
        ).data,
        "parent_node": NodeSerializerShallow(parent_nodes, many=True).data,
        "parent_outcomenode": OutcomeNodeSerializerShallow(
            parent_outcomenodes, many=True
        ).data,
        "parent_outcome": OutcomeSerializerShallow(
            parent_outcomes, many=True
        ).data,
        "parent_outcomeoutcome": OutcomeOutcomeSerializerShallow(
            parent_outcomeoutcomes, many=True
        ).data,
        "outcomehorizontallink": OutcomeHorizontalLinkSerializerShallow(
            outcomehorizontallinks, many=True
        ).data,
    }


def get_child_outcome_data(workflow, user):
    nodes = Node.objects.filter(week__workflow=workflow).exclude(
        Q(deleted=True) | Q(week__deleted=True)
    )
    linked_workflows = (
        Workflow.objects.filter(linked_nodes__week__workflow=workflow)
        .exclude(deleted=True)
        .prefetch_related("outcomeworkflow_set")
    )
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

    return {
        "child_workflow": WorkflowSerializerShallow(
            linked_workflows, many=True
        ).data,
        "child_outcomeworkflow": OutcomeWorkflowSerializerShallow(
            child_workflow_outcomeworkflows, many=True
        ).data,
        "child_outcome": OutcomeSerializerShallow(
            child_workflow_outcomes, many=True
        ).data,
        "child_outcomeoutcome": OutcomeOutcomeSerializerShallow(
            child_workflow_outcomeoutcomes, many=True
        ).data,
        "child_outcomehorizontallink": OutcomeHorizontalLinkSerializerShallow(
            outcomehorizontallinks, many=True
        ).data,
    }


def get_workflow_data_flat(workflow, user):
    SerializerClass = serializer_lookups_shallow[workflow.type]
    columnworkflows = workflow.columnworkflow_set.all()
    weekworkflows = workflow.weekworkflow_set.all()
    columns = workflow.columns.all()
    weeks = workflow.weeks.all()
    nodeweeks = NodeWeek.objects.filter(week__workflow=workflow)
    nodes = Node.objects.filter(week__workflow=workflow).prefetch_related(
        "outcomenode_set"
    )
    nodelinks = NodeLink.objects.filter(source_node__in=nodes)
    if not workflow.is_strategy:
        outcomeworkflows = workflow.outcomeworkflow_set.all()
        outcomes, outcomeoutcomes = get_all_outcomes_for_workflow(workflow)
        outcomenodes = OutcomeNode.objects.filter(
            node__week__workflow=workflow
        )

    data_flat = {
        "workflow": SerializerClass(workflow).data,
        "columnworkflow": ColumnWorkflowSerializerShallow(
            columnworkflows, many=True
        ).data,
        "column": ColumnSerializerShallow(columns, many=True).data,
        "weekworkflow": WeekWorkflowSerializerShallow(
            weekworkflows, many=True
        ).data,
        "week": WeekSerializerShallow(weeks, many=True).data,
        "nodeweek": NodeWeekSerializerShallow(nodeweeks, many=True).data,
        "node": NodeSerializerShallow(nodes, many=True).data,
        "nodelink": NodeLinkSerializerShallow(nodelinks, many=True).data,
    }

    if not workflow.is_strategy:
        data_flat["outcomeworkflow"] = OutcomeWorkflowSerializerShallow(
            outcomeworkflows, many=True
        ).data
        data_flat["outcome"] = OutcomeSerializerShallow(
            outcomes, many=True
        ).data
        data_flat["outcomeoutcome"] = OutcomeOutcomeSerializerShallow(
            outcomeoutcomes, many=True
        ).data
        data_flat["outcomenode"] = OutcomeNodeSerializerShallow(
            outcomenodes, many=True
        ).data
        if workflow.type == "course":
            data_flat["strategy"] = WorkflowSerializerShallow(
                Course.objects.filter(author=user, is_strategy=True),
                many=True,
            ).data
            data_flat["saltise_strategy"] = WorkflowSerializerShallow(
                Course.objects.filter(
                    from_saltise=True, is_strategy=True, published=True
                ),
                many=True,
            ).data
        elif workflow.type == "activity":
            data_flat["strategy"] = WorkflowSerializerShallow(
                Activity.objects.filter(author=user, is_strategy=True),
                many=True,
            ).data
            data_flat["saltise_strategy"] = WorkflowSerializerShallow(
                Activity.objects.filter(
                    from_saltise=True, is_strategy=True, published=True
                ),
                many=True,
            ).data

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
        parent_project = ProjectSerializerShallow(project).data

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
    context["read_only"] = JSONRenderer().render(True).decode("utf-8")
    if (
        workflow.author == user
        or ObjectPermission.objects.filter(
            user=user, permission_type=ObjectPermission.PERMISSION_EDIT
        ).count()
        > 0
    ):
        context["read_only"] = JSONRenderer().render(False).decode("utf-8")

    return context


class WorkflowDetailView(LoginRequiredMixin, UserCanViewMixin, DetailView):
    model = Workflow
    fields = ["id", "title", "description"]
    template_name = "course_flow/workflow_update.html"

    def get_queryset(self):
        return self.model.objects.select_subclasses()

    def get_object(self):
        workflow = super().get_object()
        return Workflow.objects.get_subclass(pk=workflow.pk)

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

        return context


class ProgramCreateView(
    LoginRequiredMixin, UserCanEditProjectMixin, CreateView_No_Autocomplete
):
    model = Program
    fields = ["title", "description"]
    template_name = "course_flow/program_create.html"

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
    template_name = "course_flow/course_create.html"

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
    template_name = "course_flow/course_create.html"

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
    template_name = "course_flow/activity_create.html"

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
    template_name = "course_flow/activity_create.html"

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


def save_serializer(serializer) -> HttpResponse:
    if serializer:
        if serializer.is_valid():
            serializer.save()
            return JsonResponse({"action": "posted"})
        else:
            return JsonResponse({"action": "error"})
    else:
        return JsonResponse({"action": "error"})


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
Contextual information methods
"""


@user_can_view("workflowPk")
def get_parent_workflow_info(request: HttpRequest) -> HttpResponse:
    workflow_id = json.loads(request.POST.get("workflowPk"))
    try:
        parent_workflows = [
            node.get_workflow()
            for node in Node.objects.filter(linked_workflow__id=workflow_id)
        ]
        data_package = InfoBoxSerializer(parent_workflows, many=True).data
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "parent_workflows": data_package})


@user_can_edit(False)
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
        data_package = CommentSerializer(comments, many=True).data
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


class DisciplineListView(LoginRequiredMixin, ListAPIView):
    queryset = Discipline.objects.order_by("title")
    serializer_class = DisciplineSerializer


@user_can_view("workflowPk")
def get_workflow_parent_data(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        data_package = get_parent_outcome_data(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@user_can_view("workflowPk")
def get_workflow_child_data(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        data_package = get_child_outcome_data(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@user_can_view("workflowPk")
def get_workflow_data(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        data_package = get_workflow_data_flat(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@user_can_view("projectPk")
def get_project_data(request: HttpRequest) -> HttpResponse:
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        data_package = get_workflow_data_package(
            request.user, project, self_only=True
        )
        project_data = (
            JSONRenderer()
            .render(ProjectSerializerShallow(project).data)
            .decode("utf-8")
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
            "project_data": project_data,
        }
    )


@user_can_view("outcomePk")
def get_outcome_data(request: HttpRequest) -> HttpResponse:
    outcome = Outcome.objects.get(pk=request.POST.get("outcomePk"))
    try:
        data_package = get_outcome_context_data(outcome, {}, request.user)[
            "data_flat"
        ]
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@user_can_view("workflowPk")
def get_target_projects(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        data_package = get_my_projects(request.user, False)
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
            "workflow_id": workflow.id,
        }
    )


@user_can_edit_or_none("projectPk")
def get_possible_added_workflows(request: HttpRequest) -> HttpResponse:
    type_filter = json.loads(request.POST.get("type_filter"))
    get_strategies = json.loads(request.POST.get("get_strategies", "false"))
    projectPk = request.POST.get("projectPk", False)
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
    except IndexError:
        return None

    return new_outcome


def fast_duplicate_workflow(workflow: Workflow, author: User) -> Workflow:

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

        # Link everything up
        WorkflowProject.objects.bulk_create(
            [
                WorkflowProject(
                    rank=workflowproject.rank,
                    workflow=id_dict["workflow"][workflowproject.workflow.id],
                    project=new_project,
                )
                for workflowproject in workflowprojects
            ]
        )

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
            clone = fast_duplicate_workflow(workflow, request.user)

            WorkflowProject.objects.create(project=project, workflow=clone)

            if workflow.get_project() != project:
                cleanup_workflow_post_duplication(clone, project)

    except ValidationError:
        return JsonResponse({"action": "error"})

    linked_workflows = Workflow.objects.filter(
        linked_nodes__week__workflow=clone
    )
    for wf in linked_workflows:
        data_package = get_parent_outcome_data(wf.get_subclass(), request.user)
        actions.dispatch_wf(wf, actions.replaceStoreData(data_package))

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
            clone = fast_duplicate_workflow(workflow, request.user)
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
    last_time = time.time()
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        with transaction.atomic():
            clone = fast_duplicate_project(project, request.user)
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
    translation = json.loads(request.POST.get("translation"))
    translation_plural = json.loads(request.POST.get("translation_plural"))
    try:
        CustomTerm.objects.filter(term=term, project=project,).delete()
        project.terminology_dict.create(
            term=term,
            translation=translation,
            translation_plural=translation_plural,
        )
    except ValidationError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "new_dict": ProjectSerializerShallow(project).data[
                "terminology_dict"
            ],
        }
    )


@user_can_edit(False)
def add_comment(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    text = json.loads(request.POST.get("text"))
    try:
        obj = get_model_from_str(object_type).objects.get(id=object_id)
        obj.comments.create(text=text, user=request.user)
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
    return JsonResponse({"action": "posted",})


@user_can_edit("workflowPk")
def new_outcome_for_workflow(request: HttpRequest) -> HttpResponse:
    workflow_id = json.loads(request.POST.get("workflowPk"))
    workflow = Workflow.objects.get(pk=workflow_id)
    try:
        outcome = Outcome.objects.create(author=request.user)
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
        workflow, actions.newChildOutcomeAction(response_data)
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
        if (
            strategy.get_subclass().author == request.user
            or strategy.published
        ):
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
            return JsonResponse({"action": "posted",})

        else:
            raise ValidationError("User cannot access this strategy")
    except ValidationError:
        return JsonResponse({"action": "error"})


@user_can_edit("nodePk")
@user_can_edit(False)
def new_node_link(request: HttpRequest) -> HttpResponse:
    node_id = json.loads(request.POST.get("nodePk"))
    target_id = json.loads(request.POST.get("objectID"))
    source_port = json.loads(request.POST.get("sourcePort"))
    target_port = json.loads(request.POST.get("targetPort"))
    node = Node.objects.get(pk=node_id)
    target = Node.objects.get(pk=target_id)
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
    return JsonResponse({"action": "posted",})


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
            new_model_serialized = OutcomeSerializerShallow(newmodel).data
            new_through_serialized = OutcomeOutcomeSerializerShallow(
                newthroughmodel
            ).data
        else:
            raise ValidationError("Uknown component type")

    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "new_model": new_model_serialized,
        "new_through": new_through_serialized,
        "parentID": model.id,
    }
    workflow = model.get_workflow()
    actions.dispatch_wf(
        workflow, actions.insertChildAction(response_data, object_type),
    )
    if object_type == "outcome":
        actions.dispatch_to_parent_wf(
            workflow, actions.insertChildAction(response_data, "childoutcome")
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

    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "new_model": new_model_serialized,
        "new_through": new_through_serialized,
        "parentID": parent_id,
    }
    workflow = model.get_workflow()
    if object_type == "outcome" and through_type == "outcomeworkflow":
        object_type = "outcome_base"
    actions.dispatch_wf(
        workflow, actions.insertBelowAction(response_data, object_type),
    )
    if object_type == "outcome" or object_type == "outcome_base":
        actions.dispatch_to_parent_wf(
            workflow,
            actions.insertBelowAction(response_data, "child" + object_type),
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
    through_type = json.loads(request.POST.get("throughType"))
    try:
        with transaction.atomic():
            if object_type == "week":
                model = Week.objects.get(id=object_id)
                parent = Workflow.objects.get(id=parent_id)
                through = WeekWorkflow.objects.get(week=model, workflow=parent)
                newmodel = fast_duplicate_week(model, request.user)
                newthroughmodel = WeekWorkflow.objects.create(
                    workflow=parent, week=newmodel, rank=through.rank + 1
                )
                new_model_serialized = WeekSerializerShallow(newmodel).data
                new_through_serialized = WeekWorkflowSerializerShallow(
                    newthroughmodel
                ).data
                new_children_serialized = {
                    "node": NodeSerializerShallow(
                        newmodel.nodes, many=True
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
                model = Node.objects.get(id=object_id)
                parent = Week.objects.get(id=parent_id)
                through = NodeWeek.objects.get(node=model, week=parent)
                newmodel = duplicate_node(model, request.user, None, None)
                newthroughmodel = NodeWeek.objects.create(
                    week=parent, node=newmodel, rank=through.rank + 1
                )
                new_model_serialized = NodeSerializerShallow(newmodel).data
                new_through_serialized = NodeWeekSerializerShallow(
                    newthroughmodel
                ).data
                new_children_serialized = {
                    "outcomenode": OutcomeNodeSerializerShallow(
                        OutcomeNode.objects.filter(node=newmodel), many=True
                    ).data,
                }
            elif object_type == "column":
                model = Column.objects.get(id=object_id)
                parent = Workflow.objects.get(id=parent_id)
                through = ColumnWorkflow.objects.get(
                    column=model, workflow=parent
                )
                newmodel = duplicate_column(model, request.user)
                newthroughmodel = ColumnWorkflow.objects.create(
                    workflow=parent, column=newmodel, rank=through.rank + 1
                )
                new_model_serialized = ColumnSerializerShallow(newmodel).data
                new_through_serialized = ColumnWorkflowSerializerShallow(
                    newthroughmodel
                ).data
                new_children_serialized = None
            elif object_type == "outcome":
                model = Outcome.objects.get(id=object_id)
                newmodel = fast_duplicate_outcome(model, request.user)
                if parent_type == "outcome":
                    parent = Outcome.objects.get(id=parent_id)
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
                    parent = Workflow.objects.get(id=parent_id)
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
                new_children_serialized = {
                    "outcome": OutcomeSerializerShallow(
                        outcomes, many=True
                    ).data,
                    "outcomeoutcome": OutcomeOutcomeSerializerShallow(
                        outcomeoutcomes, many=True
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
    }
    workflow = model.get_workflow()
    if object_type == "outcome" and through_type == "outcomeworkflow":
        object_type = "outcome_base"
    actions.dispatch_wf(
        workflow, actions.insertBelowAction(response_data, object_type),
    )
    if object_type == "outcome" or object_type == "outcome_base":
        actions.dispatch_to_parent_wf(
            workflow,
            actions.insertBelowAction(response_data, "child" + object_type),
        )

    linked_workflows = False
    if object_type == "node":
        linked_workflows = Workflow.objects.filter(linked_nodes=model)
    elif object_type == "week":
        linked_workflows = Workflow.objects.filter(linked_nodes__week=model)
    if linked_workflows:
        for wf in linked_workflows:
            data_package = get_parent_outcome_data(
                wf.get_subclass(), request.user
            )
            actions.dispatch_wf(wf, actions.replaceStoreData(data_package))
    return JsonResponse({"action": "posted"})


# favourite/unfavourite a project or workflow or outcome for a user
@user_can_view(False)
def toggle_favourite(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    objectType = json.loads(request.POST.get("objectType"))
    favourite = json.loads(request.POST.get("favourite"))
    response = {}
    try:
        item = get_model_from_str(objectType).objects.get(id=object_id)
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
    user_id = json.loads(request.POST.get("permission_user"))
    permission_type = json.loads(request.POST.get("permission_type"))
    response = {}
    try:
        user = User.objects.get(id=user_id)
        item = get_model_from_str(objectType).objects.get(id=object_id)
        if hasattr(item, "get_subclass"):
            item = item.get_subclass()
        ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(item),
            object_id=object_id,
        ).delete()
        if permission_type != ObjectPermission.PERMISSION_NONE:
            ObjectPermission.objects.create(
                user=user, content_object=item, permission_type=permission_type
            )
        response["action"] = "posted"
    except ValidationError:
        response["action"] = "error"

    return JsonResponse(response)


@user_can_edit(False)
def get_users_for_object(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    content_type = ContentType.objects.get(model=object_type)
    try:
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
    except ValidationError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "viewers": UserSerializer(viewers, many=True).data,
            "editors": UserSerializer(editors, many=True).data,
        }
    )


@user_is_teacher()
def get_user_list(request: HttpRequest) -> HttpResponse:
    name_filter = json.loads(request.POST.get("filter"))
    try:
        user_list = User.objects.filter(
            username__istartswith=name_filter,
            groups=Group.objects.get(name=settings.TEACHER_GROUP),
        )[:10]
    except ValidationError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "user_list": UserSerializer(user_list, many=True).data,
        }
    )


"""
Reorder methods
"""


# Insert a model via its throughmodel
@user_can_edit(False)
@user_can_edit_or_none(False, get_parent=True)
@user_can_edit_or_none("columnPk")
def inserted_at(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    inserted = json.loads(request.POST.get("inserted", "false"))
    column_change = json.loads(request.POST.get("columnChange", "false"))
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
                    elif new_position > all_throughs.count():
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
        actions.dispatch_wf(
            workflow,
            actions.changeThroughID(
                through_type, old_through_id, new_through.id
            ),
        )
    if object_type == "outcome":
        actions.dispatch_to_parent_wf(
            workflow,
            actions.insertBelowAction(
                "child" + through_type, old_through_id, new_through.id
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
                actions.changeField(object_id, "child" + object_type, data),
            )
    except AttributeError:
        pass

    return JsonResponse({"action": "posted"})


@user_can_edit("nodePk")
@user_can_view("outcomePk")
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
        if degree == 0:
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
    actions.dispatch_wf(
        workflow, actions.updateOutcomenodeDegreeAction(response_data),
    )
    if node.linked_workflow is not None:
        data_package = get_parent_outcome_data(
            node.linked_workflow.get_subclass(), request.user
        )
        actions.dispatch_wf(
            node.linked_workflow, actions.replaceStoreData(data_package)
        )
    return JsonResponse({"action": "posted",})


# Add a parent outcome to an outcome
@user_can_edit("outcomePk")
@user_can_view(False)
def update_outcomehorizontallink_degree(request: HttpRequest) -> HttpResponse:

    outcome_id = json.loads(request.POST.get("outcomePk"))
    parent_id = json.loads(request.POST.get("objectID"))
    degree = json.loads(request.POST.get("degree"))
    try:
        outcome = Outcome.objects.get(id=outcome_id)
        parent_outcome = Outcome.objects.get(id=parent_id)
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
        if degree == 0:
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
    workflow = outcome.get_workflow()
    actions.dispatch_wf(
        workflow,
        actions.updateOutcomehorizontallinkDegreeAction(response_data),
    )
    actions.dispatch_to_parent_wf(
        workflow,
        actions.updateChildOutcomehorizontallinkDegreeAction(response_data),
    )
    return JsonResponse({"action": "posted",})


# Do not call if duplicating the parent workflow
def set_linked_workflow(node: Node, workflow):
    project = node.get_workflow().get_project()
    if WorkflowProject.objects.get(workflow=workflow).project == project:
        node.linked_workflow = workflow
        node.save()
    else:
        try:
            new_workflow = fast_duplicate_workflow(workflow, node.author)
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
    last_time = time.time()
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
            set_linked_workflow(node, workflow)
            if node.linked_workflow is None:
                raise ValidationError("Project could not be found")
            linked_workflow = node.linked_workflow.id
            linked_workflow_data = LinkedWorkflowSerializerShallow(
                node.linked_workflow
            ).data

    except ValidationError:
        return JsonResponse({"action": "error"})
    response_data = {
        "id": node_id,
        "linked_workflow": linked_workflow,
        "linked_workflow_data": linked_workflow_data,
    }
    if original_workflow is not None:
        data_package = get_parent_outcome_data(
            original_workflow.get_subclass(), request.user
        )
        actions.dispatch_wf(
            original_workflow, actions.replaceStoreData(data_package)
        )
    if workflow is not None:
        data_package = get_parent_outcome_data(
            workflow.get_subclass(), request.user
        )
        actions.dispatch_wf(workflow, actions.replaceStoreData(data_package))
    actions.dispatch_wf(
        parent_workflow, actions.setLinkedWorkflowAction(response_data)
    )
    return JsonResponse({"action": "posted",})


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
            strategy = fast_duplicate_workflow(workflow, request.user)
            strategy.title = week.title
            strategy.is_strategy = True
            strategy.save()
            strategy.weeks.exclude(parent_week=week).delete()
            strategy_week = strategy.weeks.first()
            strategy_week.is_strategy = True
            strategy_week.save()
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

    return JsonResponse({"action": "posted",})


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


@user_can_delete(False)
def delete_self(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        workflow = None
        extra_data = None
        parent_id = None
        object_suffix = ""
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
                Node.objects.filter(pk__in=affected_nodes), many=True,
            ).data
        elif object_type =="column":
            extra_data = (
                workflow.columnworkflow_set.filter(column__deleted=False)
                .order_by("rank")
                .first()
                .column.id
            )
    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})
    if workflow is not None:
        actions.dispatch_wf(
            workflow,
            actions.deleteSelfAction(
                object_id, object_type, parent_id, extra_data
            ),
        )
        if object_type == "outcome" or object_type == "outcome_base":
            actions.dispatch_to_parent_wf(
                workflow,
                actions.deleteSelfAction(
                    object_id, "child" + object_type, parent_id, extra_data
                ),
            )
    if linked_workflows:
        for wf in linked_workflows:
            data_package = get_parent_outcome_data(
                wf.get_subclass(), request.user
            )
            actions.dispatch_wf(wf, actions.replaceStoreData(data_package))
    if object_type in ["workflow", "activity", "course", "program"]:
        for parent_workflow in parent_workflows:
            data_package = get_child_outcome_data(
                parent_workflow.get_subclass(), request.user
            )
            actions.dispatch_wf(
                parent_workflow, actions.replaceStoreData(data_package)
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
        object_suffix = ""
        try:
            workflow = model.get_workflow()
        except AttributeError:
            pass
        # Delete the object
        with transaction.atomic():
            model.deleted = False
            model.save()
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
                Node.objects.filter(outcomes__in=outcomes_list), many=True,
            ).data
            outcomes_to_update = RefreshSerializerOutcome(
                Outcome.objects.filter(horizontal_outcomes__in=outcomes_list),
                many=True,
            ).data
        if object_type == "week":
            throughparent_id = WeekWorkflow.objects.get(week=model).id
            parent_id = workflow.id
        elif object_type == "column":
            throughparent_id = ColumnWorkflow.objects.get(column=model).id
            extra_data = [x.id for x in Node.objects.filter(column=model)]
            parent_id = workflow.id
        elif object_type == "node":
            throughparent_id = NodeWeek.objects.get(node=model).id
            parent_id = NodeWeek.objects.get(node=model).week.id
        elif object_type == "outcome" and model.depth == 0:
            throughparent_id = OutcomeWorkflow.objects.get(outcome=model).id
            parent_id = workflow.id
            object_type = "outcome_base"
        elif object_type == "outcome":
            throughparent_id = OutcomeOutcome.objects.get(child=model).id
            parent_id = OutcomeOutcome.objects.get(child=model).parent.id

    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})
    if workflow is not None:
        actions.dispatch_wf(
            workflow,
            actions.restoreSelfAction(
                object_id, object_type, parent_id, throughparent_id, extra_data
            ),
        )
        if object_type == "outcome" or object_type == "outcome_base":
            actions.dispatch_to_parent_wf(
                workflow,
                actions.restoreSelfAction(
                    object_id,
                    "child" + object_type,
                    parent_id,
                    throughparent_id,
                    extra_data,
                ),
            )
    if linked_workflows:
        for wf in linked_workflows:
            data_package = get_parent_outcome_data(
                wf.get_subclass(), request.user
            )
            actions.dispatch_wf(wf, actions.replaceStoreData(data_package))
            if object_type == "outcome" or object_type == "outcome_base":
                actions.dispatch_wf(
                    wf,
                    actions.updateHorizontalLinks(
                        {"data": outcomes_to_update}
                    ),
                )
    if object_type in ["workflow", "activity", "course", "program"]:
        for parent_workflow in parent_workflows:
            data_package = get_child_outcome_data(
                parent_workflow.get_subclass(), request.user
            )
            actions.dispatch_wf(
                parent_workflow, actions.replaceStoreData(data_package)
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
        object_suffix = ""
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
        if object_type == "week":
            parent_id = WeekWorkflow.objects.get(week=model).id
        elif object_type == "column":
            parent_id = ColumnWorkflow.objects.get(column=model).id

        elif object_type == "node":
            parent_id = NodeWeek.objects.get(node=model).id
        elif object_type == "outcome" and model.depth == 0:
            parent_id = OutcomeWorkflow.objects.get(outcome=model).id
            object_type = "outcome_base"
        elif object_type == "outcome":
            parent_id = OutcomeOutcome.objects.get(child=model).id

        # Delete the object
        with transaction.atomic():
            model.deleted = True
            model.save()

        if object_type == "outcome" or object_type == "outcome_base":
            outcomes_list = [object_id] + list(
                get_descendant_outcomes(model).values_list("pk", flat=True)
            )
            extra_data = RefreshSerializerNode(
                Node.objects.filter(outcomes__in=outcomes_list), many=True,
            ).data
            outcomes_to_update = RefreshSerializerOutcome(
                Outcome.objects.filter(horizontal_outcomes__in=outcomes_list),
                many=True,
            ).data
        elif object_type=="column":
            extra_data = (
                workflow.columnworkflow_set.filter(column__deleted=False)
                .order_by("rank")
                .first()
                .column.id
            )
    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})
    if workflow is not None:
        actions.dispatch_wf(
            workflow,
            actions.deleteSelfSoftAction(
                object_id, object_type, parent_id, extra_data
            ),
        )
        if object_type == "outcome" or object_type == "outcome_base":
            actions.dispatch_to_parent_wf(
                workflow,
                actions.deleteSelfSoftAction(
                    object_id, "child" + object_type, parent_id, extra_data
                ),
            )
    if linked_workflows:
        for wf in linked_workflows:
            data_package = get_parent_outcome_data(
                wf.get_subclass(), request.user
            )
            actions.dispatch_wf(wf, actions.replaceStoreData(data_package))
            if object_type == "outcome" or object_type == "outcome_base":
                actions.dispatch_wf(
                    wf,
                    actions.updateHorizontalLinks(
                        {"data": outcomes_to_update}
                    ),
                )
    if object_type in ["workflow", "activity", "course", "program"]:
        for parent_workflow in parent_workflows:
            data_package = get_child_outcome_data(
                parent_workflow.get_subclass(), request.user
            )
            actions.dispatch_wf(
                parent_workflow, actions.replaceStoreData(data_package)
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
                    project["title"], tags=bleach_allowed_tags
                ),
            )
            id_dict["project"][project["id"]] = new_project
        #        for outcome in json_data["outcome"]:
        #            new_outcome = Outcome.objects.create(
        #                author=request.user,
        #                title=bleach_sanitizer(
        #                    outcome["title"], tags=bleach_allowed_tags
        #                ),
        #            )
        #            id_dict["outcome"][outcome["id"]] = new_outcome
        for activity in json_data["activity"]:
            new_activity = Activity.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    activity["title"], tags=bleach_allowed_tags
                ),
                description=bleach_sanitizer(
                    activity["description"], tags=bleach_allowed_tags
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
                    course["title"], tags=bleach_allowed_tags
                ),
                description=bleach_sanitizer(
                    course["description"], tags=bleach_allowed_tags
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
                    program["title"], tags=bleach_allowed_tags
                ),
                description=bleach_sanitizer(
                    program["description"], tags=bleach_allowed_tags
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
                    week["title"], tags=bleach_allowed_tags
                ),
            )
            id_dict["week"][week["id"]] = new_week
        for node in json_data["node"]:
            new_node = Node.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    node["title"], tags=bleach_allowed_tags
                ),
                description=bleach_sanitizer(
                    node["description"], tags=bleach_allowed_tags
                ),
                task_classification=task_dict.get(node["task_classification"])
                or 0,
                context_classification=context_dict.get(
                    node["context_classification"]
                )
                or 0,
                time_units=time_unit_dict.get(node["time_units"]) or 0,
                time_required=bleach_sanitizer(
                    node["time_required"], tags=bleach_allowed_tags
                ),
            )
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
            node_model.has_autolink = node_model.node_type == 0
            node_model.save()

        #        for outcomenode in json_data["outcomenode"]:
        #            OutcomeNode.objects.create(
        #                outcome=id_dict["outcome"][outcomenode["outcome"]],
        #                node=id_dict["node"][outcomenode["node"]],
        #                degree=outcomenode["degree"],
        #            )

        for nodelink in json_data["nodelink"]:
            NodeLink.objects.create(
                source_node=id_dict["node"][nodelink["source"]],
                target_node=id_dict["node"][nodelink["target"]],
                title=bleach_sanitizer(
                    nodelink["title"], tags=bleach_allowed_tags
                ),
                dashed=nodelink["style"] or False,
            )

    except Exception:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})
