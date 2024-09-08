import json
import math

from django.core.exceptions import ValidationError
from django.http import HttpRequest, JsonResponse

from course_flow.decorators import (
    user_can_edit,
    user_can_view,
    user_can_view_or_none,
    user_is_teacher,
)
from course_flow.duplication_functions import (
    duplicate_column,
    fast_duplicate_week,
)
from course_flow.forms import CreateProject
from course_flow.models import (
    Column,
    Node,
    Notification,
    ObjectPermission,
    ObjectSet,
    Outcome,
    Project,
    User,
    Week,
    Workflow,
)
from course_flow.models.relations import (
    ColumnWorkflow,
    NodeWeek,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    WeekWorkflow,
)
from course_flow.serializers import (
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    serializer_lookups_shallow,
)
from course_flow.sockets import redux_actions as actions
from course_flow.utils import get_model_from_str


@user_can_edit("weekPk")
@user_can_view_or_none("columnPk")
def json_api_post_new_node(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
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

    response_data = {
        "new_model": NodeSerializerShallow(node).data,
        "new_through": NodeWeekSerializerShallow(node_week).data,
        "index": position,
        "parentID": week_id,
        "columnworkflow": ColumnWorkflowSerializerShallow(columnworkflow).data,
        "column": ColumnSerializerShallow(column).data,
    }
    actions.dispatch_wf(
        week.get_workflow(), actions.newNodeAction(response_data)
    )
    return JsonResponse({"action": "posted"})
