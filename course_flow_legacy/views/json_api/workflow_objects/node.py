import json
import logging
from datetime import timezone

from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from django.db.models import ProtectedError
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow_legacy.apps import logger
from course_flow_legacy.models import Column, Node, OutcomeNode, Week, Workflow
from course_flow_legacy.models.objectset import ObjectSet
from course_flow_legacy.models.relations import (
    ColumnWorkflow,
    NodeLink,
    NodeWeek,
    WeekWorkflow,
)
from course_flow_legacy.serializers import (
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    LinkedWorkflowSerializerShallow,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    OutcomeNodeSerializerShallow,
)
from course_flow_legacy.services import DAO
from course_flow_legacy.services.node import (
    duplicate_node,
    set_linked_workflow,
)
from course_flow_legacy.sockets.emitters import WorkflowUpdateEmitter
from course_flow_legacy.views.json_api._validators import (
    DeleteRequestSerializer,
)


class NodeEndpoint:
    @staticmethod
    # @user_can_edit("weekPk")
    # @user_can_view_or_none("columnPk")
    @api_view(["POST"])
    def create(request: Request) -> Response:
        body = request.data
        week_id = body.get("week_pk")
        column_id = body.get("column_pk")
        column_type = body.get("column_type")
        position = body.get("position")
        week = Week.objects.get(pk=week_id)

        try:
            # 1 get the column id
            if column_id is not None and column_id >= 0:
                column = Column.objects.get(pk=column_id)
                columnworkflow = ColumnWorkflow.objects.get(column=column)

            # 2 why get the column type , no creating column here
            elif column_type is not None and column_type >= 0:
                column = Column.objects.create(column_type=column_type, author=week.author)
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

            node = Node.objects.create(author=week.author, node_type=week.week_type, column=column)
            node_week = NodeWeek.objects.create(week=week, node=node, rank=position)

        except ValidationError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"}, status=status.HTTP_400_BAD_REQUEST)

        response_data = {
            "new_model": NodeSerializerShallow(node).data,
            "new_through": NodeWeekSerializerShallow(node_week).data,
            "index": position,
            "parent_id": week_id,
            "columnworkflow": ColumnWorkflowSerializerShallow(columnworkflow).data,
            "column": ColumnSerializerShallow(column).data,
        }

        # what
        WorkflowUpdateEmitter.emit_workflow_update(
            week.get_workflow(), WorkflowUpdateEmitter.new_node_action(response_data)
        )

        return Response({"message": "success"})

    @staticmethod
    # @user_can_delete(False)
    @api_view(["POST"])
    def delete(request: Request, pk: int) -> Response:
        """
         Hard delete. Deletes the record, instead of just marking a flag.
         Deletes properly cascaded through models:
         - nodeweek
         - nodecomment
         - node sets (node objectset)
         - outcome node


        :param pk:
        :param request:
        :return:
        """

        serializer = DeleteRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        object_id = pk
        try:
            model = Node.objects.get(id=object_id)
        except (ProtectedError, ObjectDoesNotExist):
            return Response(
                {
                    "error": "Object does not exist",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            model.delete()

        return Response({"message": "success"})

    @staticmethod
    # #@user_can_delete(False)
    @api_view(["POST"])
    def delete_soft(request: Request, pk: int) -> Response:
        """

        Soft delete the object by setting its 'deleted' property to True.
        Keeps linked workflows updated about the deletion status. [why?]
        :param request:
        :param pk:
        :return:
        """
        serializer = DeleteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # extract payload
        object_id = pk

        try:
            node = Node.objects.get(id=object_id)
        except (ProtectedError, ObjectDoesNotExist):
            return Response({"error": "Object does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        # Perform the soft delete
        with transaction.atomic():
            node.deleted = True
            node.deleted_on = timezone.now()
            node.save()

        return Response(
            {
                "message": "success",
            },
            status=status.HTTP_200_OK,
        )

    # might need to handle reranking again
    @staticmethod
    @api_view(["POST"])
    def restore(request: Request, pk: int) -> Response:
        """

        Restore from soft delete.  the object by setting its 'deleted' property to True.
        Keeps linked workflows updated about the deletion status. [why?]
        :param request:
        :param pk:
        :return:
        """
        serializer = DeleteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # extract payload
        object_id = pk

        try:
            node = Node.objects.get(id=object_id)
        except (ProtectedError, ObjectDoesNotExist):
            return Response({"error": "Object does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        # Perform the soft delete
        with transaction.atomic():
            node.deleted = False
            node.deleted_on = None
            node.save()

        return Response(
            {
                "message": "success",
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    # #@user_can_view(False)
    # #@user_can_edit(False, get_parent=True)
    @api_view(["POST"])
    def duplicate(request: Request, pk: int) -> Response:
        """
        When they are duplicated individually from the UI

        :param request:
        :return:
        """
        body = request.data
        node_id = pk
        object_type = body.get("object_type")
        week_id = body.get("parent_id")

        node_updates = []

        try:
            with transaction.atomic():
                node = Node.objects.get(id=node_id)
                week = Week.objects.get(id=week_id)
                through = NodeWeek.objects.get(node=node, week=week)

                new_node = duplicate_node(node, request.user, None, None)
                new_node_week = NodeWeek.objects.create(week=week, node=node, rank=through.rank + 1)

                try:
                    new_node.title = new_node.title + _("(copy)")
                    new_node.save()
                except (ValidationError, TypeError):
                    logger.exception("An error occurred")

                new_model_serialized = NodeSerializerShallow(
                    new_node, context={"user": request.user}
                ).data

                new_through_serialized = NodeWeekSerializerShallow(new_node_week).data

                new_children_serialized = {
                    "outcomenode": OutcomeNodeSerializerShallow(
                        OutcomeNode.objects.filter(node=new_node),
                        many=True,
                    ).data,
                }

        except ValidationError as e:
            logger.exception("An error occurred")
            return Response({"error": "ObjectDoesNotExist"}, status=400)

        response_data = {
            "new_model": new_model_serialized,
            "new_through": new_through_serialized,
            "parentId": week_id,
            "children": new_children_serialized,
            "node_updates": node_updates,
        }

        parent_workflow = node.get_workflow()

        WorkflowUpdateEmitter.emit_workflow_update(
            parent_workflow,
            WorkflowUpdateEmitter.insert_below_action(response_data, object_type),
        )

        if object_type == "outcome" or object_type == "outcome_base":
            WorkflowUpdateEmitter.dispatch_to_parent_wf(
                parent_workflow,
                WorkflowUpdateEmitter.insert_below_action(response_data, object_type),
            )

        linked_workflows = Workflow.objects.filter(linked_nodes=parent_workflow)

        # this needs review
        if linked_workflows:
            for wf in linked_workflows:
                WorkflowUpdateEmitter.emit_parent_updated(wf)

        return Response({"message": "success"}, status=status.HTTP_200_OK)

    @staticmethod
    @api_view(["POST"])
    # @user_can_edit("nodePk")
    # @user_can_edit(False)
    def node_link__create(request: Request, pk: int) -> Response:
        """
        really this is node node
        :param request:
        :return:
        """
        body = request.data

        node_id = pk
        target_id = body.get("object_id")
        target_type = body.get("object_type")
        source_port = body.get("source_port")
        target_port = body.get("target_port")

        # load original node
        node = Node.objects.get(pk=node_id)

        # load port target
        target = DAO.get_model_from_str(target_type).objects.get(pk=target_id)

        try:
            node_link = NodeLink.objects.create(
                author=node.author,
                source_node=node,
                target_node=target,
                source_port=source_port,
                target_port=target_port,
            )
        except ValidationError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"}, status=status.HTTP_400_BAD_REQUEST)

        # change from 'new_model'
        response_data = {
            "new_model": NodeLinkSerializerShallow(node_link).data,
        }

        # emit the update event for the updated workflow
        WorkflowUpdateEmitter.emit_workflow_update(
            node.get_workflow(), WorkflowUpdateEmitter.new_node_link_action(response_data)
        )

        return Response({"message": "success"})

    @staticmethod
    @api_view(["POST"])
    # @user_can_edit("nodePk")
    # @user_can_edit(False)
    def toggle_object_set(request: Request, pk: int) -> Response:
        """ """
        body = request.data

        node_id = pk
        object_set_id = body.get("object_set_id")

        if not object_set_id:
            return Response(
                {"error": "object_set_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            node = Node.objects.get(pk=node_id)
        except Node.DoesNotExist:
            return Response({"error": "Node not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            obj_set = ObjectSet.objects.get(pk=object_set_id)
        except ObjectSet.DoesNotExist:
            return Response({"error": "ObjectSet not found"}, status=status.HTTP_404_NOT_FOUND)

        if node.sets.filter(pk=obj_set.pk).exists():
            node.sets.remove(obj_set)
            return Response({"message": "ObjectSet removed from Node"}, status=status.HTTP_200_OK)
        else:
            node.sets.add(obj_set)
            return Response({"message": "ObjectSet added to Node"}, status=status.HTTP_200_OK)

    # @staticmethod
    # @api_view(["POST"])
    # # #@user_can_view(False)
    # # #@user_can_edit(False, get_parent=True)
    # def insert_sibling(request: Request) -> Response:
    #     """
    #      Creates a new Node
    #      why is this different from node create
    #      it doesn't handle re-ordering all the nodeweeks
    #
    #     :param request:
    #     :return:
    #     """
    #     data = request.data
    #     object_id = data.get("id")
    #     object_type = data.get("object_type")
    #     parent_id = data.get("parent_id")
    #     parent_type = data.get("parent_type")
    #     through_type = data.get("through_type")
    #
    #     try:
    #         node = Node.objects.get(id=object_id)
    #         week = Week.objects.get(id=parent_id)
    #
    #         through = NodeWeek.objects.get({object_type: node, parent_type: week})
    #
    #         defaults = {"column": node.column, "node_type": node.node_type}
    #
    #         new_node = Node.objects.create(
    #             author=request.user, **defaults
    #         )
    #
    #         new_through_kwargs = {object_type: new_node, parent_type: week}
    #         new_through_model = NodeWeek.objects.create(
    #             **new_through_kwargs, rank=through.rank + 1
    #         )
    #         new_node_serialized = NodeSerializerShallow(new_node).data
    #         new_node_week_serialized = NodeWeekSerializerShallow(new_through_model).data
    #
    #         children = None
    #         node_updates = []
    #
    #     except ValidationError as e:
    #         logger.exception("An error occurred")
    #         return Response({"action": "error"}, status=status.HTTP_400_BAD_REQUEST)
    #
    #     response_data = {
    #         "new_model": new_node_serialized,
    #         "new_through": new_node_week_serialized,
    #         "children": children,
    #         "node_updates": node_updates,
    #         "parentId": parent_id,
    #     }
    #     workflow = node.get_workflow()
    #
    #     WorkflowUpdateEmitter.emit_workflow_update(
    #         workflow,
    #         WorkflowUpdateEmitter.insert_below_action(response_data, object_type),
    #     )
    #
    #     return Response({"message": "success"}, status=status.HTTP_200_OK)

    @staticmethod
    @api_view(["POST"])
    # #@user_can_edit(False)
    # #@user_can_edit_or_none(False, get_parent=True)
    # #@user_can_edit_or_none("columnPk")
    # @from_same_workflow(False, False, get_parent=True)
    # @from_same_workflow(False, "columnPk")
    def update_position(request: Request, pk: int) -> Response:
        """
        @todo make this explanation meaningful
        # Called when an object in a list is reordered

        # legacy "Insert a model via its throughmodel to reorder it"
            use case:
                - re-order weeks
                - re-order columns
                ...
        :param request:
        :return:
        """
        body = request.data

        node_id = pk
        column_id = body.get("column_id")
        week_id = body.get("week_id")
        node: Node = Node.objects.get(id=node_id)
        rank = body.get("rank")

        # computed
        current_node_week: NodeWeek = NodeWeek.objects.get(node=node).first()
        parent_week: Week = Week.objects.get(id=current_node_week.week_id)
        new_node_week = current_node_week

        # Update ranks of other nodes in both the old and new weeks
        # Update ranks in affected weeks
        def update_ranks(week, moved_node_id):
            # Fetch all nodes in the week except the newly moved/updated node
            nodes_in_week = (
                NodeWeek.objects.filter(week=week).exclude(node_id=moved_node_id).order_by("rank")
            )
            current_rank = 1
            for nw in nodes_in_week:
                if current_rank == rank:
                    current_rank += 1  # Skip the rank where the new node is placed
                nw.rank = current_rank
                nw.save()
                current_rank += 1

        try:
            with transaction.atomic():
                #########################################################
                # UPDATE COLUMN
                #########################################################
                if column_id and column_id != node.column_id:
                    node.column = Column.objects.get(id=column_id)
                    node.save()

                #########################################################
                # UPDATE ORDER
                #########################################################
                # Determine new week object
                new_week = (
                    Week.objects.get(id=week_id)
                    if week_id and week_id != parent_week.id
                    else parent_week
                )

                # Reassign node to new week and rank or update rank
                if week_id != parent_week.id:
                    current_node_week.delete()  # Remove from current week
                    new_node_week: NodeWeek = NodeWeek.objects.create(
                        node=node, week=new_week, rank=rank
                    )
                else:
                    current_node_week.rank = rank
                    current_node_week.save()

                update_ranks(parent_week, node_id)
                if week_id != parent_week.id:
                    update_ranks(new_week)

                # emitter
                workflow = node.get_workflow()
                WorkflowUpdateEmitter.emit_workflow_update(
                    workflow,
                    WorkflowUpdateEmitter.change_through_id(
                        "node_week", current_node_week.id, new_node_week.id, {}
                    ),
                )

                return Response({"message": "Node reordered successfully"}, status=200)

        except ObjectDoesNotExist as e:
            return Response({"error": str(e)}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @staticmethod
    # @user_can_edit("nodePk")
    # @user_can_view_or_none("workflowPk")
    def link_to_workflow(request: Request) -> Response:
        """
            @todo ??
         The actual JSON API which sets the linked workflow
        for a node, adding it to the project is different.
            :param request:
            :return:
        """

        body = request.data
        try:
            node_id = body.get("node_pk")
            workflow_id = body.get("workflow_pk")
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
            return Response({"action": "error"}, status=status.HTTP_400_BAD_REQUEST)

        response_data = {
            "id": node_id,
            "linked_workflow": linked_workflow,
            "linked_workflow_data": linked_workflow_data,
        }
        if original_workflow is not None:
            WorkflowUpdateEmitter.emit_parent_updated(original_workflow)

        if workflow is not None:
            WorkflowUpdateEmitter.emit_parent_updated(workflow)

        WorkflowUpdateEmitter.emit_workflow_update(
            parent_workflow, WorkflowUpdateEmitter.set_linked_workflow_action(response_data)
        )

        return Response({"message": "Workflow successfully linked to node"})
