from io import BytesIO
from smtplib import SMTPException

import pandas as pd
from celery import shared_task
from django.core.mail import EmailMessage
from django.utils import timezone
from django.utils.translation import gettext as _

from .celery import try_async
from .models import (
    Column,
    Course,
    Program,
    Node,
    NodeWeek,
    OutcomeNode,
    OutcomeWorkflow,
    WeekWorkflow,
)
from .serializers import OutcomeExportSerializer
from .utils import (
    dateTimeFormatNoSpace,
    get_all_outcomes_ordered,
    get_all_outcomes_ordered_for_outcome,
    get_model_from_str,
    get_parent_nodes_for_workflow,
    get_unique_outcomehorizontallinks,
    get_unique_outcomenodes,
)


def get_displayed_title(node):
    if node.linked_workflow is not None and node.represents_workflow:
        return node.linked_workflow.title
    else:
        return _("Untitled Node") if node.title is None else node.title


def get_str(obj, key):
    s = obj.get(key, "")
    return "" if s is None else s


def stringify(value):
    if value is None:
        return ""
    else:
        return str(value)


def get_framework_line_for_outcome(outcome):
    outcome_serialized = OutcomeExportSerializer(outcome).data
    sub_outcomes = get_all_outcomes_ordered_for_outcome(outcome)
    sub_outcomes_serialized = OutcomeExportSerializer(
        sub_outcomes[1:], many=True
    ).data
    sub_outcomes_entry = "\n".join(
        [
            get_str(sub, "code") + " - " + get_str(sub, "title")
            for sub in sub_outcomes_serialized
        ]
    )
    outcomes_horizontal = [
        och.parent_outcome
        for och in get_unique_outcomehorizontallinks(outcome)
    ]
    outcomes_horizontal_serialized = OutcomeExportSerializer(
        outcomes_horizontal, many=True
    ).data
    outcomes_horizontal_entry = "\n".join(
        [get_str(och, "code") for och in outcomes_horizontal_serialized]
    )
    dict_data = {
        "a": get_str(outcome_serialized, "code")
        + " - "
        + get_str(outcome_serialized, "title"),
        "b": sub_outcomes_entry,
        "c": outcomes_horizontal_entry,
    }
    activities = Node.objects.filter(
        outcomenode__outcome__in=sub_outcomes,
        column__column_type=Column.LESSON,
        deleted=False,
    ).distinct()
    assessments = Node.objects.filter(
        outcomenode__outcome__in=sub_outcomes,
        column__column_type=Column.ASSESSMENT,
        deleted=False,
    ).distinct()
    dict_data["e"] = "\n".join(
        [get_displayed_title(activity) for activity in activities]
    )
    dict_data["f"] = "\n".join(
        [get_displayed_title(assessment) for assessment in assessments]
    )
    return dict_data


def get_course_framework(workflow):
    df = pd.DataFrame(columns=["a", "b", "c", "d", "e", "f", "g"])
    df = df.append(
        {
            "a": _("Course Title"),
            "b": workflow.title,
            "c": _("Ponderation Theory/Practical/Individual"),
            "d": str(workflow.ponderation_theory)
            + "/"
            + str(workflow.ponderation_practical)
            + "/"
            + str(workflow.ponderation_individual),
        },
        ignore_index=True,
    )
    df = df.append(
        {
            "a": _("Course Code"),
            "b": workflow.code,
            "c": _("Hours"),
            "d": str(
                workflow.time_general_hours + workflow.time_specific_hours
            ),
            "e": _("Time"),
            "f": stringify(workflow.time_required)
            + " "
            + workflow.get_time_units_display(),
        },
        ignore_index=True,
    )
    df = df.append({"a": _("Ministerial Competencies")}, ignore_index=True)
    df = df.append({"a": _("Competency"), "b": _("Title")}, ignore_index=True)
    nodes = get_parent_nodes_for_workflow(workflow)
    parent_outcomes = []
    for node in nodes:
        outcomenodes = get_unique_outcomenodes(node)
        parent_outcomes += OutcomeExportSerializer(
            [ocn.outcome for ocn in outcomenodes], many=True
        ).data
    a = [get_str(outcome, "code") for outcome in parent_outcomes]
    b = [get_str(outcome, "title") for outcome in parent_outcomes]
    df = pd.concat([df, pd.DataFrame({"a": a, "b": b})])
    if len(nodes) > 0:
        df = df.append(
            {
                "a": _("Term"),
                "b": WeekWorkflow.objects.get(
                    week__nodes=nodes[0]
                ).get_display_rank()
                + 1,
            },
            ignore_index=True,
        )
        prereqs = Node.objects.filter(
            outgoing_links__target_node__in=nodes, deleted=False,
        ).distinct()
        postreqs = Node.objects.filter(
            incoming_links__source_node__in=nodes, deleted=False,
        ).distinct()
        if len(prereqs) > 0:
            df = df.append(
                {
                    "a": _("Prerequisites"),
                    "b": [get_displayed_title(req) for req in prereqs].join(
                        ", "
                    ),
                },
                ignore_index=True,
            )
        if len(postreqs) > 0:
            df = df.append(
                {
                    "a": _("Required For"),
                    "b": [get_displayed_title(req) for req in postreqs].join(
                        ", "
                    ),
                },
                ignore_index=True,
            )
    df = df.append(
        {
            "a": _("Course Outcome"),
            "b": _("Sub-Outcomes"),
            "c": _("Competencies"),
            "d": _("Topics & Content"),
            "e": _("Lessons/Activities"),
            "f": _("Assessments"),
        },
        ignore_index=True,
    )
    for outcome in workflow.outcomes.filter(deleted=False):
        df = df.append(
            get_framework_line_for_outcome(outcome), ignore_index=True
        )
    return df


def get_workflow_outcomes_table(workflow):
    outcomes = get_all_outcomes_ordered(workflow)
    data = OutcomeExportSerializer(outcomes, many=True).data
    df = pd.DataFrame(
        data, columns=["code", "title", "description", "id", "depth"]
    )
    pd.set_option("display.max_colwidth", None)
    return df


@try_async
@shared_task
def async_send_export_email(user_email, pk, object_type, task_type):
    model_object = get_model_from_str(object_type).objects.get(pk=pk)
    if task_type == "outcomes_excel":
        file = get_outcomes_excel(model_object, object_type)
        file_type = "xlsx"
    elif task_type == "outcomes_csv":
        file = get_outcomes_csv(model_object, object_type)
        file_type = "csv"
    elif task_type == "frameworks_excel":
        file = get_course_frameworks_excel(model_object, object_type)
        file_type = "xlsx"
    elif task_type == "matrix_excel":
        file = get_program_matrix_excel(model_object, object_type)
        file_type = "xlsx"
    elif task_type == "matrix_csv":
        file = get_program_matrix_csv(model_object, object_type)
        file_type = "csv"
    filename = (
        object_type
        + "_"
        + str(pk)
        + "_"
        + timezone.now().strftime(dateTimeFormatNoSpace())
        + "."
        + file_type
    )
    email = EmailMessage(
        _("Your Outcomes Export"),
        _("Hi there! Here are the results of your recent export."),
        "noreply@courseflow.org",
        [user_email],
    )
    if file_type == "csv":
        file_data = "text/csv"
    elif file_type == "xlsx":
        file_data = (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    email.attach(
        filename, file, file_data,
    )
    try:
        email.send()
    except SMTPException:
        print("Email could not be sent")


def get_outcomes_excel(model_object, object_type):
    with BytesIO() as b:
        writer = pd.ExcelWriter(b, engine="openpyxl")
        if object_type == "workflow":
            workflows = [model_object]
        elif object_type == "project":
            workflows = list(model_object.workflows.filter(deleted=False))
        for workflow in workflows:
            df = get_workflow_outcomes_table(workflow)
            df.to_excel(
                writer,
                sheet_name=workflow.title + "_" + str(workflow.pk),
                index=False,
            )
            writer.save()

        return b.getvalue()


#        response = HttpResponse(
#            b.getvalue(),
#            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
#        )
#        response['Content-Disposition'] = 'attachment; filename=%s' % filename
#        return response


def get_outcomes_csv(model_object, object_type):
    if object_type == "workflow":
        workflows = [model_object]
    elif object_type == "project":
        workflows = list(model_object.workflows.filter(deleted=False))
    df = pd.DataFrame(
        {}, columns=["code", "title", "description", "id", "depth"]
    )
    for workflow in workflows:
        df = df.append({"title": workflow.title}, ignore_index=True)
        df = pd.concat([df, get_workflow_outcomes_table(workflow)])
        df = df.append({"title": ""}, ignore_index=True)

    with BytesIO() as b:
        df.to_csv(path_or_buf=b, sep=",", index=False)
        return b.getvalue()


def get_course_frameworks_excel(model_object, object_type):
    with BytesIO() as b:
        writer = pd.ExcelWriter(b, engine="openpyxl")
        if object_type == "workflow":
            workflows = [model_object]
        elif object_type == "project":
            workflows = list(
                Course.objects.filter(project=model_object, deleted=False)
            )
        for workflow in workflows:
            df = get_course_framework(workflow)
            df.to_excel(
                writer,
                sheet_name=workflow.title + "_" + str(workflow.pk),
                index=False,
                header=False,
            )
            writer.save()
        return b.getvalue()


def get_matrix_row_header(row):
    if row["type"] == "node":
        node = row["object"]
        return get_displayed_title(node)
    else:
        week = row["object"]
        if week.title is not None and week.title is not "":
            return week.title
        else:
            return (
                _("Term")
                + " "
                + str(
                    WeekWorkflow.objects.filter(week=week)
                    .first()
                    .get_display_rank()
                    + 1
                )
            )


def evaluate_outcome(node, outcomes):
    outcome_ids = list(node.outcomes.all().values_list("id", flat=True))
    if outcomes[0].id in outcome_ids:
        outcomenode = OutcomeNode.objects.get(outcome=outcomes[0], node=node)
        degree = outcomenode.degree
        if degree == 1:
            return "X"
        value = ""
        if degree & 2:
            value += "I"
        if degree & 4:
            value += "D"
        if degree & 8:
            value += "A"
        return value
    else:
        for sub_outcome in outcomes[1:]:
            if sub_outcome.id in outcome_ids:
                return "(X)"


def get_matrix_entry(row, outcomes):
    if row["type"] == "node":
        node = row["object"]
        return evaluate_outcome(node, outcomes)
    else:
        week = row["object"]
        return ""


def get_matrix_sum_line(rows, fn):
    total = 0
    values = []
    for row in reversed(rows):
        if row["type"] == "node":
            value = fn(row["object"])
            values += [value]
            if value is None or value is "":
                value = 0
            total += int(value)
        else:
            values += [total]
            total = 0

    return list(reversed(values))


def get_program_matrix(workflow, simple):
    if simple:
        outcomes = [
            outcomeworkflow.outcome
            for outcomeworkflow in OutcomeWorkflow.objects.filter(
                workflow=workflow, outcome__deleted=False
            )
        ]
    else:
        outcomes = get_all_outcomes_ordered(workflow)

    rows = []
    for weekworkflow in WeekWorkflow.objects.filter(
        workflow=workflow, week__deleted=False
    ).order_by("rank"):
        week = weekworkflow.week
        # Add a line for the term
        rows += [{"type": "week", "object": week}]
        for nodeweek in NodeWeek.objects.filter(
            week=week, node__deleted=False
        ).order_by("rank"):
            rows += [{"type": "node", "object": nodeweek.node}]

    # headers
    col = 0
    data = {}
    data[str(col)] = ["", ""] + [get_matrix_row_header(row) for row in rows]
    col += 1

    for outcome in outcomes:
        outcome_data = OutcomeExportSerializer(outcome).data
        all_outcomes = get_all_outcomes_ordered_for_outcome(outcome)
        data[str(col)] = [outcome_data["code"], outcome_data["title"]] + [
            get_matrix_entry(row, all_outcomes) for row in rows
        ]
        col += 1

    data[str(col)] = ["" for x in data["0"]]
    col += 1

    data[str(col)] = ["", _("Specific Education")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.time_specific_hours
        if x.linked_workflow is not None
        else "",
    )
    col += 1

    data[str(col)] = ["", _("General Education")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.time_general_hours
        if x.linked_workflow is not None
        else "",
    )
    col += 1

    data[str(col)] = ["", _("Total Hours")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.time_general_hours
        + x.linked_workflow.time_specific_hours
        if x.linked_workflow is not None
        else "",
    )
    col += 1

    data[str(col)] = ["" for x in data["0"]]
    col += 1

    data[str(col)] = ["", _("Theory")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.ponderation_theory
        if x.linked_workflow is not None
        else "",
    )
    col += 1

    data[str(col)] = ["", _("Practical")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.ponderation_practical
        if x.linked_workflow is not None
        else "",
    )
    col += 1

    data[str(col)] = ["", _("Practical")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.ponderation_individual
        if x.linked_workflow is not None
        else "",
    )
    col += 1

    data[str(col)] = ["", _("Total")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.ponderation_individual
        + x.linked_workflow.ponderation_theory
        + x.linked_workflow.ponderation_practical
        if x.linked_workflow is not None
        else "",
    )
    col += 1

    data[str(col)] = ["" for x in data["0"]]
    col += 1

    data[str(col)] = ["", _("Credits")] + get_matrix_sum_line(
        rows, lambda x: x.linked_workflow.time_required if x.linked_workflow is not None else "",
    )
    col += 1

    df = pd.DataFrame(data, columns=[str(x) for x in range(col)])
    return df


def get_program_matrix_excel(model_object, object_type):
    with BytesIO() as b:
        writer = pd.ExcelWriter(b, engine="openpyxl")
        if object_type == "workflow":
            workflows = [model_object]
        elif object_type == "project":
            workflows = list(
                Program.objects.filter(project=model_object, deleted=False)
            )
        for workflow in workflows:
            df = get_program_matrix(workflow, True)
            df.to_excel(
                writer,
                sheet_name=workflow.title + "_" + str(workflow.pk),
                index=False,
                header=False,
            )
            writer.save()

        return b.getvalue()
    
    
def get_program_matrix_csv(model_object, object_type):
    if object_type == "workflow":
        workflows = [model_object]
    elif object_type == "project":
        workflows = list(
            Program.objects.filter(project=model_object, deleted=False)
        )
    df = pd.DataFrame(
        {}
    )
    for workflow in workflows:
        df = df.append({"0": workflow.title}, ignore_index=True)
        df = pd.concat([df, get_program_matrix(workflow,True)])
        df = df.append({"0": ""}, ignore_index=True)

    with BytesIO() as b:
        df.to_csv(path_or_buf=b, sep=",", index=False, header=False)
        return b.getvalue()
