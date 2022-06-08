from io import BytesIO

import pandas as pd
from django.conf import settings
from django.db.models import Q
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
    WorkflowExportSerializer,
)
from .utils import (
    dateTimeFormatNoSpace,
    get_all_outcomes_ordered,
    get_all_outcomes_ordered_filtered,
    get_all_outcomes_ordered_for_outcome,
    get_alphanum,
    get_model_from_str,
    get_outcomenodes,
    get_parent_nodes_for_workflow,
    get_unique_outcomehorizontallinks,
    get_unique_outcomenodes,
)

#
# def get_displayed_title(node):
#    if node.linked_workflow is not None and node.represents_workflow:
#        return node.linked_workflow.title
#    else:
#        return _("Untitled Node") if node.title is None else node.title


def get_str(obj, key):
    s = obj.get(key, "")
    return "" if s is None else s


def stringify(value):
    if value is None:
        return ""
    else:
        return str(value)


def allowed_sets_Q(allowed_sets):
    return Q(sets__in=allowed_sets) | Q(sets=None)


def check_allowed_sets(obj, allowed_sets):
    if obj.sets.all().count() == 0:
        return True
    if (
        obj.sets.filter(
            id__in=allowed_sets.values_list("id", flat=True)
        ).count()
        > 0
    ):
        return True
    return False


def get_framework_line_for_outcome(outcome, columns, allowed_sets):
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
        filter(
            lambda och: check_allowed_sets(och, allowed_sets),
            outcomes_horizontal,
        ),
        many=True,
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
        nodes = (
            Node.objects.filter(
                outcomenode__outcome__in=sub_outcomes,
                column=column,
                deleted=False,
            )
            .filter(allowed_sets_Q(allowed_sets))
            .distinct()
        )
        nodes_serialized = NodeExportSerializer(nodes, many=True).data
        dict_data[str(3 + i)] = "\n".join(
            [node["title"] for node in nodes_serialized]
        )
    return dict_data


def get_course_framework(workflow, allowed_sets):
    workflow_serialized = WorkflowExportSerializer(workflow).data
    num_columns = workflow.columns.all().count()
    df_columns = max(6, 3 + num_columns)
    df = pd.DataFrame(columns=[str(i) for i in range(num_columns)])
    df = df.append(
        {
            "0": _("Course Title"),
            "1": workflow_serialized["title"],
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
    nodes = get_parent_nodes_for_workflow(workflow).filter(
        allowed_sets_Q(allowed_sets)
    )
    parent_outcomes = []
    for node in nodes:
        outcomenodes = get_outcomenodes(node)
        outcomes_unfiltered = [ocn.outcome for ocn in outcomenodes]
        outcomes_filtered = filter(
            lambda oc: check_allowed_sets(oc, allowed_sets),
            outcomes_unfiltered,
        )
        parent_outcomes += OutcomeExportSerializer(
            outcomes_filtered, many=True
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
        prereqs = (
            Node.objects.filter(
                outgoing_links__target_node__in=nodes, deleted=False,
            )
            .filter(allowed_sets_Q(allowed_sets))
            .distinct()
        )
        postreqs = (
            Node.objects.filter(
                incoming_links__source_node__in=nodes, deleted=False,
            )
            .filter(allowed_sets_Q(allowed_sets))
            .distinct()
        )
        if len(prereqs) > 0:
            df = df.append(
                {
                    "0": _("Prerequisites"),
                    "1": ", ".join(
                        [
                            req["title"]
                            for req in NodeExportSerializer(
                                prereqs, many=True
                            ).data
                        ]
                    ),
                },
                ignore_index=True,
            )
        if len(postreqs) > 0:
            df = df.append(
                {
                    "0": _("Required For"),
                    "1": ", ".join(
                        [
                            req["title"]
                            for req in NodeExportSerializer(
                                postreqs, many=True
                            ).data
                        ]
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
    for outcome in workflow.outcomes.filter(deleted=False).filter(
        allowed_sets_Q(allowed_sets)
    ):
        df = df.append(
            get_framework_line_for_outcome(outcome, columns, allowed_sets),
            ignore_index=True,
        )
    return df


def get_workflow_outcomes_table(workflow, allowed_sets):
    outcomes = get_all_outcomes_ordered_filtered(
        workflow, allowed_sets_Q(allowed_sets)
    )
    data = OutcomeExportSerializer(outcomes, many=True).data
    df = pd.DataFrame(
        data, columns=["code", "title", "description", "id", "depth"]
    )
    pd.set_option("display.max_colwidth", None)
    return df


def get_outcomes_export(
    model_object, object_type, export_format, allowed_sets
):
    if object_type == "project":
        workflows = list(model_object.workflows.filter(deleted=False))
    else:
        workflows = [model_object]
    with BytesIO() as b:
        if export_format == "excel":
            writer = pd.ExcelWriter(b, engine="openpyxl")
            for workflow in workflows:
                df = get_workflow_outcomes_table(workflow, allowed_sets)
                df.to_excel(
                    writer,
                    sheet_name=get_alphanum(workflow.title)
                    + "_"
                    + str(workflow.pk),
                    index=False,
                )
                writer.save()
        elif export_format == "csv":
            df = pd.DataFrame(
                {}, columns=["code", "title", "description", "id", "depth"]
            )
            workflows_serialized = WorkflowExportSerializer(
                workflows, many=True
            ).data
            for i, workflow in enumerate(workflows):
                df = df.append(
                    {"title": workflows_serialized[i]["title"]},
                    ignore_index=True,
                )
                df = pd.concat(
                    [df, get_workflow_outcomes_table(workflow, allowed_sets)]
                )
                df = df.append({"title": ""}, ignore_index=True)
            df.to_csv(path_or_buf=b, sep=",", index=False)
        return b.getvalue()


def get_course_frameworks_export(
    model_object, object_type, export_format, allowed_sets
):
    if object_type == "project":
        workflows = list(
            Course.objects.filter(project=model_object, deleted=False)
        )
    else:
        workflows = [model_object]
    with BytesIO() as b:
        if export_format == "excel":
            writer = pd.ExcelWriter(b, engine="openpyxl")
            for workflow in workflows:
                df = get_course_framework(workflow, allowed_sets)
                df.to_excel(
                    writer,
                    sheet_name=get_alphanum(workflow.title)
                    + "_"
                    + str(workflow.pk),
                    index=False,
                )
                writer.save()
        elif export_format == "csv":
            df = pd.DataFrame({})
            workflows_serialized = WorkflowExportSerializer(
                workflows, many=True
            ).data
            for i, workflow in enumerate(workflows):
                df = df.append(
                    {"0": workflows_serialized[i]["title"]}, ignore_index=True
                )
                df = pd.concat(
                    [df, get_course_framework(workflow, allowed_sets)]
                )
                df = df.append({"0": ""}, ignore_index=True)
            df.to_csv(path_or_buf=b, sep=",", index=False)
        return b.getvalue()


def get_program_matrix_export(
    model_object, object_type, export_format, allowed_sets
):
    if object_type == "project":
        workflows = list(
            Program.objects.filter(project=model_object, deleted=False)
        )
    else:
        workflows = [model_object]
    with BytesIO() as b:
        if export_format == "excel":
            writer = pd.ExcelWriter(b, engine="openpyxl")
            for workflow in workflows:
                df = get_program_matrix(workflow, True, allowed_sets)
                df.to_excel(
                    writer,
                    sheet_name=get_alphanum(workflow.title)
                    + "_"
                    + str(workflow.pk),
                    index=False,
                )
                writer.save()
        elif export_format == "csv":
            df = pd.DataFrame({})
            workflows_serialized = WorkflowExportSerializer(
                workflows, many=True
            ).data
            for i, workflow in enumerate(workflows):
                df = df.append(
                    {"0": workflows_serialized[i]["title"]}, ignore_index=True
                )
                df = pd.concat(
                    [df, get_program_matrix(workflow, True, allowed_sets)]
                )
                df = df.append({"0": ""}, ignore_index=True)
            df.to_csv(path_or_buf=b, sep=",", index=False)
        return b.getvalue()


def get_nodes_export(model_object, object_type, export_format, allowed_sets):
    if object_type == "project":
        workflows = list(model_object.workflows.filter(deleted=False))
    else:
        workflows = [model_object]
    with BytesIO() as b:
        if export_format == "excel":
            writer = pd.ExcelWriter(b, engine="openpyxl")
            for workflow in workflows:
                df = get_workflow_nodes_table(workflow, allowed_sets)
                df.to_excel(
                    writer,
                    sheet_name=get_alphanum(workflow.title)
                    + "_"
                    + str(workflow.pk),
                    index=False,
                )
                writer.save()
        elif export_format == "csv":
            df = pd.DataFrame(
                {},
                columns=["type", "title", "description", "column_order", "id"],
            )
            workflows_serialized = WorkflowExportSerializer(
                workflows, many=True
            ).data
            for i, workflow in enumerate(workflows):
                df = df.append(
                    {"title": workflows_serialized[i]["title"]},
                    ignore_index=True,
                )
                df = pd.concat(
                    [df, get_workflow_nodes_table(workflow, allowed_sets)]
                )
                df = df.append({"title": ""}, ignore_index=True)
            df.to_csv(path_or_buf=b, sep=",", index=False)
        return b.getvalue()


#
#
# def get_nodes_excel(model_object, object_type):
#    with BytesIO() as b:
#        writer = pd.ExcelWriter(b, engine="openpyxl")
#        if object_type == "workflow":
#            workflows = [model_object]
#        elif object_type == "project":
#            workflows = list(model_object.workflows.filter(deleted=False))
#        for workflow in workflows:
#            df = get_workflow_nodes_table(workflow)
#            df.to_excel(
#                writer,
#                sheet_name=get_alphanum(workflow.title) + "_" + str(workflow.pk),
#                index=False,
#            )
#            writer.save()
#
#        return b.getvalue()
#
#
# def get_nodes_csv(model_object, object_type):
#    if object_type == "workflow":
#        workflows = [model_object]
#    elif object_type == "project":
#        workflows = list(model_object.workflows.filter(deleted=False))
#    df = pd.DataFrame(
#        {}, columns=["type", "title", "description", "column_order", "id"]
#    )
#    for workflow in workflows:
#        df = df.append({"title": workflow.title}, ignore_index=True)
#        df = pd.concat([df, get_workflow_nodes_table(workflow)])
#        df = df.append({"title": ""}, ignore_index=True)
#
#    with BytesIO() as b:
#        df.to_csv(path_or_buf=b, sep=",", index=False)
#        return b.getvalue()
#

#
# def get_program_matrix_excel(model_object, object_type):
#    with BytesIO() as b:
#        writer = pd.ExcelWriter(b, engine="openpyxl")
#        if object_type == "workflow":
#            workflows = [model_object]
#        elif object_type == "project":
#            workflows = list(
#                Program.objects.filter(project=model_object, deleted=False)
#            )
#        for workflow in workflows:
#            df = get_program_matrix(workflow, True)
#            df.to_excel(
#                writer,
#                sheet_name=get_alphanum(workflow.title) + "_" + str(workflow.pk),
#                index=False,
#                header=False,
#            )
#            writer.save()
#
#        return b.getvalue()
#
#
# def get_program_matrix_csv(model_object, object_type):
#    if object_type == "workflow":
#        workflows = [model_object]
#    elif object_type == "project":
#        workflows = list(
#            Program.objects.filter(project=model_object, deleted=False)
#        )
#    df = pd.DataFrame({})
#    for workflow in workflows:
#        df = df.append({"0": workflow.title}, ignore_index=True)
#        df = pd.concat([df, get_program_matrix(workflow, True)])
#        df = df.append({"0": ""}, ignore_index=True)
#
#    with BytesIO() as b:
#        df.to_csv(path_or_buf=b, sep=",", index=False, header=False)
#        return b.getvalue()


# def get_course_frameworks_excel(model_object, object_type):
#    with BytesIO() as b:
#        writer = pd.ExcelWriter(b, engine="openpyxl")
#        if object_type == "workflow":
#            workflows = [model_object]
#        elif object_type == "project":
#            workflows = list(
#                Course.objects.filter(project=model_object, deleted=False)
#            )
#        for workflow in workflows:
#            df = get_course_framework(workflow)
#            df.to_excel(
#                writer,
#                sheet_name=get_alphanum(workflow.title) + "_" + str(workflow.pk),
#                index=False,
#                header=False,
#            )
#            writer.save()
#        return b.getvalue()

# def get_outcomes_excel(model_object, object_type):
#    with BytesIO() as b:
#        writer = pd.ExcelWriter(b, engine="openpyxl")
#        if object_type == "workflow":
#            workflows = [model_object]
#        elif object_type == "project":
#            workflows = list(model_object.workflows.filter(deleted=False))
#        for workflow in workflows:
#            df = get_workflow_outcomes_table(workflow)
#            df.to_excel(
#                writer,
#                sheet_name=get_alphanum(workflow.title) + "_" + str(workflow.pk),
#                index=False,
#            )
#            writer.save()
#
#        return b.getvalue()
#
#
# def get_outcomes_csv(model_object, object_type):
#    if object_type == "workflow":
#        workflows = [model_object]
#    elif object_type == "project":
#        workflows = list(model_object.workflows.filter(deleted=False))
#    df = pd.DataFrame(
#        {}, columns=["code", "title", "description", "id", "depth"]
#    )
#    for workflow in workflows:
#        df = df.append({"title": workflow.title}, ignore_index=True)
#        df = pd.concat([df, get_workflow_outcomes_table(workflow)])
#        df = df.append({"title": ""}, ignore_index=True)
#
#    with BytesIO() as b:
#        df.to_csv(path_or_buf=b, sep=",", index=False)
#        return b.getvalue()


def get_matrix_row_header(row):
    if row["type"] == "node":
        node = row["object"]
        return NodeExportSerializer(node).data["title"]
    else:
        week = row["object"]
        return WeekExportSerializer(week).data["title"]


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


def get_program_matrix(workflow, simple, allowed_sets):
    if simple:
        outcomes = filter(
            lambda oc: check_allowed_sets(oc, allowed_sets),
            [
                outcomeworkflow.outcome
                for outcomeworkflow in OutcomeWorkflow.objects.filter(
                    workflow=workflow, outcome__deleted=False
                )
            ],
        )
    else:
        outcomes = get_all_outcomes_ordered_filtered(
            workflow, allowed_sets_Q(allowed_sets)
        )

    rows = []
    for weekworkflow in WeekWorkflow.objects.filter(
        workflow=workflow, week__deleted=False
    ).order_by("rank"):
        week = weekworkflow.week
        # Add a line for the term
        rows += [{"type": "week", "object": week}]
        for node in (
            Node.objects.filter(allowed_sets_Q(allowed_sets))
            .filter(week=week, deleted=False)
            .order_by("nodeweek__rank")
        ):
            rows += [{"type": "node", "object": node}]

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


def get_workflow_nodes_table(workflow, allowed_sets):
    entries = []
    for week in Week.objects.filter(workflow=workflow, deleted=False).order_by(
        "weekworkflow__rank"
    ):
        entries += [WeekExportSerializer(week).data]
        entries += NodeExportSerializer(
            Node.objects.filter(week=week, deleted=False)
            .filter(allowed_sets_Q(allowed_sets))
            .order_by("nodeweek__rank"),
            many=True,
        ).data
    df = pd.DataFrame(
        entries, columns=["type", "title", "description", "column_order", "id"]
    )
    pd.set_option("display.max_colwidth", None)
    return df
