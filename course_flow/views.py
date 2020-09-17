from .models import (
    model_lookups,
    User,
    Course,
    Column,
    ColumnWorkflow,
    Preparation,
    Workflow,
    Activity,
    Assessment,
    Artifact,
    Strategy,
    Node,
    NodeStrategy,
    StrategyWorkflow,
    ComponentWeek,
    Component,
    Week,
    Program,
    NodeCompletionStatus,
    ComponentCompletionStatus,
)
from .serializers import (
    serializer_lookups,
    ActivitySerializer,
    CourseSerializer,
    StrategySerializer,
    NodeSerializer,
    WeekLevelComponentSerializer,
    ProgramSerializer,
    ProgramLevelComponentSerializer,
    WeekSerializer,
    ArtifactSerializer,
    AssessmentSerializer,
    PreparationSerializer,
)
from .decorators import ajax_login_required, is_owner, is_parent_owner
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


class ActivityViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):

    serializer_class = ActivitySerializer
    renderer_classes = [JSONRenderer]
    queryset = Activity.objects.all()


class CourseViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):

    serializer_class = CourseSerializer
    renderer_classes = [JSONRenderer]
    queryset = Course.objects.all()


class ProgramViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):

    serializer_class = ProgramSerializer
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
            "course_flow:program-update", kwargs={"pk": self.object.pk}
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
            "course_flow:course-update", kwargs={"pk": self.object.pk}
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
            "course_flow:activity-update", kwargs={"pk": self.object.pk}
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
        classification=node.classification,
    )
    return new_node


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


@require_POST
@ajax_login_required
@is_owner("workflowPk")
def add_strategy(request: HttpRequest) -> HttpResponse:
    strategy = Strategy.objects.get(pk=request.POST.get("strategyPk"))
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))

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
        parent_activity=activity,
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


def duplicate_component(component: Component, author: User) -> Component:
    if type(component.content_object) == Artifact:
        new_component = Component.objects.create(
            content_object=Artifact.objects.create(
                title=component.content_object.title,
                description=component.content_object.description,
                author=author,
                is_original=False,
                parent_artifact=component.content_object,
            )
        )
    elif type(component.content_object) == Preparation:
        new_component = Component.objects.create(
            content_object=Preparation.objects.create(
                title=component.content_object.title,
                description=component.content_object.description,
                author=author,
                is_original=False,
                parent_preparation=component.content_object,
            )
        )
    elif type(component.content_object) == Assessment:
        new_component = Component.objects.create(
            content_object=Assessment.objects.create(
                title=component.content_object.title,
                description=component.content_object.description,
                author=author,
                is_original=False,
                parent_assessment=component.content_object,
            )
        )
    elif type(component.content_object) == Activity:
        new_component = Component.objects.create(
            content_object=duplicate_activity(component.content_object, author)
        )
    return new_component


def duplicate_week(week: Week, author: User) -> Week:
    new_week = Week.objects.create(title=week.title, author=author)
    for componentweek in ComponentWeek.objects.filter(week=week):
        ComponentWeek.objects.create(
            week=new_week,
            component=duplicate_component(componentweek.component, author),
            rank=componentweek.rank,
        )
    return new_week


def duplicate_course(course: Course, author: User) -> Course:
    new_course = Course.objects.create(
        title=course.title,
        description=course.description,
        author=author,
        is_original=False,
        parent_course=course,
    )
    for week in course.weeks.all():
        WeekCourse.objects.create(
            course=new_course,
            week=duplicate_week(week, author),
            rank=WeekCourse.objects.get(week=week, course=course).rank,
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
def get_component_completion_status(request: HttpRequest) -> HttpResponse:

    status = ComponentCompletionStatus.objects.get(
        component=Component.objects.get(pk=request.GET.get("componentPk")),
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


@ajax_login_required
def get_component_completion_count(request: HttpRequest) -> HttpResponse:

    statuses = ComponentCompletionStatus.objects.filter(
        component=Component.objects.get(pk=request.GET.get("componentPk")),
        is_completed=True,
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


@require_POST
@ajax_login_required
@is_owner("programPk")
def add_component_to_program(request: HttpRequest) -> HttpResponse:
    component = Component.objects.get(pk=request.POST.get("componentPk"))
    program = Program.objects.get(pk=request.POST.get("programPk"))

    try:
        for link in ComponentProgram.objects.filter(program=program):
            link.rank += 1
            link.save()

        ComponentProgram.objects.create(
            program=program, component=component, rank=0
        )
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


@require_POST
@ajax_login_required
@is_parent_owner
def dialog_form_create(request: HttpRequest) -> HttpResponse:
    data = json.loads(request.POST.get("object"))
    model = json.loads(request.POST.get("objectType"))
    data["author"] = request.user.username
    if model == "program":
        del data["work_classification"], data["activity_classification"]
        serializer = ProgramSerializer(data=data)
        return save_serializer(serializer)
    parent_id = json.loads(request.POST.get("parentID"))
    is_program_level = json.loads(request.POST.get("isProgramLevelComponent"))
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
    elif model == "activity":
        del data["work_classification"], data["activity_classification"]
        data["parent_activity"] = None
        serializer = ActivitySerializer(data=data)
        if parent_id:
            week = Week.objects.get(id=parent_id)
            if serializer.is_valid():
                activity = serializer.save()
            else:
                return JsonResponse({"action": "error"})
            try:
                component = Component.objects.create(content_object=activity)
                for link in ComponentWeek.objects.filter(week=week):
                    link.rank += 1
                    link.save()
                ComponentWeek.objects.create(week=week, component=component)
            except ValidationError:
                return JsonResponse({"action": "error"})
            return JsonResponse({"action": "posted"})
    elif model == "assessment":
        del data["work_classification"], data["activity_classification"]
        data["parent_activity"] = None
        serializer = AssessmentSerializer(data=data)
        if parent_id:
            if serializer.is_valid():
                assessment = serializer.save()
            else:
                return JsonResponse({"action": "error"})
            try:
                if is_program_level:
                    program = Program.objects.get(id=parent_id)
                    component = Component.objects.create(
                        content_object=assessment
                    )
                    for link in ComponentProgram.objects.filter(
                        program=program
                    ):
                        link.rank += 1
                        link.save()
                    ComponentProgram.objects.create(
                        program=program, component=component
                    )
                else:
                    week = Week.objects.get(id=parent_id)
                    component = Component.objects.create(
                        content_object=assessment
                    )
                    for link in ComponentWeek.objects.filter(week=week):
                        link.rank += 1
                        link.save()
                    ComponentWeek.objects.create(
                        week=week, component=component
                    )
            except ValidationError:
                return JsonResponse({"action": "error"})
            return JsonResponse({"action": "posted"})
    elif model == "artifact":
        del data["work_classification"], data["activity_classification"]
        data["parent_artifact"] = None
        serializer = ArtifactSerializer(data=data)
        if parent_id:
            week = Week.objects.get(id=parent_id)
            if serializer.is_valid():
                artifact = serializer.save()
            else:
                return JsonResponse({"action": "error"})
            try:
                component = Component.objects.create(content_object=artifact)
                for link in ComponentWeek.objects.filter(week=week):
                    link.rank += 1
                    link.save()
                ComponentWeek.objects.create(week=week, component=component)
            except ValidationError:
                return JsonResponse({"action": "error"})
            return JsonResponse({"action": "posted"})
    elif model == "preparation":
        del data["work_classification"], data["activity_classification"]
        data["parent_preparation"] = None
        serializer = PreparationSerializer(data=data)
        if parent_id:
            week = Week.objects.get(id=parent_id)
            if serializer.is_valid():
                preparation = serializer.save()
            else:
                return JsonResponse({"action": "error"})
            try:
                component = Component.objects.create(
                    content_object=preparation
                )
                for link in ComponentWeek.objects.filter(week=week):
                    link.rank += 1
                    link.save()
                ComponentWeek.objects.create(week=week, component=component)
            except ValidationError:
                return JsonResponse({"action": "error"})
            return JsonResponse({"action": "posted"})
    elif model == "week":
        del data["work_classification"], data["activity_classification"]
        data["parent_week"] = None
        serializer = WeekSerializer(data=data)
        if parent_id:
            course = Course.objects.get(id=parent_id)
            if serializer.is_valid():
                week = serializer.save()
            else:
                return JsonResponse({"action": "error"})
            try:
                for link in WeekCourse.objects.filter(course=course):
                    link.rank += 1
                    link.save()
                WeekCourse.objects.create(course=course, week=week)
            except ValidationError:
                return JsonResponse({"action": "error"})
            return JsonResponse({"action": "posted"})
    elif model == "course":
        del data["work_classification"], data["activity_classification"]
        data["parent_course"] = None
        serializer = CourseSerializer(data=data)
        if parent_id:
            program = Program.objects.get(id=parent_id)
            if serializer.is_valid():
                course = serializer.save()
            else:
                return JsonResponse({"action": "error"})
            try:
                component = Component.objects.create(content_object=course)
                for link in ComponentProgram.objects.filter(program=program):
                    link.rank += 1
                    link.save()
                ComponentProgram.objects.create(
                    program=program, component=component
                )
            except ValidationError:
                return JsonResponse({"action": "error"})
            return JsonResponse({"action": "posted"})
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
