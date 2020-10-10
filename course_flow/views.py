from .models import (
    model_lookups,
    User,
    Course,
    Column,
    ColumnWorkflow,
    Workflow,
    Activity,
    Strategy,
    Node,
    NodeStrategy,
    StrategyWorkflow,
    Program,
    NodeCompletionStatus,
)
from .serializers import (
    serializer_lookups,
    serializer_lookups_shallow,
    ActivitySerializer,
    CourseSerializer,
    StrategySerializer,
    NodeSerializer,
    ProgramSerializer,
    WorkflowSerializer,
    WorkflowSerializerShallow,
    CourseSerializerShallow,
    ActivitySerializerShallow,
    ProgramSerializerShallow,
    StrategyWorkflowSerializerShallow,
    StrategySerializerShallow,
    NodeStrategySerializerShallow,
    NodeSerializerShallow,
    ColumnWorkflowSerializerShallow,
    ColumnSerializerShallow,
    WorkflowSerializerFinder,
)
from .decorators import ajax_login_required, is_owner, is_parent_owner, is_throughmodel_parent_owner
from django.urls import reverse
from django.views.generic.edit import CreateView
from django.views.generic import DetailView, UpdateView
from rest_framework import viewsets
from rest_framework.renderers import JSONRenderer
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.db.models import Count
import json
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import authenticate, login
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from .forms import RegistrationForm
from django.shortcuts import render, redirect
from django.db.models import ProtectedError
from django.core.exceptions import ValidationError
import math


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


@login_required
def home_view(request):
    context = {
        "programs": Program.objects.exclude(author=request.user),
        "courses": Course.objects.exclude(author=request.user, static=True),
        "activities": Activity.objects.exclude(
            author=request.user, static=True
        ),
        "owned_programs": Program.objects.filter(author=request.user),
        "owned_courses": Course.objects.filter(
            author=request.user, static=False
        ),
        "owned_activities": Activity.objects.filter(
            author=request.user, static=False
        ),
        "owned_static_courses": Course.objects.filter(
            author=request.user, static=True
        ),
    }
    return render(request, "course_flow/home.html", context)


class WorkflowUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Workflow
    fields = ["title", "description"]
    template_name = "course_flow/workflow_update.html"
    
    def get_queryset(self):
        return self.model.objects.select_subclasses()
    
    def get_object(self):
        wf = super().get_object()
        return Workflow.objects.get_subclass(pk=wf.pk)
    
    def test_func(self):
        return self.get_object().author == self.request.user

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
        )


class WorkflowDetailView(LoginRequiredMixin, UserPassesTestMixin, DetailView):
    model = Workflow
    template_name = "course_flow/workflow_detail.html"

    def get_object(self):
        wf = super().get_object()
        return Workflow.objects.get_subclass(pk=wf.pk)
    
    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )

class WorkflowViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = WorkflowSerializerFinder
    renderer_classes = [JSONRenderer]
    queryset = Workflow.objects.select_subclasses()

class StrategyWorkflowViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = StrategyWorkflowSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = StrategyWorkflow.objects.all()

class StrategyViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = StrategySerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = Strategy.objects.all()

class NodeStrategyViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = NodeStrategySerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = NodeStrategy.objects.all()

class NodeViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = NodeSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = Node.objects.all()

class ColumnWorkflowViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ColumnWorkflowSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = ColumnWorkflow.objects.all()

class ColumnViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ColumnSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = Column.objects.all()

class ActivityViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivitySerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = Activity.objects.all()


class CourseViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = CourseSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = Course.objects.all()


class ProgramViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ProgramSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = Program.objects.all()


class ProgramDetailView(LoginRequiredMixin, UserPassesTestMixin, DetailView):
    model = Program
    template_name = "course_flow/program_detail.html"

    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )


class ProgramCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Program
    fields = ["title", "description"]
    template_name = "course_flow/program_create.html"

    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super(ProgramCreateView, self).form_valid(form)

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )


class ProgramUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Program
    fields = ["title", "description", "author"]
    template_name = "course_flow/program_update.html"

    def test_func(self):
        return self.get_object().author == self.request.user

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        component_set = set()
        for course in Course.objects.filter(
            author=self.request.user, static=False
        ).order_by("-last_modified")[:10]:
            component, created = Component.objects.get_or_create(
                object_id=course.id,
                content_type=ContentType.objects.get_for_model(Course),
            )
            component_set.add(component.pk)
        context["owned_components"] = Component.objects.filter(
            pk__in=component_set
        )
        context["owned_component_json"] = (
            JSONRenderer()
            .render(
                ProgramLevelComponentSerializer(
                    context["owned_components"], many=True
                ).data
            )
            .decode("utf-8")
        )
        return context

    def get_success_url(self):
        return reverse(
            "course_flow:course-detail", kwargs={"pk": self.object.pk}
        )


class CourseDetailView(LoginRequiredMixin, UserPassesTestMixin, DetailView):
    model = Course
    template_name = "course_flow/course_detail.html"

    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )


class StaticCourseDetailView(LoginRequiredMixin, DetailView):
    model = Course
    template_name = "course_flow/course_detail_static.html"


class StudentCourseDetailView(LoginRequiredMixin, DetailView):
    model = Course
    template_name = "course_flow/course_detail_student.html"


class CourseCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
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
        return super(CourseCreateView, self).form_valid(form)

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )


class CourseUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Course
    fields = ["title", "description", "author"]
    template_name = "course_flow/course_update.html"

    def test_func(self):
        return self.get_object().author == self.request.user

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        component_set = set()
        for activity in Activity.objects.filter(
            author=self.request.user, static=False
        ).order_by("-last_modified")[:10]:
            component, created = Component.objects.get_or_create(
                object_id=activity.id,
                content_type=ContentType.objects.get_for_model(Activity),
            )
            component_set.add(component.pk)
        context["owned_components"] = Component.objects.filter(
            pk__in=component_set
        )
        context["owned_component_json"] = (
            JSONRenderer()
            .render(
                WeekLevelComponentSerializer(
                    context["owned_components"], many=True
                ).data
            )
            .decode("utf-8")
        )
        return context

    def get_success_url(self):
        return reverse(
            "course_flow:course-detail", kwargs={"pk": self.object.pk}
        )


class ActivityDetailView(LoginRequiredMixin, UserPassesTestMixin, DetailView):
    model = Activity
    template_name = "course_flow/activity_detail.html"

    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )


class StaticActivityDetailView(LoginRequiredMixin, DetailView):
    model = Activity
    template_name = "course_flow/activity_detail_static.html"


class StudentActivityDetailView(LoginRequiredMixin, DetailView):
    model = Activity
    template_name = "course_flow/activity_detail_student.html"


class ActivityCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
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
        return super(ActivityCreateView, self).form_valid(form)

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )


class ActivityUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Activity
    fields = ["title", "description", "author"]
    template_name = "course_flow/activity_update.html"

    def test_func(self):
        return self.get_object().author == self.request.user

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        default_strategy_quearyset = Strategy.objects.filter(
            default=True
        ).annotate(num_children=Count("strategy"))
        context["default_strategy_json"] = (
            JSONRenderer()
            .render(
                StrategySerializer(default_strategy_quearyset, many=True).data
            )
            .decode("utf-8")
        )
        return context

    def get_success_url(self):
        return reverse(
            "course_flow:activity-detail", kwargs={"pk": self.object.pk}
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

@require_POST
@ajax_login_required
@is_owner("activity")
def update_activity_json(request: HttpRequest) -> HttpResponse:
    data = json.loads(request.POST.get("json"))
    serializer = ActivitySerializer(
        Activity.objects.get(id=data["id"]), data=data
    )
    return save_serializer(serializer)


@require_POST
@ajax_login_required
@is_owner("course")
def update_course_json(request: HttpRequest) -> HttpResponse:
    data = json.loads(request.POST.get("json"))
    serializer = CourseSerializer(Course.objects.get(id=data["id"]), data=data)
    return save_serializer(serializer)


@require_POST
@ajax_login_required
@is_owner("program")
def update_program_json(request: HttpRequest) -> HttpResponse:
    data = json.loads(request.POST.get("json"))
    serializer = ProgramSerializer(
        Program.objects.get(id=data["id"]), data=data
    )
    return save_serializer(serializer)


def duplicate_node(node: Node, author: User) -> Node:
    new_node = Node.objects.create(
        title=node.title,
        description=node.description,
        author=author,
        is_original=False,
        parent_node=node,
        work_classification=node.work_classification,
        activity_classification=node.activity_classification,
        column=node.column,
        node_type=node.node_type,
    )
    return new_node


#Called when a node is added from the sidebar (duplicated)
@login_required
@ajax_login_required
@is_owner("strategyPk")
def add_node(request: HttpRequest) -> HttpResponse:
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    strategy = Strategy.objects.get(pk=request.POST.get("strategyPk"))

    try:
        for link in NodeStrategy.objects.filter(strategy=strategy):
            link.rank += 1
            link.save()

        NodeStrategy.objects.create(
            strategy=strategy, node=duplicate_node(node, request.user), rank=0
        )

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


def duplicate_strategy(strategy: Strategy, author: User) -> Strategy:
    new_strategy = Strategy.objects.create(
        title=strategy.title,
        description=strategy.description,
        author=author,
        is_original=False,
        parent_strategy=strategy,
    )
    for node in strategy.nodes.all():
        NodeStrategy.objects.create(
            strategy=new_strategy,
            node=duplicate_node(node, author),
            rank=NodeStrategy.objects.get(node=node, strategy=strategy).rank,
        )
    return new_strategy

#Called when a strategy is added from the sidebar (duplicated)
@require_POST
@ajax_login_required
@is_owner("workflowPk")
def add_strategy(request: HttpRequest) -> HttpResponse:
    strategy = Strategy.objects.get(pk=request.POST.get("strategyPk"))
    workflow = Workflow.objects.get_subclass(pk=request.POST.get("workflowPk"))

    try:
        for link in StrategyWorkflow.objects.filter(workflow=workflow):
            link.rank += 1
            link.save()

        StrategyWorkflow.objects.create(
            workflow=workflow,
            strategy=duplicate_strategy(strategy, request.user),
            rank=0,
        )
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


def duplicate_activity(activity: Activity, author: User) -> Activity:
    new_activity = Activity.objects.create(
        title=activity.title,
        description=activity.description,
        author=author,
        is_original=False,
        parent_workflow=activity,
    )
    for strategy in activity.strategies.all():
        StrategyWorkflow.objects.create(
            activity=new_activity,
            strategy=duplicate_strategy(strategy, author),
            rank=StrategyWorkflow.objects.get(
                workflow=activity, strategy=strategy
            ).rank,
        )
    return new_activity


@require_POST
@ajax_login_required
def duplicate_activity_ajax(request: HttpRequest) -> HttpResponse:
    activity = Activity.objects.get(pk=request.POST.get("activityPk"))
    try:
        clone = duplicate_activity(activity, request.user)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted", "clone_pk": clone.pk})


def duplicate_course(course: Course, author: User) -> Course:
    new_course = Course.objects.create(
        title=course.title,
        description=course.description,
        author=author,
        is_original=False,
        parent_workflow=course,
    )
    for strategy in course.strategies.all():
        StrategyWorkflow.objects.create(
            workflow=new_course,
            strategy=duplicate_strategy(strategy, author),
            rank=StrategyWorkflow.objects.get(strategy=strategy, workflow=workflow).rank,
        )
    return new_course


@require_POST
@ajax_login_required
def duplicate_course_ajax(request: HttpRequest) -> HttpResponse:
    course = Course.objects.get(pk=request.POST.get("coursePk"))
    try:
        clone = duplicate_course(course, request.user)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted", "clone_pk": clone.pk})


def get_owned_courses(user: User):
    return Course.objects.filter(author=user, static=False).order_by(
        "-last_modified"
    )[:10]


def setup_link_to_group(course_pk, students) -> Course:

    course = Course.objects.get(pk=course_pk)

    clone = duplicate_course(course, course.author)
    clone.static = True
    clone.title += " -- Live"
    clone.save()
    clone.students.add(*students)
    for week in clone.weeks.all():
        for component in week.components.exclude(
            content_type=ContentType.objects.get_for_model(Activity)
        ):
            component.students.add(*students)
        for component in week.components.filter(
            content_type=ContentType.objects.get_for_model(Activity)
        ):
            activity = component.content_object
            activity.static = True
            activity.save()
            activity.students.add(*students)
            for strategy in activity.strategies.all():
                for node in strategy.nodes.all():
                    node.students.add(*students)
    return clone


def setup_unlink_from_group(course_pk):
    Course.objects.get(pk=course_pk).delete()
    return "done"


def remove_student_from_group(student, course):
    course.students.remove(student)
    for week in course.weeks.all():
        for component in week.components.exclude(
            content_type=ContentType.objects.get_for_model(Activity)
        ):
            ComponentCompletionStatus.objects.get(
                student=student, component=component
            ).delete()
        for component in week.components.filter(
            content_type=ContentType.objects.get_for_model(Activity)
        ):
            activity = component.content_object
            activity.students.remove(student)
            for strategy in activity.strategies.all():
                for node in strategy.nodes.all():
                    NodeCompletionStatus.objects.get(
                        student=student, node=node
                    ).delete()


def add_student_to_group(student, course):
    course.students.add(student)
    for week in course.weeks.all():
        for component in week.components.exclude(
            content_type=ContentType.objects.get_for_model(Activity)
        ):
            ComponentCompletionStatus.objects.create(
                student=student, component=component
            )
        for component in week.components.filter(
            content_type=ContentType.objects.get_for_model(Activity)
        ):
            activity = component.content_object
            activity.students.add(student)
            for strategy in activity.strategies.all():
                for node in strategy.nodes.all():
                    NodeCompletionStatus.objects.create(
                        student=student, node=node
                    )


@require_POST
@ajax_login_required
def switch_node_completion_status(request: HttpRequest) -> HttpResponse:
    node = Node.objects.get(pk=request.POST.get("pk"))
    is_completed = request.POST.get("isCompleted")

    status = NodeCompletionStatus.objects.get(node=node, student=request.user)

    try:
        if is_completed == "true":
            status.is_completed = True
        else:
            status.is_completed = False

        status.save()
    except:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


@require_POST
@ajax_login_required
def switch_component_completion_status(request: HttpRequest) -> HttpResponse:
    component = Component.objects.get(pk=request.POST.get("pk"))
    is_completed = request.POST.get("isCompleted")

    try:
        status = ComponentCompletionStatus.objects.get(
            component=component, student=request.user
        )

        if is_completed == "true":
            status.is_completed = True
        else:
            status.is_completed = False

        status.save()
    except:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


@ajax_login_required
def get_node_completion_status(request: HttpRequest) -> HttpResponse:

    status = NodeCompletionStatus.objects.get(
        node=Node.objects.get(pk=request.GET.get("nodePk")),
        student=request.user,
    )

    return JsonResponse(
        {"action": "got", "completion_status": status.is_completed}
    )


@ajax_login_required
def get_node_completion_count(request: HttpRequest) -> HttpResponse:

    statuses = NodeCompletionStatus.objects.filter(
        node=Node.objects.get(pk=request.GET.get("nodePk")), is_completed=True
    )

    return JsonResponse(
        {"action": "got", "completion_status": statuses.count()}
    )

@require_POST
@ajax_login_required
@is_owner("weekPk")
def add_component_to_course(request: HttpRequest) -> HttpResponse:
    week = Week.objects.get(pk=request.POST.get("weekPk"))
    component = Component.objects.get(pk=request.POST.get("componentPk"))

    if ComponentWeek.objects.filter(week=week, component=component):
        component = duplicate_component(component, request.user)
        component_object = component.content_object
        component_object.title += " (duplicate)"
        component_object.save()

    try:
        for link in ComponentWeek.objects.filter(week=week):
            link.rank += 1
            link.save()

        ComponentWeek.objects.create(week=week, component=component, rank=0)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


#Called to add components via a dialog form
@require_POST
@ajax_login_required
@is_parent_owner
def dialog_form_create(request: HttpRequest) -> HttpResponse:
    data = json.loads(request.POST.get("object"))
    model = json.loads(request.POST.get("objectType"))
    data["author"] = request.user.username
    parent_id = json.loads(request.POST.get("parentID"))
    if model == "node":
        data["work_classification"] = int(data["work_classification"])
        data["activity_classification"] = int(data["activity_classification"])
        data["parent_node"] = None
        serializer = NodeSerializer(data=data)
        if parent_id:
            strategy = Strategy.objects.get(id=parent_id)
            if serializer.is_valid():
                node = serializer.save()
            else:
                return JsonResponse({"action": "error"})
            try:
                for link in NodeStrategy.objects.filter(strategy=strategy):
                    link.rank += 1
                    link.save()
                NodeStrategy.objects.create(strategy=strategy, node=node)
            except ValidationError:
                return JsonResponse({"action": "error"})
            return JsonResponse({"action": "posted"})
    elif model == "strategy":
        del data["work_classification"], data["activity_classification"]
        data["parent_strategy"] = None
        serializer = StrategySerializer(data=data)
        if parent_id:
            workflow = Workflow.objects.get(id=parent_id)
            if serializer.is_valid():
                strategy = serializer.save()
            else:
                return JsonResponse({"action": "error"})
            try:
                for link in StrategyWorkflow.objects.filter(workflow=workflow):
                    link.rank += 1
                    link.save()
                StrategyWorkflow.objects.create(
                    workflow=workflow, strategy=strategy
                )
            except ValidationError:
                return JsonResponse({"action": "error"})
            return JsonResponse({"action": "posted"})
    else:
        del data["work_classification"], data["activity_classification"]
        return save_serializer(serializer_lookups[model](data=data))
    return save_serializer(serializer)


@require_POST
@ajax_login_required
@is_owner(False)
def dialog_form_update(request: HttpRequest) -> HttpResponse:
    data = json.loads(request.POST.get("object"))
    model = json.loads(request.POST.get("objectType"))

    serializer = serializer_lookups[model](
        model_lookups[model].objects.get(id=data["id"]), data=data
    )

    return save_serializer(serializer)


@require_POST
@ajax_login_required
@is_owner(False)
def dialog_form_delete(request: HttpRequest) -> HttpResponse:
    id = json.loads(request.POST.get("objectID"))
    model = json.loads(request.POST.get("objectType"))

    try:
        model_lookups[model].objects.get(id=id).delete()
    except ProtectedError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


@require_POST
@ajax_login_required
@is_owner(False)
def dialog_form_remove(request: HttpRequest) -> HttpResponse:
    link_id = json.loads(request.POST.get("linkID"))
    is_program_level = json.loads(request.POST.get("isProgramLevelComponent"))

    try:
        if is_program_level:
            ComponentProgram.objects.get(id=link_id).delete()
        else:
            ComponentWeek.objects.get(id=link_id).delete()
    except ProtectedError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


"""
Creation methods
"""
@require_POST
@ajax_login_required
@is_owner("workflowPk")
def new_column(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get_subclass(pk=request.POST.get("workflowPk"))
    column_type = request.POST.get("column_type")
    try:
        number_of_columns = workflow.columns.count()
        if column_type is None: column_type = workflow.DEFAULT_CUSTOM_COLUMN
        column = workflow.columns.create(
            author=workflow.author,
            column_type=column_type,
            through_defaults={"rank":number_of_columns}
        )
    except ValidationError:
        return JsonResponse({"action":"error"})
    return JsonResponse({"action":"posted","objectID":column.id})

@require_POST
@ajax_login_required
@is_owner("strategyPk")
@is_owner("columnPk")
def new_node(request: HttpRequest) -> HttpResponse:
    strategy_id = json.loads(request.POST.get("strategyPk"))
    column_id = json.loads(request.POST.get("columnPk"))
    position = json.loads(request.POST.get("position"))
    strategy = Strategy.objects.get(pk=strategy_id)
    column = Column.objects.get(pk=column_id)
    try:
        if(position<0 or position>strategy.nodes.count()):
            position=strategy.nodes.count()
        node_strategy = NodeStrategy.objects.create(
            strategy = strategy,
            node = Node.objects.create(
                author=strategy.author,
                node_type=strategy.strategy_type,
                column=column,
            ),
            rank=position,
        )
    except ValidationError:
        return JsonResponse({"action":"error"})
    return JsonResponse({"action":"posted","objectID":node_strategy.node.id})

#Add a new sibling to a through model
@require_POST
@ajax_login_required
@is_throughmodel_parent_owner
def insert_sibling(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))

    try:
        model = model_lookups[object_type].objects.get(id=object_id)
        if object_type=="strategyworkflow":
            newmodel = StrategyWorkflow.objects.create(
                workflow=model.workflow,
                strategy=Strategy.objects.create(
                    author = model.workflow.get_subclass().author,
                    strategy_type=model.workflow.get_subclass().WORKFLOW_TYPE
                ),
                rank=model.rank+1
            )
        elif object_type=="nodestrategy":
            newmodel = NodeStrategy.objects.create(
                strategy=model.strategy,
                node=Node.objects.create(
                    author = model.strategy.author,
                    column = model.node.column,
                    node_type=model.node.node_type
                ),
                rank=model.rank+1
            )
        else:
            raise ValidationError
        
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted","objectID":newmodel.id})

"""
Reorder methods
"""

owned_throughmodels = [
    "node",
    "nodestrategy",
    "strategy",
    "strategyworkflow",
    "workflow",
    "columnworkflow",
    "workflow"
]

#Insert a model via its throughmodel
@require_POST
@ajax_login_required
@is_throughmodel_parent_owner
def inserted_at(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))
    new_position = json.loads(request.POST.get("newPosition"))
    new_parent_id = json.loads(request.POST.get("newParentID"))
    new_column_id = json.loads(request.POST.get("newColumnID"))
    try:
        model=model_lookups[object_type].objects.get(id=object_id)
        old_position=model.rank
        parentType = owned_throughmodels[owned_throughmodels.index(object_type)+1]
        
        parent = model_lookups[parentType].objects.get(id=parent_id)
        if not new_parent_id is None: 
            new_parent = model_lookups[parentType].objects.get(id=new_parent_id)
        else: 
            new_parent = parent
        new_parent_count = model_lookups[object_type].objects.filter(
            **{parentType:new_parent}
        ).count()
        if new_position<0:
            new_position=0
        if new_position>new_parent_count:
            new_position=new_parent_count-1
        delta = new_position-old_position
        
        if parent.id==new_parent.id:
            if delta != 0:
                sign = int(math.copysign(1,delta))
                for out_of_order_link in model_lookups[object_type].objects.filter(
                    rank__gte=min(old_position+1,new_position),
                    rank__lte=max(new_position,old_position-1),
                    **{parentType:parent}
                ):
                    out_of_order_link.rank-=sign
                    out_of_order_link.save()
                model.rank=new_position
                model.save()
        elif parent.id != new_parent.id:
            if hasattr(parent,"get_subclass"):
                if parent.get_subclass().author != new_parent.get_subclass().author:
                    raise ValidationError
            else:
                if parent.author != new_parent.author:
                    raise ValidationError
            for out_of_order_link in model_lookups[object_type].objects.filter(
                rank__gt=old_position,
                **{parentType:parent}
            ):
                out_of_order_link.rank-=1
                out_of_order_link.save()
            for out_of_order_link in model_lookups[object_type].objects.filter(
                rank__gte=new_position,
                **{parentType:new_parent}
            ):
                out_of_order_link.rank+=1
                out_of_order_link.save()
            model.rank=new_position
            setattr(model,parentType,new_parent)
            model.save()
        if not new_column_id is None and int(new_column_id)>0 and object_type=="nodestrategy":
            new_column = ColumnWorkflow.objects.get(id=new_column_id).column
            if(new_column.author==parent.author):
                model.node.column=new_column
                model.node.save()
            
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})



"""    
Update Methods
"""   

#Updates an object's information using its serializer
@require_POST
@ajax_login_required
@is_owner(False)
def update_value(request: HttpRequest) -> HttpResponse:
    try:
        object_id = json.loads(request.POST.get("objectID"))
        object_type = json.loads(request.POST.get("objectType"))
        data = json.loads(request.POST.get("data"))
        objects = model_lookups[object_type].objects
        if hasattr(objects,"get_subclass"): object_to_update = objects.get_subclass(pk=object_id)
        else: object_to_update = objects.get(pk=object_id)
        serializer = serializer_lookups_shallow[object_type](
            object_to_update, data=data,partial=True
        )
        return save_serializer(serializer)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})
    

"""
Delete methods
"""
@require_POST
@ajax_login_required
@is_owner(False)
def delete_self(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))

    try:
        model_lookups[object_type].objects.get(id=object_id).delete()
    except ProtectedError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})

