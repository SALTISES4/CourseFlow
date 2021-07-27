import time

from django.contrib.contenttypes.models import ContentType

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


def get_project_outcomes(project):
    # this should probably be replaced with a single recursive raw sql call...
    # but not by me
    outcomes = project.outcomes.all()
    for outcome in outcomes:
        outcomes = outcomes | get_descendant_outcomes(outcome)
    return outcomes


def get_descendant_outcomes(outcome):
    outcomes = outcome.children.all()
    for child in outcomes:
        outcomes = outcomes | get_descendant_outcomes(child)
    return outcomes


def get_all_outcomes(outcome, search_depth):
    if search_depth > 10:
        return
    outcomes = [outcome]
    for child_link in outcome.child_outcome_links.all():
        outcomes += get_all_outcomes(child_link.child, search_depth + 1)
    return outcomes


def get_unique_outcomenodes(node):
    links = node.outcomenode_set.all().order_by("rank")
    # Filter out lower level outcomes that are included by higher up ones
    outcomes_used = []
    for link in links:
        outcomes_used += map(linkIDMap, get_descendant_outcomes(link.outcome))
    return node.outcomenode_set.exclude(outcome__id__in=outcomes_used)


def get_unique_outcomehorizontallinks(outcome):
    links = outcome.outcome_horizontal_links.all().order_by("rank")
    # Filter out lower level outcomes that are included by higher up ones
    outcomes_used = []
    for link in links:
        outcomes_used += map(
            linkIDMap, get_descendant_outcomes(link.parent_outcome)
        )
    return outcome.outcome_horizontal_links.exclude(
        parent_outcome__id__in=outcomes_used
    )


def benchmark(identifier, last_time):
    current_time = time.time()
    print("Completed " + identifier + " in " + str(current_time - last_time))
    return current_time
