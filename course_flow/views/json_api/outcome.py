import json
import logging

from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db.models import ProtectedError
from django.http import HttpRequest, JsonResponse

from course_flow.apps import logger
from course_flow.decorators import (
    from_same_workflow,
    user_can_edit,
    user_can_view,
)
from course_flow.models import Node, ObjectSet, Outcome, Workflow
from course_flow.models.relations import (
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
)
from course_flow.serializers import (
    NodeSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
)
from course_flow.sockets.emitters import WorkflowUpdateEmitter


@user_can_edit("nodePk")
@user_can_view("outcomePk")
@from_same_workflow("nodePk", "outcomePk")
def json_api_post_update_outcomenode_degree(
    request: HttpRequest,
) -> JsonResponse:
    """
    # Links an outcome to a node
    """
    body = json.loads(
        request.body
    )  # note this is using django directl and not DRF, we are bypassing the middleware for case conversion
    node_id = body.get("nodePk")
    outcome_id = body.get("outcomePk")
    degree = body.get("degree")

    try:
        node = Node.objects.get(id=node_id)
        workflow = node.get_workflow()
        if (
            OutcomeNode.objects.filter(
                node__id=node_id, outcome__id=outcome_id, degree=degree
            ).count()
            > 0
        ):
            return JsonResponse({"message": "success", "outcomenode": -1})
        model = OutcomeNode.objects.create(
            node=node,
            outcome=Outcome.objects.get(id=outcome_id),
            degree=degree,
        )
        new_outcomenodes = OutcomeNodeSerializerShallow(
            [model] + model.check_parent_outcomes() + model.check_child_outcomes(),
            many=True,
        ).data
        OutcomeNode.objects.filter(node=model.node, degree=0).delete()
        new_node_data = NodeSerializerShallow(model.node).data
        new_outcomenode_set = new_node_data["outcomenode_set"]
        new_outcomenode_unique_set = new_node_data["outcomenode_unique_set"]
    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    response_data = {
        "data_package": new_outcomenodes,
        "new_outcomenode_set": new_outcomenode_set,
        "new_outcomenode_unique_set": new_outcomenode_unique_set,
    }

    # here the developer is dyanmically sending back a socket msg
    # WITH a redux action type attached to it
    # the original idea being i guess to be for the backend to be in charge of whether the frontend
    # update store ... look for all WorkflowUpdateEmitter.* commands and fix them
    update_action = WorkflowUpdateEmitter.update_outcomenode_degree_action(response_data)

    WorkflowUpdateEmitter.emit_workflow_update(
        workflow,
        update_action,
    )
    if node.linked_workflow is not None:
        WorkflowUpdateEmitter.emit_workflow_update(
            node.linked_workflow,
            update_action,
        )
    return JsonResponse({"message": "success"})


@user_can_edit(False)
def json_api_post_insert_child_outcome(request: HttpRequest) -> JsonResponse:
    """
    Add a new child to a model (??)
    :param request:
    :return:
    """
    body = json.loads(
        request.body
    )  # note this is using django directl and not DRF, we are bypassing the middleware for case conversion
    object_id = body.get("objectID")
    object_type = body.get("objectType")

    try:
        if object_type == "outcome":
            model = Outcome.objects.get(id=object_id)
            newmodel = Outcome.objects.create(author=model.author, depth=model.depth + 1)
            newrank = model.children.count()
            newthroughmodel = OutcomeOutcome.objects.create(
                parent=model, child=newmodel, rank=newrank
            )
            newmodel.refresh_from_db()
            new_model_serialized = OutcomeSerializerShallow(newmodel).data
            new_through_serialized = OutcomeOutcomeSerializerShallow(newthroughmodel).data
            outcomenodes = OutcomeNode.objects.filter(outcome=newmodel)
            outcomenodes_serialized = OutcomeNodeSerializerShallow(outcomenodes, many=True).data
            node_updates = NodeSerializerShallow([x.node for x in outcomenodes], many=True).data
        else:
            raise ValidationError("Uknown component type")

    except ValidationError as e:
        logger.exception("An error occurred")
        return JsonResponse({"action": "error"})

    response_data = {
        "new_model": new_model_serialized,
        "new_through": new_through_serialized,
        "children": {
            "outcomenode": outcomenodes_serialized,
            "outcome": [],
            "outcomeoutcome": [],
        },
        "node_updates": node_updates,
        "parentId": model.id,
    }
    workflow = model.get_workflow()
    WorkflowUpdateEmitter.emit_workflow_update(
        workflow,
        WorkflowUpdateEmitter.insert_child_action(response_data, object_type),
    )
    if object_type == "outcome":
        WorkflowUpdateEmitter.dispatch_to_parent_wf(
            workflow, WorkflowUpdateEmitter.insert_child_action(response_data, "outcome")
        )
    return JsonResponse({"message": "success"})


@user_can_edit("workflowPk")
def json_api_post_new_outcome_for_workflow(
    request: HttpRequest,
) -> JsonResponse:
    body = json.loads(
        request.body
    )  # note this is using django directl and not DRF, we are bypassing the middleware for case conversion
    workflow_id = body.get("workflowPk")
    workflow = Workflow.objects.get(pk=workflow_id)
    objectset_id = body.get("objectsetPk")

    try:
        outcome = Outcome.objects.create(author=request.user)
        if objectset_id is not None:
            objectset = ObjectSet.objects.get(id=objectset_id)
            outcome.sets.add(objectset)
        outcome_workflow = OutcomeWorkflow.objects.create(
            workflow=workflow, outcome=outcome, rank=workflow.outcomes.count()
        )
    except ValidationError as e:
        logger.exception("An error occurred")
        return JsonResponse({"action": "error"})

    response_data = {
        "new_model": OutcomeSerializerShallow(outcome).data,
        "new_through": OutcomeWorkflowSerializerShallow(outcome_workflow).data,
        "parentId": workflow_id,
    }
    WorkflowUpdateEmitter.emit_workflow_update(
        workflow, WorkflowUpdateEmitter.new_outcome_action(response_data)
    )
    WorkflowUpdateEmitter.dispatch_to_parent_wf(
        workflow, WorkflowUpdateEmitter.new_outcome_action(response_data)
    )

    return JsonResponse({"message": "success"})
