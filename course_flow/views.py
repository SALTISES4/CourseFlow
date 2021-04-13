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
    Discipline,
    Favourite,
    ObjectPermission,
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
    DisciplineSerializer,
    UserSerializer,
    InfoBoxSerializer,
    bleach_allowed_tags,
    bleach_sanitizer,
)
from .decorators import (
    ajax_login_required,
    user_can_edit,
    user_can_view,
    user_can_delete,
    user_can_view_or_none,
    user_is_teacher
)
from django.urls import reverse
from django.views.generic.edit import CreateView
from django.views.generic import DetailView, UpdateView, TemplateView, ListView
from rest_framework import viewsets
from rest_framework.renderers import JSONRenderer
from rest_framework.generics import ListAPIView
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.db.models import Count, Q
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
from functools import reduce
from itertools import chain, islice, tee
from .utils import (
    get_model_from_str,
    get_parent_model_str,
    get_parent_model,
    get_project_outcomes,
)


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

class ExploreView(LoginRequiredMixin,UserPassesTestMixin,TemplateView):

    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )
    
    template_name = "course_flow/explore.html"
    
    def get_context_data(self):
        types = self.request.GET.getlist("types[]",None)
        author = self.request.GET.get("auth",None)
        disciplines = self.request.GET.getlist("disc[]",None)
        title = self.request.GET.get("title",None)
        description = self.request.GET.get("des",None)
        sort = self.request.GET.get("sort",None)
        page = self.request.GET.get("page",1)
        results = self.request.GET.get("results",20)
        filter_kwargs = {}
        if title: filter_kwargs['title__icontains']=title
        if description: filter_kwargs['description__icontains']=description
        if author: filter_kwargs['author__username__icontains']=author
        if page:page=int(page)
        else: page=1
        if results: results=int(results)
        else: results = 10
        disciplines = Discipline.objects.filter(id__in=disciplines)
        if len(disciplines)>0:
            filter_kwargs['disciplines__in'] = disciplines
        try:
            queryset = reduce(lambda x,y: chain(x,y), [
                get_model_from_str(model_type).objects.filter(published=True).filter(depth=0,**filter_kwargs).exclude(author=self.request.user).distinct() if model_type =="outcome" else get_model_from_str(model_type).objects.filter(published=True).filter(**filter_kwargs).exclude(author=self.request.user).distinct()
                for model_type in types])
        except:
            queryset = Project.objects.none()
        total_results = 0
        subqueryset = []
        for x in queryset:
            if(total_results>=(page-1)*results and total_results<page*results):subqueryset.append(x)
            total_results=total_results+1
        page_number = math.ceil(float(total_results)/results)
        object_list = JSONRenderer().render(
            InfoBoxSerializer(subqueryset,many=True,context={'user':self.request.user}).data
        ).decode('utf-8')
        return {
            'object_list':object_list,
            'pages':JSONRenderer().render({
                'total_results':total_results,
                'page_count':page_number,
                'current_page':page,
                'results_per_page':results,
            }).decode('utf-8'),
            'disciplines':JSONRenderer().render(
                DisciplineSerializer(Discipline.objects.all(),many=True).data
            ).decode('utf-8')
        }
    
    
    
        
        
        


def get_all_outcomes(outcome, search_depth):
    if search_depth > 10:
        return
    outcomes = [outcome]
    for child_link in outcome.child_outcome_links.all():
        outcomes += get_all_outcomes(child_link.child, search_depth + 1)
    return outcomes


def get_project_data_package(user):
    data_package = {
        "owned_projects": {
            "title": "Your Projects",
            "sections": [
                {
                    "title": "Add a Project",
                    "object_type": "project",
                    "objects": InfoBoxSerializer(
                        Project.objects.filter(author=user), 
                        many=True,
                        context={'user':user},
                    ).data,
                }
            ],
            "add": True,
            "duplicate": "copy",
        },
        "owned_strategies": {
            "title": "Your Strategies",
            "sections": [
                {
                    "title": "Add an Activity-Level Strategy",
                    "object_type": "activity",
                    "objects": InfoBoxSerializer(
                        Activity.objects.filter(author=user, is_strategy=True),
                        many=True,
                        context={'user':user},
                    ).data,
                },
                {
                    "title": "Add a Course-Level Strategy",
                    "object_type": "course",
                    "objects": InfoBoxSerializer(
                        Course.objects.filter(author=user, is_strategy=True),
                        many=True,
                        context={'user':user},
                    ).data,
                },
            ],
            "add": True,
            "duplicate": "copy",
        },
        "other_projects": {
            "title": "Favourite Projects",
            "sections": [
                {
                    "title": "Your Favourite Projects",
                    "object_type": "project",
                    "objects": InfoBoxSerializer(
                        [favourite.content_object for favourite in Favourite.objects.filter(user=user,project__published=True)],
                        many=True,
                        context={'user':user},
                    ).data,
                }
            ],
            "duplicate": "import",
        },
        "other_strategies": {
            "title": "Favourite Strategies",
            "sections": [
                {
                    "title": "Your Favourite Activity-Level Strategies",
                    "object_type": "activity",
                    "objects": InfoBoxSerializer(
                        [favourite.content_object for favourite in Favourite.objects.filter(user=user,activity__published=True,activity__is_strategy=True)],
                        many=True,
                        context={'user':user},
                    ).data,
                },
                {
                    "title": "Your Favourite Course-Level Strategies",
                    "object_type": "course",
                    "objects": InfoBoxSerializer(
                        [favourite.content_object for favourite in Favourite.objects.filter(user=user,course__published=True,course__is_strategy=True)],
                        many=True,
                        context={'user':user},
                    ).data,
                },
            ],
            "duplicate": "import",
        },
    }
    return data_package


def get_workflow_data_package(user, project, type_filter, self_only):
    this_project_sections = []
    other_project_sections = []
    all_published_sections = []
    if type_filter is None:
        this_project_sections.append(
            {
                "title": "Programs",
                "object_type": "program",
                "objects": InfoBoxSerializer(
                    Program.objects.filter(project=project, is_strategy=False),
                    many=True,
                    context={'user':user},
                ).data,
            }
        )
        if not self_only: other_project_sections.append(
            {
                "title": "Programs",
                "object_type": "program",
                "objects": InfoBoxSerializer(
                    Program.objects.filter(
                        author=user, is_strategy=False
                    ).exclude(project=project),
                    many=True,
                    context={'user':user},
                ).data,
            }
        )
        if not self_only: all_published_sections.append(
            {
                "title": "Your Favourite Programs",
                "object_type": "program",
                "objects": InfoBoxSerializer(
                    [favourite.content_object for favourite in Favourite.objects.filter(user=user,program__published=True,program__is_strategy=False)],
                    many=True,
                    context={'user':user},
                ).data,
            }
        )
    if type_filter is None or type_filter == 1:
        this_project_sections.append(
            {
                "title": "Courses",
                "object_type": "course",
                "objects": InfoBoxSerializer(
                    Course.objects.filter(project=project, is_strategy=False),
                    many=True,
                    context={'user':user},
                ).data,
            }
        )
        if not self_only: other_project_sections.append(
            {
                "title": "Courses",
                "object_type": "course",
                "objects": InfoBoxSerializer(
                    Course.objects.filter(
                        author=user, is_strategy=False
                    ).exclude(project=project),
                    many=True,
                    context={'user':user},
                ).data,
            }
        )
        if not self_only: all_published_sections.append(
            {
                "title": "Your Favourite Courses",
                "object_type": "course",
                "objects": InfoBoxSerializer(
                    [favourite.content_object for favourite in Favourite.objects.filter(user=user,course__published=True,course__is_strategy=False)],
                    many=True,
                    context={'user':user},
                ).data,
            }
        )

    if type_filter is None or type_filter == 0:
        this_project_sections.append(
            {
                "title": "Activities",
                "object_type": "activity",
                "objects": InfoBoxSerializer(
                    Activity.objects.filter(
                        project=project, is_strategy=False
                    ),
                    many=True,
                    context={'user':user},
                ).data,
            }
        )
        if not self_only: other_project_sections.append(
            {
                "title": "Activities",
                "object_type": "activity",
                "objects": InfoBoxSerializer(
                    Activity.objects.filter(
                        author=user, is_strategy=False
                    ).exclude(project=project),
                    many=True,
                    context={'user':user},
                ).data,
            }
        )
        if not self_only: all_published_sections.append(
            {
                "title": "Your Favourite Activities",
                "object_type": "activity",
                "objects": InfoBoxSerializer(
                    [favourite.content_object for favourite in Favourite.objects.filter(user=user,activity__published=True,activity__is_strategy=False)],
                    many=True,
                    context={'user':user},
                ).data,
            }
        )

    if type_filter is None:
        this_project_sections.append(
            {
                "title": "Outcomes",
                "object_type": "outcome",
                "objects": InfoBoxSerializer(
                    Outcome.objects.filter(project=project),
                    many=True,
                    context={'user':user},
                ).data,
            }
        )
        if not self_only: other_project_sections.append(
            {
                "title": "Outcomes",
                "object_type": "outcome",
                "objects": InfoBoxSerializer(
                    Outcome.objects.filter(author=user)
                    .exclude(project=project)
                    .exclude(project=None),
                    many=True,
                    context={'user':user},
                ).data,
            }
        )
        if not self_only: all_published_sections.append(
            {
                "title": "Your Favourite Outcomes",
                "object_type": "outcome",
                "objects": InfoBoxSerializer(
                    [favourite.content_object for favourite in Favourite.objects.filter(user=user,outcome__published=True)],
                    many=True,
                    context={'user':user},
                ).data,
            }
        )
    if project.author == user:
        current_copy_type = "copy"
        other_copy_type = "import"
    else:
        current_copy_type = False
        other_copy_type = False

    data_package = {
        "current_project": {
            "title": "This Project",
            "sections": this_project_sections,
            "add": (project.author == user),
            "duplicate": current_copy_type,
        },
    }
    if not self_only: 
        data_package["other_projects"]={
            "title": "From Your Other Projects",
            "sections": other_project_sections,
            "duplicate": other_copy_type,
        }
        data_package["all_published"]={
            "title": "Your Favourites",
            "sections": all_published_sections,
            "duplicate": other_copy_type,
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


@login_required
def import_view(request):
    return render(request, "course_flow/import.html")


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
                get_workflow_data_package(self.request.user, project, None,False)
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
                get_workflow_data_package(self.request.user, project, None,False)
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
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:outcome-update", kwargs={"pk": self.object.pk}
        )

def get_outcome_context_data(outcome, context, user):
    outcomes = get_all_outcomes(outcome, 0)
    outcomeoutcomes = []
    for oc in outcomes:
        outcomeoutcomes += list(oc.child_outcome_links.all())

    parent_project_pk = OutcomeProject.objects.get(
        outcome=outcome
    ).project.pk

    data_flat = {
        "outcome": OutcomeSerializerShallow(outcomes, many=True).data,
        "outcomeoutcome": OutcomeOutcomeSerializerShallow(
            outcomeoutcomes, many=True
        ).data,
    }
    context["data_flat"] = JSONRenderer().render(data_flat).decode("utf-8")
    context["parent_project_pk"] = (
        JSONRenderer().render(parent_project_pk).decode("utf-8")
    )
    return context

class OutcomeDetailView(LoginRequiredMixin, OwnerOrPublishedMixin, DetailView):
    model = Outcome
    fields = ["title", "description", "published"]
    template_name = "course_flow/outcome_detail.html"

    def get_context_data(self, **kwargs):
        context = super(DetailView, self).get_context_data(**kwargs)
        context = get_outcome_context_data(self.object,context,self.request.user)

        return context


class OutcomeUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Outcome
    fields = ["title", "description", "published"]
    template_name = "course_flow/outcome_update.html"

    def test_func(self):
        return self.get_object().author == self.request.user

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        context = get_outcome_context_data(self.object,context,self.request.user)
        
        return context


def get_workflow_context_data(workflow, context, user):
    data_package={}
    if not workflow.is_strategy:
        project = WorkflowProject.objects.get(workflow=workflow).project
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
    if not workflow.is_strategy:
        outcomeprojects = project.outcomeproject_set.all()
        base_outcomes = project.outcomes.all()
        outcomes = []
        for oc in base_outcomes:
            outcomes += get_all_outcomes(oc, 0)
        outcomeoutcomes = []
        for oc in outcomes:
            outcomeoutcomes += list(oc.child_outcome_links.all())
        outcomenodes = OutcomeNode.objects.filter(node__in=nodes)
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
        "nodeweek": NodeWeekSerializerShallow(nodeweeks, many=True).data,
        "node": NodeSerializerShallow(nodes, many=True).data,
        "nodelink": NodeLinkSerializerShallow(nodelinks, many=True).data,
    }
    if not workflow.is_strategy:
        data_flat["outcome"] = OutcomeSerializerShallow(
            outcomes, many=True
        ).data
        data_flat["outcomeoutcome"] = OutcomeOutcomeSerializerShallow(
            outcomeoutcomes, many=True
        ).data
        data_flat["outcomenode"] = OutcomeNodeSerializerShallow(
            outcomenodes, many=True
        ).data
        data_flat["outcomeproject"] = OutcomeProjectSerializerShallow(
            outcomeprojects, many=True
        ).data
        if workflow.author == user:
            if workflow.type == "course":
                data_flat["strategy"] = WorkflowSerializerShallow(
                    Course.objects.filter(author=user, is_strategy=True),
                    many=True,
                ).data
                data_flat["saltise_strategy"] = WorkflowSerializerShallow(
                    Course.objects.filter(from_saltise=True, is_strategy=True),
                    many=True,
                ).data
            elif workflow.type == "activity":
                data_flat["strategy"] = WorkflowSerializerShallow(
                    Activity.objects.filter(author=user, is_strategy=True),
                    many=True,
                ).data
                data_flat["saltise_strategy"] = WorkflowSerializerShallow(
                    Activity.objects.filter(
                        from_saltise=True, is_strategy=True
                    ),
                    many=True,
                ).data

    data_package["data_flat"] = data_flat
    data_package["is_strategy"] = workflow.is_strategy
    data_package["column_choices"] = column_choices
    data_package["context_choices"] = context_choices
    data_package["task_choices"] = task_choices
    data_package["time_choices"] = time_choices
    data_package["outcome_type_choices"] = outcome_type_choices
    data_package["outcome_sort_choices"] = outcome_sort_choices
    data_package["strategy_classification_choices"] = strategy_classification_choices
    if not workflow.is_strategy:
        context["parent_project_pk"] = parent_project_pk
    context["is_strategy"] = JSONRenderer().render(workflow.is_strategy).decode("utf-8")
    context["data_package"] = JSONRenderer().render(data_package).decode("utf-8")

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

        context = get_workflow_context_data(
            workflow, context, self.request.user
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

        context = get_workflow_context_data(
            workflow, context, self.request.user
        )

        return context


class WorkflowViewSet(
    LoginRequiredMixin, OwnerOrPublishedMixin, viewsets.ReadOnlyModelViewSet
):
    serializer_class = WorkflowSerializerFinder
    renderer_classes = [JSONRenderer]
    queryset = Workflow.objects.select_subclasses()


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


# class StaticCourseDetailView(LoginRequiredMixin, DetailView):
#    model = Course
#    template_name = "course_flow/course_detail_static.html"
#
#
# class StudentCourseDetailView(LoginRequiredMixin, DetailView):
#    model = Course
#    template_name = "course_flow/course_detail_student.html"


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
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )


class CourseStrategyCreateView(
    LoginRequiredMixin, UserPassesTestMixin, CreateView
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


class ActivityDetailView(
    LoginRequiredMixin, OwnerOrPublishedMixin, DetailView
):
    model = Activity
    template_name = "course_flow/activity_detail.html"


# class StaticActivityDetailView(LoginRequiredMixin, DetailView):
#    model = Activity
#    template_name = "course_flow/activity_detail_static.html"
#
#
# class StudentActivityDetailView(LoginRequiredMixin, DetailView):
#    model = Activity
#    template_name = "course_flow/activity_detail_student.html"


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
        return response

    def get_success_url(self):
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": self.object.pk}
        )


class ActivityStrategyCreateView(
    LoginRequiredMixin, UserPassesTestMixin, CreateView
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
#    except:
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

class DisciplineListView(LoginRequiredMixin, ListAPIView):
    queryset = Discipline.objects.order_by('title')
    serializer_class = DisciplineSerializer


@require_POST
@ajax_login_required
@user_can_view("workflowPk")
def get_workflow_data(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        data_package = get_workflow_context_data(workflow.get_subclass(),{},request.user)["data_package"]
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {"action": "posted", "data_package": data_package}
    )

@require_POST
@ajax_login_required
@user_can_view("projectPk")
def get_project_data(request: HttpRequest) -> HttpResponse:
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        data_package = get_workflow_data_package(request.user,project,None,True)
        project_data = (
            JSONRenderer()
            .render(ProjectSerializerShallow(project).data)
            .decode("utf-8")
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {"action": "posted", "data_package": data_package,"project_data":project_data}
    )

@require_POST
@ajax_login_required
@user_can_view("outcomePk")
def get_outcome_data(request: HttpRequest) -> HttpResponse:
    outcome = Outcome.objects.get(pk=request.POST.get("outcomePk"))
    try:
        data_package = get_outcome_context_data(outcome,{},request.user)["data_flat"]
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {"action": "posted", "data_package": data_package}
    )

@require_POST
@ajax_login_required
@user_can_edit("nodePk")
def get_possible_linked_workflows(request: HttpRequest) -> HttpResponse:
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    try:
        project = (
            node.get_workflow().get_project()
        )
        data_package = get_workflow_data_package(
            request.user, project, node.node_type - 1,False
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
        linked_workflow=node.linked_workflow,
    )

    for outcome in node.outcomes.all():
        OutcomeNode.objects.create(
            outcome=outcome,
            node=new_node,
            rank=OutcomeNode.objects.get(node=node, outcome=outcome).rank,
        )

    return new_node


def duplicate_week(week: Week, author: User, new_workflow: Workflow) -> Week:
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
        is_strategy=workflow.is_strategy,
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
            rank=WeekWorkflow.objects.get(week=week, workflow=workflow).rank,
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
                            week2.nodes.get(parent_node=node_link.target_node),
                        )

    return new_workflow


@require_POST
@ajax_login_required
@user_can_view("workflowPk")
@user_can_edit("projectPk")
def duplicate_workflow_ajax(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        clone = duplicate_workflow(workflow, request.user)
        WorkflowProject.objects.create(project=project, workflow=clone)
        if workflow.get_project() != clone.get_project():
            outcomes_set = get_project_outcomes(project)
            cleanup_workflow_post_duplication(clone, project, outcomes_set)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "new_item": InfoBoxSerializer(clone,context={'user':request.user}).data,
            "type": clone.type,
        }
    )


@require_POST
@ajax_login_required
@user_can_view("workflowPk")
def duplicate_strategy_ajax(request: HttpRequest) -> HttpResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        clone = duplicate_workflow(workflow, request.user)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "new_item": InfoBoxSerializer(clone,context={'user':request.user}).data,
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
    )

    for child in outcome.children.all():
        OutcomeOutcome.objects.create(
            child=duplicate_outcome(child, author),
            parent=new_outcome,
            rank=OutcomeOutcome.objects.get(child=child, parent=outcome).rank,
        )

    return new_outcome


@require_POST
@ajax_login_required
@user_can_view("outcomePk")
@user_can_edit("projectPk")
def duplicate_outcome_ajax(request: HttpRequest) -> HttpResponse:
    outcome = Outcome.objects.get(pk=request.POST.get("outcomePk"))
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        clone = duplicate_outcome(outcome, request.user)
        OutcomeProject.objects.create(project=project, outcome=clone)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "new_item": InfoBoxSerializer(clone,context={'user':request.user}).data,
            "type": "outcome",
        }
    )


def duplicate_project(project: Project, author: User) -> Project:

    new_project = Project.objects.create(
        title=project.title,
        description=project.description,
        author=author,
        is_original=False,
        parent_project=project,
    )

    for outcome in project.outcomes.all():
        OutcomeProject.objects.create(
            outcome=duplicate_outcome(outcome, author),
            project=new_project,
            rank=OutcomeProject.objects.get(
                outcome=outcome, project=project
            ).rank,
        )

    for workflow in project.workflows.all():
        WorkflowProject.objects.create(
            workflow=duplicate_workflow(workflow, author),
            project=new_project,
            rank=WorkflowProject.objects.get(
                workflow=workflow, project=project
            ).rank,
        )
        
    for discipline in project.disciplines.all():
        new_project.disciplines.add(discipline)

    outcomes_set = get_project_outcomes(new_project)
    for workflow in new_project.workflows.all():
        cleanup_workflow_post_duplication(workflow, new_project, outcomes_set)

    return new_project


@require_POST
@ajax_login_required
@user_can_view("projectPk")
def duplicate_project_ajax(request: HttpRequest) -> HttpResponse:
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        clone = duplicate_project(project, request.user)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "new_item": InfoBoxSerializer(clone,context={'user':request.user}).data,
            "type": "project",
        }
    )


# post-duplication cleanup. Setting the linked workflows and outcomes for nodes. This must be done after the fact because the workflows and outcomes have not necessarily been duplicated by the time the nodes are
def cleanup_workflow_post_duplication(workflow, project, outcomes_set):
    for node in Node.objects.filter(week__workflow=workflow):
        if node.linked_workflow is not None:
            new_linked_workflow = project.workflows.filter(
                parent_workflow=node.linked_workflow
            ).last()
            node.linked_workflow = new_linked_workflow
            node.save()
        for outcomenode in node.outcomenode_set.all():
            new_outcome = outcomes_set.filter(
                parent_outcome=outcomenode.outcome
            ).last()
            if new_outcome is None:
                outcomenode.delete()
            else:
                outcomenode.outcome = new_outcome
                outcomenode.save()


"""
Creation methods
"""


@require_POST
@ajax_login_required
@user_can_edit("workflowPk")
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
            # create a copy of the strategy (the first/only week in the strategy workflow). Note that all the nodes, at this point, are pointed at the columns from the OLD workflow
            if position < 0 or position > workflow.weeks.count():
                position = workflow.weeks.count()
            old_week = strategy.weeks.first()
            week = duplicate_week(old_week, request.user, None)
            week.title = strategy.title
            week.is_strategy = True
            week.original_strategy = strategy
            week.save()
            new_through = WeekWorkflow.objects.create(
                week=week, workflow=workflow, rank=position
            )
            # now, check for missing columns. We try to create a one to one relationship between the columns, and then add in any that are still missing
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
                    # if we have multiple columns of that type, check to see if any have this one as their parent
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
            # we have to copy all the nodelinks, since by default they are not duplicated when a week is duplicated
            for node_link in NodeLink.objects.filter(
                source_node__in=old_week.nodes.all(),
                target_node__in=old_week.nodes.all(),
            ):
                duplicate_nodelink(
                    node_link,
                    request.user,
                    week.nodes.get(parent_node=node_link.source_node),
                    week.nodes.get(parent_node=node_link.target_node),
                )

            # return all this information to the user
            return JsonResponse(
                {
                    "action": "posted",
                    "strategy": WeekSerializerShallow(week).data,
                    "new_through": WeekWorkflowSerializerShallow(
                        new_through
                    ).data,
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
            )

        else:
            raise ValidationError("User cannot access this strategy")
    except ValidationError:
        return JsonResponse({"action": "error"})


@require_POST
@ajax_login_required
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
    return JsonResponse(
        {
            "action": "posted",
            "new_model": NodeLinkSerializerShallow(node_link).data,
        }
    )


# Add a new child to a model
@require_POST
@ajax_login_required
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
@user_can_view(False)
@user_can_edit(False,get_parent=True)
def insert_sibling(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))
    parent_type = json.loads(request.POST.get("parentType"))
    through_type = json.loads(request.POST.get("throughType"))
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        parent = get_model_from_str(parent_type).objects.get(id=parent_id)
        if parent_type==object_type:
            old_through_kwargs = {"child":model,"parent":parent}
        else:
            old_through_kwargs = {object_type:model,parent_type:parent}
        through = get_model_from_str(through_type).objects.get(**old_through_kwargs)

        if object_type=="week":
            defaults={"week_type":model.week_type}
        elif object_type=="node":
            defaults={"column":model.column,"node_type":model.node_type}
        elif object_type=="column":
            defaults={"column_type":math.floor(model.column_type / 10) * 10}
        elif object_type=="outcome":
            defaults={"depth":model.depth}
        else:
            defaults={}

        new_model = get_model_from_str(object_type).objects.create(
            author = request.user,**defaults
        )
        if parent_type==object_type:
            new_through_kwargs = {"child":new_model,"parent":parent}
        else:
            new_through_kwargs = {object_type:new_model,parent_type:parent}
        new_through_model = get_model_from_str(through_type).objects.create(
            **new_through_kwargs,
            rank=through.rank+1
        )
        new_model_serialized = serializer_lookups_shallow[object_type](
            new_model
        ).data
        new_through_serialized = serializer_lookups_shallow[through_type](
            new_through_model
        ).data
    
    

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "new_model": new_model_serialized,
            "new_through": new_through_serialized,
            "parentID": parent_id,
        }
    )


# Soft-duplicate the item
@require_POST
@ajax_login_required
@user_can_view(False)
@user_can_edit(False,get_parent=True)
def duplicate_self(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))
    parent_type = json.loads(request.POST.get("parentType"))
    through_type = json.loads(request.POST.get("throughType"))
    try:
        if object_type == "week":
            model = Week.objects.get(id=object_id)
            parent = Workflow.objects.get(id=parent_id)
            through = WeekWorkflow.objects.get(week=model, workflow=parent)
            newmodel = duplicate_week(model, request.user, None)
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
            newmodel = duplicate_node(model, request.user, None)
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
            newmodel = duplicate_column(model, request.user)
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
            newmodel = duplicate_outcome(model, request.user)
            newthroughmodel = OutcomeOutcome.objects.create(
                parent=parent, child=newmodel, rank=through.rank + 1
            )
            new_model_serialized = OutcomeSerializerShallow(newmodel).data
            new_through_serialized = OutcomeOutcomeSerializerShallow(
                newthroughmodel
            ).data
            outcomes = get_all_outcomes(newmodel, 0)
            outcomeoutcomes = []
            for oc in outcomes:
                outcomeoutcomes += list(oc.child_outcome_links.all())
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
        "children": new_children_serialized,
        "children_through": new_child_through_serialized,
    }
    return JsonResponse(response)

#favourite/unfavourite a project or workflow or outcome for a user
@require_POST
@ajax_login_required
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
            object_id=object_id
        ).delete()
        if favourite:
            f = Favourite.objects.create(user=request.user,content_object=item)
        response["action"]="posted"
    except:
        response["action"]="error"
    
    return JsonResponse(response)

#change permissions on an object for a user
@require_POST
@ajax_login_required
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
        if hasattr(item,"get_subclass"):
            item = item.get_subclass()
        ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(item),
            object_id=object_id
        ).delete()
        p = ObjectPermission.objects.create(user=user,content_object=item,permission_type=permission_type)
        response["action"]="posted"
    except:
        response["action"]="error"
    
    return JsonResponse(response)

@require_POST
@ajax_login_required
@user_can_edit(False)
def get_users_for_object(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    content_type = ContentType.objects.get(model=object_type)
    try:
        editors = set()
        for object_permission in ObjectPermission.objects.filter(content_type=content_type,object_id=object_id,permission_type=ObjectPermission.PERMISSION_EDIT).select_related('user'):
            editors.add(object_permission.user)
        viewers = set()
        for object_permission in ObjectPermission.objects.filter(content_type=content_type,object_id=object_id,permission_type=ObjectPermission.PERMISSION_VIEW).select_related('user'):
            viewers.add(object_permission.user)
    except:
        return JsonResponse({"action": "error"})
    return JsonResponse({
        "action":"posted",
        "viewers":UserSerializer(viewers,many=True).data,
        "editors":UserSerializer(editors,many=True).data,
    })

@require_POST
@ajax_login_required
#@user_is_teacher(False)
def get_user_list(request: HttpRequest) -> HttpResponse:
    name_filter = json.loads(request.POST.get("filter"))
    print(name_filter)
    try:
        print(User.objects.filter(username__istartswith=name_filter))
        user_list = User.objects.filter(username__istartswith=name_filter,groups=Group.objects.get(name=settings.TEACHER_GROUP))[:10]
    except:
        return JsonResponse({"action": "error"})
    return JsonResponse({
        "action":"posted",
        "user_list":UserSerializer(user_list,many=True).data,
    })
    
"""
Reorder methods
"""

# Insert a model via its throughmodel
@require_POST
@ajax_login_required
@user_can_edit(False)
@user_can_edit(False,get_parent=True)
def inserted_at(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))
    parent_type = json.loads(request.POST.get("parentType"))
    new_position = json.loads(request.POST.get("newPosition"))
    through_type = json.loads(request.POST.get("throughType"))
    
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        parent = get_model_from_str(parent_type).objects.get(id=parent_id)
        if object_type==parent_type:
            creation_kwargs = {"child":model,"parent":parent}
        else:
            creation_kwargs = {object_type:model,parent_type:parent}
        through = get_model_from_str(through_type).objects.create(rank=new_position,**creation_kwargs)

    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


# Change a node's column
@require_POST
@ajax_login_required
@user_can_edit("nodePk")
@user_can_edit("columnPk")
def change_column(request: HttpRequest) -> HttpResponse:
    node_id = json.loads(request.POST.get("nodePk"))
    new_column_id = json.loads(request.POST.get("columnPk"))
    try:
        node = Node.objects.get(id=node_id)
        new_column = Column.objects.get(id=new_column_id)
        node.column = new_column
        node.save()
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


# Add an outcome to a node
@require_POST
@ajax_login_required
@user_can_edit("nodePk")
@user_can_view("outcomePk")
def add_outcome_to_node(request: HttpRequest) -> HttpResponse:
    node_id = json.loads(request.POST.get("nodePk"))
    outcome_id = json.loads(request.POST.get("outcomePk"))
    try:
        node = Node.objects.get(id=node_id)
        outcome = Outcome.objects.get(id=outcome_id)
        if OutcomeNode.objects.filter(node=node, outcome=outcome).count() > 0:
            return JsonResponse({"action": "error"})
        outcomenode = OutcomeNode.objects.create(outcome=outcome, node=node)
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "outcomenode": OutcomeNodeSerializerShallow(outcomenode).data,
        }
    )


"""
Update Methods
"""

# Updates an object's information using its serializer
@require_POST
@ajax_login_required
@user_can_edit(False)
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
@user_can_edit("nodePk")
@user_can_view("outcomePk")
def update_outcomenode_degree(request: HttpRequest) -> HttpResponse:
    node_id = json.loads(request.POST.get("nodePk"))
    outcome_id = json.loads(request.POST.get("outcomePk"))
    degree = json.loads(request.POST.get("degree"))
    try:
        if (
            OutcomeNode.objects.filter(
                node__id=node_id, outcome__id=outcome_id
            ).count()
            > 0
        ):
            model = OutcomeNode.objects.get(
                node__id=node_id, outcome__id=outcome_id
            )
        else:
            model = OutcomeNode.objects.create(
                node=Node.objects.get(id=node_id),
                outcome=Outcome.objects.get(id=outcome_id),
            )
        model.degree = degree
        model.save()
    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


# Do not call if duplicating the parent workflow
def set_linked_workflow(node: Node, workflow):
    project = node.get_workflow().get_project()
    if WorkflowProject.objects.get(workflow=workflow).project == project:
        node.linked_workflow = workflow
        node.save()
    else:
        try:
            new_workflow = duplicate_workflow(workflow, node.author)
            WorkflowProject.objects.create(
                workflow=new_workflow, project=project
            )
            node.linked_workflow = new_workflow
            node.save()
        except ValidationError:
            pass


# Sets the linked workflow for a node, adding it to the project if different.
@require_POST
@ajax_login_required
@user_can_edit("nodePk")
@user_can_view_or_none("workflowPk")
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


# Creates strategy from week or turns strategy into week
@require_POST
@ajax_login_required
@user_can_edit("weekPk")
def week_toggle_strategy(request: HttpRequest) -> HttpResponse:
    try:
        object_id = json.loads(request.POST.get("weekPk"))
        is_strategy = json.loads(request.POST.get("is_strategy"))
        week = Week.objects.get(id=object_id)
        # This check is to prevent people from spamming the button, which would potentially create a bunch of superfluous strategies
        if week.is_strategy != is_strategy:
            raise ValidationError("Request has already been processed")
        if week.is_strategy:
            week.is_strategy = False
            strategy = week.original_strategy.get_subclass()
            week.original_strategy = None
            week.strategy_classification = 0
            week.save()
        else:
            workflow = WeekWorkflow.objects.get(week=week).workflow
            strategy = duplicate_workflow(workflow, request.user)
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

    return JsonResponse(
        {
            "action": "posted",
            "id": week.id,
            "is_strategy": week.is_strategy,
            "strategy": strategy_serialized,
        }
    )


"""
Delete methods
"""


@require_POST
@ajax_login_required
@user_can_delete(False)
def delete_self(request: HttpRequest) -> HttpResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))

    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        model.delete()
    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

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
        for outcome in json_data["outcome"]:
            new_outcome = Outcome.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    outcome["title"], tags=bleach_allowed_tags
                ),
            )
            id_dict["outcome"][outcome["id"]] = new_outcome
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
            for outcome_id in project["outcomes"]:
                OutcomeProject.objects.create(
                    project=project_model,
                    outcome=id_dict["outcome"][outcome_id],
                )

        for outcome in json_data["outcome"]:
            outcome_model = id_dict["outcome"][outcome["id"]]
            for i, child in enumerate(outcome["children"]):
                OutcomeOutcome.objects.create(
                    parent=outcome_model,
                    child=id_dict["outcome"][child],
                    rank=i,
                )

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

        for outcomenode in json_data["outcomenode"]:
            OutcomeNode.objects.create(
                outcome=id_dict["outcome"][outcomenode["outcome"]],
                node=id_dict["node"][outcomenode["node"]],
                degree=outcomenode["degree"],
            )

        for nodelink in json_data["nodelink"]:
            NodeLink.objects.create(
                source_node=id_dict["node"][nodelink["source"]],
                target_node=id_dict["node"][nodelink["target"]],
                title=bleach_sanitizer(
                    nodelink["title"], tags=bleach_allowed_tags
                ),
                dashed=nodelink["style"] or False,
            )

    except:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})
