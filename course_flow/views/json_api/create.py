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

#########################################################
# JSON API to create workflow objects
#########################################################


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


@user_can_edit("workflowPk")
def json_api_post_new_outcome_for_workflow(
    request: HttpRequest,
) -> JsonResponse:
    body = json.loads(request.body)
    workflow_id = body.get("workflowPk")
    workflow = Workflow.objects.get(pk=workflow_id)
    objectset_id_json = body.get("objectsetPk")
    if objectset_id_json is not None:
        objectset_id = json.loads(objectset_id_json)
    else:
        objectset_id = None
    try:
        outcome = Outcome.objects.create(author=request.user)
        if objectset_id is not None:
            objectset = ObjectSet.objects.get(id=objectset_id)
            outcome.sets.add(objectset)
        outcome_workflow = OutcomeWorkflow.objects.create(
            workflow=workflow, outcome=outcome, rank=workflow.outcomes.count()
        )
    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "new_model": OutcomeSerializerShallow(outcome).data,
        "new_through": OutcomeWorkflowSerializerShallow(outcome_workflow).data,
        "parentID": workflow_id,
    }
    actions.dispatch_wf(workflow, actions.newOutcomeAction(response_data))
    actions.dispatch_to_parent_wf(
        workflow, actions.newOutcomeAction(response_data)
    )

    return JsonResponse({"action": "posted"})


#########################################################
# ??
#########################################################


@user_can_edit(False)
def json_api_post_insert_child(request: HttpRequest) -> JsonResponse:
    """
    Add a new child to a model (??)
    :param request:
    :return:
    """
    body = json.loads(request.body)
    object_id = body.get("objectID")
    object_type = body.get("objectType")

    try:
        if object_type == "outcome":
            model = Outcome.objects.get(id=object_id)
            newmodel = Outcome.objects.create(
                author=model.author, depth=model.depth + 1
            )
            newrank = model.children.count()
            newthroughmodel = OutcomeOutcome.objects.create(
                parent=model, child=newmodel, rank=newrank
            )
            newmodel.refresh_from_db()
            new_model_serialized = OutcomeSerializerShallow(newmodel).data
            new_through_serialized = OutcomeOutcomeSerializerShallow(
                newthroughmodel
            ).data
            outcomenodes = OutcomeNode.objects.filter(outcome=newmodel)
            outcomenodes_serialized = OutcomeNodeSerializerShallow(
                outcomenodes, many=True
            ).data
            node_updates = NodeSerializerShallow(
                [x.node for x in outcomenodes], many=True
            ).data
        else:
            raise ValidationError("Uknown component type")

    except ValidationError:
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
        "parentID": model.id,
    }
    workflow = model.get_workflow()
    actions.dispatch_wf(
        workflow,
        actions.insertChildAction(response_data, object_type),
    )
    if object_type == "outcome":
        actions.dispatch_to_parent_wf(
            workflow, actions.insertChildAction(response_data, "outcome")
        )
    return JsonResponse({"action": "posted"})


#########################################################
# ?
#########################################################


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


@user_is_teacher()
def json_api_post_create_project(request: HttpRequest) -> JsonResponse:
    # instantiate the form with the JSON params
    data = json.loads(request.body)
    form = CreateProject(json.loads(request.body))

    # if the form is valid, save it and return a success response
    # along with the redirect URL to the newly created project
    if form.is_valid():
        project = form.save()
        project.author = request.user
        project.save()

        # Create the object sets, if any
        object_sets = data["objectSets"]
        for object_set in object_sets:
            title = "Untitled Set"
            if object_set["label"] is not None and object_set["label"] != "":
                title = object_set["label"]
            project.object_sets.create(term=object_set["type"], title=title)

        return JsonResponse(
            {
                "action": "posted",
                "redirect": reverse(
                    "course_flow:project-update", kwargs={"pk": project.pk}
                ),
            }
        )

    # otherwise, return the errors so UI can display errors accordingly
    return JsonResponse({"action": "error", "errors": form.errors})


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
