import json
import math
import re

import bleach
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.http import HttpRequest, JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

from course_flow.forms import CreateProject

from course_flow.decorators import (
    check_object_permission,
    user_can_comment,
    user_can_edit,
    user_can_view,
    user_can_view_or_none,
)
from course_flow.duplication_functions import (
    duplicate_column,
    fast_duplicate_week,
)
from course_flow.models import (
    Column,
    Node,
    Notification,
    ObjectPermission,
    ObjectSet,
    Outcome,
    User,
    Week,
    Workflow,
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
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    ProjectSerializerShallow,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
    serializer_lookups_shallow,
)
from course_flow.sockets import redux_actions as actions
from course_flow.utils import get_model_from_str

###############################################
# JSON API to create workflow objects
###############################################


@user_can_edit("weekPk")
@user_can_view_or_none("columnPk")
def json_api_post_new_node(request: HttpRequest) -> JsonResponse:
    week_id = json.loads(request.POST.get("weekPk"))
    column_id = json.loads(request.POST.get("columnPk"))
    column_type = json.loads(request.POST.get("columnType"))
    position = json.loads(request.POST.get("position"))
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
    workflow_id = json.loads(request.POST.get("workflowPk"))
    workflow = Workflow.objects.get(pk=workflow_id)
    objectset_id_json = request.POST.get("objectsetPk")
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


@user_can_edit("workflowPk")
@user_can_view(False)
def json_api_post_add_strategy(request: HttpRequest) -> JsonResponse:
    workflow_id = json.loads(request.POST.get("workflowPk"))
    strategy_id = json.loads(request.POST.get("objectID"))
    strategy_type = json.loads(request.POST.get("objectType"))
    position = json.loads(request.POST.get("position"))
    workflow = Workflow.objects.get(pk=workflow_id)
    strategy = get_model_from_str(strategy_type).objects.get(pk=strategy_id)
    try:
        if strategy.author == request.user or strategy.published:
            # first, check compatibility between types (activity/course)
            if strategy.type != workflow.type:
                raise ValidationError("Mismatch between types")
            # create a copy of the strategy (the first/only week in the strategy
            # workflow). Note that all the nodes, at this point, are pointed at
            # the columns from the OLD workflow
            if position < 0 or position > workflow.weeks.count():
                position = workflow.weeks.count()
            old_week = strategy.weeks.first()
            week = fast_duplicate_week(old_week, request.user)
            week.title = strategy.title
            week.is_strategy = True
            week.original_strategy = strategy
            week.save()
            new_through = WeekWorkflow.objects.create(
                week=week, workflow=workflow, rank=position
            )
            # now, check for missing columns. We try to create a one to one
            # relationship between the columns, and then add in any that are
            # still missing
            old_columns = []
            for node in week.nodes.all():
                if node.column not in old_columns:
                    old_columns.append(node.column)
            new_columns = []
            columnworkflows_added = []
            columns_added = []
            for column in old_columns:
                # check for a new column with same type
                columns_type = workflow.columns.filter(
                    column_type=column.column_type
                ).exclude(id__in=map(lambda x: x.id, new_columns))
                if columns_type.count() == 1:
                    new_columns.append(columns_type.first())
                    continue
                if columns_type.count() == 0:
                    added_column = duplicate_column(column, request.user)
                    columnworkflows_added.append(
                        ColumnWorkflow.objects.create(
                            column=added_column,
                            workflow=workflow,
                            rank=workflow.columns.count(),
                        )
                    )
                    new_columns.append(added_column)
                    columns_added.append(added_column)
                    continue
                if columns_type.count() > 1:
                    # if we have multiple columns of that type, check to see if
                    # any have this one as their parent
                    columns_parent = columns_type.filter(parent_column=column)
                    if columns_parent.count() == 1:
                        new_columns.append(columns_parent.first())
                        continue
                    if columns_parent.count() > 1:
                        columns_type = columns_parent
                    # check to see if any have the same title
                    columns_title = columns_type.filter(title=column.title)
                    if columns_title.count() >= 1:
                        new_columns.append(columns_title.first())
                        continue
                    else:
                        new_columns.append(columns_type.first())
            # go through all the nodes and fill them in with our updated columns
            for node in week.nodes.all():
                column_index = old_columns.index(node.column)
                node.column = new_columns[column_index]
                node.save()

            # return all this information to the user
            response_data = {
                "strategy": WeekSerializerShallow(week).data,
                "new_through": WeekWorkflowSerializerShallow(new_through).data,
                "index": position,
                "columns_added": ColumnSerializerShallow(
                    columns_added, many=True
                ).data,
                "columnworkflows_added": ColumnWorkflowSerializerShallow(
                    columnworkflows_added, many=True
                ).data,
                "nodeweeks_added": NodeWeekSerializerShallow(
                    week.nodeweek_set, many=True
                ).data,
                "nodes_added": NodeSerializerShallow(
                    week.nodes.all(), many=True
                ).data,
                "nodelinks_added": NodeLinkSerializerShallow(
                    NodeLink.objects.filter(
                        source_node__in=week.nodes.all(),
                        target_node__in=week.nodes.all(),
                    ),
                    many=True,
                ).data,
            }
            actions.dispatch_wf(
                workflow, actions.newStrategyAction(response_data)
            )
            return JsonResponse({"action": "posted"})

        else:
            raise ValidationError("User cannot access this strategy")
    except ValidationError:
        return JsonResponse({"action": "error"})


@user_can_edit("nodePk")
@user_can_edit(False)
def json_api_post_new_node_link(request: HttpRequest) -> JsonResponse:
    node_id = json.loads(request.POST.get("nodePk"))
    target_id = json.loads(request.POST.get("objectID"))
    target_type = json.loads(request.POST.get("objectType"))
    source_port = json.loads(request.POST.get("sourcePort"))
    target_port = json.loads(request.POST.get("targetPort"))
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


# Add a new child to a model
@user_can_edit(False)
def json_api_post_insert_child(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))

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


# Add a new sibling to a through model
@user_can_view(False)
@user_can_edit(False, get_parent=True)
def json_api_post_insert_sibling(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("parentID"))
    parent_type = json.loads(request.POST.get("parentType"))
    through_type = json.loads(request.POST.get("throughType"))
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


@login_required
@require_POST
def json_api_post_create_project(request: HttpRequest) -> JsonResponse:
    # instantiate the form with the JSON params
    form = CreateProject(json.loads(request.body))

    # if the form is valid, save it and return a success response
    # along with the redirect URL to the newly created project
    if form.is_valid():
        # form.save()
        # return reverse(
        #     "course_flow:project-update", kwargs={"pk": self.object.pk}
        # )
        return JsonResponse({"action": "posted"})

    # otherwise, return the errors so UI can display errors accordingly
    return JsonResponse({"action": "error", "errors": form.errors})


# Add an object set to a project
@user_can_edit("projectPk")
def json_api_post_add_object_set(request: HttpRequest) -> JsonResponse:
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    term = json.loads(request.POST.get("term"))
    title = json.loads(request.POST.get("title"))
    translation_plural = json.loads(request.POST.get("translation_plural"))
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
