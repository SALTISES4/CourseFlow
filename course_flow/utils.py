import re
import time

from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.http import HttpResponse, JsonResponse

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
    exclude_outcomes = models.Outcome.objects.filter(
        Q(parent_outcomes__node=node)
        | Q(parent_outcomes__parent_outcomes__node=node)
    )
    return (
        node.outcomenode_set.exclude(
            Q(outcome__deleted=True)
            | Q(outcome__parent_outcomes__deleted=True)
            | Q(outcome__parent_outcomes__parent_outcomes__deleted=True)
        )
        .exclude(outcome__in=exclude_outcomes)
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
    exclude_outcomes = models.Outcome.objects.filter(
        Q(parent_outcomes__reverse_horizontal_outcomes=outcome)
        | Q(
            parent_outcomes__parent_outcomes__reverse_horizontal_outcomes=outcome
        )
    )
    return (
        outcome.outcome_horizontal_links.exclude(
            Q(parent_outcome__deleted=True)
            | Q(parent_outcome__parent_outcomes__deleted=True)
            | Q(parent_outcome__parent_outcomes__parent_outcomes__deleted=True)
        )
        .exclude(parent_outcome__in=exclude_outcomes)
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
    return models.Favourite.objects.filter(user=user).exclude(
        Q(
            object_id__in=models.Workflow.objects.filter(
                Q(deleted=True) | Q(project__deleted=True)
            )
        )
        | Q(object_id__in=models.Project.objects.filter(deleted=True))
    )

def get_classrooms_for_student(user):
    return models.Project.objects.filter(
        user_permissions__user=user,
        user_permissions__permission_type=models.ObjectPermission.PERMISSION_STUDENT,
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


def benchmark(identifier, last_time):
    current_time = time.time()
    print("Completed " + identifier + " in " + str(current_time - last_time))
    return current_time
