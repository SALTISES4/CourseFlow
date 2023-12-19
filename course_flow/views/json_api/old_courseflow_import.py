import json

from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_POST

from course_flow.decorators import ajax_login_required
from course_flow.models.activity import Activity
from course_flow.models.column import Column
from course_flow.models.course import Course
from course_flow.models.models import Project
from course_flow.models.node import Node
from course_flow.models.program import Program
from course_flow.models.relations.columnWorkflow import ColumnWorkflow
from course_flow.models.relations.nodeLink import NodeLink
from course_flow.models.relations.nodeWeek import NodeWeek
from course_flow.models.relations.weekWorkflow import WeekWorkflow
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.models.week import Week
from course_flow.serializers import (
    bleach_allowed_tags_description,
    bleach_allowed_tags_title,
    bleach_sanitizer,
)

# This view allows users to import a project from the old CourseFlow by exporting
# their project as a JSON then importing it here. It's not used often, and due to
# differences in how we use outcomes (which belonged to the project rather than
# the workflows) it's not fully functional - currently the outcomes are not processed
# and that portion has been commented out.


@require_POST
@ajax_login_required
def json_api_post_project_from_json(request: HttpRequest) -> JsonResponse:
    column_type_dict = {
        "OOCI": 1,
        "OOC": 2,
        "ICI": 3,
        "ICS": 4,
        "HW": 11,
        "AC": 12,
        "FA": 13,
        "SA": 14,
    }
    task_dict = {
        "research": 1,
        "discuss": 2,
        "problem": 3,
        "analyze": 4,
        "peerreview": 5,
        "debate": 6,
        "play": 7,
        "create": 8,
        "practice": 9,
        "reading": 10,
        "write": 11,
        "present": 12,
        "experiment": 13,
        "quiz": 14,
        "curation": 15,
        "orchestration": 16,
        "instrevaluate": 17,
        "jigsaw": 101,
        "peer-instruction": 102,
        "case-studies": 103,
        "gallery-walk": 104,
        "reflective-writing": 105,
        "two-stage-exam": 106,
        "toolkit": 107,
        "one-minute-paper": 108,
        "distributed-problem-solving": 109,
        "peer-assessment": 110,
    }
    context_dict = {
        "solo": 1,
        "group": 2,
        "class": 3,
        "exercise": 101,
        "test": 102,
        "exam": 103,
    }
    time_unit_dict = {
        "s": 1,
        "min": 2,
        "hr": 3,
        "day": 4,
        "week": 5,
        "month": 6,
        "yr": 7,
        "cr": 8,
    }

    try:
        json_data = json.loads(request.POST.get("jsonData"))
        id_dict = {
            "project": {},
            "workflow": {},
            "column": {},
            "week": {},
            "node": {},
            "outcome": {},
        }
        for project in json_data["project"]:
            new_project = Project.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    project["title"], tags=bleach_allowed_tags_title
                ),
            )
            id_dict["project"][project["id"]] = new_project
        #        for outcome in json_data["outcome"]:
        #            new_outcome = Outcome.objects.create(
        #                author=request.user,
        #                title=bleach_sanitizer(
        #                    outcome["title"], tags=bleach_allowed_tags_title
        #                ),
        #            )
        #            id_dict["outcome"][outcome["id"]] = new_outcome
        for activity in json_data["activity"]:
            new_activity = Activity.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    activity["title"], tags=bleach_allowed_tags_title
                ),
                description=bleach_sanitizer(
                    activity["description"],
                    tags=bleach_allowed_tags_description,
                ),
                outcomes_type=activity["outcomes_type"],
            )
            id_dict["workflow"][activity["id"]] = new_activity
            id_dict["column"][activity["id"]] = {}
            new_activity.weeks.all().delete()
            new_activity.columns.all().delete()
        for course in json_data["course"]:
            new_course = Course.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    course["title"], tags=bleach_allowed_tags_title
                ),
                description=bleach_sanitizer(
                    course["description"], tags=bleach_allowed_tags_description
                ),
                outcomes_type=course["outcomes_type"],
            )
            id_dict["workflow"][course["id"]] = new_course
            id_dict["column"][course["id"]] = {}
            new_course.weeks.all().delete()
            new_course.columns.all().delete()
        for program in json_data["program"]:
            new_program = Program.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    program["title"], tags=bleach_allowed_tags_title
                ),
                description=bleach_sanitizer(
                    program["description"],
                    tags=bleach_allowed_tags_description,
                ),
                outcomes_type=program["outcomes_type"],
            )
            id_dict["workflow"][program["id"]] = new_program
            id_dict["column"][program["id"]] = {}
            new_program.weeks.all().delete()
            new_program.columns.all().delete()
        for column in json_data["column"]:
            workflow = id_dict["workflow"][column["workflow"]]
            workflow = id_dict["workflow"][column["workflow"]]
            if column["id"][:3] == "CUS":
                column_type = workflow.get_subclass().WORKFLOW_TYPE * 10
            else:
                column_type = column_type_dict[column["id"]]
            new_column = Column.objects.create(
                author=request.user,
                title=column["title"],
                colour=int(column["colour"].replace("#", "0x"), 16),
                column_type=column_type,
            )
            id_dict["column"][column["workflow"]][column["id"]] = new_column

        for week in json_data["week"]:
            new_week = Week.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    week["title"], tags=bleach_allowed_tags_title
                ),
            )
            id_dict["week"][week["id"]] = new_week
        for node in json_data["node"]:
            new_node = Node.objects.create(
                author=request.user,
                title=bleach_sanitizer(
                    node["title"], tags=bleach_allowed_tags_title
                ),
                description=bleach_sanitizer(
                    node["description"], tags=bleach_allowed_tags_description
                ),
                task_classification=task_dict.get(node["task_classification"])
                or 0,
                context_classification=context_dict.get(
                    node["context_classification"]
                )
                or 0,
                time_units=time_unit_dict.get(node["time_units"]) or 0,
                time_required=bleach_sanitizer(node["time_required"], tags=[]),
            )
            try:
                new_node.has_autolink = node["has_autolink"]
                new_node.save()
            except KeyError:
                pass
            id_dict["node"][node["id"]] = new_node

        for project in json_data["project"]:
            project_model = id_dict["project"][project["id"]]
            for activity_id in project["activities"]:
                WorkflowProject.objects.create(
                    project=project_model,
                    workflow=id_dict["workflow"][activity_id],
                )
            for course_id in project["courses"]:
                WorkflowProject.objects.create(
                    project=project_model,
                    workflow=id_dict["workflow"][course_id],
                )
            for program_id in project["programs"]:
                WorkflowProject.objects.create(
                    project=project_model,
                    workflow=id_dict["workflow"][program_id],
                )
        #            for outcome_id in project["outcomes"]:
        #                OutcomeProject.objects.create(
        #                    project=project_model,
        #                    outcome=id_dict["outcome"][outcome_id],
        #                )

        #        for outcome in json_data["outcome"]:
        #            outcome_model = id_dict["outcome"][outcome["id"]]
        #            for i, child in enumerate(outcome["children"]):
        #                OutcomeOutcome.objects.create(
        #                    parent=outcome_model,
        #                    child=id_dict["outcome"][child],
        #                    rank=i,
        #                )

        for workflow in (
            json_data["activity"] + json_data["course"] + json_data["program"]
        ):
            workflow_model = id_dict["workflow"][workflow["id"]]
            for i, column in enumerate(id_dict["column"][workflow["id"]]):
                column_model = id_dict["column"][workflow["id"]][column]
                ColumnWorkflow.objects.create(
                    workflow=workflow_model, column=column_model, rank=i
                )

            for i, week_id in enumerate(workflow["weeks"]):
                WeekWorkflow.objects.create(
                    workflow=workflow_model,
                    week=id_dict["week"][week_id],
                    rank=i,
                )

        for week in json_data["week"]:
            week_model = id_dict["week"][week["id"]]
            for i, node_id in enumerate(week["nodes"]):
                NodeWeek.objects.create(
                    week=week_model, node=id_dict["node"][node_id], rank=i
                )

        for node in json_data["node"]:
            node_model = id_dict["node"][node["id"]]
            node_model.column = id_dict["column"][node["workflow"]][
                node["column"]
            ]
            if node["linked_workflow"] is not None:
                node_model.linked_workflow = id_dict["workflow"][
                    node["linked_workflow"]
                ]
            node_model.save()

        #        for outcomenode in json_data["outcomenode"]:
        #            OutcomeNode.objects.create(
        #                outcome=id_dict["outcome"][outcomenode["outcome"]],
        #                node=id_dict["node"][outcomenode["node"]],
        #                degree=outcomenode["degree"],
        #            )

        for nodelink in json_data["nodelink"]:
            nl = NodeLink.objects.create(
                source_node=id_dict["node"][nodelink["source"]],
                target_node=id_dict["node"][nodelink["target"]],
                title=bleach_sanitizer(
                    nodelink["title"], tags=bleach_allowed_tags_title
                ),
            )
            if nodelink["style"] == "dashed":
                nl.dashed = True
                nl.save()
            ports = nodelink.get("ports", None)
            if ports is not None:
                try:
                    port_data = ports.split(";")
                    if port_data[0].find("sourcePort="):
                        source_port = port_data[0][-1]
                        target_port = port_data[1][-1]
                    else:
                        source_port = port_data[0][-1]
                        target_port = port_data[1][-1]
                    if source_port == "e":
                        nl.source_port = nl.EAST
                    elif source_port == "w":
                        nl.source_port = nl.WEST
                    elif source_port == "s":
                        nl.source_port = nl.SOUTH
                    if target_port == "e":
                        nl.target_port = nl.EAST
                    elif target_port == "w":
                        nl.target_port = nl.WEST
                    elif target_port == "n":
                        nl.target_port = nl.NORTH
                    nl.save()
                except Exception:
                    pass

    except AttributeError:
        return JsonResponse({"action": "error"})

    return JsonResponse({"action": "posted"})
