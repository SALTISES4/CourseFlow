import json
import logging
from enum import Enum

from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType

# from duplication
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from django.db.models import ProtectedError, Q
from django.http import HttpRequest, JsonResponse
from django.utils import timezone
from django.utils.translation import gettext as _
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from course_flow.apps import logger
from course_flow.decorators import (
    user_can_delete,
    user_can_edit,
    user_can_view,
)
from course_flow.duplication_functions import (
    duplicate_column,
    duplicate_node,
    fast_duplicate_outcome,
    fast_duplicate_week,
)
from course_flow.models import Node, Outcome, Workflow
from course_flow.models.objectPermission import ObjectPermission, Permission
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
    RefreshSerializerNode,
    RefreshSerializerOutcome,
    UserSerializer,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
    serializer_lookups_shallow,
)
from course_flow.services import DAO, Utility
from course_flow.sockets import redux_actions as actions
from course_flow.views.json_api._validators import DeleteRequestSerializer


class ObjectType(Enum):
    NODE = "node"
    WEEK = "week"
    WORKFLOW = "workflow"
    ACTIVITY = "activity"
    COURSE = "course"
    PROGRAM = "program"
    OUTCOME = "program"
    COLUMN = "column"
    NODELINK = "nodelink"


class WorkspaceEndpoint:
    # Updates an object's information using its serializer. This is
    # the most frequently used view, used to change almost any
    # non-foreign key fields on models
    @staticmethod
    @api_view(["POST"])
    @user_can_edit(False)
    def update_value(request: Request) -> Response:
        body = json.loads(request.body)
        try:
            object_id = body.get("objectID")
            object_type = body.get("objectType")
            data = body.get("data")
            changeFieldID = body.get("changeFieldID", False)
            objects = DAO.get_model_from_str(object_type).objects
            if hasattr(objects, "get_subclass"):
                object_to_update = objects.get_subclass(pk=object_id)
            else:
                object_to_update = objects.get(pk=object_id)
            serializer = serializer_lookups_shallow[object_type](
                object_to_update,
                data=data,
                partial=True,
                context={"user": request.user},
            )
            Utility.save_serializer(serializer)
        except ValidationError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"})
        try:
            workflow = object_to_update.get_workflow()
            actions.dispatch_wf(
                workflow,
                actions.changeField(
                    object_id, object_type, data, changeFieldID
                ),
            )
            if object_type == "outcome":
                actions.dispatch_to_parent_wf(
                    workflow,
                    actions.changeField(object_id, object_type, data),
                )
        except AttributeError as e:
            logger.exception("An error occurred")
            pass

        return Response({"message": "success"}, status=status.HTTP_200_OK)

    #########################################################
    # DELETE
    #########################################################

    @staticmethod
    @user_can_delete(False)
    @api_view(["POST"])
    def delete(request: HttpRequest) -> JsonResponse:
        """
         Hard delete. Actually deletes the object instead of just marking a flag. This is used infrequently.
        :param request:
        :return:
        """

        body = json.loads(request.body)
        object_id = body.get("objectID")
        object_type = body.get("objectType")

        try:
            model = DAO.get_model_from_str(object_type).objects.get(
                id=object_id
            )
            workflow = None
            extra_data = None
            parent_id = None
            # object_suffix = ""
            try:
                workflow = model.get_workflow()
            except AttributeError as e:
                logger.exception("An error occurred")
                pass
            # Check to see if we have any linked workflows that need to be updated
            linked_workflows = False
            if object_type == "node":
                linked_workflows = list(
                    Workflow.objects.filter(linked_nodes=model)
                )
            elif object_type == "week":
                linked_workflows = list(
                    Workflow.objects.filter(linked_nodes__week=model)
                )
            elif object_type in ["workflow", "activity", "course", "program"]:
                workflow = None
                linked_workflows = list(
                    Workflow.objects.filter(
                        linked_nodes__week__workflow__id=model.id
                    )
                )
                parent_workflows = [
                    node.get_workflow()
                    for node in Node.objects.filter(linked_workflow=model)
                ]

            elif object_type == "outcome":
                linked_workflows = list(
                    Workflow.objects.filter(
                        Q(
                            linked_nodes__outcomes__in=[model.id]
                            + list(
                                DAO.get_descendant_outcomes(model).values_list(
                                    "pk", flat=True
                                )
                            )
                        )
                    )
                )
            if object_type == "outcome":
                affected_nodes = (
                    Node.objects.filter(
                        outcomes__in=[object_id]
                        + list(
                            DAO.get_descendant_outcomes(model).values_list(
                                "pk", flat=True
                            )
                        )
                    ).values_list("pk", flat=True),
                )
            if object_type == "week":
                parent_id = WeekWorkflow.objects.get(week=model).id

            elif object_type == "column":
                parent_id = ColumnWorkflow.objects.get(column=model).id

            elif object_type == "node":
                parent_id = NodeWeek.objects.get(node=model).id

            elif object_type == "nodelink":
                parent_id = Node.objects.get(outgoing_links=model).id

            elif object_type == "outcome" and model.depth == 0:
                parent_id = OutcomeWorkflow.objects.get(outcome=model).id
                object_type = "outcome_base"

            elif object_type == "outcome":
                parent_id = OutcomeOutcome.objects.get(child=model).id
            # Delete the object
            with transaction.atomic():
                model.delete()
            if object_type == "outcome" or object_type == "outcome_base":
                extra_data = RefreshSerializerNode(
                    Node.objects.filter(pk__in=affected_nodes),
                    many=True,
                ).data
            elif object_type == "column":
                extra_data = (
                    workflow.columnworkflow_set.filter(column__deleted=False)
                    .order_by("rank")
                    .first()
                    .column.id
                )
        except (ProtectedError, ObjectDoesNotExist):
            return JsonResponse({"action": "error"})

        if workflow is not None:
            action = actions.deleteSelfAction(
                object_id, object_type, parent_id, extra_data
            )
            actions.dispatch_wf(
                workflow,
                action,
            )
            if object_type == "outcome" or object_type == "outcome_base":
                actions.dispatch_to_parent_wf(
                    workflow,
                    action,
                )
                if linked_workflows:
                    for wf in linked_workflows:
                        actions.dispatch_wf(wf, action)
        if (
            object_type != "outcome"
            and object_type != "outcome_base"
            and linked_workflows
        ):
            for wf in linked_workflows:
                actions.dispatch_parent_updated(wf)
        if object_type in ["workflow", "activity", "course", "program"]:
            for parent_workflow in parent_workflows:
                actions.dispatch_child_updated(
                    parent_workflow, model.get_workflow()
                )
        return JsonResponse({"message": "success"})

    # Soft delete the object. This just sets the deleted property
    # to true. Most of this method is just ensuring
    # that workflows that use the object are kept up to date
    # about it being deleted.
    @staticmethod
    @user_can_delete(False)
    @api_view(["POST"])
    def delete_soft(request: Request, pk: int) -> Response:
        serializer = DeleteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        # assing payload data to local objects
        object_id = pk
        object_type = serializer.validated_data["objectType"]

        try:
            model = DAO.get_model_from_str(object_type).objects.get(
                id=object_id
            )
            workflow = None
            extra_data = None
            parent_id = None
            # object_suffix = ""

            # Check to see if we have any linked workflows that need to be updated
            linked_workflows = False
            if object_type == "node":
                linked_workflows = list(
                    Workflow.objects.filter(linked_nodes=model)
                )
            elif object_type == "week":
                linked_workflows = list(
                    Workflow.objects.filter(linked_nodes__week=model)
                )
            elif object_type in ["workflow", "activity", "course", "program"]:
                linked_workflows = list(
                    Workflow.objects.filter(
                        linked_nodes__week__workflow__id=model.id
                    )
                )
                parent_workflows = [
                    node.get_workflow()
                    for node in Node.objects.filter(linked_workflow=model)
                ]
            elif object_type == "outcome":
                linked_workflows = list(
                    Workflow.objects.filter(
                        Q(
                            linked_nodes__outcomes__in=[model.id]
                            + list(
                                DAO.get_descendant_outcomes(model).values_list(
                                    "pk", flat=True
                                )
                            )
                        )
                    )
                )

            if object_type == "week":
                parent_id = WeekWorkflow.objects.get(week=model).id

            elif object_type == "column":
                parent_id = ColumnWorkflow.objects.get(column=model).id

            elif object_type == "node":
                parent_id = NodeWeek.objects.get(node=model).id

            elif object_type == "nodelink":
                parent_id = Node.objects.get(outgoing_links=model).id

            elif object_type == "outcome" and model.depth == 0:
                parent_id = OutcomeWorkflow.objects.get(outcome=model).id

                object_type = "outcome_base"

            elif object_type == "outcome":
                parent_id = OutcomeOutcome.objects.get(child=model).id

            # Delete the object
            with transaction.atomic():
                model.deleted = True
                model.deleted_on = timezone.now()
                model.save()

            if object_type == "outcome" or object_type == "outcome_base":
                outcomes_list = [object_id] + list(
                    DAO.get_descendant_outcomes(model).values_list(
                        "pk", flat=True
                    )
                )
                extra_data = RefreshSerializerNode(
                    Node.objects.filter(outcomes__in=outcomes_list),
                    many=True,
                ).data
                outcomes_to_update = RefreshSerializerOutcome(
                    Outcome.objects.filter(
                        horizontal_outcomes__in=outcomes_list
                    ),
                    many=True,
                ).data
            elif object_type == "column":
                extra_data = (
                    model.get_workflow()
                    .columnworkflow_set.filter(column__deleted=False)
                    .order_by("rank")
                    .first()
                    .column.id
                )
        except (ProtectedError, ObjectDoesNotExist):
            return Response({"error": "Object does not exist"}, status=400)

        try:
            workflow = model.get_workflow()
        except AttributeError as e:
            logger.exception("An error occurred")
        pass
        if workflow is not None:
            action = actions.deleteSelfSoftAction(
                object_id, object_type, parent_id, extra_data
            )
            actions.dispatch_wf(
                workflow,
                action,
            )
            if object_type == "outcome" or object_type == "outcome_base":
                actions.dispatch_to_parent_wf(
                    workflow,
                    action,
                )
                if linked_workflows:
                    for wf in linked_workflows:
                        actions.dispatch_wf(wf, action)
                        actions.dispatch_wf(
                            wf,
                            actions.updateHorizontalLinks(
                                {"data": outcomes_to_update}
                            ),
                        )
        if (
            object_type != "outcome"
            and object_type != "outcome_base"
            and linked_workflows
        ):
            for wf in linked_workflows:
                actions.dispatch_parent_updated(wf)
        if object_type in ["workflow", "activity", "course", "program"]:
            for parent_workflow in parent_workflows:
                actions.dispatch_child_updated(
                    parent_workflow, model.get_workflow()
                )
        return Response({"message": "success"}, status=status.HTTP_200_OK)

    @user_can_view(False)
    @user_can_edit(False, get_parent=True)
    def duplicate(request: Request) -> Response:
        body = json.loads(request.body)
        object_id = body.get("objectID")
        object_type = body.get("objectType")
        parent_id = body.get("parentID")
        parent_type = body.get("parentType")
        through_type = body.get("throughType")
        node_updates = []
        try:
            with transaction.atomic():
                if object_type == "week":
                    model = DAO.get_model_from_str(object_type).objects.get(
                        id=object_id
                    )
                    parent = DAO.get_model_from_str(parent_type).objects.get(
                        id=parent_id
                    )
                    through = WeekWorkflow.objects.get(
                        week=model, workflow=parent
                    )
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
                            NodeLink.objects.filter(
                                source_node__week=newmodel
                            ),
                            many=True,
                        ).data,
                    }
                elif object_type == "node":
                    model = DAO.get_model_from_str(object_type).objects.get(
                        id=object_id
                    )
                    parent = DAO.get_model_from_str(parent_type).objects.get(
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
                            OutcomeNode.objects.filter(node=newmodel),
                            many=True,
                        ).data,
                    }
                elif object_type == "column":
                    model = DAO.get_model_from_str(object_type).objects.get(
                        id=object_id
                    )
                    parent = DAO.get_model_from_str(parent_type).objects.get(
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
                    new_model_serialized = ColumnSerializerShallow(
                        newmodel
                    ).data
                    new_through_serialized = ColumnWorkflowSerializerShallow(
                        newthroughmodel
                    ).data
                    new_children_serialized = None
                elif object_type == "outcome":
                    model = DAO.get_model_from_str(object_type).objects.get(
                        id=object_id
                    )
                    newmodel = fast_duplicate_outcome(model, request.user)

                    try:
                        newmodel.title = newmodel.title + _("(copy)")
                        newmodel.save()
                    except (ValidationError, TypeError):
                        pass

                    if parent_type == "outcome":
                        parent = DAO.get_model_from_str(
                            parent_type
                        ).objects.get(id=parent_id)
                        through = OutcomeOutcome.objects.get(
                            child=model, parent=parent
                        )
                        newthroughmodel = OutcomeOutcome.objects.create(
                            parent=parent,
                            child=newmodel,
                            rank=through.rank + 1,
                        )
                        new_through_serialized = (
                            OutcomeOutcomeSerializerShallow(
                                newthroughmodel
                            ).data
                        )
                    elif parent_type == "workflow":
                        parent = DAO.get_model_from_str(
                            parent_type
                        ).objects.get(id=parent_id)
                        through = OutcomeWorkflow.objects.get(
                            outcome=model, workflow=parent
                        )
                        newthroughmodel = OutcomeWorkflow.objects.create(
                            workflow=parent,
                            outcome=newmodel,
                            rank=through.rank + 1,
                        )
                        new_through_serialized = (
                            OutcomeWorkflowSerializerShallow(
                                newthroughmodel
                            ).data
                        )

                    new_model_serialized = OutcomeSerializerShallow(
                        newmodel
                    ).data
                    (
                        outcomes,
                        outcomeoutcomes,
                    ) = DAO.get_all_outcomes_for_outcome(newmodel)
                    outcomenodes = OutcomeNode.objects.filter(
                        outcome__id__in=[newmodel.id]
                        + [x.id for x in outcomes]
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
            linked_workflows = Workflow.objects.filter(
                linked_nodes__week=model
            )
        if linked_workflows:
            for wf in linked_workflows:
                actions.dispatch_parent_updated(wf)

        return Response({"message": "success"}, status=status.HTTP_200_OK)

    @staticmethod
    @user_can_delete(False)
    @api_view(["POST"])
    def restore(request: Request, pk: int) -> Response:
        """
        -- Restore an object that was soft-deleted
        -- issue a socket update for all referenced workflow (what defines a reference ?)
        :param pk:
        :param request:
        :return:
        """
        serializer = DeleteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        # assing payload data to local objects
        object_id = pk
        object_type = serializer.validated_data["objectType"]

        try:
            model = DAO.get_model_from_str(object_type).objects.get(
                id=object_id
            )
            workflow = None
            extra_data = None
            parent_id = None
            throughparent_id = None
            throughparent_index = None
            # object_suffix = ""

            # Restore the object
            with transaction.atomic():
                model.deleted = False
                model.save()

            try:
                workflow = model.get_workflow()
            except AttributeError as e:
                logger.exception("An error occurred")
            pass
            # Check to see if we have any linked workflows that need to be updated
            linked_workflows = False
            if object_type == ObjectType.NODE:
                linked_workflows = list(
                    Workflow.objects.filter(linked_nodes=model)
                )
            elif object_type == ObjectType.WEEK:
                linked_workflows = list(
                    Workflow.objects.filter(linked_nodes__week=model)
                )
            elif object_type in ["workflow", "activity", "course", "program"]:
                linked_workflows = list(
                    Workflow.objects.filter(
                        linked_nodes__week__workflow__id=model.id
                    )
                )
                parent_workflows = [
                    node.get_workflow()
                    for node in Node.objects.filter(linked_workflow=model)
                ]
            elif object_type == ObjectType.OUTCOME:
                linked_workflows = list(
                    Workflow.objects.filter(
                        Q(
                            linked_nodes__outcomes__in=[model.id]
                            + list(
                                DAO.get_descendant_outcomes(model).values_list(
                                    "pk", flat=True
                                )
                            )
                        )
                    )
                )
            if object_type == ObjectType.OUTCOME:
                outcomes_list = [object_id] + list(
                    DAO.get_descendant_outcomes(model).values_list(
                        "pk", flat=True
                    )
                )
                extra_data = RefreshSerializerNode(
                    Node.objects.filter(outcomes__in=outcomes_list),
                    many=True,
                ).data
                outcomes_to_update = RefreshSerializerOutcome(
                    Outcome.objects.filter(
                        horizontal_outcomes__in=outcomes_list
                    ),
                    many=True,
                ).data
            if object_type == ObjectType.WEEK:
                throughparent = WeekWorkflow.objects.get(week=model)
                throughparent_id = throughparent.id
                parent_id = workflow.id
                throughparent_index = (
                    workflow.weekworkflow_set.exclude(week__deleted=True)
                    .filter(rank__lt=throughparent.rank)
                    .count()
                )
            elif object_type == ObjectType.COLUMN:
                throughparent = ColumnWorkflow.objects.get(column=model)
                throughparent_id = throughparent.id
                throughparent_index = (
                    workflow.columnworkflow_set.exclude(column__deleted=True)
                    .filter(rank__lt=throughparent.rank)
                    .count()
                )
                extra_data = [x.id for x in Node.objects.filter(column=model)]
                parent_id = workflow.id
            elif object_type == ObjectType.NODE:
                throughparent = NodeWeek.objects.get(node=model)
                throughparent_id = throughparent.id
                throughparent_index = (
                    throughparent.week.nodeweek_set.exclude(node__deleted=True)
                    .filter(rank__lt=throughparent.rank)
                    .count()
                )
                parent_id = throughparent.week.id
            elif object_type == ObjectType.NODELINK:
                throughparent_id = None
                parent_id = Node.objects.get(outgoing_links=model).id
            elif object_type == ObjectType.OUTCOME and model.depth == 0:
                throughparent = OutcomeWorkflow.objects.get(outcome=model)
                throughparent_id = throughparent.id
                throughparent_index = (
                    workflow.outcomeworkflow_set.exclude(outcome__deleted=True)
                    .filter(rank__lt=throughparent.rank)
                    .count()
                )
                parent_id = workflow.id
                object_type = "outcome_base"

            elif object_type == ObjectType.OUTCOME:
                throughparent = OutcomeOutcome.objects.get(child=model)
                throughparent_id = throughparent.id
                throughparent_index = (
                    throughparent.parent.child_outcome_links.exclude(
                        child__deleted=True
                    )
                    .filter(rank__lt=throughparent.rank)
                    .count()
                )
                parent_id = throughparent.parent.id

        except (ProtectedError, ObjectDoesNotExist):
            return Response({"error": "ObjectDoesNotExist"}, status=400)

        if workflow is not None:
            action = actions.restoreSelfAction(
                object_id,
                object_type,
                parent_id,
                throughparent_id,
                throughparent_index,
                extra_data,
            )
            actions.dispatch_wf(
                workflow,
                action,
            )
            if object_type == "outcome" or object_type == "outcome_base":
                actions.dispatch_to_parent_wf(
                    workflow,
                    action,
                )
                if linked_workflows:
                    for wf in linked_workflows:
                        actions.dispatch_wf(wf, action)
                        actions.dispatch_wf(
                            wf,
                            actions.updateHorizontalLinks(
                                {"data": outcomes_to_update}
                            ),
                        )
        if (
            object_type != "outcome"
            and object_type != "outcome_base"
            and linked_workflows
        ):
            for wf in linked_workflows:
                actions.dispatch_parent_updated(wf)
        if object_type in ["workflow", "activity", "course", "program"]:
            for parent_workflow in parent_workflows:
                actions.dispatch_child_updated(
                    parent_workflow, model.get_workflow()
                )
        return Response({"message": "success"}, status=status.HTTP_200_OK)

    #########################################################
    # USERS
    #########################################################
    @staticmethod
    # @user_can_view(False)
    @api_view(["POST"])
    def user__list(request: Request, pk: int) -> Response:
        """
        This is about getting users by workspace object (project or workflow only)
        :param pk:
        :param request:
        :return:
        """
        serializer = DeleteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            logger.log(logging.INFO, "invalid serializer")
            return Response(serializer.errors, status=400)

        # passing payload data to local objects
        object_id = pk
        object_type = serializer.validated_data["object_type"]

        if object_type in ["activity", "course", "program"]:
            object_type = "workflow"

        content_type = ContentType.objects.get(model=object_type)
        this_object = DAO.get_model_from_str(object_type).objects.get(
            id=object_id
        )
        published = this_object.published
        public_view = False

        if object_type == "workflow":
            public_view = this_object.public_view
        try:
            this_object = DAO.get_model_from_str(object_type).objects.get(
                id=object_id
            )
            cannot_change = []
            if this_object.author is not None:
                cannot_change = [this_object.author.id]
                author = UserSerializer(this_object.author).data
                if object_type == "workflow" and not this_object.is_strategy:
                    cannot_change.append(this_object.get_project().author.id)
            else:
                author = None
            editors = set()
            for object_permission in ObjectPermission.objects.filter(
                content_type=content_type,
                object_id=object_id,
                permission_type=Permission.PERMISSION_EDIT.value,
            ).select_related("user"):
                editors.add(object_permission.user)
            viewers = set()

            for object_permission in ObjectPermission.objects.filter(
                content_type=content_type,
                object_id=object_id,
                permission_type=Permission.PERMISSION_VIEW.value,
            ).select_related("user"):
                viewers.add(object_permission.user)
            commentors = set()

            for object_permission in ObjectPermission.objects.filter(
                content_type=content_type,
                object_id=object_id,
                permission_type=Permission.PERMISSION_COMMENT.value,
            ).select_related("user"):
                commentors.add(object_permission.user)
            students = set()

            for object_permission in ObjectPermission.objects.filter(
                content_type=content_type,
                object_id=object_id,
                permission_type=Permission.PERMISSION_STUDENT.value,
            ).select_related("user"):
                students.add(object_permission.user)

            try:
                if (
                    Group.objects.get(name="SALTISE_Staff")
                    in request.user.groups.all()
                ):
                    saltise_user = True
                else:
                    saltise_user = False
            except ObjectDoesNotExist as e:
                logger.exception("An error occurred")
                saltise_user = False
            is_template = this_object.is_template

        except ValidationError as e:
            logger.exception("An error occurred")
            return Response({"action": "error"})

        return Response(
            {
                "message": "success",
                "author": author,
                "viewers": UserSerializer(viewers, many=True).data,
                "commentors": UserSerializer(commentors, many=True).data,
                "editors": UserSerializer(editors, many=True).data,
                "students": UserSerializer(students, many=True).data,
                "published": published,
                "public_view": public_view,
                "cannot_change": cannot_change,
                "saltise_user": saltise_user,
                "is_template": is_template,
            },
            status=status.HTTP_200_OK,
        )
