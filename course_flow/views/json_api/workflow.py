import json
import traceback

from django.contrib.auth.decorators import login_required
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import HttpRequest, JsonResponse

# from duplication
from django.utils.translation import gettext as _
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.decorators import (
    public_model_access,
    user_can_edit,
    user_can_view,
    user_can_view_or_none,
)
from course_flow.duplication_functions import (
    cleanup_workflow_post_duplication,
    fast_duplicate_workflow,
)
from course_flow.models import Activity, Course, Notification, Project
from course_flow.models.node import Node
from course_flow.models.objectset import ObjectSet
from course_flow.models.relations import NodeLink, NodeWeek, OutcomeWorkflow
from course_flow.models.relations.outcomeHorizontalLink import (
    OutcomeHorizontalLink,
)
from course_flow.models.relations.outcomeNode import OutcomeNode
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.models.workflow import Workflow
from course_flow.serializers import (
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    InfoBoxSerializer,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    ObjectSetSerializerShallow,
    OutcomeHorizontalLinkSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
    WorkflowSerializerShallow,
    serializer_lookups_shallow,
)
from course_flow.sockets import redux_actions as actions
from course_flow.utils import (
    get_all_outcomes_for_workflow,
    get_parent_nodes_for_workflow,
    get_user_permission,
)
from course_flow.view_utils import (
    get_workflow_context_data,
    get_workflow_data_package,
)
from course_flow.views.mixins import UserCanViewMixin

#########################################################
# Bulk data API for workflows
# These are used by renderers on loading a workflow
# view to fetch all the base JSON that can be
# placed into the redux state
#########################################################


class WorkflowEndpoint:
    #########################################################
    # GET DATA
    #########################################################
    @staticmethod
    @permission_classes([UserCanViewMixin])
    @login_required
    @api_view(["GET"])
    def fetch_detail(request: Request) -> Response:
        workflows_pk = request.GET.get("id")
        current_user = request.user

        try:
            workflow = Workflow.objects.get(pk=workflows_pk)

        except Workflow.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        user_permission = get_user_permission(workflow, current_user)

        context = get_workflow_context_data(workflow, current_user)

        data_package = {
            "user_id": current_user.id if current_user else 0,
            "user_name": current_user.username,
            "user_permission": user_permission,
            "public_view": False,
            "workflow_data_package": context.get("data_package"),
            "workflow_type": workflow.type,
            "workflow_model_id": workflow.id,
        }

        return Response(
            {
                "action": "GET",
                "data_package": data_package,
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    @user_can_view("workflowPk")
    @api_view(["POST"])
    def fetch_detail_full(request: Request) -> Response:
        body = json.loads(request.body)
        workflow = Workflow.objects.get(pk=body.get("workflowPk"))

        try:
            data_package = get_workflow_data_flat(
                workflow.get_subclass(), request.user
            )
        except AttributeError:
            traceback.print_exc()
            return Response(
                {"error": "hello error"}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "action": "posted",
                "data_package": data_package,
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    @user_can_view("workflowPk")
    @api_view(["POST"])
    def fetch_workflow_parent_data(
        request: Request,
    ) -> Response:
        body = json.loads(request.body)
        workflow = Workflow.objects.get(pk=body.get("workflowPk"))

        try:
            data_package = get_parent_outcome_data(
                workflow.get_subclass(), request.user
            )

        except AttributeError:
            return Response(
                {"action": "error"}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "action": "posted",
                "data_package": data_package,
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    @user_can_view("nodePk")
    @api_view(["POST"])
    def fetch_workflow_child_data(
        request: Request,
    ) -> Response:
        body = json.loads(request.body)
        node = Node.objects.get(pk=body.get("nodePk"))

        try:
            data_package = get_child_outcome_data(
                node.linked_workflow, request.user, node.get_workflow()
            )
        except AttributeError:
            return Response(
                {"action": "error"}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "action": "posted",
                "data_package": data_package,
            },
            status=status.HTTP_200_OK,
        )


@public_model_access("workflow")
def json_api_get_public_workflow_data(
    request: HttpRequest, pk
) -> JsonResponse:
    """
    Public versions if the workflow is public
    :param request:
    :param pk:
    :return:
    """
    workflow = Workflow.objects.get(pk=pk)
    try:
        data_package = get_workflow_data_flat(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@public_model_access("node", rate=50)
def json_api_get_public_workflow_child_data(
    request: HttpRequest, pk
) -> JsonResponse:
    node = Node.objects.get(pk=pk)
    try:
        data_package = get_child_outcome_data(
            node.linked_workflow, request.user, node.get_workflow()
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


@public_model_access("workflow")
def json_api_get_public_workflow_parent_data(
    request: HttpRequest, pk
) -> JsonResponse:
    workflow = Workflow.objects.get(pk=pk)
    try:
        data_package = get_parent_outcome_data(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
        }
    )


################################################
# Getting groups of workflows or context for
# workflows.
################################################


@user_can_view("workflowPk")
def json_api_post_get_workflow_context(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    workflowPk = body.get("workflowPk", False)

    try:
        workflow = Workflow.objects.get(pk=workflowPk)
        data_package = get_workflow_context_data(
            workflow,
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


@public_model_access("workflow")
def json_api_get_public_parent_workflow_info(
    request: HttpRequest, pk
) -> JsonResponse:
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

    return JsonResponse(
        {
            "action": "posted",
            "parent_workflows": data_package,
        }
    )


@user_can_view("workflowPk")
def json_api_post_get_parent_workflow_info(
    request: HttpRequest,
) -> JsonResponse:
    body = json.loads(request.body)
    workflow_id = body.get("workflowPk")
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
    return JsonResponse(
        {
            "action": "posted",
            "parent_workflows": data_package,
        }
    )


@user_can_view("projectPk")
def json_api_post_get_workflows_for_project(
    request: HttpRequest,
) -> JsonResponse:
    body = json.loads(request.body)
    try:
        user = request.user
        project = Project.objects.get(pk=body.get("projectPk"))
        workflows_serialized = InfoBoxSerializer(
            project.workflows.all(), many=True, context={"user": user}
        ).data

    except AttributeError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "data_package": workflows_serialized,
        }
    )


@user_can_edit("nodePk")
def json_api_post_get_possible_linked_workflows(
    request: HttpRequest,
) -> JsonResponse:
    body = json.loads(request.body)
    node = Node.objects.get(pk=body.get("nodePk"))
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
        {
            "action": "posted",
            "data_package": data_package,
            "node_id": node.id,
        }
    )


@user_can_view_or_none("projectPk")
def json_api_post_get_possible_added_workflows(
    request: HttpRequest,
) -> JsonResponse:
    body = json.loads(request.body)
    type_filter = body.get("type_filter")
    get_strategies = body.get("get_strategies", "false")
    projectPk = body.get("projectPk", False)
    self_only = body.get("self_only", "false")

    if projectPk:
        project = Project.objects.get(pk=body.get("projectPk"))
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


#########################################################
# CREATE
#########################################################
# Create a new workflow in a project
@user_can_edit("projectPk")
def json_api_post_create_workflow(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    project = Project.objects.get(pk=body.get("projectPk"))
    workflow_type = body.get("workflow_type")

    try:
        print(body)
        print(workflow_type)

    except AttributeError:
        return JsonResponse(
            {
                "action": "error",
            }
        )


#################################################
# HELPERS
#################################################


# For a workflow, gets all relevant info about parent workflows and their outcomes.
# Only relevant/loaded for views that rely on parent outcomes.
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


# For a workflow, get all the child outcome data. Only used for
# views that rely on this data such as the outcome analytics view.
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


# Get the JSON state for a workflow, including all relevant objects.
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
        "node": NodeSerializerShallow(
            nodes, many=True, context={"user": user}
        ).data,
    }

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


#########################################################
#  DUPLICATE WORKFLOW
#########################################################
@user_can_view("workflowPk")
@user_can_edit("projectPk")
def json_api_post_duplicate_workflow(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    workflow = Workflow.objects.get(pk=body.get("workflowPk"))
    project = Project.objects.get(pk=body.get("projectPk"))

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
