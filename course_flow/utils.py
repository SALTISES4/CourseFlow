import re
import time
import os
import json
from pathlib import Path

from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.files.storage import default_storage
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.urls import reverse
from django.utils.dateparse import parse_datetime
from django.utils import timezone

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


default_column_settings = {
    "0":{"colour":"#6738ff","icon":"other"},
    "1":{"colour":"#0b118a","icon":"ooci"},
    "2":{"colour":"#114cd4","icon":"home"},
    "3":{"colour":"#11b3d4","icon":"instruct"},
    "4":{"colour":"#04d07d","icon":"students"},
    "10":{"colour":"#6738ff","icon":"other"},
    "11":{"colour":"#ad351d","icon":"homework"},
    "12":{"colour":"#ed4a28","icon":"lesson"},
    "13":{"colour":"#ed8934","icon":"artifact"},
    "14":{"colour":"#f7ba2a","icon":"assessment"},
    "20":{"colour":"#369934","icon":"other"}
}


def get_alphanum(string):
    if(string is None):return ""
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

def get_direct_children_of_outcome_ordered(outcome):
    return(models.Outcome.objects.filter(
        parent_outcomes=outcome,deleted=False
    ).order_by("parent_outcome_links__rank"))



def get_base_outcomes_ordered_filtered(workflow, extra_filter=Q()):
    return (
        models.Outcome.objects.filter(workflow=workflow, deleted=False)
        .filter(extra_filter)
        .order_by("outcomeworkflow__rank")
        .distinct()
    )


def get_all_outcomes_ordered_filtered(workflow, extra_filter):
    outcomes = []
    for outcome in (
        models.Outcome.objects.filter(workflow=workflow, deleted=False)
        .filter(extra_filter)
        .order_by("outcomeworkflow__rank")
        .distinct()
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

#From an outcomenode, create a Q to get the outcome and all its parents, heirarchically organized
def get_outcomenode_trace(ocn):
    oc = ocn.outcome
    return models.Outcome.objects.filter(
        Q(pk=oc.pk)
        | Q(children=oc)
        | Q(children__children=oc)
        | Q(children__children__children=oc)
    ).distinct().order_by("depth")

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


def clean_old_exports(user_dir, max_jobs: int = 2):
    # Find all job JSON files
    try:
        _, filenames = default_storage.listdir(user_dir)
    except FileNotFoundError:
        return

    jobs = []

    # Scan JSON job files
    for filename in filenames:
        if not filename.endswith('.json'):
            continue

        filepath = f"{user_dir}/{filename}"

        try:
            with default_storage.open(filepath, 'r') as f:
                job_data = json.load(f)
                created = job_data.get('created')
                if created:
                    dt = parse_datetime(created)
                    jobs.append((dt, job_data['filename'], filepath))
        except Exception as e:
            # If the file is corrupt, we delete it
            try:
                print("deleting a corrupt job file")
                print(e)
                default_storage.delete(filepath)
            except Exception as delete_err:
                print(f"Error deleting corrupt file: {delete_err}")

    # Sort by creation date
    jobs.sort(key=lambda tup: tup[0])  # oldest first

    # If too many, delete oldest
    while len(jobs) >= max_jobs + 1:
        _, data_filename, json_path = jobs.pop(0)
        default_storage.delete(json_path)
        if data_filename:
            data_path = f"{user_dir}/{data_filename}"
            if default_storage.exists(data_path):
                default_storage.delete(data_path)

    valid_filenames = {filename for _, filename, _ in jobs}

    # Delete any files in the folder that aren't .json and not in the valid set
    for filename in filenames:
        if filename.endswith(('.csv', '.xlsx')) and filename not in valid_filenames:
            try:
                default_storage.delete(f"{user_dir}/{filename}")
                print(f"Deleted orphaned export file: {filename}")
            except Exception as e:
                print(f"Error deleting orphaned file {filename}: {e}")

    #Delete any files older than 24 hours
    EXPORT_MAX_AGE_SECONDS = 86400

    now = timezone.now()
    for dt, data_filename, json_path in jobs:
        try:
            if dt and (now - dt).total_seconds() > EXPORT_MAX_AGE_SECONDS:
                default_storage.delete(json_path)

                if data_filename:
                    data_path = f"{user_dir}/{data_filename}"
                    if default_storage.exists(data_path):
                        default_storage.delete(data_path)

        except Exception as e:
            print(f"Error deleting old job {json_path}: {e}")