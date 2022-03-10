from io import BytesIO

import pandas as pd
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext as _

from .celery import try_async
from .models import (
    Column,
    Course,
    Node,
    NodeWeek,
    OutcomeNode,
    OutcomeWorkflow,
    Program,
    Week,
    WeekWorkflow,
)
from .serializers import (
    NodeExportSerializer,
    OutcomeExportSerializer,
    WeekExportSerializer,
)
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


def get_framework_line_for_outcome(outcome, columns):
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
        "0": get_str(outcome_serialized, "code")
        + " - "
        + get_str(outcome_serialized, "title"),
        "1": sub_outcomes_entry,
        "2": outcomes_horizontal_entry,
    }
    for i, column in enumerate(columns):
        nodes = Node.objects.filter(
            outcomenode__outcome__in=sub_outcomes,
            column=column,
            deleted=False,
        ).distinct()
        dict_data[str(3 + i)] = "\n".join(
            [get_displayed_title(node) for node in nodes]
        )
    return dict_data


def get_course_framework(workflow):
    num_columns = workflow.columns.all().count()
    df_columns = max(6, 3 + num_columns)
    df = pd.DataFrame(columns=[str(i) for i in range(num_columns)])
    df = df.append(
        {
            "0": _("Course Title"),
            "1": workflow.title,
            "2": _("Ponderation Theory/Practical/Individual"),
            "3": str(workflow.ponderation_theory)
            + "/"
            + str(workflow.ponderation_practical)
            + "/"
            + str(workflow.ponderation_individual),
        },
        ignore_index=True,
    )
    df = df.append(
        {
            "0": _("Course Code"),
            "1": workflow.code,
            "2": _("Hours"),
            "3": str(
                workflow.time_general_hours + workflow.time_specific_hours
            ),
            "4": _("Time"),
            "5": stringify(workflow.time_required)
            + " "
            + workflow.get_time_units_display(),
        },
        ignore_index=True,
    )
    df = df.append({"0": _("Ministerial Competencies")}, ignore_index=True)
    df = df.append({"0": _("Competency"), "1": _("Title")}, ignore_index=True)
    nodes = get_parent_nodes_for_workflow(workflow)
    parent_outcomes = []
    for node in nodes:
        outcomenodes = get_unique_outcomenodes(node)
        parent_outcomes += OutcomeExportSerializer(
            [ocn.outcome for ocn in outcomenodes], many=True
        ).data
    a = [get_str(outcome, "code") for outcome in parent_outcomes]
    b = [get_str(outcome, "title") for outcome in parent_outcomes]
    df = pd.concat([df, pd.DataFrame({"0": a, "1": b})])
    if len(nodes) > 0:
        df = df.append(
            {
                "0": _("Term"),
                "1": WeekWorkflow.objects.get(
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
                    "0": _("Prerequisites"),
                    "1": ", ".join(
                        [get_displayed_title(req) for req in prereqs]
                    ),
                },
                ignore_index=True,
            )
        if len(postreqs) > 0:
            df = df.append(
                {
                    "0": _("Required For"),
                    "1": ", ".join(
                        [get_displayed_title(req) for req in postreqs]
                    ),
                },
                ignore_index=True,
            )
    headers = {
        "0": _("Course Outcome"),
        "1": _("Sub-Outcomes"),
        "2": _("Competencies"),
    }
    columns = workflow.columns.order_by("columnworkflow__rank").all()
    for i, column in enumerate(columns):
        headers[str(3 + i)] = column.get_display_title()
    df = df.append(headers, ignore_index=True,)
    for outcome in workflow.outcomes.filter(deleted=False):
        df = df.append(
            get_framework_line_for_outcome(outcome, columns), ignore_index=True
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
        if week.title is not None and week.title != "":
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
            if value is None or value == "":
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
        if (x.linked_workflow is not None and x.represents_workflow)
        else x.time_specific_hours,
    )
    col += 1

    data[str(col)] = ["", _("General Education")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.time_general_hours
        if (x.linked_workflow is not None and x.represents_workflow)
        else x.time_general_hours,
    )
    col += 1

    data[str(col)] = ["", _("Total Hours")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.time_general_hours
        + x.linked_workflow.time_specific_hours
        if (x.linked_workflow is not None and x.represents_workflow)
        else x.time_general_hours + x.time_specific_hours,
    )
    col += 1

    data[str(col)] = ["" for x in data["0"]]
    col += 1

    data[str(col)] = ["", _("Theory")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.ponderation_theory
        if (x.linked_workflow is not None and x.represents_workflow)
        else x.ponderation_theory,
    )
    col += 1

    data[str(col)] = ["", _("Practical")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.ponderation_practical
        if (x.linked_workflow is not None and x.represents_workflow)
        else x.ponderation_practical,
    )
    col += 1

    data[str(col)] = ["", _("Practical")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.ponderation_individual
        if (x.linked_workflow is not None and x.represents_workflow)
        else x.ponderation_individual,
    )
    col += 1

    data[str(col)] = ["", _("Total")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.ponderation_individual
        + x.linked_workflow.ponderation_theory
        + x.linked_workflow.ponderation_practical
        if (x.linked_workflow is not None and x.represents_workflow)
        else x.ponderation_individual
        + x.ponderation_theory
        + x.ponderation_practical,
    )
    col += 1

    data[str(col)] = ["" for x in data["0"]]
    col += 1

    data[str(col)] = ["", _("Credits")] + get_matrix_sum_line(
        rows,
        lambda x: x.linked_workflow.time_required
        if (x.linked_workflow is not None and x.represents_workflow)
        else x.time_required,
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
    df = pd.DataFrame({})
    for workflow in workflows:
        df = df.append({"0": workflow.title}, ignore_index=True)
        df = pd.concat([df, get_program_matrix(workflow, True)])
        df = df.append({"0": ""}, ignore_index=True)

    with BytesIO() as b:
        df.to_csv(path_or_buf=b, sep=",", index=False, header=False)
        return b.getvalue()


def get_nodes_excel(model_object, object_type):
    with BytesIO() as b:
        writer = pd.ExcelWriter(b, engine="openpyxl")
        if object_type == "workflow":
            workflows = [model_object]
        elif object_type == "project":
            workflows = list(model_object.workflows.filter(deleted=False))
        for workflow in workflows:
            df = get_workflow_nodes_table(workflow)
            df.to_excel(
                writer,
                sheet_name=workflow.title + "_" + str(workflow.pk),
                index=False,
            )
            writer.save()

        return b.getvalue()


def get_nodes_csv(model_object, object_type):
    if object_type == "workflow":
        workflows = [model_object]
    elif object_type == "project":
        workflows = list(model_object.workflows.filter(deleted=False))
    df = pd.DataFrame(
        {}, columns=["type", "title", "description", "column_order", "id"]
    )
    for workflow in workflows:
        df = df.append({"title": workflow.title}, ignore_index=True)
        df = pd.concat([df, get_workflow_nodes_table(workflow)])
        df = df.append({"title": ""}, ignore_index=True)

    with BytesIO() as b:
        df.to_csv(path_or_buf=b, sep=",", index=False)
        return b.getvalue()


def get_workflow_nodes_table(workflow):
    entries = []
    for week in Week.objects.filter(workflow=workflow, deleted=False).order_by(
        "weekworkflow__rank"
    ):
        entries += [WeekExportSerializer(week).data]
        entries += NodeExportSerializer(
            Node.objects.filter(week=week, deleted=False).order_by(
                "nodeweek__rank"
            ),
            many=True,
        ).data
    df = pd.DataFrame(
        entries, columns=["type", "title", "description", "column_order", "id"]
    )
    pd.set_option("display.max_colwidth", None)
    return df
