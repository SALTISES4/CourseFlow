import json
import math

# from duplication
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.utils.translation import gettext as _
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.apps import logger
from course_flow.decorators import user_can_edit, user_can_view
from course_flow.duplication_functions import (
    duplicate_column,
    duplicate_node,
    fast_duplicate_outcome,
    fast_duplicate_week,
)
from course_flow.models.objectset import ObjectSet
from course_flow.models.relations import (
    ColumnWorkflow,
    NodeLink,
    NodeWeek,
    OutcomeOutcome,
    OutcomeWorkflow,
    WeekWorkflow,
)
from course_flow.models.relations.outcomeHorizontalLink import (
    OutcomeHorizontalLink,
)
from course_flow.models.relations.outcomeNode import OutcomeNode
from course_flow.models.workflow_objects.column import Column
from course_flow.models.workflow_objects.node import Node
from course_flow.models.workflow_objects.outcome import Outcome
from course_flow.models.workspace.workflow import Workflow
from course_flow.serializers import (
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    OutcomeHorizontalLinkSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    RefreshSerializerNode,
    RefreshSerializerOutcome,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
    serializer_lookups_shallow,
)
from course_flow.services import DAO
from course_flow.sockets import redux_actions as actions


class WorkflowObjectEndpoint:
    @staticmethod
    # @user_can_view(False)
    # @user_can_edit(False, get_parent=True)
    def duplicate(request: Request) -> Response:
        """
        This duplication function handles all the Children of workflows
        when they are duplicated individually from the UI
        it should not be confused with the general
        Duplicate workflow
        or
        Duplicate Project

        types handled:
        week
        node
        column
        outcome

        :param request:
        :return:
        """
        body = json.loads(request.body)
        object_id = body.get("objectID")
        object_type = body.get("objectType")
        parent_id = body.get("parentID")
        parent_type = body.get("parentType")
        through_type = body.get("throughType")
        node_updates = []
        try:
            with transaction.atomic():
                ##########################################################
                # WEEK
                #########################################################
                if object_type == "week":
                    model = DAO.get_model_from_str(object_type).objects.get(id=object_id)
                    parent = DAO.get_model_from_str(parent_type).objects.get(id=parent_id)
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
                    new_through_serialized = WeekWorkflowSerializerShallow(newthroughmodel).data
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

                ##########################################################
                # NODE
                #########################################################
                elif object_type == "node":
                    model = DAO.get_model_from_str(object_type).objects.get(id=object_id)
                    parent = DAO.get_model_from_str(parent_type).objects.get(id=parent_id)
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
                    new_through_serialized = NodeWeekSerializerShallow(newthroughmodel).data
                    new_children_serialized = {
                        "outcomenode": OutcomeNodeSerializerShallow(
                            OutcomeNode.objects.filter(node=newmodel),
                            many=True,
                        ).data,
                    }

                ##########################################################
                # COLUMN
                #########################################################
                elif object_type == "column":
                    model = DAO.get_model_from_str(object_type).objects.get(id=object_id)
                    parent = DAO.get_model_from_str(parent_type).objects.get(id=parent_id)
                    through = ColumnWorkflow.objects.get(column=model, workflow=parent)
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
                    new_through_serialized = ColumnWorkflowSerializerShallow(newthroughmodel).data
                    new_children_serialized = None

                ##########################################################
                # OUTCOME
                #########################################################
                elif object_type == "outcome":
                    model = DAO.get_model_from_str(object_type).objects.get(id=object_id)
                    newmodel = fast_duplicate_outcome(model, request.user)

                    try:
                        newmodel.title = newmodel.title + _("(copy)")
                        newmodel.save()
                    except (ValidationError, TypeError):
                        pass

                    if parent_type == "outcome":
                        parent = DAO.get_model_from_str(parent_type).objects.get(id=parent_id)
                        through = OutcomeOutcome.objects.get(child=model, parent=parent)
                        newthroughmodel = OutcomeOutcome.objects.create(
                            parent=parent,
                            child=newmodel,
                            rank=through.rank + 1,
                        )
                        new_through_serialized = OutcomeOutcomeSerializerShallow(
                            newthroughmodel
                        ).data
                    elif parent_type == "workflow":
                        parent = DAO.get_model_from_str(parent_type).objects.get(id=parent_id)
                        through = OutcomeWorkflow.objects.get(outcome=model, workflow=parent)
                        newthroughmodel = OutcomeWorkflow.objects.create(
                            workflow=parent,
                            outcome=newmodel,
                            rank=through.rank + 1,
                        )
                        new_through_serialized = OutcomeWorkflowSerializerShallow(
                            newthroughmodel
                        ).data

                    new_model_serialized = OutcomeSerializerShallow(newmodel).data
                    (
                        outcomes,
                        outcomeoutcomes,
                    ) = DAO.get_all_outcomes_for_outcome(newmodel)
                    outcomenodes = OutcomeNode.objects.filter(
                        outcome__id__in=[newmodel.id] + [x.id for x in outcomes]
                    )
                    node_updates = NodeSerializerShallow(
                        list(set([x.node for x in outcomenodes])),
                        many=True,
                    ).data
                    new_children_serialized = {
                        "outcome": OutcomeSerializerShallow(outcomes, many=True).data,
                        "outcomeoutcome": OutcomeOutcomeSerializerShallow(
                            outcomeoutcomes, many=True
                        ).data,
                        "outcomenode": OutcomeNodeSerializerShallow(outcomenodes, many=True).data,
                    }
                else:
                    raise ValidationError("Uknown component type")

        except ValidationError as e:
            logger.exception("An error occurred")
            return Response({"error": "ObjectDoesNotExist"}, status=400)

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

        return Response({"message": "success"}, status=status.HTTP_200_OK)

    @staticmethod
    @user_can_view(False)
    # @user_can_edit(False, get_parent=True)
    def insert_sibling(request: HttpRequest) -> JsonResponse:
        """
        Add a new sibling to a through model
        :param request:
        :return:
        """
        body = json.loads(request.body)
        object_id = body.get("objectId")
        object_type = body.get("objectType")
        parent_id = body.get("parentId")
        parent_type = body.get("parentType")
        through_type = body.get("throughType")

        try:
            model = DAO.get_model_from_str(object_type).objects.get(id=object_id)
            parent = DAO.get_model_from_str(parent_type).objects.get(id=parent_id)

            if parent_type == object_type:
                old_through_kwargs = {"child": model, "parent": parent}
            else:
                old_through_kwargs = {object_type: model, parent_type: parent}
            through = DAO.get_model_from_str(through_type).objects.get(**old_through_kwargs)

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

            new_model = DAO.get_model_from_str(object_type).objects.create(
                author=request.user, **defaults
            )
            if parent_type == object_type:
                new_through_kwargs = {"child": new_model, "parent": parent}
            else:
                new_through_kwargs = {object_type: new_model, parent_type: parent}
            new_through_model = DAO.get_model_from_str(through_type).objects.create(
                **new_through_kwargs, rank=through.rank + 1
            )
            new_model_serialized = serializer_lookups_shallow[object_type](new_model).data
            new_through_serialized = serializer_lookups_shallow[through_type](
                new_through_model
            ).data
            if object_type == "outcome":
                outcomenodes = OutcomeNode.objects.filter(outcome=new_model)
                outcomenodes_serialized = OutcomeNodeSerializerShallow(outcomenodes, many=True).data
                node_updates = NodeSerializerShallow([x.node for x in outcomenodes], many=True).data
                children = {
                    "outcomenode": outcomenodes_serialized,
                    "outcome": [],
                    "outcomeoutcome": [],
                }
            else:
                children = None
                node_updates = []

        except ValidationError as e:
            logger.exception("An error occurred")
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
        return JsonResponse({"message": "success"})


# Add a parent outcome to an outcome
@user_can_edit("outcomePk")
@user_can_view(False)
def json_api_post_update_outcomehorizontallink_degree(
    request: HttpRequest,
) -> JsonResponse:
    body = json.loads(request.body)
    outcome_id = body.get("outcomePk")
    object_type = body.get("objectType")
    parent_id = body.get("objectID")
    degree = body.get("degree")
    try:
        outcome = Outcome.objects.get(id=outcome_id)
        parent_outcome = DAO.get_model_from_str(object_type).objects.get(id=parent_id)
        workflow = outcome.get_workflow()
        parent_workflow = parent_outcome.get_workflow()
        if not DAO.check_possible_parent(workflow, parent_workflow, True):
            raise ValidationError
        if (
            OutcomeHorizontalLink.objects.filter(
                parent_outcome=parent_outcome, outcome=outcome, degree=degree
            ).count()
            > 0
        ):
            return JsonResponse({"message": "success", "outcomehorizontallink": -1})
        model = OutcomeHorizontalLink.objects.create(
            outcome=outcome, parent_outcome=parent_outcome, degree=degree
        )
        new_outcomehorizontallinks = OutcomeHorizontalLinkSerializerShallow(
            [model] + model.check_parent_outcomes() + model.check_child_outcomes(),
            many=True,
        ).data
        OutcomeHorizontalLink.objects.filter(outcome=outcome, degree=0).delete()
        new_outcome_data = OutcomeSerializerShallow(model.outcome).data
        new_outcome_horizontal_links = new_outcome_data["outcome_horizontal_links"]
        new_outcome_horizontal_links_unique = new_outcome_data["outcome_horizontal_links_unique"]
    except ValidationError as e:
        logger.exception("An error occurred")
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
    return JsonResponse({"message": "success"})


# @todo clarify this vocabulary
# Toggle on or off an object set for an object.
@user_can_edit(False)
@user_can_view("objectsetPk")
def json_api_post_update_object_set(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    try:
        object_id = body.get("objectID")
        object_type = body.get("objectType")
        objectset_id = body.get("objectsetPk")
        add = body.get("add")
        objects = DAO.get_model_from_str(object_type).objects
        if hasattr(objects, "get_subclass"):
            objects_to_update = [objects.get_subclass(pk=object_id)]
        else:
            objects_to_update = [objects.get(pk=object_id)]
            if object_type == "outcome":
                objects_to_update += list(DAO.get_descendant_outcomes(objects_to_update[0]))
        objectset = ObjectSet.objects.get(id=objectset_id)
        if add:
            for object_to_update in objects_to_update:
                object_to_update.sets.add(objectset)
                object_to_update.save()
        else:
            for object_to_update in objects_to_update:
                object_to_update.sets.remove(objectset)
                object_to_update.save()

    except ValidationError as e:
        logger.exception("An error occurred")
        return JsonResponse({"action": "error"})
    try:
        workflow = objects_to_update[0].get_workflow()
        if len(objects_to_update) == 1:
            action = actions.changeField(
                object_id,
                object_type,
                {"sets": [object_set.id for object_set in object_to_update.sets.all()]},
            )
        else:
            action = actions.changeFieldMany(
                [obj.id for obj in objects_to_update],
                object_type,
                {"sets": [object_set.id for object_set in object_to_update.sets.all()]},
            )
        actions.dispatch_wf(workflow, action)
        if object_type == "outcome":
            actions.dispatch_to_parent_wf(workflow, action)
    except AttributeError as e:
        logger.exception("An error occurred")
        pass

    return JsonResponse({"message": "success"})


#########################################################
# REORDER?
#########################################################


# @user_can_edit(False)
# @user_can_edit_or_none(False, get_parent=True)
# @user_can_edit_or_none("columnPk")
# @from_same_workflow(False, False, get_parent=True)
# @from_same_workflow(False, "columnPk")
def json_api_post_inserted_at(request: HttpRequest) -> JsonResponse:
    """
    @todo make this explanation meaningful
    # Insert a model via its throughmodel to reorder it

    :param request:
    :return:
    """
    body = json.loads(request.body)
    object_id = body.get("objectID")
    object_type = body.get("objectType")
    inserted = body.get("inserted", False)
    column_change = body.get("columnChange", False)
    changing_workflow = False
    try:
        with transaction.atomic():
            if column_change:
                new_column_id = body.get("columnPk")
                model = DAO.get_model_from_str(object_type).objects.get(id=object_id)
                new_column = Column.objects.get(id=new_column_id)
                model.column = new_column
                model.save()
            if inserted:
                parent_id = body.get("parentID")
                parent_type = body.get("parentType")
                new_position = body.get("newPosition")
                through_type = body.get("throughType")
                model = DAO.get_model_from_str(object_type).objects.get(id=object_id)
                parent = DAO.get_model_from_str(parent_type).objects.get(id=parent_id)
                workflow1 = model.get_workflow()
                workflow2 = parent.get_workflow()
                if workflow1.pk != workflow2.pk:
                    changing_workflow = True
                    if workflow1.get_project().pk == workflow2.get_project().pk:
                        if object_type == "node":
                            model.outcomenode_set.all().delete()
                            same_type_columns = workflow2.columns.filter(
                                column_type=model.column.column_type
                            )
                            if same_type_columns.count() > 0:
                                new_column = same_type_columns.first()
                            else:
                                new_column = workflow2.columns.all().first()
                            model.column = new_column
                            model.save()
                            linked_workflows = Workflow.objects.filter(linked_nodes=model)
                        elif object_type == "outcome" or object_type == "outcome_base":
                            OutcomeNode.objects.filter()
                            outcomes_list = [object_id] + list(
                                DAO.get_descendant_outcomes(model).values_list("pk", flat=True)
                            )
                            affected_nodes = (
                                Node.objects.filter(outcomes__in=outcomes_list).values_list(
                                    "pk", flat=True
                                ),
                            )
                            linked_workflows = Workflow.objects.filter(
                                linked_nodes__outcomes__in=outcomes_list
                            )
                            OutcomeNode.objects.filter(outcome__in=outcomes_list).delete()
                        else:
                            return JsonResponse({"message": "success"})
                if object_type == parent_type:
                    creation_kwargs = {"child": model, "parent": parent}
                    search_kwargs = {"child": model}
                    index_kwargs = {"parent": parent, "child__deleted": False}
                else:
                    creation_kwargs = {object_type: model, parent_type: parent}
                    search_kwargs = {object_type: model}
                    index_kwargs = {
                        parent_type: parent,
                        object_type + "__deleted": False,
                    }
                # Adjust the new position, given the # of deleted items
                try:
                    all_throughs = (
                        DAO.get_model_from_str(through_type)
                        .objects.filter(**index_kwargs)
                        .order_by("rank")
                    )
                    if new_position < 0:
                        new_position = 0
                    elif new_position >= all_throughs.count():
                        new_position = all_throughs.count()
                    else:
                        new_position = (
                            DAO.get_model_from_str(through_type)
                            .objects.filter(**index_kwargs)
                            .order_by("rank")[new_position]
                            .rank
                        )
                except (IndexError, AttributeError):
                    print("had an error in inserted_at")

                old_through_id = (
                    DAO.get_model_from_str(through_type).objects.filter(**search_kwargs).first().id
                )
                new_through = DAO.get_model_from_str(through_type).objects.create(
                    rank=new_position, **creation_kwargs
                )

    except ValidationError as e:
        logger.exception("An error occurred")
        return JsonResponse({"action": "error"})

    workflow = model.get_workflow()
    if inserted:
        if changing_workflow:
            object_type_sent = object_type
            if object_type == "outcome" and through_type == "outcomeworkflow":
                object_type_sent = "outcome_base"
            # Send a signal to delete the object from its original workflow
            extra_data = {}
            new_children_serialized = None
            if object_type == "outcome" or object_type == "outcome_base":
                extra_data = RefreshSerializerNode(
                    Node.objects.filter(pk__in=affected_nodes),
                    many=True,
                ).data
                outcomes_to_update = RefreshSerializerOutcome(
                    Outcome.objects.filter(horizontal_outcomes__in=outcomes_list),
                    many=True,
                ).data
                outcomes, outcomeoutcomes = DAO.get_all_outcomes_for_outcome(model)
                new_children_serialized = {
                    "outcome": OutcomeSerializerShallow(outcomes, many=True).data,
                    "outcomeoutcome": OutcomeOutcomeSerializerShallow(
                        outcomeoutcomes, many=True
                    ).data,
                }

            delete_action = actions.deleteSelfAction(
                object_id, object_type_sent, old_through_id, extra_data
            )
            actions.dispatch_wf(
                workflow1,
                delete_action,
            )
            # Send a signal to add it to the new workflow
            new_model_serialized = serializer_lookups_shallow[object_type](model).data
            new_through_serialized = serializer_lookups_shallow[through_type](new_through).data
            response_data = {
                "new_model": new_model_serialized,
                "new_through": new_through_serialized,
                "parentID": parent_id,
                "children": new_children_serialized,
            }

            actions.dispatch_wf(
                workflow2,
                actions.insertBelowAction(response_data, object_type_sent),
            )
            # Send the relevant signals to parent and child workflows
            if object_type == "outcome" or object_type == "outcome_base":
                actions.dispatch_to_parent_wf(
                    workflow1,
                    delete_action,
                )
                if linked_workflows:
                    for wf in linked_workflows:
                        actions.dispatch_wf(wf, delete_action)
                        actions.dispatch_wf(
                            wf,
                            actions.updateHorizontalLinks({"data": outcomes_to_update}),
                        )
            if object_type != "outcome" and object_type != "outcome_base" and linked_workflows:
                for wf in linked_workflows:
                    actions.dispatch_parent_updated(wf)
        else:
            if object_type == "outcome":
                outcomes, outcomeoutcomes = DAO.get_all_outcomes_for_outcome(model)
                outcomenodes = OutcomeNode.objects.filter(
                    outcome__id__in=[model.id] + [x.id for x in outcomes]
                )
                node_updates = NodeSerializerShallow(
                    list(set([x.node for x in outcomenodes])),
                    many=True,
                ).data
                new_children_serialized = {
                    "outcome": [],
                    "outcomeoutcome": [],
                    "outcomenode": OutcomeNodeSerializerShallow(outcomenodes, many=True).data,
                }
                extra_data = {
                    "children": new_children_serialized,
                    "node_updates": node_updates,
                }
            else:
                extra_data = {}

            actions.dispatch_wf(
                workflow,
                actions.changeThroughID(through_type, old_through_id, new_through.id, extra_data),
            )
            if object_type == "outcome":
                actions.dispatch_to_parent_wf(
                    workflow,
                    actions.changeThroughID(
                        through_type,
                        old_through_id,
                        new_through.id,
                        extra_data,
                    ),
                )
    actions.dispatch_wf_lock(workflow, actions.unlock(model.id, object_type))
    return JsonResponse({"message": "success"})
