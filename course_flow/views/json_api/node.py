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
    fast_duplicate_workflow,
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
    WorkflowProject,
)
from course_flow.models.relations import (
    ColumnWorkflow,
    NodeLink,
    NodeWeek,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    WeekWorkflow,
)
from course_flow.serializers import (
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    LinkedWorkflowSerializerShallow,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    serializer_lookups_shallow,
)
from course_flow.sockets import redux_actions as actions
from course_flow.utils import check_possible_parent, get_model_from_str


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


@user_can_edit("nodePk")
@user_can_view_or_none("workflowPk")
def json_api_post_set_linked_workflow(request: HttpRequest) -> JsonResponse:
    """

        @todo ??

     # The actual JSON API which sets the linked workflow
    # for a node, adding it to the project if different.
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
            if not check_possible_parent(workflow, parent_workflow, False):
                raise ValidationError
            set_linked_workflow(node, workflow)
            if node.linked_workflow is None:
                raise ValidationError("Project could not be found")
            linked_workflow = node.linked_workflow.id
            linked_workflow_data = LinkedWorkflowSerializerShallow(
                node.linked_workflow,
                context={"user": request.user},
            ).data

    except ValidationError:
        return JsonResponse({"action": "error"})
    response_data = {
        "id": node_id,
        "linked_workflow": linked_workflow,
        "linked_workflow_data": linked_workflow_data,
    }
    if original_workflow is not None:
        actions.dispatch_parent_updated(original_workflow)
    if workflow is not None:
        actions.dispatch_parent_updated(workflow)
    actions.dispatch_wf(
        parent_workflow, actions.setLinkedWorkflowAction(response_data)
    )
    return JsonResponse({"action": "posted"})


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
            new_workflow = fast_duplicate_workflow(
                workflow, node.author, project
            )
            WorkflowProject.objects.create(
                workflow=new_workflow, project=project
            )
            node.linked_workflow = new_workflow
            node.save()
        except ValidationError:
            pass


@user_can_edit("nodePk")
@user_can_edit(False)
def json_api_post_new_node_link(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    node_id = body.get("nodePk")
    target_id = body.get("objectID")
    target_type = body.get("objectType")
    source_port = body.get("sourcePort")
    target_port = body.get("targetPort")
    node = Node.objects.get(pk=node_id)
    target = get_model_from_str(target_type).objects.get(pk=target_id)
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

    response_data = {
        "new_model": NodeLinkSerializerShallow(node_link).data,
    }
    actions.dispatch_wf(
        node.get_workflow(), actions.newNodeLinkAction(response_data)
    )
    return JsonResponse({"action": "posted"})
