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





def get_all_workflows_for_project(project):
    workflows = models.Workflow.objects.filter(
       Q(project=project)
    )
    return workflows


def get_program_data(workflow):
    return get_all_outcomes_ordered(workflow)
    # pass back list of program outcomes
    # [PO1, PO1.1, PO2]

def check_associated_outcome(outcome, program_outcomes):
    if outcome in program_outcomes:
        return True

    # pass in an individual program outcome, look at which courses are linked to that outcome
def get_courses_data(program_outcome):

    #access associated nodes
    program_outcome_children = get_all_outcomes_ordered_for_outcome(program_outcome)
    nodes = list(
          models.Node.objects.filter(outcomes__in=program_outcome_children)
          .order_by("week")
      )
    # needs to be organized by term, use order by?

    # check for associated workflows in these nodes, will be course workflows
    courses = list(node.linked_workflow for node in nodes)

    # get course outcomes

    course_outcomes = []

    for course in courses:
        if course == None:
            course_outcomes.append(None)
        else:
            for outcome in get_all_outcomes_ordered(course):
                course_outcomes.append(outcome)

    # get program level outcomes using get unique outcome horizontal links, filtering with program_outcome_children

    course_outcomes_with_associated_program_outcomes = {}
    for outcome in course_outcomes:
        horizontal_links = list(get_unique_outcomehorizontallinks(outcome))
        if len(horizontal_links) > 0:
          for link in horizontal_links:
              program_outcome = link.parent_outcome
              if check_associated_outcome(program_outcome, program_outcome_children):
                  if outcome.id not in course_outcomes_with_associated_program_outcomes:
                      course_outcomes_with_associated_program_outcomes[outcome.id] = {"instance": outcome, "program outcome": [program_outcome]}
                  else:
                      course_outcomes_with_associated_program_outcomes[outcome.id]["program outcome"].append(program_outcome)
        else:
            course_outcomes_with_associated_program_outcomes[outcome.id] = {"instance": outcome, "program outcome": [None]}


    # for each outcome, display associated program outcomes

    return course_outcomes_with_associated_program_outcomes
    # eventually return associated program outcome


def get_course_term(course_workflow):
    weeks = models.Weeks.objects.filter(
        Q(workflow=course_workflow)
    )
    return weeks


def get_framework(workflow):
    program_serialized = ProgramSerializerShallow(workflow)
    course_instances = get_courses_data(get_program_data(workflow)[0])

    return program_serialized.data
