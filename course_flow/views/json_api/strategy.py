import json

from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.utils.translation import gettext as _

from course_flow.decorators import user_can_edit, user_can_view
from course_flow.duplication_functions import (
    duplicate_column,
    fast_duplicate_week,
    fast_duplicate_workflow,
)
from course_flow.models import ColumnWorkflow, WeekWorkflow, Workflow
from course_flow.models.relations import NodeLink
from course_flow.serializers import (
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    InfoBoxSerializer,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
)
from course_flow.sockets import redux_actions as actions
from course_flow.utils import get_model_from_str

#########################################################
# @todo fix response shape
#########################################################


@user_can_view("workflowPk")
def json_api_post_duplicate_strategy(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    workflow = Workflow.objects.get(pk=body.get("workflowPk"))
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


#########################################################
# CREATE
#########################################################


@user_can_edit("workflowPk")
@user_can_view(False)
def json_api_post_add_strategy(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    workflow_id = body.get("workflowPk")
    strategy_id = body.get("objectID")
    strategy_type = body.get("objectType")
    position = body.get("position")
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
