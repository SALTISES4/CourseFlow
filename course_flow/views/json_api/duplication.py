import json

from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.utils.translation import gettext as _

from course_flow.decorators import user_can_edit, user_can_view
from course_flow.duplication_functions import (
    cleanup_workflow_post_duplication,
    duplicate_column,
    duplicate_node,
    fast_duplicate_outcome,
    fast_duplicate_project,
    fast_duplicate_week,
    fast_duplicate_workflow,
)
from course_flow.models.models import Project
from course_flow.models.relations.columnWorkflow import ColumnWorkflow
from course_flow.models.relations.nodeLink import NodeLink
from course_flow.models.relations.nodeWeek import NodeWeek
from course_flow.models.relations.outcomeNode import OutcomeNode
from course_flow.models.relations.outcomeOutcome import OutcomeOutcome
from course_flow.models.relations.outcomeWorkflow import OutcomeWorkflow
from course_flow.models.relations.weekWorkflow import WeekWorkflow
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.models.workflow import Workflow
from course_flow.serializers import (
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    InfoBoxSerializer,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
)
from course_flow.sockets import redux_actions as actions
from course_flow.utils import get_all_outcomes_for_outcome, get_model_from_str

#############################################
# JSON API for duplication of workflows and
# workflow objects
#############################################


@user_can_view("workflowPk")
@user_can_edit("projectPk")
def json_api_post_duplicate_workflow(request: HttpRequest) -> JsonResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    project = Project.objects.get(pk=request.POST.get("projectPk"))

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


@user_can_view("workflowPk")
def json_api_post_duplicate_strategy(request: HttpRequest) -> JsonResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        with transaction.atomic():
            clone = fast_duplicate_workflow(workflow, request.user, None)
            try:
                clone.title = clone.title + _("(copy)")
                clone.save()
            except (ValidationError, TypeError):
                pass
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "new_item": InfoBoxSerializer(
                clone, context={"user": request.user}
            ).data,
            "type": clone.type,
        }
    )


@user_can_view("projectPk")
def json_api_post_duplicate_project(request: HttpRequest) -> JsonResponse:
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        with transaction.atomic():
            clone = fast_duplicate_project(project, request.user)
            try:
                clone.title = clone.title + _("(copy)")
                clone.save()
            except (ValidationError, TypeError):
                pass
    except ValidationError:
        return JsonResponse({"action": "error"})

    return JsonResponse(
        {
            "action": "posted",
            "new_item": InfoBoxSerializer(
                clone, context={"user": request.user}
            ).data,
            "type": "project",
        }
    )


# Soft-duplicate the item
@user_can_view(False)
@user_can_edit(False, get_parent=True)
def json_api_post_duplicate_self(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))
    parent_type = json.loads(request.POST.get("parentType"))
    through_type = json.loads(request.POST.get("throughType"))  # noqa F841
    node_updates = []
    try:
        with transaction.atomic():
            if object_type == "week":
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                parent = get_model_from_str(parent_type).objects.get(
                    id=parent_id
                )
                through = WeekWorkflow.objects.get(week=model, workflow=parent)
                newmodel = fast_duplicate_week(model, request.user)
                newthroughmodel = WeekWorkflow.objects.create(
                    workflow=parent, week=newmodel, rank=through.rank + 1
                )
                try:
                    newmodel.title = newmodel.title + _("(copy)")
                    newmodel.save()
                except (ValidationError, TypeError):
                    pass
                new_model_serialized = WeekSerializerShallow(newmodel).data
                new_through_serialized = WeekWorkflowSerializerShallow(
                    newthroughmodel
                ).data
                new_children_serialized = {
                    "node": NodeSerializerShallow(
                        newmodel.nodes,
                        many=True,
                        context={"user": request.user},
                    ).data,
                    "nodeweek": NodeWeekSerializerShallow(
                        newmodel.nodeweek_set, many=True
                    ).data,
                    "outcomenode": OutcomeNodeSerializerShallow(
                        OutcomeNode.objects.filter(node__week=newmodel),
                        many=True,
                    ).data,
                    "nodelink": NodeLinkSerializerShallow(
                        NodeLink.objects.filter(source_node__week=newmodel),
                        many=True,
                    ).data,
                }
            elif object_type == "node":
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                parent = get_model_from_str(parent_type).objects.get(
                    id=parent_id
                )
                through = NodeWeek.objects.get(node=model, week=parent)
                newmodel = duplicate_node(model, request.user, None, None)
                newthroughmodel = NodeWeek.objects.create(
                    week=parent, node=newmodel, rank=through.rank + 1
                )
                try:
                    newmodel.title = newmodel.title + _("(copy)")
                    newmodel.save()
                except (ValidationError, TypeError):
                    pass
                new_model_serialized = NodeSerializerShallow(
                    newmodel, context={"user": request.user}
                ).data
                new_through_serialized = NodeWeekSerializerShallow(
                    newthroughmodel
                ).data
                new_children_serialized = {
                    "outcomenode": OutcomeNodeSerializerShallow(
                        OutcomeNode.objects.filter(node=newmodel), many=True
                    ).data,
                }
            elif object_type == "column":
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                parent = get_model_from_str(parent_type).objects.get(
                    id=parent_id
                )
                through = ColumnWorkflow.objects.get(
                    column=model, workflow=parent
                )
                newmodel = duplicate_column(model, request.user)
                newthroughmodel = ColumnWorkflow.objects.create(
                    workflow=parent, column=newmodel, rank=through.rank + 1
                )
                try:
                    newmodel.title = newmodel.title + _("(copy)")
                    newmodel.save()
                except (ValidationError, TypeError):
                    pass
                new_model_serialized = ColumnSerializerShallow(newmodel).data
                new_through_serialized = ColumnWorkflowSerializerShallow(
                    newthroughmodel
                ).data
                new_children_serialized = None
            elif object_type == "outcome":
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                newmodel = fast_duplicate_outcome(model, request.user)
                try:
                    newmodel.title = newmodel.title + _("(copy)")
                    newmodel.save()
                except (ValidationError, TypeError):
                    pass
                if parent_type == "outcome":
                    parent = get_model_from_str(parent_type).objects.get(
                        id=parent_id
                    )
                    through = OutcomeOutcome.objects.get(
                        child=model, parent=parent
                    )
                    newthroughmodel = OutcomeOutcome.objects.create(
                        parent=parent, child=newmodel, rank=through.rank + 1
                    )
                    new_through_serialized = OutcomeOutcomeSerializerShallow(
                        newthroughmodel
                    ).data
                elif parent_type == "workflow":
                    parent = get_model_from_str(parent_type).objects.get(
                        id=parent_id
                    )
                    through = OutcomeWorkflow.objects.get(
                        outcome=model, workflow=parent
                    )
                    newthroughmodel = OutcomeWorkflow.objects.create(
                        workflow=parent,
                        outcome=newmodel,
                        rank=through.rank + 1,
                    )
                    new_through_serialized = OutcomeWorkflowSerializerShallow(
                        newthroughmodel
                    ).data

                new_model_serialized = OutcomeSerializerShallow(newmodel).data
                outcomes, outcomeoutcomes = get_all_outcomes_for_outcome(
                    newmodel
                )
                outcomenodes = OutcomeNode.objects.filter(
                    outcome__id__in=[newmodel.id] + [x.id for x in outcomes]
                )
                node_updates = NodeSerializerShallow(
                    list(set([x.node for x in outcomenodes])),
                    many=True,
                ).data
                new_children_serialized = {
                    "outcome": OutcomeSerializerShallow(
                        outcomes, many=True
                    ).data,
                    "outcomeoutcome": OutcomeOutcomeSerializerShallow(
                        outcomeoutcomes, many=True
                    ).data,
                    "outcomenode": OutcomeNodeSerializerShallow(
                        outcomenodes, many=True
                    ).data,
                }
            else:
                raise ValidationError("Uknown component type")
    except ValidationError:
        return JsonResponse({"action": "error"})
    response_data = {
        "new_model": new_model_serialized,
        "new_through": new_through_serialized,
        "parentID": parent_id,
        "children": new_children_serialized,
        "node_updates": node_updates,
    }
    workflow = model.get_workflow()
    if object_type == "outcome" and through_type == "outcomeworkflow":
        object_type = "outcome_base"
    actions.dispatch_wf(
        workflow,
        actions.insertBelowAction(response_data, object_type),
    )
    if object_type == "outcome" or object_type == "outcome_base":
        actions.dispatch_to_parent_wf(
            workflow,
            actions.insertBelowAction(response_data, object_type),
        )

    linked_workflows = False
    if object_type == "node":
        linked_workflows = Workflow.objects.filter(linked_nodes=model)
    elif object_type == "week":
        linked_workflows = Workflow.objects.filter(linked_nodes__week=model)
    if linked_workflows:
        for wf in linked_workflows:
            actions.dispatch_parent_updated(wf)
    return JsonResponse({"action": "posted"})
