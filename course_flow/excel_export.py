from io import BytesIO

import pandas as pd
from django.db.models import Q
from django.utils.translation import gettext as _

from course_flow import analytics, models

from .models import (
    Course,
    Node,
    Outcome,
    OutcomeNode,
    OutcomeWorkflow,
    Program,
    Week,
    WeekWorkflow,
)
from .serializers import (
    NodeExportSerializer,
    NodeExportSerializerWithTime,
    OutcomeExportSerializer,
    WeekExportSerializer,
    WorkflowExportSerializer,
    ProgramSerializerShallow,
    CourseSerializerShallow,
)
from .utils import (
    get_all_outcomes_ordered_filtered,
    get_all_outcomes_ordered,
    get_all_outcomes_ordered_for_outcome,
    get_all_outcomes_for_workflow,
    get_all_outcomes_for_outcome,
    get_alphanum,
    get_base_outcomes_ordered_filtered,
    get_outcomenodes,
    get_parent_nodes_for_workflow,
    get_unique_outcomehorizontallinks,
    get_descendant_outcomes,
)

from .export_functions import (
   get_sobec_outcome,
)

def get_excel_export(model_object, object_type, export_format, allowed_sets):
    if object_type == "project":
        workflows = list(
            Program.objects.filter(project=model_object, deleted=False)
        )
    else:
        workflows = [model_object]
    with BytesIO() as b:
        with pd.ExcelWriter(b, engine="xlsxwriter") as writer:
            workbook = writer.book
            header_format = workbook.add_format({"bg_color": "#b5fbbb"})
            bold_format = workbook.add_format(
                {"bold": True, "bg_color": "#04BA74", "color": "white"}
            )
            wrap_format = workbook.add_format()
            wrap_format.set_text_wrap()
            wrap_format.set_align("top")
            for workflow in workflows:
                df = get_excel(workflow, allowed_sets)
                sheet_name = (
                    get_alphanum(workflow.title) + "_" + str(workflow.pk)
                )[:30]
                df.to_excel(
                    writer,
                    sheet_name=sheet_name,
                    index=False,
                )
                worksheet = writer.sheets[sheet_name]
                worksheet.set_row(0, None, bold_format)
                worksheet.set_row(1, None, bold_format)
                worksheet.set_row(2, None, bold_format)
                worksheet.add_table(6, 0, "# of outcomes per terms", 7)
            return b.getvalue()



# def get_excel_outcome(workflow, outcome, allowed_sets):
#     nodes = (
#         Node.objects.filter(week__workflow=workflow)
#         .filter(deleted=False)
#         .filter(allowed_sets_Q(allowed_sets))
#         .filter(
#             Q(outcomes=outcome)
#             | Q(
#                 outcomes__parent_outcomes=outcome,
#                 outcomes__parent_outcomes__deleted=False,
#             )
#             | Q(
#                 outcomes__parent_outcomes__parent_outcomes=outcome,
#                 outcomes__parent_outcomes__parent_outcomes__deleted=False,
#             )
#         )
#         .distinct()
#     )
#     header = {
#         "comp_code": outcome.code,
#         "code": f"Pass X of the following courses ({nodes.count()})",
#     }
#     nodes_serialized = NodeExportSerializerWithTime(nodes, many=True).data
#     return [header] + nodes_serialized


# def get_excel(workflow, allowed_sets):
#     outcomes = get_base_outcomes_ordered_filtered(
#         workflow, allowed_sets_Q(allowed_sets)
#     )
#     data = []
#     for outcome in outcomes:
#         data += get_sobec_outcome(workflow, outcome, allowed_sets)

#     df = pd.DataFrame(
#         data,
#         columns=[
#             "comp_code",
#             "code",
#             "title",
#             "term",
#             "course_outcome",
#             "course_outcome_two",
#             "suboutcomes",

#         ],
#     )
#     df.rename(
#         columns={
#             "comp_code": _("Competency Code"),
#             "code": _("Course Code"),
#             "title": _("Course Title"),
#             "term": _("Term #")
#             "course_outcome": _("Course Outcome Level 1")
#             "course_outcome_two": _("Course Outcome Level 2")
#             "suboutcomes": _("Sub Outcomes")

#         },
#         inplace=True,
#     )
#     pd.set_option("display.max_colwidth", None)
#     return df

def get_all_workflows_for_project(project):
    workflows = models.Workflow.objects.filter(
       Q(project=project)
    )
    return workflows


def get_program_data(workflow):
    return get_all_outcomes_ordered(workflow)
    # pass back list of program outcomes
    # [PO1, PO1.1, PO2]


def gfet_courses_data(project):
    all_workflows = get_all_workflows_for_project(project)
    courses_workflow = []
    for workflow in all_workflows:
        if workflow.type == "course":
            courses_workflow.append(workflow)
    courses = {}
    count = 0
    for course in courses_workflow:
        outcomes = get_all_outcomes_ordered(course)
        outcome_titles = []
        for outcome in outcomes:
            outcome_titles.append(outcome.title)
        code = course.code or "n/a"
        courses[count] = [course.title, code, "find the term somehow", outcome_titles]
        count +=1
    return courses

    # pass into this an individual program outcome, look at which courses are linked to that outcome
    # the term is a week model


def get_courses_data(program_outcome):
    #possibly rename to "get_course_associated_program_outcomes"?
    program_outcome_children = get_all_outcomes_ordered_for_outcome(program_outcome)
    outcome_nodes = (
      [models.OutcomeNode.objects.filter(outcome=outcome) for outcome in program_outcome_children]
    )
    nodes = [models.Node.objects.filter(outcomenode__in=node) for node in outcome_nodes]

    # check for associated workflows in these nodes, will be course workflows
    # get course outcomes using get unique outcome horizontal links, filtering with program_outcome_children
    # for each outcome, display associated program outcomes


    return nodes
    # eventually return associated program outcome

    # outcome is linked to outcomenode which is then linked to a node


    # grabs course data by taking the program node from a program outcome


def get_course_term(course_workflow):
    weeks = models.Weeks.objects.filter(
        Q(workflow=course_workflow)
    )
    return weeks


def view_courses_data(workflow):
    workflow_serialized = ProgramSerializerShallow(workflow)
    print(workflow_serialized.data)
