"""
@todo separate out domain specific tasks from generalized utils

"""
import re
import time

from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext as _

import course_flow.models.project
from course_flow import models

owned_throughmodels = [
    "node",
    "nodeweek",
    "week",
    "weekworkflow",
    "workflow",
    "workflowproject",
    "project",
    "columnworkflow",
    "workflow",
    "workflowproject",
    "project",
    "outcome",
    "outcomeoutcome",
    "outcome",
]


def get_alphanum(string):
    return re.sub(r"\W+", "", string)


# Create a regex from dict keys
def multiple_replace(dict, text):
    regex = re.compile("(%s)" % "|".join(map(re.escape, dict.keys())))
    return regex.sub(lambda mo: dict[mo.string[mo.start() : mo.end()]], text)


def dateTimeFormat():
    return "%Y/%m/%d"


def dateTimeFormatNoSpace():
    return "%Y_%m_%d_%H_%m_%s"


def get_model_from_str(model_str: str):
    return ContentType.objects.get(model=model_str).model_class()


def get_parent_model_str(model_str: str) -> str:
    return owned_throughmodels[owned_throughmodels.index(model_str) + 1]


def get_parent_model(model_str: str):
    return ContentType.objects.get(
        model=get_parent_model_str(model_str)
    ).model_class()


def linkIDMap(link):
    return link.id


def get_descendant_outcomes(outcome):
    return models.Outcome.objects.filter(
        Q(parent_outcomes=outcome)
        | Q(parent_outcomes__parent_outcomes=outcome)
    )


def get_all_outcomes_for_outcome(outcome):
    outcomes = models.Outcome.objects.filter(
        Q(parent_outcomes=outcome)
        | Q(parent_outcomes__parent_outcomes=outcome)
    ).prefetch_related(
        "outcome_horizontal_links", "child_outcome_links", "sets"
    )
    outcomeoutcomes = models.OutcomeOutcome.objects.filter(
        Q(parent=outcome) | Q(parent__parent_outcomes=outcome)
    )
    return outcomes, outcomeoutcomes


def get_all_outcomes_for_workflow(workflow):
    outcomes = models.Outcome.objects.filter(
        Q(workflow=workflow)
        | Q(parent_outcomes__workflow=workflow)
        | Q(parent_outcomes__parent_outcomes__workflow=workflow)
    ).prefetch_related(
        "outcome_horizontal_links", "child_outcome_links", "sets"
    )
    outcomeoutcomes = models.OutcomeOutcome.objects.filter(
        Q(parent__workflow=workflow)
        | Q(parent__parent_outcomes__workflow=workflow)
    )
    return outcomes, outcomeoutcomes


def get_all_outcomes_ordered_for_outcome(outcome):
    outcomes = [outcome]
    for outcomeoutcome in outcome.child_outcome_links.filter(
        child__deleted=False
    ).order_by("rank"):
        outcomes += get_all_outcomes_ordered_for_outcome(outcomeoutcome.child)
    return outcomes


def get_all_outcomes_ordered(workflow):
    outcomes = []
    for outcomeworkflow in workflow.outcomeworkflow_set.filter(
        outcome__deleted=False
    ).order_by("rank"):
        outcomes += get_all_outcomes_ordered_for_outcome(
            outcomeworkflow.outcome
        )
    return outcomes


def get_base_outcomes_ordered_filtered(workflow, extra_filter):
    return (
        models.Outcome.objects.filter(workflow=workflow, deleted=False)
        .filter(extra_filter)
        .order_by("outcomeworkflow__rank")
    )


def get_all_outcomes_ordered_filtered(workflow, extra_filter):
    outcomes = []
    for outcome in (
        models.Outcome.objects.filter(workflow=workflow, deleted=False)
        .filter(extra_filter)
        .order_by("outcomeworkflow__rank")
    ):
        outcomes += get_all_outcomes_ordered_for_outcome(outcome)
    return outcomes


def get_unique_outcomenodes(node):
    return (
        node.outcomenode_set.exclude(
            Q(outcome__deleted=True)
            | Q(outcome__parent_outcomes__deleted=True)
            | Q(outcome__parent_outcomes__parent_outcomes__deleted=True)
        )
        .exclude(outcome__parent_outcomes__node=node)
        .exclude(outcome__parent_outcomes__parent_outcomes__node=node)
        .order_by(
            "outcome__parent_outcome_links__parent__parent_outcome_links__parent__outcomeworkflow__rank",
            "outcome__parent_outcome_links__parent__outcomeworkflow__rank",
            "outcome__outcomeworkflow__rank",
            "outcome__parent_outcome_links__parent__parent_outcome_links__rank",
            "outcome__parent_outcome_links__rank",
        )
    )


def get_outcomenodes(node):
    return node.outcomenode_set.exclude(
        Q(outcome__deleted=True)
        | Q(outcome__parent_outcomes__deleted=True)
        | Q(outcome__parent_outcomes__parent_outcomes__deleted=True)
    ).order_by(
        "outcome__parent_outcome_links__parent__parent_outcome_links__parent__outcomeworkflow__rank",
        "outcome__parent_outcome_links__parent__outcomeworkflow__rank",
        "outcome__outcomeworkflow__rank",
        "outcome__parent_outcome_links__parent__parent_outcome_links__rank",
        "outcome__parent_outcome_links__rank",
    )


def get_unique_outcomehorizontallinks(outcome):
    return (
        outcome.outcome_horizontal_links.exclude(
            Q(parent_outcome__deleted=True)
            | Q(parent_outcome__parent_outcomes__deleted=True)
            | Q(parent_outcome__parent_outcomes__parent_outcomes__deleted=True)
        )
        .exclude(
            parent_outcome__parent_outcomes__reverse_horizontal_outcomes=outcome
        )
        .exclude(
            parent_outcome__parent_outcomes__parent_outcomes__reverse_horizontal_outcomes=outcome
        )
        .order_by(
            "parent_outcome__parent_outcome_links__parent__parent_outcome_links__parent__outcomeworkflow__rank",
            "parent_outcome__parent_outcome_links__parent__outcomeworkflow__rank",
            "parent_outcome__outcomeworkflow__rank",
            "parent_outcome__parent_outcome_links__parent__parent_outcome_links__rank",
            "parent_outcome__parent_outcome_links__rank",
        )
    )


def get_parent_nodes_for_workflow(workflow):
    nodes = (
        models.Node.objects.filter(linked_workflow=workflow)
        .exclude(
            Q(deleted=True)
            | Q(week__deleted=True)
            | Q(week__workflow__deleted=True)
        )
        .prefetch_related("outcomenode_set")
    )
    return nodes


def get_nondeleted_favourites(user):
    return list(
        course_flow.models.project.Project.objects.filter(
            favourited_by__user=user
        )
    ) + list(models.Workflow.objects.filter(favourited_by__user=user))


def check_possible_parent(workflow, parent_workflow, same_project):
    order = ["activity", "course", "program"]
    try:
        if order.index(workflow.type) == order.index(parent_workflow.type) - 1:
            if same_project:
                if workflow.get_project() == parent_workflow.get_project():
                    return True
            else:
                return True
    except IndexError:
        pass
    return False


def get_user_permission(obj, user):
    if obj.type in ["workflow", "course", "activity", "program"]:
        obj = models.Workflow.objects.get(pk=obj.pk)

    if user is None or not user.is_authenticated:
        return models.ObjectPermission.PERMISSION_NONE
    if obj.author == user:
        return models.ObjectPermission.PERMISSION_EDIT
    permissions = models.ObjectPermission.objects.filter(
        user=user,
        content_type=ContentType.objects.get_for_model(obj),
        object_id=obj.id,
    )
    if permissions.count() == 0:
        return models.ObjectPermission.PERMISSION_NONE
    return permissions.first().permission_type


def user_workflow_url(workflow, user):
    user_permission = get_user_permission(workflow, user)
    can_view = False
    is_public = workflow.public_view
    if user is not None and user.is_authenticated and workflow.published:
        if Group.objects.get(name=settings.TEACHER_GROUP) in user.groups.all():
            can_view = True
    if user_permission != models.ObjectPermission.PERMISSION_NONE:
        can_view = True
    if can_view:
        return reverse(
            "course_flow:workflow-update", kwargs={"pk": workflow.pk}
        )
    if is_public:
        return reverse(
            "course_flow:workflow-public", kwargs={"pk": workflow.pk}
        )
    if user is None or not user.is_authenticated:
        return "nouser"
    return "noaccess"


def user_project_url(project, user):
    user_permission = get_user_permission(project, user)
    if not user.is_authenticated:
        return "noaccess"
    if user_permission != models.ObjectPermission.PERMISSION_NONE:
        return reverse("course_flow:project-detail", kwargs={"pk": project.pk})
    return ""


def save_serializer(serializer) -> HttpResponse:
    if serializer:
        if serializer.is_valid():
            serializer.save()
            return JsonResponse({"action": "posted"})
        else:
            return JsonResponse({"action": "error"})
    else:
        return JsonResponse({"action": "error"})


def get_relevance(obj, name_filter, keywords):
    if obj.title is None:
        title = ""
    else:
        title = obj.title.lower()
    if obj.description is None:
        description = ""
    else:
        description = obj.description.lower()
    if obj.author is None:
        first = ""
        last = ""
        username = ""
    else:
        if obj.author.first_name is None:
            first = ""
        else:
            first = obj.author.first_name
        if obj.author.last_name is None:
            last = ""
        else:
            last = obj.author.last_name
        if obj.author.username is None:
            username = ""
        else:
            username = obj.author.username
    relevance = ""
    to_check = [name_filter] + keywords
    keys = [title, last, first, username, description]
    for key in keys:
        for keyword in to_check:
            if keyword == "":
                continue
            if key.startswith(keyword):
                relevance += "0"
            elif key.find(" " + keyword) >= 0:
                relevance += "1"
            else:
                relevance += "2"
    return relevance


def make_user_notification(
    source_user, target_user, notification_type, content_object, **kwargs
):
    if source_user is not target_user:
        extra_text = kwargs.get("extra_text", None)
        comment = kwargs.get("comment", None)
        text = ""
        if source_user is not None:
            text += source_user.username + " "
        else:
            text += _("Someone ")
        if notification_type == models.Notification.TYPE_SHARED:
            text += _("added you to the ")
        elif notification_type == models.Notification.TYPE_COMMENT:
            text += _("notified you in a comment in ")
        else:
            text += _(" notified you for ")
        text += _(content_object.type) + " " + content_object.__str__()
        if extra_text is not None:
            text += ": " + extra_text
        models.Notification.objects.create(
            user=target_user,
            source_user=source_user,
            notification_type=notification_type,
            content_object=content_object,
            text=text,
            comment=comment,
        )

        # clear any notifications older than two months
        target_user.notifications.filter(
            created_on__lt=timezone.now() - timezone.timedelta(days=60)
        ).delete()


def benchmark(identifier, last_time):
    current_time = time.time()
    print("Completed " + identifier + " in " + str(current_time - last_time))
    return current_time
