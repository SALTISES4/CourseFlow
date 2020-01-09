from .models import (
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
from django.urls import reverse
from django.views.generic.edit import CreateView
from django.views.generic import ListView, DetailView, UpdateView, DeleteView
from django.forms import ModelForm
from django.db.models import Q
from rest_framework import viewsets
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
import io
from django.http import JsonResponse
from django.db.models import Count
import uuid
import json
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q

class ActivityViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = ActivitySerializer
    renderer_classes = [JSONRenderer]
    queryset = Activity.objects.all()

class CourseViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = CourseSerializer
    renderer_classes = [JSONRenderer]
    queryset = Course.objects.all()

class ProgramViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = ProgramSerializer
    renderer_classes = [JSONRenderer]
    queryset = Program.objects.all()

class ProgramDetailView(DetailView):
    model = Program
    template_name = "course_flow_creation_distribution/program_detail.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        context["program_json"] = JSONRenderer().render(ProgramSerializer(self.object).data).decode("utf-8")
        return context

class ProgramCreateView(CreateView):
    model = Program
    fields = ["title", "description"]
    template_name = "course_flow_creation_distribution/program_create.html"

    def form_valid(self, form):
        if type(self.request.user) == "User":
            form.instance.author = self.request.user
        return super(ProgramCreateView, self).form_valid(form)

    def get_success_url(self):
        return reverse("program-update", kwargs={"pk": self.object.pk})

class ProgramUpdateView(UpdateView):
    model = Program
    fields = ["title", "description", "author"]
    template_name = "course_flow_creation_distribution/program_update.html"

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        context["program_json"] = JSONRenderer().render(ProgramSerializer(self.object).data).decode("utf-8")
        context["owned_components"] = Component.objects.filter(Q(content_type=ContentType.objects.get_for_model(Course))|Q(content_type=ContentType.objects.get_for_model(Assesment)))
        context["owned_component_json"] = JSONRenderer().render(ProgramLevelComponentSerializer(context["owned_components"], many=True).data).decode("utf-8")
        return context

    def get_success_url(self):
        return reverse("course-detail", kwargs={"pk": self.object.pk})


class CourseDetailView(DetailView):
    model = Course
    template_name = "course_flow_creation_distribution/course_detail.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        context["course_json"] = JSONRenderer().render(CourseSerializer(self.object).data).decode("utf-8")
        return context


class CourseUpdateView(UpdateView):
    model = Course
    fields = ["title", "description", "author"]
    template_name = "course_flow_creation_distribution/course_update.html"

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        context["course_json"] = JSONRenderer().render(CourseSerializer(self.object).data).decode("utf-8")
        context["owned_components"] = Component.objects.exclude(content_type=ContentType.objects.get_for_model(Course))
        context["owned_component_json"] = JSONRenderer().render(WeekLevelComponentSerializer(context["owned_components"], many=True).data).decode("utf-8")
        return context

    def get_success_url(self):
        return reverse("course-detail", kwargs={"pk": self.object.pk})

class ActivityDetailView(DetailView):
    model = Activity
    template_name = "course_flow_creation_distribution/activity_detail.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        context["activity_json"] = JSONRenderer().render(ActivitySerializer(self.object).data).decode("utf-8")
        return context

class ActivityUpdateView(UpdateView):
    model = Activity
    fields = ["title", "description", "author"]
    template_name = "course_flow_creation_distribution/activity_update.html"

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        context["default_strategies"] = Strategy.objects.filter(default=True)
        context["default_strategy_json"] = JSONRenderer().render(StrategySerializer(context["default_strategies"], many=True).data).decode("utf-8")
        context["popular_nodes"] = Node.objects.filter(is_original=True).annotate(num_children=Count('node')).order_by('-num_children')[:3]
        context["popoular_node_json"] = JSONRenderer().render(NodeSerializer(context["popular_nodes"], many=True).data).decode("utf-8")
        return context

    def get_success_url(self):
        return reverse("activity-detail", kwargs={"pk": self.object.pk})

def save_serializer(serializer):
    if serializer:
        if serializer.is_valid():
            serializer.save()
            return JsonResponse({"action": "posted"})
        else:
            return JsonResponse({"action": "error"})
    else:
        return JsonResponse({"action": "error"})

def update_activity_json(request):
    data = json.loads(request.POST.get("json"))
    serializer = ActivitySerializer(Activity.objects.get(id=data['id']), data=data)
    return save_serializer(serializer)

def update_course_json(request):
    data = json.loads(request.POST.get("json"))
    serializer = CourseSerializer(Course.objects.get(id=data['id']), data=data)
    return save_serializer(serializer)

def update_program_json(request):
    data = json.loads(request.POST.get("json"))
    serializer = ProgramSerializer(Program.objects.get(id=data['id']), data=data)
    return save_serializer(serializer)

def duplicate_node(node):
    new_node = Node.objects.create(title=node.title,
        description=node.description,
        is_original=False,
        parent_node=node,
        work_classification=node.work_classification,
        activity_classification=node.activity_classification,
        classification=node.classification,
    )
    return new_node

def add_node(request):
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    strategy = Strategy.objects.get(pk=request.POST.get("strategyPk"))

    NodeStrategy.objects.create(
        strategy=strategy,
        node=duplicate_node(node),
        rank=strategy.nodestrategy_set.order_by("-rank").first().rank + 1
    )

    activity = Activity.objects.get(pk=request.POST.get("activityPk"))

    return JsonResponse(JSONRenderer().render(ActivitySerializer(activity).data).decode("utf-8"), safe=False)

def duplicate_strategy(strategy):
    new_strategy = Strategy.objects.create(title=strategy.title, description=strategy.description, is_original=False, parent_strategy=strategy)
    for node in strategy.nodes.all():
        NodeStrategy.objects.create(
            strategy=new_strategy,
            node=duplicate_node(node),
            rank=NodeStrategy.objects.get(node=node, strategy=strategy).rank,
        )
    return new_strategy

def add_strategy(request):
    strategy = Strategy.objects.get(pk=request.POST.get("strategyPk"))
    activity = Activity.objects.get(pk=request.POST.get("activityPk"))

    StrategyActivity.objects.create(
        activity=activity,
        strategy=duplicate_strategy(strategy),
        rank=(activity.strategyactivity_set.order_by("-rank").first().rank if activity.strategyactivity_set else -1) + 1
    )

    activity = Activity.objects.get(pk=request.POST.get("activityPk"))

    return JsonResponse(JSONRenderer().render(ActivitySerializer(activity).data).decode("utf-8"), safe=False)

def duplicate_component_course_level(component):
    if type(component.content_object) == Activity:
        new_component = Component.objects.create(content_object=Activity.objects.create(title=component.content_object.title, description=component.content_object.description, is_original=False, parent_activity=component.content_object))
        for strategy in component.content_object.strategies.all():
            StrategyActivity.objects.create(
                activity=new_component.content_object,
                strategy=duplicate_strategy(strategy),
                rank=StrategyActivity.objects.get(strategy=strategy, activity=component.content_object).rank,
            )
    elif type(component.content_object) == Preparation:
        new_component = Component.objects.create(content_object=Preparation.objects.create(title=component.content_object.title, description=component.content_object.description, is_original=False, parent_preparation=component.content_object))
    elif type(component.content_object) == Assesment:
        new_component = Component.objects.create(content_object=Assesment.objects.create(title=component.content_object.title, description=component.content_object.description, is_original=False, parent_assesment=component.content_object))
    else:
        new_component = Component.objects.create(content_object=Artifact.objects.create(title=component.content_object.title, description=component.content_object.description, is_original=False, parent_artifact=component.content_object))
    return new_component

def add_component_to_course(request):
    week = Week.objects.get(pk=request.POST.get("weekPk"))
    component = Component.objects.get(pk=request.POST.get("componentPk"))

    ComponentWeek.objects.create(
        week=week,
        component=duplicate_component_course_level(component),
        rank=(week.componentweek_set.order_by("-rank").first().rank if week.componentweek_set else -1) + 1,
    )

    course = Course.objects.get(pk=request.POST.get("coursePk"))

    return JsonResponse(JSONRenderer().render(CourseSerializer(course).data).decode("utf-8"), safe=False)

def duplicate_week(week):
    new_week = Week.objects.create(title=week.title)
    for component in week.compmonents.all():
        ComponentWeek.objects.create(
            week=new_week,
            component=duplicate_component_course_level(component),
            rank=ComponentWeek.objects.get(week=week, component=component).rank,
        )
    return new_strategy

def duplicate_component_program_level(component):
    if type(component.content_object) == Assesment:
        new_component = Component.objects.create(content_object=Assesment.objects.create(title=component.content_object.title, description=component.content_object.description, is_original=False, parent_assesment=component.content_object))
    else:
        new_component = Component.objects.create(content_object=Course.objects.create(title=component.content_object.title, description=component.content_object.description, is_original=False, parent_course=component.content_object))
        for week in component.content_object.weeks.all():
            WeekCourse.objects.create(
                course=new_component.content_object,
                week=duplicate_week(week),
                rank=WeekCourse.objects.get(week=week, course=component.content_object).rank,
            )
    return new_component

def add_component_to_program(request):
    component = Component.objects.get(pk=request.POST.get("componentPk"))
    program = Program.objects.get(pk=request.POST.get("programPk"))

    ComponentProgram.objects.create(
        program=program,
        component=duplicate_component_program_level(component),
        rank=(program.componentprogram_set.order_by("-rank").first().rank if program.componentprogram_set else -1) + 1,
    )

    return JsonResponse(JSONRenderer().render(ProgramSerializer(program).data).decode("utf-8"), safe=False)

def dialog_form_create(request):
    data = json.loads(request.POST.get("object"))
    model = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))

    if model == "node":
        del data["componentType"]
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
            for link in NodeStrategy.objects.filter(strategy=strategy):
                link.rank += 1
                link.save()
            NodeStrategy.objects.create(strategy=strategy, node=node)
            return JsonResponse({"action": "posted"})
    elif model == "strategy":
        del data["componentType"], data["work_classification"], data["activity_classification"]
        data["parent_strategy"] = None
        serializer = StrategySerializer(data=data)
        if parent_id:
            activity = Activity.objects.get(id=parent_id)
            if serializer.is_valid():
                strategy = serializer.save()
            else:
                print(serializer.errors)
                return JsonResponse({"action": "error"})
            for link in StrategyActivity.objects.filter(activity=activity):
                link.rank += 1
                link.save()
            StrategyActivity.objects.create(activity=activity, strategy=strategy)
            return JsonResponse({"action": "posted"})
    elif model == "activity":
        serializer = ActivitySerializer(data=data)
    elif model == "assesment":
        serializer = AssesmentSerializer(data=data)
    elif model == "artifact":
        serializer = ArtifactSerializer(data=data)
    elif model == "preparation":
        serializer = PreparationSerializer(data=data)
    elif model == "week":
        serializer = WeekSerializer(data=data)
    elif model == "course":
        serializer = CourseSerializer(data=data)
    elif model == "program":
        serializer = ProgramSerializer(data=data)
    return save_serializer(serializer)


    del data["componentType"], data["work_classification"], data["activity_classification"]

def dialog_form_update(request):
    data = json.loads(request.POST.get("object"))
    model = json.loads(request.POST.get("objectType"))

    if model == "node":
        serializer = NodeSerializer(Node.objects.get(id=data['id']), data=data)
    elif model == "strategy":
        serializer = StrategySerializer(Strategy.objects.get(id=data['id']), data=data)
    elif model == "activity":
        serializer = ActivitySerializer(Activity.objects.get(id=data['id']), data=data)
    elif model == "assesment":
        serializer = AssesmentSerializer(Assesment.objects.get(id=data['id']), data=data)
    elif model == "artifact":
        serializer = ArtifactSerializer(Artifact.objects.get(id=data['id']), data=data)
    elif model == "preparation":
        serializer = PreparationSerializer(Preparation.objects.get(id=data['id']), data=data)
    elif model == "week":
        serializer = WeekSerializer(Week.objects.get(id=data['id']), data=data)
    elif model == "course":
        serializer = CourseSerializer(Course.objects.get(id=data['id']), data=data)
    elif model == "program":
        serializer = ProgramSerializer(Program.objects.get(id=data['id']), data=data)
    return save_serializer(serializer)


def dialog_form_delete(request):
    id = json.loads(request.POST.get("objectID"))
    model = json.loads(request.POST.get("objectType"))

    try:
        if model == "node":
            Node.objects.filter(id=id).delete()
        elif model == "strategy":
            Strategy.objects.filter(id=id).delete()
        elif model == "activity":
            Activity.objects.filter(id=id).delete()
        elif model == "component":
            Component.objects.filter(id=id).delete()
        elif model == "week":
            Week.objects.filter(id=id).delete()
        elif model == "course":
            Course.objects.filter(id=id).delete()
        elif model == "program":
            Program.objects.filter(id=id).delete()
    except:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})
