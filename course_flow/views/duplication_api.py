import json

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.http import HttpRequest, JsonResponse
from django.utils import timezone
from django.utils.translation import gettext as _

from course_flow import redux_actions as actions
from course_flow.decorators import user_can_edit, user_can_view
from course_flow.models import (
    Activity,
    Column,
    ColumnWorkflow,
    Course,
    Node,
    NodeLink,
    NodeWeek,
    ObjectSet,
    Outcome,
    OutcomeHorizontalLink,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    Program,
    Project,
    User,
    Week,
    WeekWorkflow,
    Workflow,
    WorkflowProject,
)
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
from course_flow.utils import (
    get_all_outcomes_for_outcome,
    get_all_outcomes_for_workflow,
    get_model_from_str,
)

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


#############################################
# Duplication methods that quickly duplicate
# workflows and workflow objects.
#############################################


# post-duplication cleanup. Setting the linked workflows.
# This must be done after the fact because the workflows have not
# necessarily been duplicated by the time the nodes are
def cleanup_workflow_post_duplication(workflow, project):
    for node in Node.objects.filter(week__workflow=workflow).exclude(
        linked_workflow=None
    ):
        new_linked_workflow = project.workflows.filter(
            parent_workflow=node.linked_workflow
        ).last()
        node.linked_workflow = new_linked_workflow
        node.save()


def duplicate_nodelink(
    nodelink: NodeLink, author: User, source_node: Node, target_node: Node
) -> NodeLink:
    new_nodelink = NodeLink.objects.create(
        title=nodelink.title,
        author=author,
        source_node=source_node,
        target_node=target_node,
        source_port=nodelink.source_port,
        target_port=nodelink.target_port,
        dashed=nodelink.dashed,
        is_original=False,
        deleted=nodelink.deleted,
    )

    return new_nodelink


def duplicate_node(
    node: Node, author: User, new_workflow: Workflow, outcome_ids
) -> Node:
    if new_workflow is not None:
        for new_column in new_workflow.columns.all():
            if (
                new_column == node.column
                or new_column.parent_column == node.column
            ):
                column = new_column
                break
    else:
        column = node.column
    new_node = Node.objects.create(
        title=node.title,
        description=node.description,
        author=author,
        node_type=node.node_type,
        column=column,
        task_classification=node.task_classification,
        context_classification=node.context_classification,
        has_autolink=node.has_autolink,
        represents_workflow=node.represents_workflow,
        time_required=node.time_required,
        time_units=node.time_units,
        is_original=False,
        parent_node=node,
        linked_workflow=node.linked_workflow,
        deleted=node.deleted,
    )

    for object_set in node.sets.all():
        if new_workflow is None:
            new_node.sets.add(object_set)

    for outcome in node.outcomes.all():
        if new_workflow is not None:
            new_outcome = Outcome.objects.get(
                parent_outcome=outcome, id__in=outcome_ids
            )
        else:
            new_outcome = outcome
        OutcomeNode.objects.create(
            outcome=new_outcome,
            node=new_node,
            rank=OutcomeNode.objects.get(node=node, outcome=outcome).rank,
        )

    return new_node


def duplicate_week(
    week: Week, author: User, new_workflow: Workflow, outcome_ids
) -> Week:
    new_week = Week.objects.create(
        title=week.title,
        description=week.description,
        author=author,
        is_original=False,
        parent_week=week,
        week_type=week.week_type,
        is_strategy=week.is_strategy,
        original_strategy=week.original_strategy,
        strategy_classification=week.strategy_classification,
        deleted=week.deleted,
    )

    for node in week.nodes.all():
        NodeWeek.objects.create(
            node=duplicate_node(node, author, new_workflow, outcome_ids),
            week=new_week,
            rank=NodeWeek.objects.get(node=node, week=week).rank,
        )

    return new_week


def duplicate_column(column: Column, author: User) -> Column:
    new_column = Column.objects.create(
        title=column.title,
        author=author,
        is_original=False,
        parent_column=column,
        column_type=column.column_type,
        deleted=column.deleted,
        colour=column.colour,
    )

    return new_column


def fast_column_copy(column, author, now):
    return Column(
        title=column.title,
        author=author,
        is_original=False,
        parent_column=column,
        column_type=column.column_type,
        created_on=now,
        deleted=column.deleted,
        colour=column.colour,
    )


def fast_week_copy(week, author, now):
    return Week(
        title=week.title,
        description=week.description,
        author=author,
        is_original=False,
        parent_week=week,
        week_type=week.week_type,
        is_strategy=week.is_strategy,
        original_strategy=week.original_strategy,
        strategy_classification=week.strategy_classification,
        created_on=now,
        deleted=week.deleted,
    )


def fast_node_copy(node, column, author, now, **kwargs):
    workflow_dict = kwargs.get("workflow_dict", None)
    linked_workflow = node.linked_workflow
    if linked_workflow is not None and workflow_dict is not None:
        linked_workflow = workflow_dict[linked_workflow.id]

    return Node(
        title=node.title,
        description=node.description,
        author=author,
        node_type=node.node_type,
        column=column,
        task_classification=node.task_classification,
        context_classification=node.context_classification,
        has_autolink=node.has_autolink,
        represents_workflow=node.represents_workflow,
        time_required=node.time_required,
        time_units=node.time_units,
        time_general_hours=node.time_general_hours,
        time_specific_hours=node.time_specific_hours,
        ponderation_theory=node.ponderation_theory,
        ponderation_individual=node.ponderation_individual,
        ponderation_practical=node.ponderation_practical,
        is_original=False,
        parent_node=node,
        linked_workflow=linked_workflow,
        created_on=now,
        deleted=node.deleted,
    )


def fast_nodelink_copy(nodelink, author, source_node, target_node):
    return NodeLink(
        title=nodelink.title,
        author=author,
        source_node=source_node,
        target_node=target_node,
        source_port=nodelink.source_port,
        target_port=nodelink.target_port,
        dashed=nodelink.dashed,
        is_original=False,
        deleted=nodelink.deleted,
    )


def fast_outcomenode_copy(outcomenode, node, outcome):
    return OutcomeNode(
        node=node,
        outcome=outcome,
        degree=outcomenode.degree,
        rank=outcomenode.rank,
    )


def fast_outcome_copy(outcome, author, now):
    return Outcome(
        title=outcome.title,
        description=outcome.description,
        author=author,
        is_original=False,
        parent_outcome=outcome,
        depth=outcome.depth,
        created_on=now,
        code=outcome.code,
        deleted=outcome.deleted,
    )


def fast_activity_copy(workflow, author, now):
    return Activity.objects.create(
        title=workflow.title,
        description=workflow.description,
        outcomes_type=workflow.outcomes_type,
        outcomes_sort=workflow.outcomes_sort,
        author=author,
        is_original=False,
        parent_workflow=workflow,
        is_strategy=workflow.is_strategy,
        time_required=workflow.time_required,
        time_units=workflow.time_units,
        ponderation_theory=workflow.ponderation_theory,
        ponderation_practical=workflow.ponderation_practical,
        ponderation_individual=workflow.ponderation_individual,
        time_general_hours=workflow.time_general_hours,
        time_specific_hours=workflow.time_specific_hours,
        code=workflow.code,
        deleted=workflow.deleted,
        condensed=workflow.condensed,
    )


def fast_course_copy(workflow, author, now):
    return Course.objects.create(
        title=workflow.title,
        description=workflow.description,
        outcomes_type=workflow.outcomes_type,
        outcomes_sort=workflow.outcomes_sort,
        author=author,
        is_original=False,
        parent_workflow=workflow,
        is_strategy=workflow.is_strategy,
        time_required=workflow.time_required,
        time_units=workflow.time_units,
        ponderation_theory=workflow.ponderation_theory,
        ponderation_practical=workflow.ponderation_practical,
        ponderation_individual=workflow.ponderation_individual,
        time_general_hours=workflow.time_general_hours,
        time_specific_hours=workflow.time_specific_hours,
        code=workflow.code,
        deleted=workflow.deleted,
        condensed=workflow.condensed,
    )


def fast_program_copy(workflow, author, now):
    return Program.objects.create(
        title=workflow.title,
        description=workflow.description,
        outcomes_type=workflow.outcomes_type,
        outcomes_sort=workflow.outcomes_sort,
        author=author,
        is_original=False,
        parent_workflow=workflow,
        is_strategy=workflow.is_strategy,
        time_required=workflow.time_required,
        time_units=workflow.time_units,
        ponderation_theory=workflow.ponderation_theory,
        ponderation_practical=workflow.ponderation_practical,
        ponderation_individual=workflow.ponderation_individual,
        time_general_hours=workflow.time_general_hours,
        time_specific_hours=workflow.time_specific_hours,
        code=workflow.code,
        deleted=workflow.deleted,
        condensed=workflow.condensed,
    )


def fast_duplicate_week(week: Week, author: User) -> Week:
    try:
        # Duplicate the week
        new_week = Week.objects.create(
            title=week.title,
            description=week.description,
            author=author,
            is_original=False,
            parent_week=week,
            week_type=week.week_type,
            is_strategy=week.is_strategy,
            original_strategy=week.original_strategy,
            strategy_classification=week.strategy_classification,
            deleted=week.deleted,
        )

        # Retrieve all data.
        # Speed is critical here. querying through __ has come out much faster (by a factor of up to 100) in testing than moving vertically through the heirarchy, even when prefetc_related is used.
        # In order to speed the creation of the throughmodels, select_related is used for any foreignkeys that need to be traversed

        nodeweeks = NodeWeek.objects.filter(week=week).select_related("node")
        nodes = Node.objects.filter(week=week).select_related(
            "column", "linked_workflow"
        )

        outcomenodes = OutcomeNode.objects.filter(
            node__week=week
        ).select_related("node", "outcome")
        nodelinks = NodeLink.objects.filter(
            source_node__week=week, target_node__week=week
        ).select_related("source_node", "target_node")

        # Create the new content, and keep track of old_id:new_instance pairs in a dict
        id_dict = {}
        now = timezone.now()

        Node.objects.bulk_create(
            [fast_node_copy(node, node.column, author, now) for node in nodes]
        )
        new_nodes = Node.objects.filter(author=author, created_on=now)
        id_dict["node"] = {
            nodes[i].id: new_node for i, new_node in enumerate(new_nodes)
        }

        # Link everything up

        NodeWeek.objects.bulk_create(
            [
                NodeWeek(
                    rank=nodeweek.rank,
                    node=id_dict["node"][nodeweek.node.id],
                    week=new_week,
                )
                for nodeweek in nodeweeks
            ]
        )

        NodeLink.objects.bulk_create(
            [
                fast_nodelink_copy(
                    nodelink,
                    author,
                    id_dict["node"][nodelink.source_node.id],
                    id_dict["node"][nodelink.target_node.id],
                )
                for nodelink in nodelinks
            ]
        )

        OutcomeNode.objects.bulk_create(
            [
                fast_outcomenode_copy(
                    outcomenode,
                    id_dict["node"][outcomenode.node.id],
                    outcomenode.outcome,
                )
                for outcomenode in outcomenodes
            ]
        )

        # Add the sets

        for node in nodes:
            if node.sets.all().count() > 0:
                for set in node.sets.all():
                    id_dict["node"][node.id].sets.add(set)
                node.save()

    except IndexError:
        return None

    return new_week


def fast_duplicate_outcome(outcome: Outcome, author: User) -> Outcome:
    try:
        # Duplicate the workflow
        new_outcome = Outcome.objects.create(
            title=outcome.title,
            description=outcome.description,
            author=author,
            is_original=False,
            parent_outcome=outcome,
            depth=outcome.depth,
            code=outcome.code,
            deleted=outcome.deleted,
        )

        # Retrieve all data.
        # Speed is critical here. querying through __ has come out much faster (by a factor of up to 100) in testing than moving vertically through the heirarchy, even when prefetc_related is used.
        # In order to speed the creation of the throughmodels, select_related is used for any foreignkeys that need to be traversed

        outcomes, outcomeoutcomes = get_all_outcomes_for_outcome(outcome)

        # Create the new content, and keep track of old_id:new_instance pairs in a dict
        id_dict = {}
        now = timezone.now()

        Outcome.objects.bulk_create(
            [fast_outcome_copy(outcome, author, now) for outcome in outcomes]
        )
        new_outcomes = Outcome.objects.filter(author=author, created_on=now)
        id_dict["outcome"] = {
            outcomes[i].id: new_outcome
            for i, new_outcome in enumerate(new_outcomes)
        }

        # We need to add in the original outcome
        id_dict["outcome"][outcome.id] = new_outcome

        # Link everything up
        OutcomeOutcome.objects.bulk_create(
            [
                OutcomeOutcome(
                    rank=outcomeoutcome.rank,
                    child=id_dict["outcome"][outcomeoutcome.child.id],
                    parent=id_dict["outcome"][outcomeoutcome.parent.id],
                )
                for outcomeoutcome in outcomeoutcomes
            ]
        )

        # Add the sets

        for outcome_inst in [outcome] + list(outcomes):
            if outcome_inst.sets.all().count() > 0:
                for set in outcome_inst.sets.all():
                    id_dict["outcome"][outcome_inst.id].sets.add(set)
                outcome_inst.save()

    except IndexError:
        return None

    return new_outcome


def fast_duplicate_workflow(
    workflow: Workflow, author: User, project
) -> Workflow:
    model = get_model_from_str(workflow.type)

    try:
        # Duplicate the workflow
        new_workflow = model.objects.create(
            title=workflow.title,
            description=workflow.description,
            outcomes_type=workflow.outcomes_type,
            outcomes_sort=workflow.outcomes_sort,
            author=author,
            is_original=False,
            parent_workflow=workflow,
            is_strategy=workflow.is_strategy,
            time_required=workflow.time_required,
            time_units=workflow.time_units,
            ponderation_theory=workflow.ponderation_theory,
            ponderation_practical=workflow.ponderation_practical,
            ponderation_individual=workflow.ponderation_individual,
            time_general_hours=workflow.time_general_hours,
            time_specific_hours=workflow.time_specific_hours,
            code=workflow.code,
            deleted=workflow.deleted,
            condensed=workflow.condensed,
        )

        # Retrieve all data.
        # Speed is critical here. querying through __ has come out much faster (by a factor of up to 100) in testing than moving vertically through the heirarchy, even when prefetc_related is used.
        # In order to speed the creation of the throughmodels, select_related is used for any foreignkeys that need to be traversed

        outcomeworkflows = OutcomeWorkflow.objects.filter(
            workflow=workflow
        ).select_related("outcome")
        outcomes, outcomeoutcomes = get_all_outcomes_for_workflow(workflow)

        columnworkflows = ColumnWorkflow.objects.filter(
            workflow=workflow
        ).select_related("column")
        columns = Column.objects.filter(workflow=workflow)

        weekworkflows = WeekWorkflow.objects.filter(
            workflow=workflow
        ).select_related("week")
        weeks = Week.objects.filter(workflow=workflow)

        nodeweeks = NodeWeek.objects.filter(
            week__workflow=workflow
        ).select_related("node", "week")
        nodes = Node.objects.filter(week__workflow=workflow).select_related(
            "column", "linked_workflow"
        )

        outcomenodes = OutcomeNode.objects.filter(
            node__week__workflow=workflow
        ).select_related("node", "outcome")
        nodelinks = NodeLink.objects.filter(
            source_node__week__workflow=workflow
        ).select_related("source_node", "target_node")

        # Create the new content, and keep track of old_id:new_instance pairs in a dict
        id_dict = {}
        now = timezone.now()

        Column.objects.bulk_create(
            [fast_column_copy(column, author, now) for column in columns]
        )
        new_columns = Column.objects.filter(author=author, created_on=now)
        id_dict["column"] = {
            columns[i].id: new_col for i, new_col in enumerate(new_columns)
        }

        Week.objects.bulk_create(
            [fast_week_copy(week, author, now) for week in weeks]
        )
        new_weeks = Week.objects.filter(author=author, created_on=now)
        id_dict["week"] = {
            weeks[i].id: new_week for i, new_week in enumerate(new_weeks)
        }

        Node.objects.bulk_create(
            [
                fast_node_copy(
                    node, id_dict["column"][node.column.id], author, now
                )
                for node in nodes
            ]
        )
        new_nodes = Node.objects.filter(author=author, created_on=now)
        id_dict["node"] = {
            nodes[i].id: new_node for i, new_node in enumerate(new_nodes)
        }

        Outcome.objects.bulk_create(
            [fast_outcome_copy(outcome, author, now) for outcome in outcomes]
        )
        new_outcomes = Outcome.objects.filter(author=author, created_on=now)
        id_dict["outcome"] = {
            outcomes[i].id: new_outcome
            for i, new_outcome in enumerate(new_outcomes)
        }

        # Link everything up
        ColumnWorkflow.objects.bulk_create(
            [
                ColumnWorkflow(
                    rank=columnworkflow.rank,
                    column=id_dict["column"][columnworkflow.column.id],
                    workflow=new_workflow,
                )
                for columnworkflow in columnworkflows
            ]
        )

        WeekWorkflow.objects.bulk_create(
            [
                WeekWorkflow(
                    rank=weekworkflow.rank,
                    week=id_dict["week"][weekworkflow.week.id],
                    workflow=new_workflow,
                )
                for weekworkflow in weekworkflows
            ]
        )

        NodeWeek.objects.bulk_create(
            [
                NodeWeek(
                    rank=nodeweek.rank,
                    node=id_dict["node"][nodeweek.node.id],
                    week=id_dict["week"][nodeweek.week.id],
                )
                for nodeweek in nodeweeks
            ]
        )

        NodeLink.objects.bulk_create(
            [
                fast_nodelink_copy(
                    nodelink,
                    author,
                    id_dict["node"][nodelink.source_node.id],
                    id_dict["node"][nodelink.target_node.id],
                )
                for nodelink in nodelinks
            ]
        )

        OutcomeNode.objects.bulk_create(
            [
                fast_outcomenode_copy(
                    outcomenode,
                    id_dict["node"][outcomenode.node.id],
                    id_dict["outcome"][outcomenode.outcome.id],
                )
                for outcomenode in outcomenodes
            ]
        )

        OutcomeWorkflow.objects.bulk_create(
            [
                OutcomeWorkflow(
                    rank=outcomeworkflow.rank,
                    outcome=id_dict["outcome"][outcomeworkflow.outcome.id],
                    workflow=new_workflow,
                )
                for outcomeworkflow in outcomeworkflows
            ]
        )

        OutcomeOutcome.objects.bulk_create(
            [
                OutcomeOutcome(
                    rank=outcomeoutcome.rank,
                    child=id_dict["outcome"][outcomeoutcome.child.id],
                    parent=id_dict["outcome"][outcomeoutcome.parent.id],
                )
                for outcomeoutcome in outcomeoutcomes
            ]
        )

        # Add the sets
        old_project = workflow.get_project()
        if (
            old_project is not None
            and project is not None
            and old_project.id == project.id
        ):
            for node in nodes:
                if node.sets.all().count() > 0:
                    for set in node.sets.all():
                        id_dict["node"][node.id].sets.add(set)
                    node.save()

            for outcome in outcomes:
                if outcome.sets.all().count() > 0:
                    for set in outcome.sets.all():
                        id_dict["outcome"][outcome.id].sets.add(set)
                    outcome.save()

    except IndexError:
        return None

    return new_workflow


def fast_duplicate_project(project: Project, author: User) -> Project:
    try:
        # Duplicate the project
        new_project = Project.objects.create(
            title=project.title,
            description=project.description,
            author=author,
            is_original=False,
            parent_project=project,
            deleted=project.deleted,
        )

        # Retrieve all data.
        # Speed is critical here. querying through __ has come out much faster (by a factor of up to 100) in testing than moving vertically through the heirarchy, even when prefetc_related is used.
        # In order to speed the creation of the throughmodels, select_related is used for any foreignkeys that need to be traversed

        workflowprojects = WorkflowProject.objects.filter(
            project=project
        ).select_related("workflow")
        activities = Activity.objects.filter(project=project)
        courses = Course.objects.filter(project=project)
        programs = Program.objects.filter(project=project)

        outcomeworkflows = OutcomeWorkflow.objects.filter(
            workflow__project=project
        ).select_related("outcome", "workflow")
        outcomes = Outcome.objects.filter(
            Q(workflow__project=project)
            | Q(parent_outcomes__workflow__project=project)
            | Q(parent_outcomes__parent_outcomes__workflow__project=project)
        )
        outcomeoutcomes = OutcomeOutcome.objects.filter(
            Q(parent__workflow__project=project)
            | Q(parent__parent_outcomes__workflow__project=project)
        ).select_related("child", "parent")

        outcomehorizontallinks = OutcomeHorizontalLink.objects.filter(
            Q(outcome__workflow__project=project)
            | Q(outcome__parent_outcomes__workflow__project=project)
            | Q(
                outcome__parent_outcomes__parent_outcomes__workflow__project=project
            )
        ).select_related("outcome", "parent_outcome")

        columnworkflows = ColumnWorkflow.objects.filter(
            workflow__project=project
        ).select_related("column", "workflow")
        columns = Column.objects.filter(workflow__project=project)

        weekworkflows = WeekWorkflow.objects.filter(
            workflow__project=project
        ).select_related("week", "workflow")
        weeks = Week.objects.filter(workflow__project=project)

        nodeweeks = NodeWeek.objects.filter(
            week__workflow__project=project
        ).select_related("node", "week")
        nodes = Node.objects.filter(
            week__workflow__project=project
        ).select_related("column", "linked_workflow")

        outcomenodes = OutcomeNode.objects.filter(
            node__week__workflow__project=project
        ).select_related("node", "outcome")
        nodelinks = NodeLink.objects.filter(
            source_node__week__workflow__project=project
        ).select_related("source_node", "target_node")

        object_sets = project.object_sets.all()

        # Create the new content, and keep track of old_id:new_instance pairs in a dict
        id_dict = {"workflow": {}}
        now = timezone.now()

        # Workflows have multi-table inheritance, and therefore cannot be bulk created
        for workflow in activities:
            new_workflow = fast_activity_copy(workflow, author, now)
            id_dict["workflow"][workflow.id] = new_workflow
        for workflow in courses:
            new_workflow = fast_course_copy(workflow, author, now)
            id_dict["workflow"][workflow.id] = new_workflow
        for workflow in programs:
            new_workflow = fast_program_copy(workflow, author, now)
            id_dict["workflow"][workflow.id] = new_workflow

        Column.objects.bulk_create(
            [fast_column_copy(column, author, now) for column in columns]
        )
        new_columns = Column.objects.filter(author=author, created_on=now)
        id_dict["column"] = {
            columns[i].id: new_col for i, new_col in enumerate(new_columns)
        }

        Week.objects.bulk_create(
            [fast_week_copy(week, author, now) for week in weeks]
        )
        new_weeks = Week.objects.filter(author=author, created_on=now)
        id_dict["week"] = {
            weeks[i].id: new_week for i, new_week in enumerate(new_weeks)
        }

        Node.objects.bulk_create(
            [
                fast_node_copy(
                    node,
                    id_dict["column"][node.column.id],
                    author,
                    now,
                    workflow_dict=id_dict["workflow"],
                )
                for node in nodes
            ]
        )
        new_nodes = Node.objects.filter(author=author, created_on=now)
        id_dict["node"] = {
            nodes[i].id: new_node for i, new_node in enumerate(new_nodes)
        }

        Outcome.objects.bulk_create(
            [fast_outcome_copy(outcome, author, now) for outcome in outcomes]
        )
        new_outcomes = Outcome.objects.filter(author=author, created_on=now)
        id_dict["outcome"] = {
            outcomes[i].id: new_outcome
            for i, new_outcome in enumerate(new_outcomes)
        }

        new_object_sets = []
        for object_set in object_sets:
            new_object_set = ObjectSet.objects.create(
                term=object_set.term,
                title=object_set.title,
                translation_plural=object_set.translation_plural,
            )
            new_object_sets += [new_object_set]
            new_project.object_sets.add(new_object_set)
        id_dict["objectset"] = {
            object_sets[i].id: object_set
            for i, object_set in enumerate(new_object_sets)
        }

        # Link everything up.

        # DO NOT bulk create workflowprojects, as then the
        # necessary permissions won't be created for the author
        [
            WorkflowProject.objects.create(
                rank=workflowproject.rank,
                workflow=id_dict["workflow"][workflowproject.workflow.id],
                project=new_project,
            )
            for workflowproject in workflowprojects
        ]

        ColumnWorkflow.objects.bulk_create(
            [
                ColumnWorkflow(
                    rank=columnworkflow.rank,
                    column=id_dict["column"][columnworkflow.column.id],
                    workflow=id_dict["workflow"][columnworkflow.workflow.id],
                )
                for columnworkflow in columnworkflows
            ]
        )

        WeekWorkflow.objects.bulk_create(
            [
                WeekWorkflow(
                    rank=weekworkflow.rank,
                    week=id_dict["week"][weekworkflow.week.id],
                    workflow=id_dict["workflow"][weekworkflow.workflow.id],
                )
                for weekworkflow in weekworkflows
            ]
        )

        NodeWeek.objects.bulk_create(
            [
                NodeWeek(
                    rank=nodeweek.rank,
                    node=id_dict["node"][nodeweek.node.id],
                    week=id_dict["week"][nodeweek.week.id],
                )
                for nodeweek in nodeweeks
            ]
        )

        NodeLink.objects.bulk_create(
            [
                fast_nodelink_copy(
                    nodelink,
                    author,
                    id_dict["node"][nodelink.source_node.id],
                    id_dict["node"][nodelink.target_node.id],
                )
                for nodelink in nodelinks
            ]
        )

        OutcomeNode.objects.bulk_create(
            [
                fast_outcomenode_copy(
                    outcomenode,
                    id_dict["node"][outcomenode.node.id],
                    id_dict["outcome"][outcomenode.outcome.id],
                )
                for outcomenode in outcomenodes
            ]
        )

        OutcomeWorkflow.objects.bulk_create(
            [
                OutcomeWorkflow(
                    rank=outcomeworkflow.rank,
                    outcome=id_dict["outcome"][outcomeworkflow.outcome.id],
                    workflow=id_dict["workflow"][outcomeworkflow.workflow.id],
                )
                for outcomeworkflow in outcomeworkflows
            ]
        )

        OutcomeOutcome.objects.bulk_create(
            [
                OutcomeOutcome(
                    rank=outcomeoutcome.rank,
                    child=id_dict["outcome"][outcomeoutcome.child.id],
                    parent=id_dict["outcome"][outcomeoutcome.parent.id],
                )
                for outcomeoutcome in outcomeoutcomes
            ]
        )

        OutcomeHorizontalLink.objects.bulk_create(
            [
                OutcomeHorizontalLink(
                    rank=outcomehorizontallink.rank,
                    outcome=id_dict["outcome"][
                        outcomehorizontallink.outcome.id
                    ],
                    parent_outcome=id_dict["outcome"][
                        outcomehorizontallink.parent_outcome.id
                    ],
                )
                for outcomehorizontallink in outcomehorizontallinks
            ]
        )

        # Add the sets
        for node in nodes:
            if node.sets.all().count() > 0:
                for set in node.sets.all():
                    id_dict["node"][node.id].sets.add(
                        id_dict["objectset"][set.id]
                    )
                node.save()

        for outcome in list(outcomes):
            if outcome.sets.all().count() > 0:
                for set in outcome.sets.all():
                    id_dict["outcome"][outcome.id].sets.add(
                        id_dict["objectset"][set.id]
                    )
                outcome.save()

    except IndexError:
        return None

    for discipline in project.disciplines.all():
        new_project.disciplines.add(discipline)

    return new_project


def fast_create_strategy(
    week: Week, workflow: Workflow, author: User
) -> Workflow:
    model = get_model_from_str(workflow.type)

    try:
        # Duplicate the workflow
        new_strategy = model.objects.create(
            title=workflow.title,
            author=author,
            is_strategy=True,
            is_original=False,
            parent_workflow=workflow,
        )

        # Retrieve all data.
        # Speed is critical here. querying through __ has come out much faster (by a factor of up to 100) in testing than moving vertically through the heirarchy, even when prefetc_related is used.
        # In order to speed the creation of the throughmodels, select_related is used for any foreignkeys that need to be traversed

        columnworkflows = ColumnWorkflow.objects.filter(
            workflow=workflow
        ).select_related("column")
        columns = Column.objects.filter(workflow=workflow)

        nodeweeks = NodeWeek.objects.filter(
            week__workflow=workflow, week=week
        ).select_related("node", "week")
        nodes = Node.objects.filter(
            week__workflow=workflow, week=week
        ).select_related("column", "linked_workflow")

        nodelinks = NodeLink.objects.filter(
            source_node__week__workflow=workflow,
            source_node__week=week,
            target_node__week=week,
        ).select_related("source_node", "target_node")

        # Create the new content, and keep track of old_id:new_instance pairs in a dict
        id_dict = {}
        now = timezone.now()

        Column.objects.bulk_create(
            [fast_column_copy(column, author, now) for column in columns]
        )
        new_columns = Column.objects.filter(author=author, created_on=now)
        id_dict["column"] = {
            columns[i].id: new_col for i, new_col in enumerate(new_columns)
        }

        weeks = [week]
        Week.objects.bulk_create([fast_week_copy(week, author, now)])
        new_weeks = Week.objects.filter(author=author, created_on=now)
        new_weeks.update(is_strategy=True)
        id_dict["week"] = {
            weeks[i].id: new_week for i, new_week in enumerate(new_weeks)
        }

        Node.objects.bulk_create(
            [
                fast_node_copy(
                    node, id_dict["column"][node.column.id], author, now
                )
                for node in nodes
            ]
        )
        new_nodes = Node.objects.filter(author=author, created_on=now)
        new_nodes.update(linked_workflow=None)
        id_dict["node"] = {
            nodes[i].id: new_node for i, new_node in enumerate(new_nodes)
        }

        # Link everything up
        ColumnWorkflow.objects.bulk_create(
            [
                ColumnWorkflow(
                    rank=columnworkflow.rank,
                    column=id_dict["column"][columnworkflow.column.id],
                    workflow=new_strategy,
                )
                for columnworkflow in columnworkflows
            ]
        )

        WeekWorkflow.objects.create(workflow=new_strategy, week=new_weeks[0])

        NodeWeek.objects.bulk_create(
            [
                NodeWeek(
                    rank=nodeweek.rank,
                    node=id_dict["node"][nodeweek.node.id],
                    week=id_dict["week"][nodeweek.week.id],
                )
                for nodeweek in nodeweeks
            ]
        )

        NodeLink.objects.bulk_create(
            [
                fast_nodelink_copy(
                    nodelink,
                    author,
                    id_dict["node"][nodelink.source_node.id],
                    id_dict["node"][nodelink.target_node.id],
                )
                for nodelink in nodelinks
            ]
        )

    except IndexError:
        return None

    return new_strategy
