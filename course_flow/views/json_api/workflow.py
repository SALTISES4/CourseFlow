import json
import logging
import traceback
from pprint import pprint

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.db import transaction

# from duplication
from django.utils.translation import gettext as _
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.apps import logger
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
from course_flow.models import Project
from course_flow.models.node import Node
from course_flow.models.relations import OutcomeWorkflow
from course_flow.models.relations.outcomeHorizontalLink import (
    OutcomeHorizontalLink,
)
from course_flow.models.relations.outcomeNode import OutcomeNode
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.models.workflow import SUBCLASSES, Workflow
from course_flow.serializers import (
    LibraryObjectSerializer,
    LinkedWorkflowSerializerShallow,
    NodeSerializerShallow,
    OutcomeHorizontalLinkSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    WorkflowSerializerShallow,
    WorkflowUpsertSerializer,
)
from course_flow.services import DAO
from course_flow.services.workflow import WorkflowService
from course_flow.sockets import redux_actions as actions
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
    # @staticmethod
    # @permission_classes([UserCanViewMixin])
    # @login_required
    # @api_view(["GET"])
    # def fetch_detail(request: Request, pk: int) -> Response:
    #     current_user = request.user
    #
    #     try:
    #         workflow = Workflow.objects.get(pk=pk)
    #     except Workflow.DoesNotExist:
    #         return Response({"detail": "Workflow not found"}, status=404)
    #
    #     user_permission = DAO.get_user_permission(workflow, current_user)
    #
    #     context = WorkflowService.get_workflow(workflow, current_user)
    #
    #     data_package = {
    #         "user_permission": user_permission,
    #         "workflow_data_package": context.get("data_package"),
    #     }
    #
    #     return Response(
    #         {"action": "GET", "data_package": data_package},
    #         status=status.HTTP_200_OK,
    #     )

    @staticmethod
    @api_view(["GET"])
    # @user_can_view("pk") # @todo poorly designed
    def fetch_detail(request: Request, pk: int) -> Response:
        current_user = request.user

        try:
            workflow = Workflow.objects.get(pk=pk)
        except Workflow.DoesNotExist:
            return Response({"detail": "Workflow not found"}, status=404)

        try:
            data_package = WorkflowService.get_workflow_full(workflow.get_subclass(), current_user)
        except AttributeError as e:
            logger.exception("log of the errors ")
            return Response({"error": "hello error"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "message": "success",
                "data_package": data_package,
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    @user_can_view("workflowPk")
    @api_view(["POST"])
    def fetch_parent_detail(
        request: Request,
    ) -> Response:
        body = json.loads(request.body)
        workflow = Workflow.objects.get(pk=body.get("workflowPk"))

        try:
            data_package = get_parent_outcome_data(workflow.get_subclass(), request.user)

        except AttributeError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "message": "success",
                "data_package": data_package,
            },
            status=status.HTTP_200_OK,
        )

    # @todo what is this doing, probably misnamed
    @staticmethod
    @user_can_view("nodePk")
    @api_view(["POST"])
    def fetch_child_workflow_data(
        request: Request,
    ) -> Response:
        body = json.loads(request.body)
        node = Node.objects.get(pk=body.get("nodePk"))

        try:
            data_package = get_child_outcome_data(
                node.linked_workflow, request.user, node.get_workflow()
            )
        except AttributeError as e:
            logger.exception("An error occurred")
            return Response(
                {
                    "action": "error",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "success",
                "data_package": data_package,
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    # @user_can_view("workflowPk") @todo permissions should not have any opinion on the request VERB
    @api_view(["GET"])
    def fetch_parent_detail_full(request: Request, pk: int) -> Response:
        workflow_id = pk
        try:
            # @todo still unclear
            parent_workflows = [
                node.get_workflow() for node in Node.objects.filter(linked_workflow__id=workflow_id)
            ]

            data_package = LibraryObjectSerializer(
                parent_workflows, many=True, context={"user": request.user}
            ).data

        except AttributeError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "message": "success",
                "parent_workflows": data_package,
            },
            status=status.HTTP_200_OK,
        )

    #########################################################
    # CREATE
    #########################################################
    @staticmethod
    @api_view(["POST"])
    # @user_can_edit("projectPk")
    def create(request: Request) -> Response:
        """
        Create a new workflow in a project
        :param request:
        :return:
        """
        serializer = WorkflowUpsertSerializer(data=request.data)
        pprint(request.data)
        if serializer.is_valid():
            workflow = serializer.save(author=request.user)

            return Response(
                {"message": "success", "data_package": {"id": workflow.id}},
                status=status.HTTP_201_CREATED,
            )
        else:
            logger.exception(f"Bad error encountered with errors: {serializer.errors}")
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

    #########################################################
    # UPDATE
    #########################################################
    @staticmethod
    # @todo needs permission
    @api_view(["POST"])
    def update(request: Request, pk: int) -> Response:
        """

        :param request:
        :param pk:
        :return:
        """

        try:
            workflow = Workflow.objects.get(pk=pk)
        except Workflow.DoesNotExist as e:
            logger.exception("")
            return Response(
                {"error": "Workflow not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = WorkflowUpsertSerializer(workflow, data=request.data)

        pprint(serializer.initial_data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            logger.exception(f"Bad error encountered with errors: {serializer.errors}")
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

    #########################################################
    #  DUPLICATE WORKFLOW
    #########################################################
    @staticmethod
    @user_can_view("workflowPk")
    @user_can_edit("projectPk")
    @api_view(["POST"])
    def duplicate_to_project(request: Request, pk: int) -> Response:
        body = json.loads(request.body)
        workflow = Workflow.objects.get(pk=pk)
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

        except ValidationError as e:
            logger.exception("An error occurred")
            return Response(
                {
                    "error": "you have error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        linked_workflows = Workflow.objects.filter(linked_nodes__week__workflow=clone)
        for wf in linked_workflows:
            actions.dispatch_parent_updated(wf)

        return Response(
            {
                "message": "success",
                "new_item": LibraryObjectSerializer(clone, context={"user": request.user}).data,
                "type": clone.type,
            },
            status=status.HTTP_200_OK,
        )

    #########################################################
    # LISTS
    #########################################################
    @staticmethod
    @user_can_edit("nodePk")
    def possible_linked(
        request: Request,
    ) -> Response:
        """
        @todo what does this do?
        :return:
        """
        body = json.loads(request.body)
        node = Node.objects.get(pk=body.get("nodePk"))

        try:
            project = node.get_workflow().get_project()
            data_package = WorkflowService.get_workflow_data_package(
                request.user,
                project,
                type_filter=SUBCLASSES[node.node_type - 1],
            )

        except AttributeError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"})

        return Response(
            {
                "message": "success",
                "data_package": data_package,
                "node_id": node.id,
            }
        )

    @staticmethod
    @user_can_view_or_none("projectPk")
    def possible_added(
        request: Request,
    ) -> Response:
        """
        @todo what does this do?
        :return:
        """
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
            data_package = WorkflowService.get_workflow_data_package(
                request.user,
                project,
                type_filter=type_filter,
                get_strategies=get_strategies,
                self_only=self_only,
            )

        except AttributeError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"})

        return Response(
            {
                "message": "success",
                "data_package": data_package,
                "project_id": projectPk,
            }
        )

    @staticmethod
    @user_can_edit("nodePk")
    @user_can_view_or_none("workflowPk")
    def link_to_node(request: Request) -> Response:
        """
            @todo ??
         The actual JSON API which sets the linked workflow
        for a node, adding it to the project is different.
            :param request:
            :return:
        """

        body = json.loads(request.body)
        # last_time = time.time()
        try:
            node_id = body.get("nodePk")
            workflow_id = body.get("workflowPk")
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
                if not DAO.check_possible_parent(workflow, parent_workflow, False):
                    raise ValidationError
                set_linked_workflow(node, workflow)
                if node.linked_workflow is None:
                    raise ValidationError("Project could not be found")
                linked_workflow = node.linked_workflow.id
                linked_workflow_data = LinkedWorkflowSerializerShallow(
                    node.linked_workflow,
                    context={"user": request.user},
                ).data

        except ValidationError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"})

        response_data = {
            "id": node_id,
            "linked_workflow": linked_workflow,
            "linked_workflow_data": linked_workflow_data,
        }
        if original_workflow is not None:
            actions.dispatch_parent_updated(original_workflow)
        if workflow is not None:
            actions.dispatch_parent_updated(workflow)
        actions.dispatch_wf(parent_workflow, actions.setLinkedWorkflowAction(response_data))
        return Response({"message": "success"})


def set_linked_workflow(node: Node, workflow):
    """
    A helper function to set the linked workflow.
    Do not call if you are duplicating the parent workflow,
    that gets taken care of in another manner.  ????

    :param node:
    :param workflow:
    :return:
    """
    project = node.get_workflow().get_project()
    if WorkflowProject.objects.get(workflow=workflow).project == project:
        node.linked_workflow = workflow
        node.save()
    else:
        try:
            new_workflow = fast_duplicate_workflow(workflow, node.author, project)
            WorkflowProject.objects.create(workflow=new_workflow, project=project)
            node.linked_workflow = new_workflow
            node.save()
        except ValidationError as e:
            logger.exception("An error occurred")
        pass


@public_model_access("workflow")
def json_api_get_public_workflow_data(request: Request, pk) -> Response:
    """
    Public versions if the workflow is public
    :param request:
    :param pk:
    :return:
    """
    workflow = Workflow.objects.get(pk=pk)
    try:
        data_package = WorkflowService.get_workflow_full(workflow.get_subclass(), request.user)
    except AttributeError as e:
        logger.exception("An error occurred")
        return Response({"action": "error"})

    return Response(
        {
            "message": "success",
            "data_package": data_package,
        }
    )


@public_model_access("node", rate=50)
def json_api_get_public_workflow_child_data(request: Request, pk) -> Response:
    node = Node.objects.get(pk=pk)
    try:
        data_package = get_child_outcome_data(
            node.linked_workflow, request.user, node.get_workflow()
        )
    except AttributeError as e:
        logger.exception("An error occurred")
        return Response({"action": "error"})
    return Response(
        {
            "message": "success",
            "data_package": data_package,
        }
    )


@public_model_access("workflow")
@api_view(["POST"])
def json_api_get_public_workflow_parent_data(request: Request, pk) -> Response:
    workflow = Workflow.objects.get(pk=pk)
    try:
        data_package = get_parent_outcome_data(workflow.get_subclass(), request.user)
    except AttributeError as e:
        logger.exception("An error occurred")
        return Response({"action": "error"})

    return Response(
        {
            "message": "success",
            "data_package": data_package,
        }
    )

    ################################################
    # Getting groups of workflows or context for
    # workflows.
    ################################################

    # @user_can_view("workflowPk")
    # def json_api_post_get_workflow_context(request: Request) -> Response:
    #     body = json.loads(request.body)
    #     workflowPk = body.get("workflowPk", False)
    #
    #     try:
    #         workflow = Workflow.objects.get(pk=workflowPk)
    #         data_package = get_workflow_context_data(
    #             workflow,
    #             request.user,
    #         )
    #
    #     except AttributeError as e:
    # logger.exception("An error occurred")


#         return Response({"action": "error"})
#
#     return Response(
#         {
#             "message": "success",
#             "data_package": data_package,
#             "workflow_id": workflowPk,
#         }
#     )


@public_model_access("workflow")
@api_view(["GET"])
def json_api_get_public_parent_workflow_info(request: Request, pk: int) -> Response:
    try:
        parent_workflows = [
            node.get_workflow() for node in Node.objects.filter(linked_workflow__id=pk)
        ]
        data_package = LibraryObjectSerializer(
            parent_workflows, many=True, context={"user": request.user}
        ).data

    except AttributeError as e:
        return Response({"error": str(e)})

    return Response(
        {"message": "success", "parent_workflows": data_package},
    )


#########################################################
# CREATE
#########################################################


#########################################################
# HELPERS
#########################################################


# Get the JSON state for a workflow, including all relevant objects.


# For a workflow, gets all relevant info about parent workflows and their outcomes.
# Only relevant/loaded for views that rely on parent outcomes.
def get_parent_outcome_data(workflow, user):
    outcomes, outcomeoutcomes = DAO.get_all_outcomes_for_workflow(workflow)
    parent_nodes = DAO.get_parent_nodes_for_workflow(workflow)
    parent_workflows = list(map(lambda x: x.get_workflow(), parent_nodes))
    parent_outcomeworkflows = OutcomeWorkflow.objects.filter(workflow__in=parent_workflows)
    parent_outcomenodes = OutcomeNode.objects.filter(node__in=parent_nodes)

    parent_outcomes = []
    parent_outcomeoutcomes = []
    for parent_workflow in parent_workflows:
        new_outcomes, new_outcomeoutcomes = DAO.get_all_outcomes_for_workflow(parent_workflow)
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
        "parent_node": NodeSerializerShallow(parent_nodes, many=True, context={"user": user}).data,
        "outcomenode": OutcomeNodeSerializerShallow(parent_outcomenodes, many=True).data,
        "outcome": OutcomeSerializerShallow(
            parent_outcomes, many=True, context={"type": outcome_type}
        ).data,
        "outcomeoutcome": OutcomeOutcomeSerializerShallow(parent_outcomeoutcomes, many=True).data,
        "outcomehorizontallink": OutcomeHorizontalLinkSerializerShallow(
            outcomehorizontallinks, many=True
        ).data,
    }


# For a workflow, get all the child outcome data. Only used for
# views that rely on this data such as the outcome analytics view.
def get_child_outcome_data(workflow, user, parent_workflow):
    nodes = Node.objects.filter(week__workflow=parent_workflow, linked_workflow=workflow)
    linked_workflows = [workflow]
    child_workflow_outcomeworkflows = []
    child_workflow_outcomes = []
    child_workflow_outcomeoutcomes = []
    for linked_workflow in linked_workflows:
        child_workflow_outcomeworkflows += linked_workflow.outcomeworkflow_set.all()
        (
            new_child_workflow_outcomes,
            new_child_workflow_outcomeoutcomes,
        ) = DAO.get_all_outcomes_for_workflow(linked_workflow)
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
        "node": NodeSerializerShallow(nodes, many=True, context={"user": user}).data,
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
