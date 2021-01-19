from .models import (
    User,
    Project,
    Course,
    Column,
    ColumnWorkflow,
    Workflow,
    Activity,
    Week,
    Node,
    NodeLink,
    NodeWeek,
    WeekWorkflow,
    Program,
    NodeCompletionStatus,
    WorkflowProject,
    OutcomeProject,
    Outcome,
    OutcomeOutcome,
    OutcomeNode,
)
from .serializers import (
    serializer_lookups,
    serializer_lookups_shallow,
    ActivitySerializer,
    CourseSerializer,
    WeekSerializer,
    NodeSerializer,
    ProgramSerializer,
    WorkflowSerializer,
    WorkflowSerializerShallow,
    CourseSerializerShallow,
    ActivitySerializerShallow,
    ProgramSerializerShallow,
    WeekWorkflowSerializerShallow,
    WeekSerializerShallow,
    NodeWeekSerializerShallow,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    ColumnWorkflowSerializerShallow,
    ColumnSerializerShallow,
    WorkflowSerializerFinder,
    ProjectSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeProjectSerializerShallow,
)
from .decorators import (
    ajax_login_required,
    is_owner,
    is_parent_owner,
    is_throughmodel_parent_owner,
    new_parent_authorship,
)
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
from django.core.exceptions import ValidationError, ObjectDoesNotExist
import math
from .utils import get_model_from_str, get_parent_model_str, get_parent_model


class OwnerOrPublishedMixin(UserPassesTestMixin):
    def test_func(self):
        return Group.objects.get(
            name=settings.TEACHER_GROUP
        ) in self.request.user.groups.all() and (
            self.get_object().author == self.request.user
            or self.get_object().published
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


def get_all_outcomes(outcome,search_depth):
    if search_depth>10: return;
    outcomes=[outcome]
    for child_link in outcome.child_outcome_links.all():
        outcomes+=get_all_outcomes(child_link.child,search_depth+1)
    return outcomes

def get_project_data_package(user):
    data_package = {
        "owned_projects": {
            "title": "Your Projects",
            "sections": [
                {
                    "title": "Add a Project",
                    "object_type": "project",
                    "objects": ProjectSerializerShallow(
                        Project.objects.filter(author=user), many=True
                    ).data,
                }
            ],
            "add": True,
        },
        "other_projects": {
            "title": "Published Projects",
            "sections": [
                {
                    "title": "Published Projects",
                    "object_type": "project",
                    "objects": ProjectSerializerShallow(
                        Project.objects.filter(published=True).exclude(
                            author=user
                        ),
                        many=True,
                    ).data,
                }
            ],
        },
    }
    return data_package


def get_workflow_data_package(user, project, type_filter):
    this_project_sections = []
    other_project_sections = []
    all_published_sections = []
    if type_filter is None:
        this_project_sections.append(
            {
                "title": "Programs",
                "object_type": "program",
                "objects": ProgramSerializerShallow(
                    Program.objects.filter(project=project), many=True
                ).data,
            }
        )
        other_project_sections.append(
            {
                "title": "Programs",
                "object_type": "program",
                "objects": ProgramSerializerShallow(
                    Program.objects.filter(author=user).exclude(
                        project=project
                    ),
                    many=True,
                ).data,
            }
        )
        all_published_sections.append(
            {
                "title": "Programs",
                "object_type": "program",
                "objects": ProgramSerializerShallow(
                    Program.objects.filter(published=True)
                    .exclude(author=user)
                    .exclude(project=project),
                    many=True,
                ).data,
            }
        )
    if type_filter is None or type_filter == 1:
        this_project_sections.append(
            {
                "title": "Courses",
                "object_type": "course",
                "objects": CourseSerializerShallow(
                    Course.objects.filter(project=project), many=True
                ).data,
            }
        )
        other_project_sections.append(
            {
                "title": "Courses",
                "object_type": "course",
                "objects": CourseSerializerShallow(
                    Course.objects.filter(author=user).exclude(
                        project=project
                    ),
                    many=True,
                ).data,
            }
        )
        all_published_sections.append(
            {
                "title": "Courses",
                "object_type": "course",
                "objects": CourseSerializerShallow(
                    Course.objects.filter(published=True)
                    .exclude(author=user)
                    .exclude(project=project),
                    many=True,
                ).data,
            }
        )

    if type_filter is None or type_filter == 0:
        this_project_sections.append(
            {
                "title": "Activities",
                "object_type": "activity",
                "objects": ActivitySerializerShallow(
                    Activity.objects.filter(project=project), many=True
                ).data,
            }
        )
        other_project_sections.append(
            {
                "title": "Activities",
                "object_type": "activity",
                "objects": ActivitySerializerShallow(
                    Activity.objects.filter(author=user).exclude(
                        project=project
                    ),
                    many=True,
                ).data,
            }
        )
        all_published_sections.append(
            {
                "title": "Activities",
                "object_type": "activity",
                "objects": ActivitySerializerShallow(
                    Activity.objects.filter(published=True)
                    .exclude(author=user)
                    .exclude(project=project),
                    many=True,
                ).data,
            }
        )
        
    if type_filter is None:
        this_project_sections.append(
            {
                "title": "Outcomes",
                "object_type": "outcome",
                "objects": OutcomeSerializerShallow(
                    Outcome.objects.filter(project=project), many=True
                ).data,
            }
        )
        other_project_sections.append(
            {
                "title": "Outcomes",
                "object_type": "outcome",
                "objects": OutcomeSerializerShallow(
                    Outcome.objects.filter(author=user).exclude(
                        project=project
                    ),
                    many=True,
                ).data,
            }
        )
        all_published_sections.append(
            {
                "title": "Outcomes",
                "object_type": "outcome",
                "objects": OutcomeSerializerShallow(
                    Outcome.objects.filter(published=True)
                    .exclude(author=user)
                    .exclude(project=project),
                    many=True,
                ).data,
            }
        )

    data_package = {
        "current_project": {
            "title": "This Project",
            "sections": this_project_sections,
            "add": (project.author == user),
        },
        "other_projects": {
            "title": "From Your Other Projects",
            "sections": other_project_sections,
        },
        "all_published": {
            "title": "All Published Workflows",
            "sections": all_published_sections,
        },
    }
    return data_package


@login_required
def home_view(request):
    context = {
        "project_data_package": JSONRenderer()
        .render(get_project_data_package(request.user))
        .decode("utf-8")
    }
    return render(request, "course_flow/home.html", context)


class ProjectCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
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


class ProjectDetailView(LoginRequiredMixin, OwnerOrPublishedMixin, DetailView):
    model = Project
    fields = ["title", "description", "published"]
    template_name = "course_flow/project_detail.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        project = self.object
        context["workflow_data_package"] = (
            JSONRenderer()
            .render(
                get_workflow_data_package(self.request.user, project, None)
            )
            .decode("utf-8")
        )
        context["project_data"] = (
            JSONRenderer()
            .render(ProjectSerializerShallow(project).data)
            .decode("utf-8")
        )

        return context


class ProjectUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Project
    fields = ["title", "description", "published"]
    template_name = "course_flow/project_update.html"

    def test_func(self):
        return self.get_object().author == self.request.user

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        project = self.object
        context["workflow_data_package"] = (
            JSONRenderer()
            .render(
                get_workflow_data_package(self.request.user, project, None)
            )
            .decode("utf-8")
        )
        context["project_data"] = (
            JSONRenderer()
            .render(ProjectSerializerShallow(project).data)
            .decode("utf-8")
        )

        return context


class OutcomeCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Outcome
    fields = ["title"]
    template_name = "course_flow/outcome_create.html"

    def test_func(self):
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
            and project.author == self.request.user
        )

    def form_valid(self, form):
        form.instance.author = self.request.user
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        response = super(CreateView, self).form_valid(form)
        OutcomeProject.objects.create(project=project, outcome=form.instance)
        form.instance.published = project.published
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:outcome-update", kwargs={"pk": self.object.pk}
        )


    
class OutcomeDetailView(LoginRequiredMixin, OwnerOrPublishedMixin, DetailView):
    model = Outcome
    fields = ["title", "description","published"]
    template_name = "course_flow/outcome_detail.html"

    
    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        outcome = self.object
        outcomes = get_all_outcomes(outcome,0)
        outcomeoutcomes=[]
        for oc in outcomes:
            outcomeoutcomes+=list(oc.child_outcome_links.all())
        
        parent_project_pk = OutcomeProject.objects.get(
            outcome=outcome
        ).project.pk
        
        data_flat = {
            "outcome":OutcomeSerializerShallow(outcomes,many=True).data,
            "outcomeoutcome":OutcomeOutcomeSerializerShallow(outcomeoutcomes,many=True).data
        }
        context["data_flat"] = JSONRenderer().render(data_flat).decode("utf-8")
        context["parent_project_pk"] = (
            JSONRenderer().render(parent_project_pk).decode("utf-8")
        )
        
        
        
        return context


class OutcomeUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Outcome
    fields = ["title", "description","published"]
    template_name = "course_flow/outcome_update.html"
    
    def test_func(self):
        return self.get_object().author == self.request.user
    
    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        outcome = self.object
        outcomes = get_all_outcomes(outcome,0)
        outcomeoutcomes=[]
        for oc in outcomes:
            outcomeoutcomes+=list(oc.child_outcome_links.all())
        
        parent_project_pk = OutcomeProject.objects.get(
            outcome=outcome
        ).project.pk
        
        data_flat = {
            "outcome":OutcomeSerializerShallow(outcomes,many=True).data,
            "outcomeoutcome":OutcomeOutcomeSerializerShallow(outcomeoutcomes,many=True).data
            
        }
        context["data_flat"] = JSONRenderer().render(data_flat).decode("utf-8")
        context["parent_project_pk"] = (
            JSONRenderer().render(parent_project_pk).decode("utf-8")
        )
        
        
        
        return context

    
    
class WorkflowUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Workflow
    fields = ["title", "description"]
    template_name = "course_flow/workflow_update.html"

    def get_queryset(self):
        return self.model.objects.select_subclasses()

    def get_object(self):
        workflow = super().get_object()
        return Workflow.objects.get_subclass(pk=workflow.pk)

    def test_func(self):
        return self.get_object().author == self.request.user

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-detail", kwargs={"pk": self.object.pk}
        )

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        workflow = self.get_object()
        project = WorkflowProject.objects.get(
            workflow=workflow
        ).project
        SerializerClass = serializer_lookups_shallow[workflow.type]
        columnworkflows = workflow.columnworkflow_set.all()
        weekworkflows = workflow.weekworkflow_set.all()
        columns = workflow.columns.all()
        weeks = workflow.weeks.all()
        nodeweeks = NodeWeek.objects.filter(week__in=weeks)
        nodes = Node.objects.filter(
            pk__in=nodeweeks.values_list("node__pk", flat=True)
        )
        nodelinks = NodeLink.objects.filter(source_node__in=nodes)
        outcomeprojects = project.outcomeproject_set.all()
        base_outcomes = project.outcomes.all()
        outcomes = []
        for oc in base_outcomes:
            outcomes+= get_all_outcomes(oc,0)
        outcomeoutcomes=[]
        for oc in outcomes:
            outcomeoutcomes+=list(oc.child_outcome_links.all())
        outcomenodes = OutcomeNode.objects.filter(node__in=nodes)
        column_choices = [
            {"type": choice[0], "name": choice[1]}
            for choice in Column._meta.get_field("column_type").choices
        ]
        context_choices = [
            {"type": choice[0], "name": choice[1]}
            for choice in Node._meta.get_field(
                "context_classification"
            ).choices
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
        parent_project_pk = project.pk

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
            "nodeweek": NodeWeekSerializerShallow(
                nodeweeks, many=True
            ).data,
            "node": NodeSerializerShallow(nodes, many=True).data,
            "nodelink": NodeLinkSerializerShallow(nodelinks, many=True).data,
            "outcome": OutcomeSerializerShallow(outcomes, many=True).data,
            "outcomeoutcome": OutcomeOutcomeSerializerShallow(outcomeoutcomes,many=True).data,
            "outcomenode": OutcomeNodeSerializerShallow(outcomenodes,many=True).data,
            "outcomeproject": OutcomeProjectSerializerShallow(outcomeprojects,many=True).data
        }

        context["data_flat"] = JSONRenderer().render(data_flat).decode("utf-8")
        context["column_choices"] = (
            JSONRenderer().render(column_choices).decode("utf-8")
        )
        context["context_choices"] = (
            JSONRenderer().render(context_choices).decode("utf-8")
        )
        context["task_choices"] = (
            JSONRenderer().render(task_choices).decode("utf-8")
        )
        context["time_choices"] = (
            JSONRenderer().render(time_choices).decode("utf-8")
        )
        context["outcome_type_choices"] = (
            JSONRenderer().render(outcome_type_choices).decode("utf-8")
        )
        context["outcome_sort_choices"] = (
            JSONRenderer().render(outcome_sort_choices).decode("utf-8")
        )
        context["parent_project_pk"] = (
            JSONRenderer().render(parent_project_pk).decode("utf-8")
        )
        return context


class WorkflowDetailView(
    LoginRequiredMixin, OwnerOrPublishedMixin, DetailView
):
    model = Workflow
    fields = ["title", "description"]
    template_name = "course_flow/workflow_detail.html"

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
        project = WorkflowProject.objects.get(
            workflow=workflow
        ).project
        SerializerClass = serializer_lookups_shallow[workflow.type]
        columnworkflows = workflow.columnworkflow_set.all()
        weekworkflows = workflow.weekworkflow_set.all()
        columns = workflow.columns.all()
        weeks = workflow.weeks.all()
        nodeweeks = NodeWeek.objects.filter(week__in=weeks)
        nodes = Node.objects.filter(
            pk__in=nodeweeks.values_list("node__pk", flat=True)
        )
        nodelinks = NodeLink.objects.filter(source_node__in=nodes)
        outcomeprojects = project.outcomeproject_set.all()
        base_outcomes = project.outcomes.all()
        outcomes = []
        for oc in base_outcomes:
            outcomes+= get_all_outcomes(oc,0)
        outcomeoutcomes=[]
        for oc in outcomes:
            outcomeoutcomes+=list(oc.child_outcome_links.all())
        outcomenodes = OutcomeNode.objects.filter(node__in=nodes)
        column_choices = [
            {"type": choice[0], "name": choice[1]}
            for choice in Column._meta.get_field("column_type").choices
        ]
        context_choices = [
            {"type": choice[0], "name": choice[1]}
            for choice in Node._meta.get_field(
                "context_classification"
            ).choices
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
        parent_project_pk = project.pk

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
            "nodeweek": NodeWeekSerializerShallow(
                nodeweeks, many=True
            ).data,
            "node": NodeSerializerShallow(nodes, many=True).data,
            "nodelink": NodeLinkSerializerShallow(nodelinks, many=True).data,
            "outcome": OutcomeSerializerShallow(outcomes, many=True).data,
            "outcomeoutcome": OutcomeOutcomeSerializerShallow(outcomeoutcomes,many=True).data,
            "outcomenode": OutcomeNodeSerializerShallow(outcomenodes,many=True).data,
            "outcomeproject": OutcomeProjectSerializerShallow(outcomeprojects,many=True).data
        }

        context["data_flat"] = JSONRenderer().render(data_flat).decode("utf-8")
        context["column_choices"] = (
            JSONRenderer().render(column_choices).decode("utf-8")
        )
        context["context_choices"] = (
            JSONRenderer().render(context_choices).decode("utf-8")
        )
        context["task_choices"] = (
            JSONRenderer().render(task_choices).decode("utf-8")
        )
        context["time_choices"] = (
            JSONRenderer().render(time_choices).decode("utf-8")
        )
        context["outcome_type_choices"] = (
            JSONRenderer().render(outcome_type_choices).decode("utf-8")
        )
        context["outcome_sort_choices"] = (
            JSONRenderer().render(outcome_sort_choices).decode("utf-8")
        )
        context["parent_project_pk"] = (
            JSONRenderer().render(parent_project_pk).decode("utf-8")
        )
        return context


class WorkflowViewSet(
    LoginRequiredMixin, OwnerOrPublishedMixin, viewsets.ReadOnlyModelViewSet
):
    serializer_class = WorkflowSerializerFinder
    renderer_classes = [JSONRenderer]
    queryset = Workflow.objects.select_subclasses()


class WeekWorkflowViewSet(
    LoginRequiredMixin, viewsets.ReadOnlyModelViewSet
):
    serializer_class = WeekWorkflowSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = WeekWorkflow.objects.all()


class WeekViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = WeekSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = Week.objects.all()


class NodeWeekViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = NodeWeekSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = NodeWeek.objects.all()


class NodeViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = NodeSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = Node.objects.all()


class NodeLinkViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = NodeLinkSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = NodeLink.objects.all()


class ColumnWorkflowViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ColumnWorkflowSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = ColumnWorkflow.objects.all()


class ColumnViewSet(LoginRequiredMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ColumnSerializerShallow
    renderer_classes = [JSONRenderer]
    queryset = Column.objects.all()


class ActivityViewSet(
    LoginRequiredMixin, OwnerOrPublishedMixin, viewsets.ReadOnlyModelViewSet
):
    serializer_class = ActivitySerializer
    renderer_classes = [JSONRenderer]
    queryset = Activity.objects.all()


class CourseViewSet(
    LoginRequiredMixin, OwnerOrPublishedMixin, viewsets.ReadOnlyModelViewSet
):
    serializer_class = CourseSerializer
    renderer_classes = [JSONRenderer]
    queryset = Course.objects.all()


class ProgramViewSet(
    LoginRequiredMixin, OwnerOrPublishedMixin, viewsets.ReadOnlyModelViewSet
):
    serializer_class = ProgramSerializer
    renderer_classes = [JSONRenderer]
    queryset = Program.objects.all()


class ProgramDetailView(LoginRequiredMixin, OwnerOrPublishedMixin, DetailView):
    model = Program
    template_name = "course_flow/program_detail.html"


class ProgramCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Program
    fields = ["title", "description"]
    template_name = "course_flow/program_create.html"

    def test_func(self):
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
            and project.author == self.request.user
        )

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


class CourseDetailView(LoginRequiredMixin, OwnerOrPublishedMixin, DetailView):
    model = Course
    template_name = "course_flow/course_detail.html"


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
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
            and project.author == self.request.user
        )

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


class ActivityDetailView(
    LoginRequiredMixin, OwnerOrPublishedMixin, DetailView
):
    model = Activity
    template_name = "course_flow/activity_detail.html"


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
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
            and project.author == self.request.user
        )

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


# Called when a node is added from the sidebar (duplicated)
@login_required
@ajax_login_required
@is_owner("weekPk")
def add_node(request: HttpRequest) -> HttpResponse:
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    week = Week.objects.get(pk=request.POST.get("weekPk"))

    try:
        for link in NodeWeek.objects.filter(week=week):
            link.rank += 1
            link.save()

        NodeWeek.objects.create(
            week=week, node=duplicate_node(node, request.user), rank=0
        )

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


# Called when a week is added from the sidebar (duplicated)
@require_POST
@ajax_login_required
@is_owner("workflowPk")
def add_week(request: HttpRequest) -> HttpResponse:
    week = Week.objects.get(pk=request.POST.get("weekPk"))
    workflow = Workflow.objects.get_subclass(pk=request.POST.get("workflowPk"))

    try:
        for link in WeekWorkflow.objects.filter(workflow=workflow):
            link.rank += 1
            link.save()

        WeekWorkflow.objects.create(
            workflow=workflow,
            week=duplicate_week(week, request.user),
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
    for week in activity.weeks.all():
        WeekWorkflow.objects.create(
            activity=new_activity,
            week=duplicate_week(week, author),
            rank=WeekWorkflow.objects.get(
                workflow=activity, week=week
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
    for week in course.weeks.all():
        WeekWorkflow.objects.create(
            workflow=new_course,
            week=duplicate_week(week, author),
            rank=WeekWorkflow.objects.get(
                week=week, workflow=workflow
            ).rank,
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
            for week in activity.weeks.all():
                for node in week.nodes.all():
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
            for week in activity.weeks.all():
                for node in week.nodes.all():
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
            for week in activity.weeks.all():
                for node in week.nodes.all():
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


"""
Contextual information methods
"""


@require_POST
@ajax_login_required
@is_owner("nodePk")
def get_possible_linked_workflows(request: HttpRequest) -> HttpResponse:
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    try:
        project = (
            node.week_set.first().workflow_set.first().project_set.first()
        )
        data_package = get_workflow_data_package(
            request.user, project, node.node_type - 1
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {"action": "posted", "data_package": data_package, "node_id": node.id}
    )


@require_POST
@ajax_login_required
def get_flat_workflow(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get_subclass(pk=request.POST.get("workflowPk"))
    try:
        SerializerClass = serializer_lookups_shallow[workflow.type]
        columnworkflows = workflow.columnworkflow_set.all()
        weekworkflows = workflow.weekworkflow_set.all()
        columns = workflow.columns.all()
        weeks = workflow.weeks.all()
        nodeweeks = NodeWeek.objects.filter(week__in=weeks)
        nodes = Node.objects.filter(
            pk__in=nodeweeks.values_list("node__pk", flat=True)
        )

        response = {
            "workflow": SerializerClass(workflow).data,
            "columnworkflows": ColumnWorkflowSerializerShallow(
                columnworkflows, many=True
            ).data,
            "columns": ColumnSerializerShallow(columns, many=True).data,
            "weekworkflows": WeekWorkflowSerializerShallow(
                weekworkflows, many=True
            ).data,
            "weeks": WeekSerializerShallow(
                weeks, many=True
            ).data,
            "nodeweeks": NodeWeekSerializerShallow(
                nodeweeks, many=True
            ).data,
            "nodes": NodeSerializerShallow(nodes, many=True).data,
        }

    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(response)


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
        parent_nodelink=nodelink,
    )

    return new_nodelink


def duplicate_node(node: Node, author: User, new_workflow: Workflow) -> Node:
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
    )
    if node.linked_workflow is not None:
        if new_workflow is not None:
            set_linked_workflow(new_node, node.linked_workflow)
        else:
            new_node.linked_workflow = node.linked_workflow

    return new_node


def duplicate_week(
    week: Week, author: User, new_workflow: Workflow
) -> Week:
    new_week = Week.objects.create(
        title=week.title,
        description=week.description,
        author=author,
        is_original=False,
        parent_week=week,
        week_type=week.week_type,
    )

    for node in week.nodes.all():
        NodeWeek.objects.create(
            node=duplicate_node(node, author, new_workflow),
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
    )

    return new_column


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
            week=duplicate_week(week, author, new_workflow),
            workflow=new_workflow,
            rank=WeekWorkflow.objects.get(
                week=week, workflow=workflow
            ).rank,
        )

    # Handle all the nodelinks. These need to be handled here because they potentially span weeks
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
                            week2.nodes.get(
                                parent_node=node_link.target_node
                            ),
                        )

    return new_workflow


@require_POST
@ajax_login_required
def duplicate_workflow_ajax(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        clone = duplicate_workflow(workflow, request.user)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted", "clone_pk": workflow.pk})

def duplicate_outcome(outcome: Outcome, author: User) -> Outcome:

    new_outcome = Outcome.objects.create(
        title=outcome.title,
        description=outcome.description,
        author=author,
        is_original=False,
        parent_outcome=outcome,
        depth=outcome.depth,
    )

    for child in outcome.children.all():
        OutcomeOutcome.objects.create(
            child=duplicate_outcome(child, author),
            parent=new_outcome,
            rank=OutcomeOutcome.objects.get(
                child=child, parent=outcome
            ).rank,
        )

    return new_outcome

@require_POST
@ajax_login_required
def duplicate_outcome_ajax(request: HttpRequest) -> HttpResponse:
    outcome = Outcome.objects.get(pk=request.POST.get("outcomePk"))
    try:
        clone = duplicate_outcome(outcome, request.user)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted", "clone_pk": outcome.pk})


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
        if column_type is None:
            column_type = workflow.DEFAULT_CUSTOM_COLUMN
        column = workflow.columns.create(
            author=workflow.author,
            column_type=column_type,
            through_defaults={"rank": number_of_columns},
        )
    except ValidationError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "objectID": column.id})


@require_POST
@ajax_login_required
@is_owner("weekPk")
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
                workflow=week.workflow_set.first(),
                rank=week.workflow_set.first().columns.count(),
            )
        else:
            columnworkflow = ColumnWorkflow.objects.filter(
                workflow=WeekWorkflow.objects.get(
                    week=week
                ).workflow
            ).first()
            column = columnworkflow.column
        if column.author != week.author:
            raise ValidationError("Column and week have different authors")
        if position < 0 or position > week.nodes.count():
            position = week.nodes.count()
        node = Node.objects.create(
            author=week.author,
            node_type=week.week_type,
            column=column,
        )
        node_week = NodeWeek.objects.create(
            week=week, node=node, rank=position
        )
    except ValidationError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "new_model": NodeSerializerShallow(node).data,
            "new_through": NodeWeekSerializerShallow(node_week).data,
            "index": position,
            "parentID": week_id,
            "columnworkflow": ColumnWorkflowSerializerShallow(
                columnworkflow
            ).data,
            "column": ColumnSerializerShallow(column).data,
        }
    )


@require_POST
@ajax_login_required
@is_owner("nodePk")
def new_node_link(request: HttpRequest) -> HttpResponse:
    node_id = json.loads(request.POST.get("nodePk"))
    target_id = json.loads(request.POST.get("targetID"))
    source_port = json.loads(request.POST.get("sourcePort"))
    target_port = json.loads(request.POST.get("targetPort"))
    node = Node.objects.get(pk=node_id)
    target = Node.objects.get(pk=target_id)
    try:
        if target.author != node.author:
            raise ValidationError("Nodes have different authors")
        node_link = NodeLink.objects.create(
            author=node.author,
            source_node=node,
            target_node=target,
            source_port=source_port,
            target_port=target_port,
        )
    except ValidationError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "new_model": NodeLinkSerializerShallow(node_link).data,
        }
    )


# Add a new child to a model
@require_POST
@ajax_login_required
@is_owner(False)
def insert_child(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))

    try:
        if object_type == "outcome":
            model = Outcome.objects.get(id=object_id)
            newmodel = Outcome.objects.create(
                author=model.author, depth=model.depth+1
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

    return JsonResponse(
        {
            "action": "posted",
            "new_model": new_model_serialized,
            "new_through": new_through_serialized,
            "parentID": model.id,
        }
    )

# Add a new sibling to a through model
@require_POST
@ajax_login_required
@is_parent_owner
def insert_sibling(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))

    try:
        if object_type == "week":
            model = Week.objects.get(id=object_id)
            parent = Workflow.objects.get(id=parent_id)
            through = WeekWorkflow.objects.get(
                week=model, workflow=parent
            )
            newmodel = Week.objects.create(
                author=model.author, week_type=model.week_type
            )
            newthroughmodel = WeekWorkflow.objects.create(
                workflow=parent, week=newmodel, rank=through.rank + 1
            )
            new_model_serialized = WeekSerializerShallow(newmodel).data
            new_through_serialized = WeekWorkflowSerializerShallow(
                newthroughmodel
            ).data
        elif object_type == "node":
            model = Node.objects.get(id=object_id)
            parent = Week.objects.get(id=parent_id)
            through = NodeWeek.objects.get(node=model, week=parent)
            newmodel = Node.objects.create(
                author=model.author,
                column=model.column,
                node_type=model.node_type,
            )
            newthroughmodel = NodeWeek.objects.create(
                week=parent, node=newmodel, rank=through.rank + 1
            )
            new_model_serialized = NodeSerializerShallow(newmodel).data
            new_through_serialized = NodeWeekSerializerShallow(
                newthroughmodel
            ).data
        elif object_type == "column":
            model = Column.objects.get(id=object_id)
            parent = Workflow.objects.get(id=parent_id)
            through = ColumnWorkflow.objects.get(column=model, workflow=parent)
            newmodel = Column.objects.create(
                author=model.author,
                column_type=math.floor(model.column_type / 10) * 10,
            )
            newthroughmodel = ColumnWorkflow.objects.create(
                workflow=parent, column=newmodel, rank=through.rank + 1
            )
            new_model_serialized = ColumnSerializerShallow(newmodel).data
            new_through_serialized = ColumnWorkflowSerializerShallow(
                newthroughmodel
            ).data
        elif object_type == "outcome":
            model = Outcome.objects.get(id=object_id)
            parent = Outcome.objects.get(id=parent_id)
            through = OutcomeOutcome.objects.get(
                parent=parent, child=model
            )
            newmodel = Outcome.objects.create(
                author=model.author, depth=model.depth
            )
            newthroughmodel = OutcomeOutcome.objects.create(
                parent=parent, child=newmodel, rank=through.rank + 1
            )
            new_model_serialized = OutcomeSerializerShallow(newmodel).data
            new_through_serialized = OutcomeOutcomeSerializerShallow(
                newthroughmodel
            ).data
        else:
            raise ValidationError("Uknown component type")

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "new_model": new_model_serialized,
            "new_through": new_through_serialized,
            "parentID": parent_id,
            "siblingID": through.id,
        }
    )


# Soft-duplicate the item
@require_POST
@ajax_login_required
@is_parent_owner
def duplicate_self(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))

    try:
        if object_type == "week":
            model = Week.objects.get(id=object_id)
            parent = Workflow.objects.get(id=parent_id)
            through = WeekWorkflow.objects.get(
                week=model, workflow=parent
            )
            newmodel = duplicate_week(model, model.author, None)
            newthroughmodel = WeekWorkflow.objects.create(
                workflow=parent, week=newmodel, rank=through.rank + 1
            )
            new_model_serialized = WeekSerializerShallow(newmodel).data
            new_through_serialized = WeekWorkflowSerializerShallow(
                newthroughmodel
            ).data
            new_children_serialized = NodeSerializerShallow(
                newmodel.nodes, many=True
            ).data
            new_child_through_serialized = NodeWeekSerializerShallow(
                newmodel.nodeweek_set, many=True
            ).data
        elif object_type == "node":
            model = Node.objects.get(id=object_id)
            parent = Week.objects.get(id=parent_id)
            through = NodeWeek.objects.get(node=model, week=parent)
            newmodel = duplicate_node(model, model.author, None)
            newthroughmodel = NodeWeek.objects.create(
                week=parent, node=newmodel, rank=through.rank + 1
            )
            new_model_serialized = NodeSerializerShallow(newmodel).data
            new_through_serialized = NodeWeekSerializerShallow(
                newthroughmodel
            ).data
            new_children_serialized = None
            new_child_through_serialized = None
        elif object_type == "column":
            model = Column.objects.get(id=object_id)
            parent = Workflow.objects.get(id=parent_id)
            through = ColumnWorkflow.objects.get(column=model, workflow=parent)
            newmodel = duplicate_column(model, model.author)
            newthroughmodel = ColumnWorkflow.objects.create(
                workflow=parent, column=newmodel, rank=through.rank + 1
            )
            new_model_serialized = ColumnSerializerShallow(newmodel).data
            new_through_serialized = ColumnWorkflowSerializerShallow(
                newthroughmodel
            ).data
            new_children_serialized = None
            new_child_through_serialized = None
        elif object_type == "outcome":
            model = Outcome.objects.get(id=object_id)
            parent = Outcome.objects.get(id=parent_id)
            through = OutcomeOutcome.objects.get(child=model, parent=parent)
            newmodel = duplicate_outcome(model, model.author)
            newthroughmodel = OutcomeOutcome.objects.create(
                parent=parent, child=newmodel, rank=through.rank + 1
            )
            new_model_serialized = OutcomeSerializerShallow(newmodel).data
            new_through_serialized = OutcomeOutcomeSerializerShallow(
                newthroughmodel
            ).data
            outcomes = get_all_outcomes(newmodel,0)
            outcomeoutcomes=[]
            for oc in outcomes:
                outcomeoutcomes+=list(oc.child_outcome_links.all())
            new_children_serialized = OutcomeSerializerShallow(
                outcomes[1:], many=True
            ).data
            new_child_through_serialized = OutcomeOutcomeSerializerShallow(
                outcomeoutcomes, many=True
            ).data
        else:
            raise ValidationError("Uknown component type")
    except ValidationError:
        return JsonResponse({"action": "error"})
    response = {
        "action": "posted",
        "new_model": new_model_serialized,
        "new_through": new_through_serialized,
        "parentID": parent_id,
        "siblingID": through.id,
        "children": new_children_serialized,
        "children_through": new_child_through_serialized,
    }
    return JsonResponse(response)


"""
Reorder methods
"""

# Insert a model via its throughmodel
@require_POST
@ajax_login_required
@is_throughmodel_parent_owner
@new_parent_authorship
def inserted_at(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))
    new_position = json.loads(request.POST.get("newPosition"))
    try:
        model_type = get_model_from_str(object_type)
        model = model_type.objects.get(id=object_id)
        old_position = model.rank

        parentType = get_parent_model_str(object_type)

        new_parent = get_model_from_str(parentType).objects.get(id=parent_id)

        if object_type == "nodeweek":
            parent = model.week
        elif object_type =="outcomeoutcome":
            parent = model.parent
        else:
            parent = new_parent
            
        if object_type=="outcomeoutcome":
            parentType="parent"

        new_parent_count = model_type.objects.filter(
            **{parentType: new_parent}
        ).count()
        if new_position < 0:
            new_position = 0
        if new_position > new_parent_count:
            new_position = new_parent_count - 1
        delta = new_position - old_position

        if parent.id == new_parent.id:
            if delta != 0:
                sign = int(math.copysign(1, delta))
                for out_of_order_link in model_type.objects.filter(
                    rank__gte=min(old_position + 1, new_position),
                    rank__lte=max(new_position, old_position - 1),
                    **{parentType: parent}
                ):
                    out_of_order_link.rank -= sign
                    out_of_order_link.save()
                model.rank = new_position
                model.save()

        elif parent.id != new_parent.id:

            """
            This takes advantage of signals, but the js is not compatible at the
            moment as the throughmodel id is not being updated, after calling this function.

            child = model.node
            model.delete()
            new_through_object = NodeWeek(week=new_parent, node=child, rank=new_position)
            setattr(new_through_object, parentType, new_parent)
            new_through_object.save()

            """
            for out_of_order_link in model_type.objects.filter(
                rank__gt=old_position, **{parentType: parent}
            ):
                out_of_order_link.rank -= 1
                out_of_order_link.save()
            for out_of_order_link in model_type.objects.filter(
                rank__gte=new_position, **{parentType: new_parent}
            ):
                out_of_order_link.rank += 1
                out_of_order_link.save()
            model.rank = new_position
            setattr(model, parentType, new_parent)
            if(object_type=="outcomeoutcome"):
                model.child.depth=model.parent.depth+1
                model.child.save()
            model.save()

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


# Change a node's column
@require_POST
@ajax_login_required
@is_owner("nodePk")
def change_column(request: HttpRequest) -> HttpResponse:
    node_id = json.loads(request.POST.get("nodePk"))
    new_column_id = json.loads(request.POST.get("columnID"))
    try:
        node = Node.objects.get(id=node_id)
        new_column = ColumnWorkflow.objects.get(id=new_column_id).column
        if new_column.author == node.author:
            node.column = new_column
            node.save()
        else:
            raise ValidationError("Authorship conflict")
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


# Add an outcome to a node
@require_POST
@ajax_login_required
@is_owner("nodePk")
@is_owner("outcomePk")
def add_outcome_to_node(request: HttpRequest) -> HttpResponse:
    node_id = json.loads(request.POST.get("nodePk"))
    outcome_id = json.loads(request.POST.get("outcomePk"))
    try:
        node = Node.objects.get(id=node_id)
        outcome = Outcome.objects.get(id=outcome_id)
        if OutcomeNode.objects.filter(node=node,outcome=outcome).count()>0:
            return JsonResponse({"action": "error"})
        if outcome.author == node.author:
            outcomenode = OutcomeNode.objects.create(
                outcome=outcome,
                node=node,
            )
        else:
            raise ValidationError("Authorship conflict")
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action":"posted","outcomenode": OutcomeNodeSerializerShallow(outcomenode).data})

"""
Update Methods
"""

# Updates an object's information using its serializer
@require_POST
@ajax_login_required
@is_owner(False)
def update_value(request: HttpRequest) -> HttpResponse:
    try:
        object_id = json.loads(request.POST.get("objectID"))
        object_type = json.loads(request.POST.get("objectType"))
        data = json.loads(request.POST.get("data"))
        objects = get_model_from_str(object_type).objects
        if hasattr(objects, "get_subclass"):
            object_to_update = objects.get_subclass(pk=object_id)
        else:
            object_to_update = objects.get(pk=object_id)
        serializer = serializer_lookups_shallow[object_type](
            object_to_update, data=data, partial=True
        )
        return save_serializer(serializer)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})

@require_POST
@ajax_login_required
def update_outcomenode_degree(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    degree = json.loads(request.POST.get("degree"))
    try:
        model = OutcomeNode.objects.get(pk=object_id);
        if(request.user.id != model.node.author.id or request.user.id != model.outcome.author.id):
            response = JsonResponse({"action": "error"})
            response.status_code = 401
            return response
        model.degree=degree
        model.save()
    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})

def set_linked_workflow(node: Node, workflow):
    project = (
        node.week_set.first().workflow_set.first().project_set.first()
    )
    if project.author == node.author or project.published:
        if WorkflowProject.objects.get(workflow=workflow).project == project:
            node.linked_workflow = workflow
            node.save()
        else:
            try:
                if (
                    workflow.author == node.author
                    or WorkflowProject.objects.get(
                        workflow=workflow
                    ).project.published
                ):
                    new_workflow = duplicate_workflow(workflow, node.author)
                    WorkflowProject.objects.create(
                        workflow=new_workflow, project=project
                    )
                    node.linked_workflow = new_workflow
                    node.save()
                else:
                    raise ValidationError("Project unpublished")
            except ValidationError:
                pass


# Sets the linked workflow for a node, adding it to the project if different
@require_POST
@ajax_login_required
@is_owner("nodePk")
def set_linked_workflow_ajax(request: HttpRequest) -> HttpResponse:
    try:
        node_id = json.loads(request.POST.get("nodePk"))
        workflow_id = json.loads(request.POST.get("workflowPk"))
        node = Node.objects.get(pk=node_id)
        if workflow_id == -1:
            node.linked_workflow = None
            node.represents_workflow = False
            node.save()
            linked_workflow = None
            linked_workflow_title = None
            linked_workflow_description = None
        else:
            workflow = Workflow.objects.get_subclass(pk=workflow_id)
            set_linked_workflow(node, workflow)
            if node.linked_workflow is None:
                raise ValidationError("Project could not be found")
            linked_workflow = node.linked_workflow.id
            linked_workflow_title = node.linked_workflow.title
            linked_workflow_description = node.linked_workflow.description

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "id": node_id,
            "linked_workflow": linked_workflow,
            "linked_workflow_title": linked_workflow_title,
            "linked_workflow_description": linked_workflow_description,
        }
    )


# Toggles whether or not a project is published
@require_POST
@ajax_login_required
@is_owner("projectPk")
def project_toggle_published(request: HttpRequest) -> HttpResponse:
    try:
        object_id = json.loads(request.POST.get("projectPk"))
        project = Project.objects.get(id=object_id)
        project.published = not project.published
        project.save()
        for workflow in project.workflows.all():
            workflow.published = project.published
            workflow.save()
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
        model = get_model_from_str(object_type).objects.get(id=object_id)
        model.delete()
    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})

@require_POST
@ajax_login_required
def unlink_outcome_from_node(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    try:
        model = OutcomeNode.objects.get(pk=object_id);
        if(request.user.id != model.node.author.id or request.user.id != model.outcome.author.id):
            response = JsonResponse({"action": "error"})
            response.status_code = 401
            return response
        model.delete()
    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})
