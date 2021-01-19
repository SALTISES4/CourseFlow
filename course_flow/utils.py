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
    "outcome"
]


def get_model_from_str(model_str: str):

    return ContentType.objects.get(model=model_str).model_class()


def get_parent_model_str(model_str: str) -> str:

    return owned_throughmodels[owned_throughmodels.index(model_str) + 1]


def get_parent_model(model_str: str):

    return ContentType.objects.get(
        model=get_parent_model_str(model_str)
    ).model_class()
