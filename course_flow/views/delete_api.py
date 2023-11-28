import json

# import time
from itertools import chain

import bleach
import pandas as pd
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Count, ProtectedError, Q
from django.http import (
    HttpRequest,
    HttpResponse,
    HttpResponseForbidden,
    JsonResponse,
)
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST
from django.views.generic import DetailView, ListView, TemplateView
from django.views.generic.edit import CreateView, UpdateView
from rest_framework.generics import ListAPIView
from rest_framework.renderers import JSONRenderer

from course_flow import export_functions
from course_flow import redux_actions as actions
from course_flow import tasks
from course_flow.decorators import (
    ajax_login_required,
    check_object_enrollment,
    check_object_permission,
    from_same_workflow,
    public_model_access,
    user_can_comment,
    user_can_delete,
    user_can_edit,
    user_can_edit_or_none,
    user_can_view,
    user_can_view_or_enrolled_as_student,
    user_can_view_or_enrolled_as_teacher,
    user_can_view_or_none,
    user_enrolled_as_student,
    user_enrolled_as_teacher,
    user_is_author,
    user_is_teacher,
)
from course_flow.forms import RegistrationForm
from course_flow.models import (  # OutcomeProject,
    Activity,
    Column,
    ColumnWorkflow,
    Course,
    CourseFlowUser,
    Discipline,
    Favourite,
    LiveAssignment,
    LiveProject,
    LiveProjectUser,
    Node,
    NodeLink,
    NodeWeek,
    Notification,
    ObjectPermission,
    ObjectSet,
    Outcome,
    OutcomeHorizontalLink,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    Program,
    Project,
    User,
    UserAssignment,
    Week,
    WeekWorkflow,
    Workflow,
    WorkflowProject,
)
from course_flow.serializers import (  # OutcomeProjectSerializerShallow,
    ActivitySerializerShallow,
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    CommentSerializer,
    CourseSerializerShallow,
    DisciplineSerializer,
    InfoBoxSerializer,
    LinkedWorkflowSerializerShallow,
    LiveAssignmentSerializer,
    LiveAssignmentWithCompletionSerializer,
    LiveProjectSerializer,
    LiveProjectUserSerializer,
    LiveProjectUserSerializerWithCompletion,
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
    RefreshSerializerNode,
    RefreshSerializerOutcome,
    UserAssignmentSerializer,
    UserAssignmentSerializerWithUser,
    UserSerializer,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
    WorkflowSerializerForAssignments,
    WorkflowSerializerShallow,
    bleach_allowed_tags_description,
    bleach_allowed_tags_title,
    bleach_sanitizer,
    serializer_lookups_shallow,
)
from course_flow.utils import (  # dateTimeFormat,; get_parent_model,; get_parent_model_str,; get_unique_outcomehorizontallinks,; get_unique_outcomenodes,
    benchmark,
    check_possible_parent,
    dateTimeFormatNoSpace,
    get_all_outcomes_for_outcome,
    get_all_outcomes_for_workflow,
    get_descendant_outcomes,
    get_model_from_str,
    get_nondeleted_favourites,
    get_parent_nodes_for_workflow,
    get_relevance,
    get_user_permission,
    get_user_role,
    save_serializer,
)

####################################
# JSON API for deleting workflows,
# projects, and workflow objects.
####################################


# Hard delete. Actually deletes the object. Tend not to use
# this very often. Most of this method is just ensuring
# that workflows that use the object are kept up to date
# about it being deleted.
@user_can_delete(False)
def json_api_post_delete_self(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        workflow = None
        extra_data = None
        parent_id = None
        # object_suffix = ""
        try:
            workflow = model.get_workflow()
        except AttributeError:
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
                            get_descendant_outcomes(model).values_list(
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
                        get_descendant_outcomes(model).values_list(
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
    return JsonResponse({"action": "posted"})


# Restore an object that was soft-deleted, and ensure all relevant
# workflows are kept up to date via their websocket connections.
@user_can_delete(False)
def json_api_post_restore_self(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
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
        except AttributeError:
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
                            get_descendant_outcomes(model).values_list(
                                "pk", flat=True
                            )
                        )
                    )
                )
            )
        if object_type == "outcome":
            outcomes_list = [object_id] + list(
                get_descendant_outcomes(model).values_list("pk", flat=True)
            )
            extra_data = RefreshSerializerNode(
                Node.objects.filter(outcomes__in=outcomes_list),
                many=True,
            ).data
            outcomes_to_update = RefreshSerializerOutcome(
                Outcome.objects.filter(horizontal_outcomes__in=outcomes_list),
                many=True,
            ).data
        if object_type == "week":
            throughparent = WeekWorkflow.objects.get(week=model)
            throughparent_id = throughparent.id
            parent_id = workflow.id
            throughparent_index = (
                workflow.weekworkflow_set.exclude(week__deleted=True)
                .filter(rank__lt=throughparent.rank)
                .count()
            )
        elif object_type == "column":
            throughparent = ColumnWorkflow.objects.get(column=model)
            throughparent_id = throughparent.id
            throughparent_index = (
                workflow.columnworkflow_set.exclude(column__deleted=True)
                .filter(rank__lt=throughparent.rank)
                .count()
            )
            extra_data = [x.id for x in Node.objects.filter(column=model)]
            parent_id = workflow.id
        elif object_type == "node":
            throughparent = NodeWeek.objects.get(node=model)
            throughparent_id = throughparent.id
            throughparent_index = (
                throughparent.week.nodeweek_set.exclude(node__deleted=True)
                .filter(rank__lt=throughparent.rank)
                .count()
            )
            parent_id = throughparent.week.id
        elif object_type == "nodelink":
            throughparent_id = None
            parent_id = Node.objects.get(outgoing_links=model).id
        elif object_type == "outcome" and model.depth == 0:
            throughparent = OutcomeWorkflow.objects.get(outcome=model)
            throughparent_id = throughparent.id
            throughparent_index = (
                workflow.outcomeworkflow_set.exclude(outcome__deleted=True)
                .filter(rank__lt=throughparent.rank)
                .count()
            )
            parent_id = workflow.id
            object_type = "outcome_base"
        elif object_type == "outcome":
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
        return JsonResponse({"action": "error"})
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
    return JsonResponse({"action": "posted"})


# Soft delete the object. This just sets the deleted property
# to true. Most of this method is just ensuring
# that workflows that use the object are kept up to date
# about it being deleted.
@user_can_delete(False)
def json_api_post_delete_self_soft(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
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
                            get_descendant_outcomes(model).values_list(
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
                get_descendant_outcomes(model).values_list("pk", flat=True)
            )
            extra_data = RefreshSerializerNode(
                Node.objects.filter(outcomes__in=outcomes_list),
                many=True,
            ).data
            outcomes_to_update = RefreshSerializerOutcome(
                Outcome.objects.filter(horizontal_outcomes__in=outcomes_list),
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
        return JsonResponse({"action": "error"})

    try:
        workflow = model.get_workflow()
    except AttributeError:
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
    return JsonResponse({"action": "posted"})


# Delete self for live project objects
@user_enrolled_as_teacher(False)
def json_api_post_delete_self_live(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)

        with transaction.atomic():
            model.delete()

    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})
    return JsonResponse({"action": "posted"})


@user_can_edit(False)
def json_api_post_remove_comment(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))
    comment_id = json.loads(request.POST.get("commentPk"))

    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        comment = model.comments.get(id=comment_id)
        comment.delete()

    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})


@user_can_edit(False)
def json_api_post_remove_all_comments(request: HttpRequest) -> JsonResponse:
    object_id = json.loads(request.POST.get("objectID"))
    object_type = json.loads(request.POST.get("objectType"))

    try:
        model = get_model_from_str(object_type).objects.get(id=object_id)
        model.comments.all().delete()

    except (ProtectedError, ObjectDoesNotExist):
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})
