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
from course_flow.utils import (
    get_model_from_str,
    get_user_permission,
    get_user_role,
)
from course_flow.view_utils import get_my_projects, get_workflow_context_data
from course_flow.views.search_api import get_explore_objects


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


"""
Contextual information methods
"""


class DisciplineListView(LoginRequiredMixin, ListAPIView):
    queryset = Discipline.objects.order_by("title")
    serializer_class = DisciplineSerializer


@login_required
def my_live_projects_view(request):
    context = {
        "project_data_package": JSONRenderer()
        .render(get_my_live_projects(request.user))
        .decode("utf-8")
    }
    return render(request, "course_flow/my_live_projects.html", context)


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


#################################################
# Helper functions
#################################################


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
