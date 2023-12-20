import json

from django.contrib.auth.decorators import login_required
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from django.db.models import ProtectedError
from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_POST

from course_flow.decorators import (
    from_same_workflow,
    user_can_edit,
    user_can_edit_or_none,
    user_can_view,
    user_can_view_or_none,
)
from course_flow.duplication_functions import (
    fast_create_strategy,
    fast_duplicate_workflow,
)
from course_flow.forms import NotificationsSettings, ProfileSettings
from course_flow.models.column import Column
from course_flow.models.courseFlowUser import CourseFlowUser
from course_flow.models.favourite import Favourite
from course_flow.models.node import Node
from course_flow.models.objectset import ObjectSet
from course_flow.models.outcome import Outcome
from course_flow.models.relations.outcomeHorizontalLink import (
    OutcomeHorizontalLink,
)
from course_flow.models.relations.outcomeNode import OutcomeNode
from course_flow.models.relations.weekWorkflow import WeekWorkflow
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.models.week import Week
from course_flow.models.workflow import Workflow
from course_flow.serializers import (
    ActivitySerializerShallow,
    CourseSerializerShallow,
    LinkedWorkflowSerializerShallow,
    NodeSerializerShallow,
    OutcomeHorizontalLinkSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    RefreshSerializerNode,
    RefreshSerializerOutcome,
    serializer_lookups_shallow,
)
from course_flow.sockets import redux_actions as actions
from course_flow.utils import (
    check_possible_parent,
    get_all_outcomes_for_outcome,
    get_descendant_outcomes,
    get_model_from_str,
    save_serializer,
)

###############################
# Our update methods that update
# an object's values
###############################


# Updates an object's information using its serializer. This is
# the most frequently used view, used to change almost any
# non-foreign key fields on models
@user_can_edit(False)
def json_api_post_update_value(request: HttpRequest) -> JsonResponse:
    try:
        object_id = json.loads(request.POST.get("objectID"))
        object_type = json.loads(request.POST.get("objectType"))
        data = json.loads(request.POST.get("data"))
        changeFieldID = request.POST.get("changeFieldID", False)
        if changeFieldID:
            changeFieldID = json.loads(changeFieldID)
        objects = get_model_from_str(object_type).objects
        if hasattr(objects, "get_subclass"):
            object_to_update = objects.get_subclass(pk=object_id)
        else:
            object_to_update = objects.get(pk=object_id)
        serializer = serializer_lookups_shallow[object_type](
            object_to_update, data=data, partial=True
        )
        save_serializer(serializer)
    except ValidationError:
        return JsonResponse({"action": "error"})
    try:
        workflow = object_to_update.get_workflow()
        actions.dispatch_wf(
            workflow,
            actions.changeField(object_id, object_type, data, changeFieldID),
        )
        if object_type == "outcome":
            actions.dispatch_to_parent_wf(
                workflow,
                actions.changeField(object_id, object_type, data),
            )
    except AttributeError:
        pass

    return JsonResponse({"action": "posted"})


# Insert a model via its throughmodel to reorder it
@user_can_edit(False)
@user_can_edit_or_none(False, get_parent=True)
@user_can_edit_or_none("columnPk")
@from_same_workflow(False, False, get_parent=True)
@from_same_workflow(False, "columnPk")
def json_api_post_inserted_at(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    inserted = json.loads(request.POST.get("inserted", "false"))
    column_change = json.loads(request.POST.get("columnChange", "false"))
    changing_workflow = False
    try:
        with transaction.atomic():
            if column_change:
                new_column_id = json.loads(request.POST.get("columnPk"))
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                new_column = Column.objects.get(id=new_column_id)
                model.column = new_column
                model.save()
            if inserted:
                parent_id = json.loads(request.POST.get("parentID"))
                parent_type = json.loads(request.POST.get("parentType"))
                new_position = json.loads(request.POST.get("newPosition"))
                through_type = json.loads(request.POST.get("throughType"))
                model = get_model_from_str(object_type).objects.get(
                    id=object_id
                )
                parent = get_model_from_str(parent_type).objects.get(
                    id=parent_id
                )
                workflow1 = model.get_workflow()
                workflow2 = parent.get_workflow()
                if workflow1.pk != workflow2.pk:
                    changing_workflow = True
                    if (
                        workflow1.get_project().pk
                        == workflow2.get_project().pk
                    ):
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
                            linked_workflows = Workflow.objects.filter(
                                linked_nodes=model
                            )
                        elif (
                            object_type == "outcome"
                            or object_type == "outcome_base"
                        ):
                            OutcomeNode.objects.filter()
                            outcomes_list = [object_id] + list(
                                get_descendant_outcomes(model).values_list(
                                    "pk", flat=True
                                )
                            )
                            affected_nodes = (
                                Node.objects.filter(
                                    outcomes__in=outcomes_list
                                ).values_list("pk", flat=True),
                            )
                            linked_workflows = Workflow.objects.filter(
                                linked_nodes__outcomes__in=outcomes_list
                            )
                            OutcomeNode.objects.filter(
                                outcome__in=outcomes_list
                            ).delete()
                        else:
                            return JsonResponse({"action": "posted"})
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
                        get_model_from_str(through_type)
                        .objects.filter(**index_kwargs)
                        .order_by("rank")
                    )
                    if new_position < 0:
                        new_position = 0
                    elif new_position >= all_throughs.count():
                        new_position = all_throughs.count()
                    else:
                        new_position = (
                            get_model_from_str(through_type)
                            .objects.filter(**index_kwargs)
                            .order_by("rank")[new_position]
                            .rank
                        )
                except (IndexError, AttributeError):
                    print("had an error in inserted_at")

                old_through_id = (
                    get_model_from_str(through_type)
                    .objects.filter(**search_kwargs)
                    .first()
                    .id
                )
                new_through = get_model_from_str(through_type).objects.create(
                    rank=new_position, **creation_kwargs
                )

    except ValidationError:
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
                    Outcome.objects.filter(
                        horizontal_outcomes__in=outcomes_list
                    ),
                    many=True,
                ).data
                outcomes, outcomeoutcomes = get_all_outcomes_for_outcome(model)
                new_children_serialized = {
                    "outcome": OutcomeSerializerShallow(
                        outcomes, many=True
                    ).data,
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
            new_model_serialized = serializer_lookups_shallow[object_type](
                model
            ).data
            new_through_serialized = serializer_lookups_shallow[through_type](
                new_through
            ).data
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
        else:
            if object_type == "outcome":
                outcomes, outcomeoutcomes = get_all_outcomes_for_outcome(model)
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
                    "outcomenode": OutcomeNodeSerializerShallow(
                        outcomenodes, many=True
                    ).data,
                }
                extra_data = {
                    "children": new_children_serialized,
                    "node_updates": node_updates,
                }
            else:
                extra_data = {}

            actions.dispatch_wf(
                workflow,
                actions.changeThroughID(
                    through_type, old_through_id, new_through.id, extra_data
                ),
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
    return JsonResponse({"action": "posted"})


# Links an outcome to a node
@user_can_edit("nodePk")
@user_can_view("outcomePk")
@from_same_workflow("nodePk", "outcomePk")
def json_api_post_update_outcomenode_degree(
    request: HttpRequest,
) -> JsonResponse:
    node_id = json.loads(request.POST.get("nodePk"))
    outcome_id = json.loads(request.POST.get("outcomePk"))
    degree = json.loads(request.POST.get("degree"))

    try:
        node = Node.objects.get(id=node_id)
        workflow = node.get_workflow()
        if (
            OutcomeNode.objects.filter(
                node__id=node_id, outcome__id=outcome_id, degree=degree
            ).count()
            > 0
        ):
            return JsonResponse({"action": "posted", "outcomenode": -1})
        model = OutcomeNode.objects.create(
            node=node,
            outcome=Outcome.objects.get(id=outcome_id),
            degree=degree,
        )
        new_outcomenodes = OutcomeNodeSerializerShallow(
            [model]
            + model.check_parent_outcomes()
            + model.check_child_outcomes(),
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
    update_action = actions.updateOutcomenodeDegreeAction(response_data)
    actions.dispatch_wf(
        workflow,
        update_action,
    )
    if node.linked_workflow is not None:
        actions.dispatch_wf(
            node.linked_workflow,
            update_action,
        )
    return JsonResponse({"action": "posted"})


# Add a parent outcome to an outcome
@user_can_edit("outcomePk")
@user_can_view(False)
def json_api_post_update_outcomehorizontallink_degree(
    request: HttpRequest,
) -> JsonResponse:
    outcome_id = json.loads(request.POST.get("outcomePk"))
    object_type = json.loads(request.POST.get("objectType"))
    parent_id = json.loads(request.POST.get("objectID"))
    degree = json.loads(request.POST.get("degree"))
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


# The actual JSON API which sets the linked workflow
# for a node, adding it to the project if different.
@user_can_edit("nodePk")
@user_can_view_or_none("workflowPk")
def json_api_post_set_linked_workflow(request: HttpRequest) -> JsonResponse:
    # last_time = time.time()
    try:
        node_id = json.loads(request.POST.get("nodePk"))
        workflow_id = json.loads(request.POST.get("workflowPk"))
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


# Creates strategy from week or turns strategy into week
@user_can_edit("weekPk")
def json_api_post_week_toggle_strategy(request: HttpRequest) -> JsonResponse:
    try:
        object_id = json.loads(request.POST.get("weekPk"))
        is_strategy = json.loads(request.POST.get("is_strategy"))
        week = Week.objects.get(id=object_id)
        workflow = WeekWorkflow.objects.get(week=week).workflow
        # This check is to prevent people from spamming the button, which would
        # potentially create a bunch of superfluous strategies
        if week.is_strategy != is_strategy:
            raise ValidationError("Request has already been processed")
        if week.is_strategy:
            week.is_strategy = False
            strategy = week.original_strategy.get_subclass()
            week.original_strategy = None
            week.strategy_classification = 0
            week.save()
        else:
            strategy = fast_create_strategy(week, workflow, request.user)
            strategy.title = week.title
            strategy.save()
            week.is_strategy = True
            week.original_strategy = strategy
            week.save()
        if strategy.type == "course":
            strategy_serialized = CourseSerializerShallow(strategy).data
        elif strategy.type == "activity":
            strategy_serialized = ActivitySerializerShallow(strategy).data
        else:
            strategy_serialized = ""

    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "id": week.id,
        "is_strategy": week.is_strategy,
        "strategy": strategy_serialized,
    }

    actions.dispatch_wf(workflow, actions.toggleStrategyAction(response_data))

    return JsonResponse({"action": "posted"})


# Toggle on or off an object set for an object.
@user_can_edit(False)
@user_can_view("objectsetPk")
def json_api_post_update_object_set(request: HttpRequest) -> JsonResponse:
    try:
        object_id = json.loads(request.POST.get("objectID"))
        object_type = json.loads(request.POST.get("objectType"))
        objectset_id = json.loads(request.POST.get("objectsetPk"))
        add = json.loads(request.POST.get("add"))
        objects = get_model_from_str(object_type).objects
        if hasattr(objects, "get_subclass"):
            objects_to_update = [objects.get_subclass(pk=object_id)]
        else:
            objects_to_update = [objects.get(pk=object_id)]
            if object_type == "outcome":
                objects_to_update += list(
                    get_descendant_outcomes(objects_to_update[0])
                )
        objectset = ObjectSet.objects.get(id=objectset_id)
        if add:
            for object_to_update in objects_to_update:
                object_to_update.sets.add(objectset)
                object_to_update.save()
        else:
            for object_to_update in objects_to_update:
                object_to_update.sets.remove(objectset)
                object_to_update.save()

    except ValidationError:
        return JsonResponse({"action": "error"})
    try:
        workflow = objects_to_update[0].get_workflow()
        if len(objects_to_update) == 1:
            action = actions.changeField(
                object_id,
                object_type,
                {
                    "sets": [
                        object_set.id
                        for object_set in object_to_update.sets.all()
                    ]
                },
            )
        else:
            action = actions.changeFieldMany(
                [obj.id for obj in objects_to_update],
                object_type,
                {
                    "sets": [
                        object_set.id
                        for object_set in object_to_update.sets.all()
                    ]
                },
            )
        actions.dispatch_wf(workflow, action)
        if object_type == "outcome":
            actions.dispatch_to_parent_wf(workflow, action)
    except AttributeError:
        pass

    return JsonResponse({"action": "posted"})


# favourite/unfavourite a project or workflow for a user
@user_can_view(False)
def json_api_post_toggle_favourite(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    objectType = json.loads(request.POST.get("objectType"))
    favourite = json.loads(request.POST.get("favourite"))
    response = {}
    if objectType in ["activity", "course", "program"]:
        objectType = "workflow"
    try:
        item = get_model_from_str(objectType).objects.get(pk=object_id)
        Favourite.objects.filter(
            user=request.user,
            content_type=ContentType.objects.get_for_model(item),
            object_id=object_id,
        ).delete()
        if favourite:
            Favourite.objects.create(user=request.user, content_object=item)
        response["action"] = "posted"
    except ValidationError:
        response["action"] = "error"


@login_required
@require_POST
def json_api_post_profile_settings(request: HttpRequest) -> JsonResponse:
    user = CourseFlowUser.objects.filter(user=request.user).first()
    # instantiate the form with the JSON params and the model instance
    form = ProfileSettings(json.loads(request.body), instance=user)

    # if the form is valid, save it and return a success response
    if form.is_valid():
        form.save()
        return JsonResponse({"action": "posted"})

    # otherwise, return the errors so UI can display errors accordingly
    return JsonResponse({"action": "error", "errors": form.errors})


@login_required
@require_POST
def json_api_post_notifications_settings(request: HttpRequest) -> JsonResponse:
    user = CourseFlowUser.objects.filter(user=request.user).first()
    # on POST, instantiate the form with the JSON params and the model instance
    form = NotificationsSettings(json.loads(request.body), instance=user)

    # if the form is valid, save it and return a success response
    if form.is_valid():
        form.save()
        return JsonResponse({"action": "posted"})

    # otherwise, return the errors so UI can display errors accordingly
    return JsonResponse({"action": "error", "errors": form.errors})


# A helper function to set the linked workflow.
# Do not call if you are duplicating the parent workflow,
# that gets taken care of in another manner.
def set_linked_workflow(node: Node, workflow):
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
