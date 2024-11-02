import json
import logging

from django.core.exceptions import ValidationError
from django.http import HttpRequest, JsonResponse
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.apps import logger
from course_flow.decorators import user_can_edit, user_can_view_or_none
from course_flow.models import Column, Node, Week
from course_flow.models.relations import (
    ColumnWorkflow,
    NodeLink,
    NodeWeek,
    WeekWorkflow,
)
from course_flow.serializers import (
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
)
from course_flow.services import DAO
from course_flow.sockets.emitters import WorkflowUpdateEmitter


class NodeEndpoint:
    @staticmethod
    @user_can_edit("weekPk")
    @user_can_view_or_none("columnPk")
    @api_view(["POST"])
    def create(request: Request) -> Response:
        body = json.loads(
            request.body
        )  # note this is using django directl and not DRF, we are bypassing the middleware for case conversion
        week_id = body.get("weekPk")
        column_id = body.get("columnPk")
        column_type = body.get("columnType")
        position = body.get("position")
        week = Week.objects.get(pk=week_id)

        try:
            if column_id is not None and column_id >= 0:
                column = Column.objects.get(pk=column_id)
                columnworkflow = ColumnWorkflow.objects.get(column=column)
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
            return Response({"action": "error"})

        response_data = {
            "new_model": NodeSerializerShallow(node).data,
            "new_through": NodeWeekSerializerShallow(node_week).data,
            "index": position,
            "parentId": week_id,
            "columnworkflow": ColumnWorkflowSerializerShallow(columnworkflow).data,
            "column": ColumnSerializerShallow(column).data,
        }

        # what
        WorkflowUpdateEmitter.emit_workflow_update(
            week.get_workflow(), WorkflowUpdateEmitter.new_node_action(response_data)
        )

        return Response({"message": "success"})

    @staticmethod
    @api_view(["POST"])
    @user_can_edit("nodePk")
    @user_can_edit(False)
    def node_link__create(request: Request) -> Response:
        body = json.loads(
            request.body
        )  # note this is using django directl and not DRF, we are bypassing the middleware for case conversion
        node_id = body.get("nodePk")
        target_id = body.get("objectID")
        target_type = body.get("objectType")
        source_port = body.get("sourcePort")
        target_port = body.get("targetPort")
        node = Node.objects.get(pk=node_id)
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
            return JsonResponse({"action": "error"})

        response_data = {
            "new_model": NodeLinkSerializerShallow(node_link).data,
        }

        WorkflowUpdateEmitter.emit_workflow_update(
            node.get_workflow(), WorkflowUpdateEmitter.new_node_link_action(response_data)
        )

        return Response({"message": "success"})
