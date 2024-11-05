import json
from enum import Enum

from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from django.db.models import ProtectedError, Q
from django.http import HttpRequest, JsonResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.apps import logger
from course_flow.decorators import user_can_delete, user_can_edit
from course_flow.models import Node, Outcome, Workflow
from course_flow.models.relations import (
    ColumnWorkflow,
    NodeWeek,
    OutcomeOutcome,
    OutcomeWorkflow,
    WeekWorkflow,
)
from course_flow.serializers import (
    RefreshSerializerNode,
    RefreshSerializerOutcome,
    serializer_lookups_shallow,
)
from course_flow.services import DAO, Utility
from course_flow.services.events_dispatch import EventsDispatch
from course_flow.services.workspace import WorkspaceService
from course_flow.sockets.emitters import WorkflowUpdateEmitter
from course_flow.views.json_api._validators import DeleteRequestSerializer


class ObjectType(Enum):
    NODE = "node"
    WEEK = "week"
    WORKFLOW = "workflow"
    ACTIVITY = "activity"
    COURSE = "course"
    PROGRAM = "program"
    OUTCOME = "program"
    COLUMN = "column"
    NODELINK = "nodelink"


class WorkspaceEndpoint:
    # Updates an object's information using its serializer. This is
    # the most frequently used view, used to change almost any
    # non-foreign key fields on models
    @staticmethod
    @api_view(["POST"])
    # @user_can_edit(False)
    def update_value(request: Request) -> Response:
        body = json.loads(
            request.body
        )  # note this is using django directl and not DRF, we are bypassing the middleware for case conversion

        try:
            object_id = body.get("objectID")
            object_type = body.get("object_type")
            data = body.get("data")
            change_field_id = body.get("change_field_id", False)
            objects = DAO.get_model_from_str(object_type).objects

            if hasattr(objects, "get_subclass"):
                object_to_update = objects.get_subclass(pk=object_id)
            else:
                object_to_update = objects.get(pk=object_id)
            serializer = serializer_lookups_shallow[object_type](
                object_to_update,
                data=data,
                partial=True,
                context={"user": request.user},
            )
            Utility.save_serializer(serializer)

        except ValidationError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            workflow = object_to_update.get_workflow()
            WorkflowUpdateEmitter.emit_workflow_update(
                workflow,
                WorkflowUpdateEmitter.change_field(object_id, object_type, data, change_field_id),
            )
            if object_type == "outcome":
                WorkflowUpdateEmitter.dispatch_to_parent_wf(
                    workflow,
                    WorkflowUpdateEmitter.change_field(object_id, object_type, data),
                )

        except AttributeError as e:
            logger.exception("An error occurred")

        return Response({"message": "success"}, status=status.HTTP_200_OK)

    #########################################################
    # DELETE
    #########################################################

    #########################################################
    # @todo this is still a giant catchall for all objects
    # separate out the worklow objects:
    #  - columnn
    #  - node
    #  - outcome
    #  - weekl
    #  from the workspace objects
    #   - workflow
    #   - project
    #########################################################
    @staticmethod
    # @user_can_delete(False)
    @api_view(["POST"])
    def delete(request: Request, pk: int) -> Response:
        """
         Hard delete. Actually deletes the object instead of just marking a flag.
        :param request:
        :return:
        """

        serializer = DeleteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # extract payload
        object_id = pk
        object_type = serializer.validated_data["object_type"]

        try:
            model = DAO.get_model_from_str(object_type).objects.get(id=object_id)
        except (ProtectedError, ObjectDoesNotExist):
            return Response({"error": "Object does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        # Delete the object
        # @todo verify if we need to do this at the end
        with transaction.atomic():
            model.delete()

        # Determine linked workflows after successful deletion
        linked_workflows, parent_workflows = WorkspaceService.determine_linked_workflows(
            object_type, model
        )
        parent_id = WorkspaceService.get_parent_id(object_type, model)
        if object_type == "outcome" and model.depth == 0:
            object_type = "outcome_base"

        # Additional data handling based on object type
        extra_data = None
        if object_type in ["outcome", "outcome_base"]:
            affected_nodes = [pk] + list(
                DAO.get_descendant_outcomes(model).values_list("pk", flat=True)
            )
            extra_data = RefreshSerializerNode(
                Node.objects.filter(pk__in=affected_nodes), many=True
            ).data
        elif object_type == "column" and linked_workflows:
            extra_data = (
                linked_workflows[0]
                .columnworkflow_set.filter(column__deleted=False)
                .order_by("rank")
                .first()
                .column.id
            )

        # Workflow actions dispatch
        EventsDispatch.dispatch_delete_action(
            object_id=pk,
            object_type=object_type,
            parent_id=parent_id,
            extra_data=extra_data,
            workflow=model.get_workflow() if hasattr(model, "get_workflow") else None,
            linked_workflows=linked_workflows,
            parent_workflows=parent_workflows,
        )

        return Response({"message": "success"})

    #########################################################
    # @todo this is still a giant catchall for all objects
    # separate out the worklow objects:
    #  - column
    #  - node
    #  - outcome
    #  - week
    #  from the workspace objects
    #   - workflow
    #   - project
    #########################################################
    @staticmethod
    # #@user_can_delete(False)
    @api_view(["POST"])
    def delete_soft(request: Request, pk: int) -> Response:
        """
        @todo rename this to archive
        - why does this exist for non workspace objects?


        Soft delete the object by setting its 'deleted' property to True.
        Keeps linked workflows updated about the deletion status.
        :param request:
        :param pk:
        :return:
        """
        serializer = DeleteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # extract payload
        object_id = pk
        object_type = serializer.validated_data["object_type"]

        try:
            model = DAO.get_model_from_str(object_type).objects.get(id=object_id)
        except (ProtectedError, ObjectDoesNotExist):
            return Response({"error": "Object does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        # Perform the soft delete
        with transaction.atomic():
            model.deleted = True
            model.deleted_on = timezone.now()
            model.save()

        #########################################################
        # WS / Event / Update
        # the transaction is over
        # now we want to update all the subscribers to this workflow channel
        #########################################################
        parent_id = WorkspaceService.get_parent_id(object_type, model)

        # probably another work around based on the model design
        if object_type == "outcome" and model.depth == 0:
            object_type = "outcome_base"

        # Determine all referenced workflows because we want to notify all of them
        linked_workflows, parent_workflows = WorkspaceService.determine_linked_workflows(
            object_type, model
        )

        # Additional data handling based on object type, not sure yet
        extra_data, outcomes_to_update = None, None
        if object_type in ["outcome", "outcome_base"]:
            outcomes_list = [pk] + list(
                DAO.get_descendant_outcomes(model).values_list("pk", flat=True)
            )
            extra_data = RefreshSerializerNode(
                Node.objects.filter(outcomes__in=outcomes_list), many=True
            ).data
            outcomes_to_update = RefreshSerializerOutcome(
                Outcome.objects.filter(horizontal_outcomes__in=outcomes_list), many=True
            ).data
        elif object_type == "column":
            extra_data = (
                model.get_workflow()
                .columnworkflow_set.filter(column__deleted=False)
                .order_by("rank")
                .first()
                .column.id
            )

        # Dispatch the WS update
        EventsDispatch.dispatch_delete_action(
            object_id=pk,
            object_type=object_type,
            parent_id=parent_id,
            extra_data=extra_data,
            workflow=model.get_workflow(),
            linked_workflows=linked_workflows,
            outcomes_to_update=outcomes_to_update,
            parent_workflows=parent_workflows,
        )

        return Response(
            {
                "message": "success",
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    # #@user_can_delete(False)
    @api_view(["POST"])
    def restore(request: Request, pk: int) -> Response:
        """
        -- Restore an object that was soft-deleted
        -- issue a socket update for all referenced workflow (what defines a reference ?)
        :param pk:
        :param request:
        :return:
        """
        serializer = DeleteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        # assing payload data to local objects
        object_id = pk
        object_type = serializer.validated_data["object_type"]

        try:
            model = DAO.get_model_from_str(object_type).objects.get(id=object_id)
            workflow = None
            extra_data = None
            parent_id = None
            throughparent_id = None
            throughparent_index = None
            # object_suffix = ""

            # Restore the object
            with transaction.atomic():
                model.deleted = False
                model.save()

            try:
                workflow = model.get_workflow()
            except AttributeError as e:
                logger.exception("An error occurred")

            # Check to see if we have any linked workflows that need to be updated
            linked_workflows = False
            if object_type == ObjectType.NODE:
                linked_workflows = list(Workflow.objects.filter(linked_nodes=model))
            elif object_type == ObjectType.WEEK:
                linked_workflows = list(Workflow.objects.filter(linked_nodes__week=model))
            elif object_type in ["workflow", "activity", "course", "program"]:
                linked_workflows = list(
                    Workflow.objects.filter(linked_nodes__week__workflow__id=model.id)
                )
                parent_workflows = [
                    node.get_workflow() for node in Node.objects.filter(linked_workflow=model)
                ]
            elif object_type == ObjectType.OUTCOME:
                linked_workflows = list(
                    Workflow.objects.filter(
                        Q(
                            linked_nodes__outcomes__in=[model.id]
                            + list(DAO.get_descendant_outcomes(model).values_list("pk", flat=True))
                        )
                    )
                )
            if object_type == ObjectType.OUTCOME:
                outcomes_list = [object_id] + list(
                    DAO.get_descendant_outcomes(model).values_list("pk", flat=True)
                )
                extra_data = RefreshSerializerNode(
                    Node.objects.filter(outcomes__in=outcomes_list),
                    many=True,
                ).data
                outcomes_to_update = RefreshSerializerOutcome(
                    Outcome.objects.filter(horizontal_outcomes__in=outcomes_list),
                    many=True,
                ).data
            if object_type == ObjectType.WEEK:
                throughparent = WeekWorkflow.objects.get(week=model)
                throughparent_id = throughparent.id
                parent_id = workflow.id
                throughparent_index = (
                    workflow.weekworkflow_set.exclude(week__deleted=True)
                    .filter(rank__lt=throughparent.rank)
                    .count()
                )
            elif object_type == ObjectType.COLUMN:
                throughparent = ColumnWorkflow.objects.get(column=model)
                throughparent_id = throughparent.id
                throughparent_index = (
                    workflow.columnworkflow_set.exclude(column__deleted=True)
                    .filter(rank__lt=throughparent.rank)
                    .count()
                )
                extra_data = [x.id for x in Node.objects.filter(column=model)]
                parent_id = workflow.id

            elif object_type == ObjectType.NODE:
                throughparent = NodeWeek.objects.get(node=model)
                throughparent_id = throughparent.id
                throughparent_index = (
                    throughparent.week.nodeweek_set.exclude(node__deleted=True)
                    .filter(rank__lt=throughparent.rank)
                    .count()
                )
                parent_id = throughparent.week.id

            elif object_type == ObjectType.NODELINK:
                throughparent_id = None
                parent_id = Node.objects.get(outgoing_links=model).id

            elif object_type == ObjectType.OUTCOME and model.depth == 0:
                throughparent = OutcomeWorkflow.objects.get(outcome=model)
                throughparent_id = throughparent.id
                throughparent_index = (
                    workflow.outcomeworkflow_set.exclude(outcome__deleted=True)
                    .filter(rank__lt=throughparent.rank)
                    .count()
                )
                parent_id = workflow.id
                object_type = "outcome_base"

            elif object_type == ObjectType.OUTCOME:
                throughparent = OutcomeOutcome.objects.get(child=model)
                throughparent_id = throughparent.id
                throughparent_index = (
                    throughparent.parent.child_outcome_links.exclude(child__deleted=True)
                    .filter(rank__lt=throughparent.rank)
                    .count()
                )
                parent_id = throughparent.parent.id

        except (ProtectedError, ObjectDoesNotExist):
            return Response({"error": "ObjectDoesNotExist"}, status=400)

        if workflow is not None:
            action = WorkflowUpdateEmitter.restore_self_action(
                object_id,
                object_type,
                parent_id,
                throughparent_id,
                throughparent_index,
                extra_data,
            )
            WorkflowUpdateEmitter.emit_workflow_update(
                workflow,
                action,
            )
            if object_type == "outcome" or object_type == "outcome_base":
                WorkflowUpdateEmitter.dispatch_to_parent_wf(
                    workflow,
                    action,
                )
                if linked_workflows:
                    for wf in linked_workflows:
                        WorkflowUpdateEmitter.emit_workflow_update(wf, action)
                        WorkflowUpdateEmitter.emit_workflow_update(
                            wf,
                            WorkflowUpdateEmitter.update_horizontal_links(
                                {"data": outcomes_to_update}
                            ),
                        )
        if object_type != "outcome" and object_type != "outcome_base" and linked_workflows:
            for wf in linked_workflows:
                WorkflowUpdateEmitter.emit_parent_updated(wf)
        if object_type in ["workflow", "activity", "course", "program"]:
            for parent_workflow in parent_workflows:
                WorkflowUpdateEmitter.emit_child_updated(parent_workflow, model.get_workflow())

        return Response({"message": "success"}, status=status.HTTP_200_OK)
