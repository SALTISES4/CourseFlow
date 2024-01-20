import json
import traceback

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpRequest, JsonResponse
from rest_framework.renderers import JSONRenderer

from course_flow.decorators import (
    public_model_access,
    user_can_comment,
    user_can_edit,
    user_can_view,
    user_can_view_or_none,
    user_is_teacher,
)
from course_flow.models import (
    Activity,
    Course,
    Node,
    Notification,
    ObjectSet,
    Project,
    Workflow,
)
from course_flow.models.relations import (
    NodeLink,
    NodeWeek,
    OutcomeHorizontalLink,
    OutcomeNode,
    OutcomeWorkflow,
)
from course_flow.serializers import (
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    CommentSerializer,
    InfoBoxSerializer,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    ObjectSetSerializerShallow,
    OutcomeHorizontalLinkSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    ProjectSerializerShallow,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
    WorkflowSerializerShallow,
    serializer_lookups_shallow,
)
from course_flow.utils import (
    get_all_outcomes_for_workflow,
    get_model_from_str,
    get_parent_nodes_for_workflow,
)
from course_flow.view_utils import (
    get_my_projects,
    get_workflow_context_data,
    get_workflow_data_package,
)

#################################################
# Bulk data API for workflows
# These are used by renderers on loading a workflow
# view to fetch all the base JSON that can be
# placed into the redux state
#################################################


@user_can_view("workflowPk")
def json_api_post_get_workflow_data(request: HttpRequest) -> JsonResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        data_package = get_workflow_data_flat(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        traceback.print_exc()
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@user_can_view("workflowPk")
def json_api_post_get_workflow_parent_data(
    request: HttpRequest,
) -> JsonResponse:
    workflow = Workflow.objects.get(pk=request.POST.get("workflowPk"))
    try:
        data_package = get_parent_outcome_data(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@user_can_view("nodePk")
def json_api_post_get_workflow_child_data(
    request: HttpRequest,
) -> JsonResponse:
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    try:
        data_package = get_child_outcome_data(
            node.linked_workflow, request.user, node.get_workflow()
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


# Public versions if the workflow is public


@public_model_access("workflow")
def json_api_get_public_workflow_data(
    request: HttpRequest, pk
) -> JsonResponse:
    workflow = Workflow.objects.get(pk=pk)
    try:
        data_package = get_workflow_data_flat(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@public_model_access("node", rate=50)
def json_api_get_public_workflow_child_data(
    request: HttpRequest, pk
) -> JsonResponse:
    node = Node.objects.get(pk=pk)
    try:
        data_package = get_child_outcome_data(
            node.linked_workflow, request.user, node.get_workflow()
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@public_model_access("workflow")
def json_api_get_public_workflow_parent_data(
    request: HttpRequest, pk
) -> JsonResponse:
    workflow = Workflow.objects.get(pk=pk)
    try:
        data_package = get_parent_outcome_data(
            workflow.get_subclass(), request.user
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


################################################
# Getting groups of workflows or context for
# workflows.
################################################


@user_can_view("workflowPk")
def json_api_post_get_workflow_context(request: HttpRequest) -> JsonResponse:
    workflowPk = request.POST.get("workflowPk", False)
    try:
        workflow = Workflow.objects.get(pk=workflowPk)
        data_package = get_workflow_context_data(
            workflow,
            {},
            request.user,
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
            "workflow_id": workflowPk,
        }
    )


@user_is_teacher()
def json_api_post_get_target_projects(request: HttpRequest) -> JsonResponse:
    try:
        workflow_id = Workflow.objects.get(
            pk=request.POST.get("workflowPk")
        ).id
    except ObjectDoesNotExist:
        workflow_id = 0
    try:
        data_package = get_my_projects(request.user, False, for_add=True)
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
            "workflow_id": workflow_id,
        }
    )


@user_can_comment(False)
def json_api_post_get_comments_for_object(
    request: HttpRequest,
) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    try:
        comments = (
            get_model_from_str(object_type)
            .objects.get(id=object_id)
            .comments.all()
            .order_by("created_on")
        )
        Notification.objects.filter(
            comment__in=comments, user=request.user
        ).update(is_unread=False)
        data_package = CommentSerializer(comments, many=True).data
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "data_package": data_package})


@public_model_access("workflow")
def json_api_get_public_parent_workflow_info(
    request: HttpRequest, pk
) -> JsonResponse:
    try:
        parent_workflows = [
            node.get_workflow()
            for node in Node.objects.filter(linked_workflow__id=pk)
        ]
        data_package = InfoBoxSerializer(
            parent_workflows, many=True, context={"user": request.user}
        ).data
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "parent_workflows": data_package})


@user_can_view("workflowPk")
def json_api_post_get_parent_workflow_info(
    request: HttpRequest,
) -> JsonResponse:
    workflow_id = json.loads(request.POST.get("workflowPk"))
    try:
        parent_workflows = [
            node.get_workflow()
            for node in Node.objects.filter(linked_workflow__id=workflow_id)
        ]
        data_package = InfoBoxSerializer(
            parent_workflows, many=True, context={"user": request.user}
        ).data
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted", "parent_workflows": data_package})


@user_can_view("projectPk")
def json_api_post_get_workflows_for_project(
    request: HttpRequest,
) -> JsonResponse:
    user = request.user
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    workflows_serialized = InfoBoxSerializer(
        project.workflows.all(), many=True, context={"user": user}
    ).data
    return JsonResponse({"data_package": workflows_serialized})


@user_can_view("projectPk")
def json_api_post_get_project_data(request: HttpRequest) -> JsonResponse:
    project = Project.objects.get(pk=request.POST.get("projectPk"))
    try:
        project_data = (
            JSONRenderer()
            .render(
                ProjectSerializerShallow(
                    project, context={"user": request.user}
                ).data
            )
            .decode("utf-8")
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "project_data": project_data,
        }
    )


@user_can_edit("nodePk")
def json_api_post_get_possible_linked_workflows(
    request: HttpRequest,
) -> JsonResponse:
    node = Node.objects.get(pk=request.POST.get("nodePk"))
    try:
        project = node.get_workflow().get_project()
        data_package = get_workflow_data_package(
            request.user,
            project,
            type_filter=Workflow.SUBCLASSES[node.node_type - 1],
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {"action": "posted", "data_package": data_package, "node_id": node.id}
    )


@user_can_view_or_none("projectPk")
def json_api_post_get_possible_added_workflows(
    request: HttpRequest,
) -> JsonResponse:
    type_filter = json.loads(request.POST.get("type_filter"))
    get_strategies = json.loads(request.POST.get("get_strategies", "false"))
    projectPk = request.POST.get("projectPk", False)
    self_only = json.loads(request.POST.get("self_only", "false"))
    if projectPk:
        project = Project.objects.get(pk=request.POST.get("projectPk"))
    else:
        project = None
    try:
        data_package = get_workflow_data_package(
            request.user,
            project,
            type_filter=type_filter,
            get_strategies=get_strategies,
            self_only=self_only,
        )
    except AttributeError:
        return JsonResponse({"action": "error"})
    return JsonResponse(
        {
            "action": "posted",
            "data_package": data_package,
            "project_id": projectPk,
        }
    )


#################################################
# The logic for the above views
#################################################


# For a workflow, gets all relevant info about parent workflows and their outcomes.
# Only relevant/loaded for views that rely on parent outcomes.
def get_parent_outcome_data(workflow, user):
    outcomes, outcomeoutcomes = get_all_outcomes_for_workflow(workflow)
    parent_nodes = get_parent_nodes_for_workflow(workflow)
    parent_workflows = list(map(lambda x: x.get_workflow(), parent_nodes))
    parent_outcomeworkflows = OutcomeWorkflow.objects.filter(
        workflow__in=parent_workflows
    )
    parent_outcomenodes = OutcomeNode.objects.filter(node__in=parent_nodes)

    parent_outcomes = []
    parent_outcomeoutcomes = []
    for parent_workflow in parent_workflows:
        new_outcomes, new_outcomeoutcomes = get_all_outcomes_for_workflow(
            parent_workflow
        )
        parent_outcomes += new_outcomes
        parent_outcomeoutcomes += new_outcomeoutcomes

    outcomehorizontallinks = OutcomeHorizontalLink.objects.filter(
        outcome__in=outcomes, parent_outcome__in=parent_outcomes
    )
    if len(parent_workflows) > 0:
        outcome_type = parent_workflows[0].type + " outcome"
    else:
        outcome_type = workflow.type + " outcome"
    return {
        "parent_workflow": WorkflowSerializerShallow(
            parent_workflows, many=True, context={"user": user}
        ).data,
        "outcomeworkflow": OutcomeWorkflowSerializerShallow(
            parent_outcomeworkflows, many=True
        ).data,
        "parent_node": NodeSerializerShallow(
            parent_nodes, many=True, context={"user": user}
        ).data,
        "outcomenode": OutcomeNodeSerializerShallow(
            parent_outcomenodes, many=True
        ).data,
        "outcome": OutcomeSerializerShallow(
            parent_outcomes, many=True, context={"type": outcome_type}
        ).data,
        "outcomeoutcome": OutcomeOutcomeSerializerShallow(
            parent_outcomeoutcomes, many=True
        ).data,
        "outcomehorizontallink": OutcomeHorizontalLinkSerializerShallow(
            outcomehorizontallinks, many=True
        ).data,
    }


# For a workflow, get all the child outcome data. Only used for
# views that rely on this data such as the outcome analytics view.
def get_child_outcome_data(workflow, user, parent_workflow):
    nodes = Node.objects.filter(
        week__workflow=parent_workflow, linked_workflow=workflow
    )
    linked_workflows = [workflow]
    child_workflow_outcomeworkflows = []
    child_workflow_outcomes = []
    child_workflow_outcomeoutcomes = []
    for linked_workflow in linked_workflows:
        child_workflow_outcomeworkflows += (
            linked_workflow.outcomeworkflow_set.all()
        )
        (
            new_child_workflow_outcomes,
            new_child_workflow_outcomeoutcomes,
        ) = get_all_outcomes_for_workflow(linked_workflow)
        child_workflow_outcomes += new_child_workflow_outcomes
        child_workflow_outcomeoutcomes += new_child_workflow_outcomeoutcomes

    outcomehorizontallinks = []
    for child_outcome in child_workflow_outcomes:
        outcomehorizontallinks += child_outcome.outcome_horizontal_links.all()

    if len(linked_workflows) > 0:
        outcome_type = linked_workflows[0].type + " outcome"
    else:
        outcome_type = workflow.type + " outcome"

    response_data = {
        "node": NodeSerializerShallow(
            nodes, many=True, context={"user": user}
        ).data,
        "child_workflow": WorkflowSerializerShallow(
            linked_workflows, many=True, context={"user": user}
        ).data,
        "outcomeworkflow": OutcomeWorkflowSerializerShallow(
            child_workflow_outcomeworkflows, many=True
        ).data,
        "outcome": OutcomeSerializerShallow(
            child_workflow_outcomes,
            many=True,
            context={"type": outcome_type},
        ).data,
        "outcomeoutcome": OutcomeOutcomeSerializerShallow(
            child_workflow_outcomeoutcomes, many=True
        ).data,
        "outcomehorizontallink": OutcomeHorizontalLinkSerializerShallow(
            outcomehorizontallinks, many=True
        ).data,
    }

    return response_data


# Get the JSON state for a workflow, including all relevant objects.
def get_workflow_data_flat(workflow, user):
    SerializerClass = serializer_lookups_shallow[workflow.type]
    columnworkflows = workflow.columnworkflow_set.all()
    weekworkflows = workflow.weekworkflow_set.all()
    columns = workflow.columns.all()
    weeks = workflow.weeks.all()
    nodeweeks = NodeWeek.objects.filter(week__workflow=workflow)
    nodes = Node.objects.filter(week__workflow=workflow).prefetch_related(
        "outcomenode_set",
        "liveassignment_set",
    )
    nodelinks = NodeLink.objects.filter(source_node__in=nodes)

    if not workflow.is_strategy:
        outcomeworkflows = workflow.outcomeworkflow_set.all()
        outcomes, outcomeoutcomes = get_all_outcomes_for_workflow(workflow)
        outcomenodes = OutcomeNode.objects.filter(
            node__week__workflow=workflow
        )
        objectsets = ObjectSet.objects.filter(project__workflows=workflow)

    data_flat = {
        "workflow": SerializerClass(workflow, context={"user": user}).data,
        "columnworkflow": ColumnWorkflowSerializerShallow(
            columnworkflows, many=True
        ).data,
        "column": ColumnSerializerShallow(columns, many=True).data,
        "weekworkflow": WeekWorkflowSerializerShallow(
            weekworkflows, many=True
        ).data,
        "week": WeekSerializerShallow(weeks, many=True).data,
        "nodeweek": NodeWeekSerializerShallow(nodeweeks, many=True).data,
        "nodelink": NodeLinkSerializerShallow(nodelinks, many=True).data,
    }

    data_flat["node"] = NodeSerializerShallow(
        nodes, many=True, context={"user": user}
    ).data

    if not workflow.is_strategy:
        data_flat["outcomeworkflow"] = OutcomeWorkflowSerializerShallow(
            outcomeworkflows, many=True
        ).data
        data_flat["outcome"] = OutcomeSerializerShallow(
            outcomes, many=True, context={"type": workflow.type + " outcome"}
        ).data
        data_flat["outcomeoutcome"] = OutcomeOutcomeSerializerShallow(
            outcomeoutcomes, many=True
        ).data
        data_flat["outcomenode"] = OutcomeNodeSerializerShallow(
            outcomenodes, many=True
        ).data
        data_flat["objectset"] = ObjectSetSerializerShallow(
            objectsets, many=True
        ).data
        if (
            workflow.type == "course"
            and user is not None
            and user.is_authenticated
        ):
            data_flat["strategy"] = WorkflowSerializerShallow(
                Course.objects.filter(
                    author=user, is_strategy=True, deleted=False
                ),
                many=True,
                context={"user": user},
            ).data
            data_flat["saltise_strategy"] = WorkflowSerializerShallow(
                Course.objects.filter(
                    from_saltise=True,
                    is_strategy=True,
                    published=True,
                    deleted=False,
                ),
                many=True,
                context={"user": user},
            ).data
        elif (
            workflow.type == "activity"
            and user is not None
            and user.is_authenticated
        ):
            data_flat["strategy"] = WorkflowSerializerShallow(
                Activity.objects.filter(
                    author=user, is_strategy=True, deleted=False
                ),
                many=True,
                context={"user": user},
            ).data
            data_flat["saltise_strategy"] = WorkflowSerializerShallow(
                Activity.objects.filter(
                    from_saltise=True,
                    is_strategy=True,
                    published=True,
                    deleted=False,
                ),
                many=True,
                context={"user": user},
            ).data

    if user.pk is not None:
        data_flat["unread_comments"] = [
            x.comment.id
            for x in Notification.objects.filter(
                user=user,
                content_type=ContentType.objects.get_for_model(Workflow),
                object_id=workflow.pk,
                is_unread=True,
            ).exclude(comment=None)
        ]

    return data_flat
