from io import BytesIO
import time

import pandas as pd
from django.db.models import Q
from django.utils.translation import gettext as _
from django.utils import timezone

from course_flow import analytics, models

from course_flow.export_functions import allowed_sets_Q

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
    OutcomeSerializerShallow,
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
    get_direct_children_of_outcome_ordered,
    get_outcomenodes,
    get_parent_nodes_for_workflow,
    get_unique_outcomehorizontallinks,
    get_unique_outcomenodes,
    get_descendant_outcomes,
    dateTimeFormat,
    benchmark,
)

from .export_functions import (
   get_sobec_outcome,
   concat_line,
   concat_df
)

def get_all_workflows_for_project(project):
    workflows = models.Workflow.objects.filter(
       Q(project=project)
    )
    return workflows

#Quick utility function to get the codes for the first program
#outcome column
def get_d01_code(serialized_outcome):
    codes_list = serialized_outcome["code"].split(".")
    if len(codes_list)>2:
        codes_list=codes_list[:2]
    return ".".join(codes_list)



#Pass in a node, get all the lines corresponding to its data
def get_course_lines(node,program_outcome_children,allowed_sets):
    node_serialized = NodeExportSerializer(node).data
    week_serialized = WeekExportSerializer(node.week_set.first()).data

    #Check if there is no linked workflow
    if node.linked_workflow is None:
        #Get the program outcomes from the list associated with that node
        associated_program_outcomes_unique = [outcomenode.outcome for outcomenode in get_unique_outcomenodes(node).filter(outcome__in=program_outcome_children)]
        associated_program_outcomes_serialized = OutcomeExportSerializer(associated_program_outcomes_unique,many=True).data

        #Get a comma separated list of the depth 0 or depth 1 outcome parent to each program outcome
        program_outcome_codes = ", ".join(set([get_d01_code(outcome) for outcome in associated_program_outcomes_serialized]))
        return [{
            "Week":week_serialized,
            "Node":node_serialized,
            "Program Outcome Codes":program_outcome_codes,
            "Program Outcomes":[make_outcome_text(x) for x in associated_program_outcomes_serialized],
        }]
    #Start with base course outcomes, they are the only ones that can have horizontal links at this point
    base_course_outcomes = get_base_outcomes_ordered_filtered(
        node.linked_workflow,
        Q(outcome_horizontal_links__parent_outcome__in=program_outcome_children) & allowed_sets_Q(allowed_sets)
    ).distinct()

    #If there are no outcomes on the workflow, treat it as though there were
    #no linked workflow
    if len(base_course_outcomes)==0:
        #Get the program outcomes from the list associated with that node
        associated_program_outcomes_unique = [outcomenode.outcome for outcomenode in get_unique_outcomenodes(node).filter(outcome__in=program_outcome_children)]
        associated_program_outcomes_serialized = OutcomeExportSerializer(associated_program_outcomes_unique,many=True).data
        #Get a comma separated list of the depth 0 or depth 1 outcome parent to each program outcome
        program_outcome_codes = ", ".join(set([get_d01_code(outcome) for outcome in associated_program_outcomes_serialized]))
        return [{
            "Week":week_serialized,
            "Node":node_serialized,
            "Program Outcome Codes":program_outcome_codes,
            "Program Outcomes":[make_outcome_text(x) for x in associated_program_outcomes_serialized],
        }]

    output = []
    base_dict = {
        "Week":week_serialized,
        "Node":node_serialized,
    }
    for base_course_outcome in base_course_outcomes:
        base_course_outcome_serialized = OutcomeExportSerializer(base_course_outcome).data

        #Gets a list of all the depth 1 course outcomes
        course_sub_outcomes = get_direct_children_of_outcome_ordered(base_course_outcome)

        #Get a list of all the program outcomes associated with the base course outcome
        associated_program_outcomes_unique = [link.parent_outcome for link in get_unique_outcomehorizontallinks(base_course_outcome).filter(parent_outcome__in=program_outcome_children)]

        associated_program_outcomes_serialized = OutcomeExportSerializer(associated_program_outcomes_unique,many=True).data

        #Get a comma separated list of the depth 0 or depth 1 outcome parent to each program outcome
        program_outcome_codes = ", ".join(set([get_d01_code(outcome) for outcome in associated_program_outcomes_serialized]))

        #If there are no sub-outcomes, just use the base outcome
        if len(course_sub_outcomes) == 0:
            output.append(
                {
                    **base_dict,
                    "Base_Course_Outcome":base_course_outcome_serialized,
                    "Program Outcome Codes":program_outcome_codes,
                    "Program Outcomes":[make_outcome_text(x) for x in associated_program_outcomes_serialized],
                }
            )
        else:
            course_sub_outcomes_serialized = OutcomeExportSerializer(course_sub_outcomes,many=True).data

            #Otherwise we iterate over all the sub outcomes
            for course_outcome_serialized in course_sub_outcomes_serialized:
                output.append(
                    {
                        **base_dict,
                        "Base_Course_Outcome":base_course_outcome_serialized,
                        "Sub_Course_Outcome":course_outcome_serialized,
                        "Program Outcome Codes":program_outcome_codes,
                        "Program Outcomes":[make_outcome_text(x) for x in associated_program_outcomes_serialized], #We don't need any more details after this, just make the text now for simplicity
                    }
                )

    return output


   # pass in an individual program outcome, look at which courses are linked to that outcome
def get_courses_data(program_outcome,allowed_sets):

    #Get a list of all the sub-outcomes
    program_outcome_children = get_all_outcomes_ordered_for_outcome(program_outcome)

    #Find all the nodes they've been associated with
    nodes  = models.Node.objects.filter(outcomes__in=program_outcome_children).filter(allowed_sets_Q(allowed_sets)).filter(deleted=False).distinct().order_by("week")

    #Get a list of dicts that will go int our dataframe
    course_data=[]
    for node in nodes:
        course_data+=get_course_lines(node,program_outcome_children,allowed_sets)
    return course_data

#This is applied to whole columns of dataframes which may have NA, make sure we return empty string if so
def make_outcome_text(serialized_outcome):
    if pd.isnull(serialized_outcome):
        return ""
    return serialized_outcome.get("code","")+"-"+serialized_outcome.get("title","")

def get_export_analytics(workflow, program_outcome, program_outcome_serialized, allowed_sets):

    course_data = get_courses_data(program_outcome,allowed_sets)

    date = timezone.now().strftime(dateTimeFormat())
    initial_data = [{
        "Program": workflow.title,
        "Program Outcome": make_outcome_text(program_outcome_serialized),
        "Export Date": date,
    }]
    initial_df = pd.DataFrame(initial_data)
    df = pd.DataFrame(course_data)
    #Ensure all our columns are present
    for col in ["Node","Week","Base_Course_Outcome","Program Outcome Codes","Sub_Course_Outcome"]:
        if col not in df.columns:
            df[col]=None
    if "Program Outcomes" not in df.columns:
        return initial_df,pd.DataFrame([{"Error":"This outcome was not used"}])

    df["Term #"] = df["Week"].apply(lambda x: x["title"])
    df["Course Code"] = df["Node"].apply(lambda x: x.get("code",""))
    df["Course Title"] = df["Node"].apply(lambda x: x["title"])
    df["Course Outcome Level 1"] = df["Base_Course_Outcome"].apply(make_outcome_text)
    df["Course Outcome Level 2"] = df["Sub_Course_Outcome"].apply(make_outcome_text)
    df["Associated Program Outcome #"] = df["Program Outcome Codes"]

    #Expand out the program outcomes into their own columns
    program_outcomes = df["Program Outcomes"].apply(pd.Series)
    program_outcomes = program_outcomes.rename(columns = lambda x : 'Associated Program Outcome ' + str(x + 1))
    df = df.join(program_outcomes)

    cdf = df.drop(columns=[
        "Week",
        "Node",
        "Base_Course_Outcome",
        "Sub_Course_Outcome",
        "Program Outcome Codes",
        "Program Outcomes",
    ])


    return initial_df, cdf

def get_analytics_table(workflow, object_type, export_format, allowed_sets):

    outcomes = get_base_outcomes_ordered_filtered(workflow,allowed_sets_Q(allowed_sets))

    with BytesIO() as b:
        if export_format == "excel":
            with pd.ExcelWriter(b, engine='xlsxwriter') as writer:
                workbook = writer.book
                header_format = workbook.add_format({"bg_color": "#b5fbbb"})
                bold_format = workbook.add_format(
                    {"bold": True, "color": "white"}
                )
                wrap_format = workbook.add_format()
                wrap_format.set_text_wrap()
                wrap_format.set_align("left")
                wrap_format.set_align("top")

                for outcome in outcomes:
                    outcome_serialized = OutcomeExportSerializer(outcome).data
                    df1, df2 = get_export_analytics(workflow, outcome, outcome_serialized,allowed_sets)
                    sheet_name = get_alphanum(outcome_serialized["code"])[:30]

                    df1.to_excel(
                        writer,
                        sheet_name=sheet_name,
                        index=False,
                        startrow=0,
                        startcol=0
                    )
                    df2.to_excel(
                        writer,
                        sheet_name=sheet_name,
                        index=False,
                        startrow=len(df1) + 2,
                        startcol=0
                    )

                    worksheet = writer.sheets[sheet_name]
                    worksheet.set_column(0, 0, 20, wrap_format)
                    worksheet.set_column(1, 1, 30, wrap_format)
                    worksheet.set_column(2, 2, 30, wrap_format)
                    for i in range(3,len(df2.columns)):
                        worksheet.set_column(i, i, 40, wrap_format)
                    worksheet.set_row(0, None, bold_format)
                    worksheet.set_row(3, None, bold_format)

        elif export_format == "csv":
            for outcome in outcomes:
                outcome_serialized = OutcomeExportSerializer(outcome).data
                df1, df2 = get_export_analytics(workflow, outcome, outcome_serialized)
                df1.to_csv(path_or_buf=b, sep=",", index=False)
                df2.to_csv(path_or_buf=b, sep=",", index=False)
        return b.getvalue()
