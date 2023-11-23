import re
import time

from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.urls import reverse

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
        models.Project.objects.filter(favourited_by__user=user)
    ) + list(models.Workflow.objects.filter(favourited_by__user=user))

    # return models.Favourite.objects.filter(user=user).exclude(
    #     Q(
    #         object_id__in=models.Workflow.objects.filter(
    #             Q(deleted=True) | Q(project__deleted=True)
    #         ),
    #         content_type=ContentType.objects.get_for_model(models.Workflow)
    #     )
    #     | Q(
    #         object_id__in=models.Project.objects.filter(deleted=True),
    #         content_type=ContentType.objects.get_for_model(models.Project)
    #     )
    # )


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


def get_classrooms_for_student(user):
    return models.Project.objects.filter(
        liveproject__liveprojectuser__user=user,
        deleted=False,
    )


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


def get_user_role(obj, user):
    if user is None or not user.is_authenticated:
        return models.LiveProjectUser.ROLE_NONE
    if obj.type == "liveproject":
        liveproject = obj
        project = obj.project
    elif obj.type == "project":
        try:
            liveproject = obj.liveproject
            project = obj
        except AttributeError:
            return models.LiveProjectUser.ROLE_NONE
    elif obj.is_strategy:
        project = None
        liveproject = None
    else:
        try:
            project = obj.get_project()
            liveproject = project.liveproject
        except AttributeError:
            return models.LiveProjectUser.ROLE_NONE
    if liveproject is None:
        return models.LiveProjectUser.ROLE_NONE
    if hasattr(obj, "author") and obj.author == user:
        return models.LiveProjectUser.ROLE_TEACHER
    permissions = models.LiveProjectUser.objects.filter(
        user=user, liveproject=liveproject
    )
    if permissions.count() == 0:
        return models.LiveProjectUser.ROLE_NONE
    return permissions.first().role_type


def user_workflow_url(workflow, user):
    user_permission = get_user_permission(workflow, user)
    user_role = get_user_role(workflow, user)
    can_view = False
    is_public = workflow.public_view
    if user is not None and user.is_authenticated and workflow.published:
        if Group.objects.get(name=settings.TEACHER_GROUP) in user.groups.all():
            can_view = True
    if user_permission != models.ObjectPermission.PERMISSION_NONE:
        can_view = True
    if user_role != models.LiveProjectUser.ROLE_NONE:
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
    user_role = get_user_role(project, user)
    if not user.is_authenticated:
        return "noaccess"
    if (
        user_permission != models.ObjectPermission.PERMISSION_NONE
        or user_role == models.LiveProjectUser.ROLE_TEACHER
    ):
        return reverse("course_flow:project-update", kwargs={"pk": project.pk})
    return reverse(
        "course_flow:live-project-update", kwargs={"pk": project.pk}
    )


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


def benchmark(identifier, last_time):
    current_time = time.time()
    print("Completed " + identifier + " in " + str(current_time - last_time))
    return current_time
