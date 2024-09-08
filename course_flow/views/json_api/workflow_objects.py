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


@user_can_view(False)
@user_can_edit(False, get_parent=True)
def json_api_post_insert_sibling(request: HttpRequest) -> JsonResponse:
    """
    Add a new sibling to a through model
    :param request:
    :return:
    """
    body = json.loads(request.body)
    object_id = body.get("objectID")
    object_type = body.get("objectType")
    parent_id = body.get("parentID")
    parent_type = body.get("parentType")
    through_type = body.get("throughType")
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        parent = get_model_from_str(parent_type).objects.get(id=parent_id)
        if parent_type == object_type:
            old_through_kwargs = {"child": model, "parent": parent}
        else:
            old_through_kwargs = {object_type: model, parent_type: parent}
        through = get_model_from_str(through_type).objects.get(
            **old_through_kwargs
        )

        if object_type == "week":
            defaults = {"week_type": model.week_type}
        elif object_type == "node":
            defaults = {"column": model.column, "node_type": model.node_type}
        elif object_type == "column":
            defaults = {"column_type": math.floor(model.column_type / 10) * 10}
        elif object_type == "outcome":
            defaults = {"depth": model.depth}
        else:
            defaults = {}

        new_model = get_model_from_str(object_type).objects.create(
            author=request.user, **defaults
        )
        if parent_type == object_type:
            new_through_kwargs = {"child": new_model, "parent": parent}
        else:
            new_through_kwargs = {object_type: new_model, parent_type: parent}
        new_through_model = get_model_from_str(through_type).objects.create(
            **new_through_kwargs, rank=through.rank + 1
        )
        new_model_serialized = serializer_lookups_shallow[object_type](
            new_model
        ).data
        new_through_serialized = serializer_lookups_shallow[through_type](
            new_through_model
        ).data
        if object_type == "outcome":
            outcomenodes = OutcomeNode.objects.filter(outcome=new_model)
            outcomenodes_serialized = OutcomeNodeSerializerShallow(
                outcomenodes, many=True
            ).data
            node_updates = NodeSerializerShallow(
                [x.node for x in outcomenodes], many=True
            ).data
            children = {
                "outcomenode": outcomenodes_serialized,
                "outcome": [],
                "outcomeoutcome": [],
            }
        else:
            children = None
            node_updates = []

    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "new_model": new_model_serialized,
        "new_through": new_through_serialized,
        "children": children,
        "node_updates": node_updates,
        "parentID": parent_id,
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
    return JsonResponse({"action": "posted"})


# Add a parent outcome to an outcome
@user_can_edit("outcomePk")
@user_can_view(False)
def json_api_post_update_outcomehorizontallink_degree(
    request: HttpRequest,
) -> JsonResponse:
    outcome_id = body.get("outcomePk")
    object_type = body.get("objectType")
    parent_id = body.get("objectID")
    degree = body.get("degree")
    try:
        outcome = Outcome.objects.get(id=outcome_id)
        parent_outcome = get_model_from_str(object_type).objects.get(
            id=parent_id
        )
        workflow = outcome.get_workflow()
        parent_workflow = parent_outcome.get_workflow()
        if not check_possible_parent(workflow, parent_workflow, True):
            raise ValidationError
        if (
            OutcomeHorizontalLink.objects.filter(
                parent_outcome=parent_outcome, outcome=outcome, degree=degree
            ).count()
            > 0
        ):
            return JsonResponse(
                {"action": "posted", "outcomehorizontallink": -1}
            )
        model = OutcomeHorizontalLink.objects.create(
            outcome=outcome, parent_outcome=parent_outcome, degree=degree
        )
        new_outcomehorizontallinks = OutcomeHorizontalLinkSerializerShallow(
            [model]
            + model.check_parent_outcomes()
            + model.check_child_outcomes(),
            many=True,
        ).data
        OutcomeHorizontalLink.objects.filter(
            outcome=outcome, degree=0
        ).delete()
        new_outcome_data = OutcomeSerializerShallow(model.outcome).data
        new_outcome_horizontal_links = new_outcome_data[
            "outcome_horizontal_links"
        ]
        new_outcome_horizontal_links_unique = new_outcome_data[
            "outcome_horizontal_links_unique"
        ]
    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "data_package": new_outcomehorizontallinks,
        "new_outcome_horizontal_links": new_outcome_horizontal_links,
        "new_outcome_horizontal_links_unique": new_outcome_horizontal_links_unique,
    }
    actions.dispatch_wf(
        workflow,
        actions.updateOutcomehorizontallinkDegreeAction(response_data),
    )
    actions.dispatch_to_parent_wf(
        workflow,
        actions.updateOutcomehorizontallinkDegreeAction(response_data),
    )
    return JsonResponse({"action": "posted"})


# Add an object set to a project
@user_can_edit("projectPk")
def json_api_post_add_object_set(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    project = Project.objects.get(pk=body.get("projectPk"))
    term = body.get("term")
    title = body.get("title")
    translation_plural = body.get("translation_plural")
    try:
        project.object_sets.create(
            term=term,
            title=title,
            translation_plural=translation_plural,
        )
    except ValidationError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "new_dict": ProjectSerializerShallow(project).data["object_sets"],
        }
    )
