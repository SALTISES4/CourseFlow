from .models import (
    model_lookups,
    Course,
    Preparation,
    Activity,
    Assesment,
    Artifact,
    Strategy,
    Node,
    NodeStrategy,
    StrategyActivity,
    ComponentWeek,
    WeekCourse,
    Component,
    Week,
    Program,
    ComponentProgram,
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
    AssesmentSerializer,
    PreparationSerializer,
)
from .decorators import ajax_login_required, is_owner, is_parent_owner
from django.urls import reverse
from django.views.generic.edit import CreateView
from django.views.generic import DetailView, UpdateView
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.renderers import JSONRenderer
from django.http import JsonResponse
from django.db.models import Count
import json
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.contrib.auth import authenticate, login
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from .forms import RegistrationForm
from django.shortcuts import render, redirect


def registration_view(request):

    if request.method == "POST":
        form = RegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get("username")
            raw_password = form.cleaned_data.get("password1")
            user = authenticate(username=username, password=raw_password)
            login(request, user)
            return redirect("home")
    else:
        form = RegistrationForm()
    return render(request, "registration/registration.html", {"form": form})


@login_required
def home_view(request):
    context = {
        "programs": Program.objects.all(),
        "courses": Course.objects.all(),
        "activities": Activity.objects.all(),
    }
    return render(request, "course_flow_creation_distribution/home.html", context)


@ajax_login_required
def get_user_courses(request):
    return JsonResponse(
        [
            {"id": course.pk, "title": course.title}
            for course in Course.objects.filter(author=request.user)
        ]
    )


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


class ProgramDetailView(LoginRequiredMixin, DetailView):
    model = Program
    template_name = "course_flow_creation_distribution/program_detail.html"


class ProgramCreateView(LoginRequiredMixin, CreateView):
    model = Program
    fields = ["title", "description"]
    template_name = "course_flow_creation_distribution/program_create.html"

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super(ProgramCreateView, self).form_valid(form)

    def get_success_url(self):
        return reverse("program-update", kwargs={"pk": self.object.pk})


class ProgramUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Program
    fields = ["title", "description", "author"]
    template_name = "course_flow_creation_distribution/program_update.html"

    def test_func(self):
        return self.get_object().author == self.request.user

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        context["owned_components"] = Component.objects.filter(
            Q(content_type=ContentType.objects.get_for_model(Course))
            | Q(content_type=ContentType.objects.get_for_model(Assesment))
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
        return reverse("course-detail", kwargs={"pk": self.object.pk})


class CourseDetailView(LoginRequiredMixin, DetailView):
    model = Course
    template_name = "course_flow_creation_distribution/course_detail.html"


class CourseCreateView(LoginRequiredMixin, CreateView):
    model = Course
    fields = ["title", "description"]
    template_name = "course_flow_creation_distribution/course_create.html"

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super(CourseCreateView, self).form_valid(form)

    def get_success_url(self):
        return reverse("course-update", kwargs={"pk": self.object.pk})


class CourseUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Course
    fields = ["title", "description", "author"]
    template_name = "course_flow_creation_distribution/course_update.html"

    def test_func(self):
        return self.get_object().author == self.request.user

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        context["course_json"] = (
            JSONRenderer().render(CourseSerializer(self.object).data).decode("utf-8")
        )
        context["owned_components"] = Component.objects.exclude(
            content_type=ContentType.objects.get_for_model(Course)
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
        return reverse("course-detail", kwargs={"pk": self.object.pk})


class ActivityDetailView(LoginRequiredMixin, DetailView):
    model = Activity
    template_name = "course_flow_creation_distribution/activity_detail.html"


class ActivityCreateView(LoginRequiredMixin, CreateView):
    model = Activity
    fields = ["title", "description"]
    template_name = "course_flow_creation_distribution/activity_create.html"

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super(ActivityCreateView, self).form_valid(form)

    def get_success_url(self):
        return reverse("activity-update", kwargs={"pk": self.object.pk})


class ActivityUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Activity
    fields = ["title", "description", "author"]
    template_name = "course_flow_creation_distribution/activity_update.html"

    def test_func(self):
        return self.get_object().author == self.request.user

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        context["default_strategies"] = Strategy.objects.filter(default=True)
        context["default_strategy_json"] = (
            JSONRenderer()
            .render(StrategySerializer(context["default_strategies"], many=True).data)
            .decode("utf-8")
        )
        context["popular_nodes"] = (
            Node.objects.filter(is_original=True)
            .annotate(num_children=Count("node"))
            .order_by("-num_children")[:3]
        )
        context["popoular_node_json"] = (
            JSONRenderer()
            .render(NodeSerializer(context["popular_nodes"], many=True).data)
            .decode("utf-8")
        )
        return context

    def get_success_url(self):
        return reverse("activity-detail", kwargs={"pk": self.object.pk})


def save_serializer(serializer):
    if serializer:
        if serializer.is_valid():
            serializer.save()
            return JsonResponse({"action": "posted"})
        else:
            print(serializer.errors)
            return JsonResponse({"action": "error"})
    else:
        return JsonResponse({"action": "error"})


@require_POST
@ajax_login_required
@is_owner("activity")
def update_activity_json(request):
    data = json.loads(request.POST.get("json"))
    serializer = ActivitySerializer(Activity.objects.get(id=data["id"]), data=data)
    return save_serializer(serializer)


@require_POST
@ajax_login_required
@is_owner("course")
def update_course_json(request):
    data = json.loads(request.POST.get("json"))
    serializer = CourseSerializer(Course.objects.get(id=data["id"]), data=data)
    return save_serializer(serializer)


@require_POST
@ajax_login_required
@is_owner("program")
def update_program_json(request):
    data = json.loads(request.POST.get("json"))
    serializer = ProgramSerializer(Program.objects.get(id=data["id"]), data=data)
    return save_serializer(serializer)


def duplicate_node(node, author):
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
def add_node(request):
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    strategy = Strategy.objects.get(pk=request.POST.get("strategyPk"))

    try:
        for link in NodeStrategy.objects.filter(strategy=strategy):
            link.rank += 1
            link.save()

        NodeStrategy.objects.create(
            strategy=strategy, node=duplicate_node(node, request.user), rank=0
        )

    except:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


def duplicate_strategy(strategy, author):
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
@is_owner("activityPk")
def add_strategy(request):
    strategy = Strategy.objects.get(pk=request.POST.get("strategyPk"))
    activity = Activity.objects.get(pk=request.POST.get("activityPk"))

    try:
        for link in StrategyActivity.objects.filter(activity=activity):
            link.rank += 1
            link.save()

        StrategyActivity.objects.create(
            activity=activity,
            strategy=duplicate_strategy(strategy, request.user),
            rank=0,
        )
    except:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


def duplicate_component(component, author):
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
    elif type(component.content_object) == Assesment:
        new_component = Component.objects.create(
            content_object=Assesment.objects.create(
                title=component.content_object.title,
                description=component.content_object.description,
                author=author,
                is_original=False,
                parent_assesment=component.content_object,
            )
        )
    else:
        return component
    return new_component


@require_POST
@ajax_login_required
@is_owner("weekPk")
def add_component_to_course(request):
    week = Week.objects.get(pk=request.POST.get("weekPk"))
    component = Component.objects.get(pk=request.POST.get("componentPk"))

    try:
        for link in ComponentWeek.objects.filter(week=week):
            link.rank += 1
            link.save()

        ComponentWeek.objects.create(
            week=week, component=duplicate_component(component, request.user), rank=0
        )
    except:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


@require_POST
@ajax_login_required
@is_owner("programPk")
def add_component_to_program(request):
    component = Component.objects.get(pk=request.POST.get("componentPk"))
    program = Program.objects.get(pk=request.POST.get("programPk"))

    try:
        for link in ComponentProgram.objects.filter(program=program):
            link.rank += 1
            link.save()

        ComponentProgram.objects.create(
            program=program,
            component=duplicate_component(component, request.user),
            rank=0,
        )
    except:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


@require_POST
@ajax_login_required
@is_parent_owner
def dialog_form_create(request):
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
            except:
                return JsonResponse({"action": "error"})
            return JsonResponse({"action": "posted"})
    elif model == "strategy":
        del data["work_classification"], data["activity_classification"]
        data["parent_strategy"] = None
        serializer = StrategySerializer(data=data)
        if parent_id:
            activity = Activity.objects.get(id=parent_id)
            if serializer.is_valid():
                strategy = serializer.save()
            else:
                return JsonResponse({"action": "error"})
            try:
                for link in StrategyActivity.objects.filter(activity=activity):
                    link.rank += 1
                    link.save()
                StrategyActivity.objects.create(activity=activity, strategy=strategy)
            except:
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
            except:
                return JsonResponse({"action": "error"})
            return JsonResponse({"action": "posted"})
    elif model == "assesment":
        del data["work_classification"], data["activity_classification"]
        data["parent_activity"] = None
        serializer = AssesmentSerializer(data=data)
        if parent_id:
            if serializer.is_valid():
                assesment = serializer.save()
            else:
                return JsonResponse({"action": "error"})
            try:
                if is_program_level:
                    program = Program.objects.get(id=parent_id)
                    component = Component.objects.create(content_object=assesment)
                    for link in ComponentProgram.objects.filter(program=program):
                        link.rank += 1
                        link.save()
                    ComponentProgram.objects.create(
                        program=program, component=component
                    )
                else:
                    week = Week.objects.get(id=parent_id)
                    component = Component.objects.create(content_object=assesment)
                    for link in ComponentWeek.objects.filter(week=week):
                        link.rank += 1
                        link.save()
                    ComponentWeek.objects.create(week=week, component=component)
            except:
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
            except:
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
                component = Component.objects.create(content_object=preparation)
                for link in ComponentWeek.objects.filter(week=week):
                    link.rank += 1
                    link.save()
                ComponentWeek.objects.create(week=week, component=component)
            except:
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
            except:
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
                ComponentProgram.objects.create(program=program, component=component)
            except:
                return JsonResponse({"action": "error"})
            return JsonResponse({"action": "posted"})
    return save_serializer(serializer)


@require_POST
@ajax_login_required
@is_owner(False)
def dialog_form_update(request):
    data = json.loads(request.POST.get("object"))
    model = json.loads(request.POST.get("objectType"))

    serializer = serializer_lookups[model](
        model_lookups[model].objects.get(id=data["id"]), data=data
    )

    return save_serializer(serializer)


@require_POST
@ajax_login_required
@is_owner(False)
def dialog_form_delete(request):
    id = json.loads(request.POST.get("objectID"))
    model = json.loads(request.POST.get("objectType"))

    try:
        model_lookups[model].objects.get(id=id).delete()
    except:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})
