from io import BytesIO
import time

import pandas as pd
from django.db.models import Q
from django.utils.translation import gettext as _
from django.utils import timezone

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
    OutcomeSerializerShallow,
    OutcomeExportSerializer,
    OutcomeWithChildrenSerializer,
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
    dateTimeFormatNoSpace,
    benchmark,
)

from .export_functions import (
   get_sobec_outcome,
   concat_line
)


def get_all_workflows_for_project(project):
    workflows = models.Workflow.objects.filter(
       Q(project=project)
    )
    return workflows


def get_program_outcome(workflow):
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


'''
Jeremie's code!
'''
#Quick utility function to get the codes for the first program
#outcome column
def get_d01_code(serialized_outcome):
    codes_list = serialized_outcome["code"].split(".")
    if len(codes_list)>2:
        codes_list=codes_list[:2]
    return ".".join(codes_list)



#Pass in a node, get all the lines corresponding to its data
def get_course_lines(node,program_outcome_children):
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
            "Program Outcomes":associated_program_outcomes_serialized,
        }]
    #Start with base course outcomes, they are the only ones that can have horizontal links at this point
    base_course_outcomes = get_base_outcomes_ordered_filtered(
        node.linked_workflow,
        Q(outcome_horizontal_links__parent_outcome__in=program_outcome_children)
    )

    #If there are no outcomes on the workflow, treat it as though there were
    #no linked workflow
    if len(base_course_outcomes)==0:
        #Get the program outcomes from the list associated with that node
        associated_program_outcomes_unique = [outcomenode.outcome for outcomenode in get_unique_outcomenodes(node).filter(outcome__in=program_outcome_children)]
        associated_program_outcomes_serialized = OutcomeExportSerializer(associated_program_outcomes_unique).data
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
        #This just gets repeated for each base course outcome in the table
        associated_program_outcomes_unique = [link.parent_outcome for link in get_unique_outcomehorizontallinks(base_course_outcome)]
        #associated_program_outcomes = [link.parent_outcome for link in get_unique_outcomehorizontallinks(base_course_outcome)]
        #associated_program_outcomes_unique = OutcomeExportSerializer(associated_program_outcomes,many=True).data
        
        associated_program_outcomes_serialized = OutcomeExportSerializer(associated_program_outcomes_unique,many=True).data
        # associated_program_outcomes_serialized = OutcomeWithChildrenSerializer(associated_program_outcomes,many=True).data
        # print("program outcomes datafied", associated_program_outcomes_serialized)

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
            # print("course suboutcomes > 0")
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
def get_courses_data_j(program_outcome):

    # print("beginning of Jeremie's code")

    #Get a list of all the sub-outcomes
    program_outcome_children = get_all_outcomes_ordered_for_outcome(program_outcome)\

    #Find all the nodes they've been associated with
    nodes  = models.Node.objects.filter(outcomes__in=program_outcome_children).distinct().order_by("week")

    #Get a list of dicts that will go int our dataframe
    course_data=[]
    for node in nodes:
        course_data+=get_course_lines(node,program_outcome_children)
    # print(course_data)
    return course_data

def make_outcome_text(serialized_outcome):
    return serialized_outcome["code"]+"-"+serialized_outcome["title"]

def get_export_analytics(workflow):

    last_time = time.time()

    program_outcome = get_program_outcome(workflow)[0]

    last_time = benchmark("initial program outcome retrieval",time.time())

    course_data = get_courses_data_j(program_outcome)

    last_time = benchmark("course data fetch",time.time())

    # print("course data", course_data)
    date = timezone.now().strftime(dateTimeFormatNoSpace())
    initial_data = [{
        "Program": workflow.title,
        "Program Outcome": program_outcome.title,
        "Export Date": date,
    }]
    idf = pd.DataFrame(initial_data)
    df = pd.DataFrame(course_data)
    df["Term #"] = df["Week"].apply(lambda x: x["title"])
    df["Course Code"] = df["Base_Course_Outcome"].apply(lambda x: x["code"])
    df["Course Title"] = df["Node"].apply(lambda x: x["title"])
    df["Course Outcome Level 1"] = df["Base_Course_Outcome"].apply(make_outcome_text)
    df["Course Outcome Level 2"] = df["Sub_Course_Outcome"].apply(make_outcome_text)
    df["Associated Program Outcome #"] = df["Program Outcome Codes"]

    maximum = 0


    # for data in course_data:
    #     if data.get("Program Outcomes"):
    #         count = len(data["Program Outcomes"][0]["children"])

    #         if count > maximum:
    #             maximum = count

    # for i in range(maximum):
    #     df[f'Associated Program Outcome {i+1}'] = df["Program Outcomes"].apply(lambda x: x[0]["children"][i]['title'])

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
    df = pd.concat([idf,cdf])

    last_time = benchmark("dataframe building",time.time())

    #with pd.option_context('display.max_rows', None, 'display.max_columns', None):
    #    print("df", df)
    return df


def get_analytics_table(workflow, export_format):
    df = get_export_analytics(workflow)
    with BytesIO() as b:
        with pd.ExcelWriter(b, engine='xlsxwriter') as writer:
            sheet_name = get_alphanum(workflow.title)[:30]
            df.to_excel(
                writer,
                sheet_name=sheet_name,
                index=False,
            )
        return b.getvalue()
