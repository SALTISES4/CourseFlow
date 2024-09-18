import logging
from io import BytesIO

import pandas as pd
from django.db.models import Q
from django.utils.translation import gettext as _

from course_flow import analytics
from course_flow.apps import logger
from course_flow.models import Course, Node, Program, Week
from course_flow.models.relations.outcomeNode import OutcomeNode
from course_flow.models.relations.outcomeWorkflow import OutcomeWorkflow
from course_flow.models.relations.weekWorkflow import WeekWorkflow
from course_flow.serializers import (
    NodeExportSerializer,
    NodeExportSerializerWithTime,
    OutcomeExportSerializer,
    WeekExportSerializer,
    WorkflowExportSerializer,
)
from course_flow.services import DAO, Utility


class Exporter:
    @staticmethod
    def get_framework_line_for_outcome(outcome, columns, allowed_sets):
        outcome_serialized = OutcomeExportSerializer(outcome).data
        sub_outcomes = DAO.get_all_outcomes_ordered_for_outcome(outcome)
        sub_outcomes_serialized = OutcomeExportSerializer(
            sub_outcomes[1:], many=True
        ).data
        sub_outcomes_entry = "\n".join(
            [
                Utility.get_str(sub, "code")
                + " - "
                + Utility.get_str(sub, "title")
                for sub in sub_outcomes_serialized
            ]
        )
        outcomes_horizontal = [
            och.parent_outcome
            for och in DAO.get_unique_outcomehorizontallinks(outcome)
        ]
        outcomes_horizontal_serialized = OutcomeExportSerializer(
            filter(
                lambda och: Utility.check_allowed_sets(och, allowed_sets),
                outcomes_horizontal,
            ),
            many=True,
        ).data
        outcomes_horizontal_entry = "\n".join(
            [
                Utility.get_str(och, "code")
                for och in outcomes_horizontal_serialized
            ]
        )
        dict_data = {
            "0": Utility.get_str(outcome_serialized, "code")
            + " - "
            + Utility.get_str(outcome_serialized, "title"),
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
                .filter(Utility.allowed_sets_Q(allowed_sets))
                .distinct()
            )
            nodes_serialized = NodeExportSerializer(nodes, many=True).data
            dict_data[str(3 + i)] = "\n".join(
                [node["title"] for node in nodes_serialized]
            )
        return dict_data

    @staticmethod
    def get_course_framework(self, workflow, allowed_sets):
        workflow_serialized = WorkflowExportSerializer(workflow).data
        num_columns = workflow.columns.all().count()
        # df_columns = max(6, 3 + num_columns)
        df = pd.DataFrame(columns=[str(i) for i in range(num_columns)])
        df = Utility.concat_line(
            df,
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
        )
        df = Utility.concat_line(
            df,
            {
                "0": _("Course Description"),
                "1": workflow_serialized["description"],
            },
        )
        df = Utility.concat_line(
            df,
            {
                "0": _("Course Code"),
                "1": workflow.code,
                "2": _("Hours"),
                "3": str(
                    workflow.time_general_hours + workflow.time_specific_hours
                ),
                "4": _("Time"),
                "5": Utility.stringify(workflow.time_required)
                + " "
                + workflow.get_time_units_display(),
            },
        )
        df = Utility.concat_line(df, {"0": _("Ministerial Competencies")})
        df = Utility.concat_line(df, {"0": _("Competency"), "1": _("Title")})
        nodes = (
            DAO.get_parent_nodes_for_workflow(workflow)
            .filter(Utility.allowed_sets_Q(allowed_sets))
            .distinct()
        )
        parent_outcomes = []
        for node in nodes:
            outcomenodes = DAO.get_outcomenodes(node)
            outcomes_unfiltered = [ocn.outcome for ocn in outcomenodes]
            outcomes_filtered = filter(
                lambda oc: Utility.check_allowed_sets(oc, allowed_sets),
                outcomes_unfiltered,
            )
            parent_outcomes += OutcomeExportSerializer(
                outcomes_filtered, many=True
            ).data
        a = [Utility.get_str(outcome, "code") for outcome in parent_outcomes]
        b = [Utility.get_str(outcome, "title") for outcome in parent_outcomes]
        df = pd.concat(
            [
                df,
                pd.DataFrame({"0": a, "1": b}).sort_values(
                    by="0",
                ),
            ]
        )
        parent_outcome_length = len(parent_outcomes)
        if len(nodes) > 0:
            df = Utility.concat_line(
                df,
                {
                    "0": _("Term"),
                    "1": WeekWorkflow.objects.get(
                        week__nodes=nodes[0]
                    ).get_display_rank()
                    + 1,
                },
            )
            prereqs = (
                Node.objects.filter(
                    outgoing_links__target_node__in=nodes,
                    deleted=False,
                )
                .filter(Utility.allowed_sets_Q(allowed_sets))
                .distinct()
            )
            postreqs = (
                Node.objects.filter(
                    incoming_links__source_node__in=nodes,
                    deleted=False,
                )
                .filter(Utility.allowed_sets_Q(allowed_sets))
                .distinct()
            )
            if len(prereqs) > 0:
                df = Utility.concat_line(
                    df,
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
                )
            if len(postreqs) > 0:
                df = Utility.concat_line(
                    df,
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
                )
        headers = {
            "0": _("Course Outcome"),
            "1": _("Sub-Outcomes"),
            "2": _("Competencies"),
        }
        columns = workflow.columns.order_by("columnworkflow__rank").all()
        for i, column in enumerate(columns):
            headers[str(3 + i)] = column.get_display_title()
        df = Utility.concat_line(df, headers)
        for outcome in workflow.outcomes.filter(deleted=False).filter(
            Utility.allowed_sets_Q(allowed_sets)
        ):
            df = Utility.concat_line(
                df,
                self.get_framework_line_for_outcome(
                    outcome, columns, allowed_sets
                ),
            )
        return df, parent_outcome_length

    @staticmethod
    def get_workflow_outcomes_table(workflow, allowed_sets):
        outcomes = DAO.get_all_outcomes_ordered_filtered(
            workflow, Utility.allowed_sets_Q(allowed_sets)
        )
        data = OutcomeExportSerializer(outcomes, many=True).data
        df = pd.DataFrame(
            data, columns=["code", "title", "description", "id", "depth"]
        )
        pd.set_option("display.max_colwidth", None)
        return df

    def get_outcomes_export(
        self, model_object, object_type, export_format, allowed_sets
    ):
        if object_type == "project":
            workflows = list(model_object.workflows.filter(deleted=False))
        else:
            workflows = [model_object]
        with BytesIO() as b:
            if export_format == "excel":
                with pd.ExcelWriter(b, engine="xlsxwriter") as writer:
                    for workflow in workflows:
                        df = self.get_workflow_outcomes_table(
                            workflow, allowed_sets
                        )
                        sheet_name = (
                            Utility.get_alphanum(str(workflow))
                            + "_"
                            + str(workflow.pk)
                        )[:30]
                        df.to_excel(
                            writer,
                            sheet_name=sheet_name,
                            index=False,
                        )
            elif export_format == "csv":
                df = pd.DataFrame(
                    {}, columns=["code", "title", "description", "id", "depth"]
                )
                workflows_serialized = WorkflowExportSerializer(
                    workflows, many=True
                ).data
                for i, workflow in enumerate(workflows):
                    df = Utility.concat_line(
                        df, {"title": workflows_serialized[i]["title"]}
                    )
                    df = Utility.concat_df(
                        df,
                        self.get_workflow_outcomes_table(
                            workflow, allowed_sets
                        ),
                    )
                    df = Utility.concat_line(df, {"title": ""})
                df.to_csv(path_or_buf=b, sep=",", index=False)
            return b.getvalue()

    def get_course_frameworks_export(
        self, model_object, object_type, export_format, allowed_sets
    ):
        if object_type == "project":
            workflows = list(
                Course.objects.filter(project=model_object, deleted=False)
            )
        else:
            workflows = [model_object]

        with BytesIO() as b:
            if export_format == "excel":
                with pd.ExcelWriter(b, engine="xlsxwriter") as writer:
                    workbook = writer.book
                    bold_format = workbook.add_format(
                        {"bold": True, "bg_color": "#04BA74", "color": "white"}
                    )
                    wrap_format = workbook.add_format()
                    wrap_format.set_text_wrap()
                    wrap_format.set_align("top")

                    for workflow in workflows:
                        df, parent_outcome_length = self.get_course_framework(
                            workflow, allowed_sets
                        )
                        sheet_name = (
                            Utility.get_alphanum(str(workflow))
                            + "_"
                            + str(workflow.pk)
                        )[:30]
                        df.to_excel(
                            writer,
                            sheet_name=sheet_name,
                            index=False,
                        )
                        worksheet = writer.sheets[sheet_name]
                        worksheet.set_column(0, 0, 20, wrap_format)
                        worksheet.set_column(1, 1, 40, wrap_format)
                        worksheet.set_column(2, 99, 25, wrap_format)

                        worksheet.set_row(
                            5 + parent_outcome_length + 4, None, bold_format
                        )
                        bold_cells = [
                            [1, 0],
                            [1, 2],
                            [2, 0],
                            [3, 0],
                            [3, 2],
                            [3, 4],
                            [4, 0],
                            [5, 0],
                            [5, 1],
                            [5 + parent_outcome_length + 1, 0],
                            [5 + parent_outcome_length + 2, 0],
                            [5 + parent_outcome_length + 3, 0],
                        ]
                        for cell in bold_cells:
                            worksheet.conditional_format(
                                cell[0],
                                cell[1],
                                cell[0],
                                cell[1],
                                {"type": "no_errors", "format": bold_format},
                            )

                        worksheet.merge_range(2, 1, 2, 5, None)

            elif export_format == "csv":
                df = pd.DataFrame({})
                workflows_serialized = WorkflowExportSerializer(
                    workflows, many=True
                ).data
                for i, workflow in enumerate(workflows):
                    df = Utility.concat_line(
                        df, {"0": workflows_serialized[i]["title"]}
                    )
                    df = Utility.concat_df(
                        df,
                        self.get_course_framework(workflow, allowed_sets)[0],
                    )
                    df = Utility.concat_line(df, {"0": ""})
                df.to_csv(path_or_buf=b, sep=",", index=False)
            return b.getvalue()

    def get_program_matrix_export(
        self, model_object, object_type, export_format, allowed_sets
    ):
        if object_type == "project":
            workflows = list(
                Program.objects.filter(project=model_object, deleted=False)
            )
        else:
            workflows = [model_object]
        with BytesIO() as b:
            if export_format == "excel":
                with pd.ExcelWriter(b, engine="xlsxwriter") as writer:
                    for workflow in workflows:
                        df = self.get_program_matrix(
                            workflow, True, allowed_sets
                        )
                        sheet_name = (
                            Utility.get_alphanum(str(workflow))
                            + "_"
                            + str(workflow.pk)
                        )[:30]
                        df.to_excel(
                            writer,
                            sheet_name=sheet_name,
                            index=False,
                        )
            elif export_format == "csv":
                df = pd.DataFrame({})
                workflows_serialized = WorkflowExportSerializer(
                    workflows, many=True
                ).data
                for i, workflow in enumerate(workflows):
                    df = Utility.concat_line(
                        df, {"0": workflows_serialized[i]["title"]}
                    )
                    df = Utility.concat_df(
                        df,
                        self.get_program_matrix(workflow, True, allowed_sets),
                    )
                    df = Utility.concat_line(df, {"0": ""})
                df.to_csv(path_or_buf=b, sep=",", index=False)
            return b.getvalue()

    def get_sobec_export(
        self, model_object, object_type, export_format, allowed_sets
    ):
        if object_type == "project":
            workflows = list(
                Program.objects.filter(project=model_object, deleted=False)
            )
        else:
            workflows = [model_object]
        with BytesIO() as b:
            if export_format == "excel":
                with pd.ExcelWriter(b, engine="xlsxwriter") as writer:
                    workbook = writer.book
                    bold_format = workbook.add_format(
                        {"bold": True, "bg_color": "#04BA74", "color": "white"}
                    )
                    wrap_format = workbook.add_format()
                    wrap_format.set_text_wrap()
                    wrap_format.set_align("top")
                    for workflow in workflows:
                        df = self.get_sobec(workflow, allowed_sets)
                        sheet_name = (
                            Utility.get_alphanum(str(workflow))
                            + "_"
                            + str(workflow.pk)
                        )[:30]
                        df.to_excel(
                            writer,
                            sheet_name=sheet_name,
                            index=False,
                        )
                        worksheet = writer.sheets[sheet_name]
                        worksheet.set_column(0, 0, 30, wrap_format)
                        worksheet.set_column(1, 1, 40, wrap_format)
                        worksheet.set_column(2, 2, 50, wrap_format)
                        worksheet.set_column(3, 3, 10, wrap_format)
                        worksheet.set_column(4, 4, 10, wrap_format)
                        worksheet.set_column(5, 5, 10, wrap_format)
                        worksheet.set_column(6, 6, 20, wrap_format)
                        worksheet.set_row(0, None, bold_format)
            elif export_format == "csv":
                df = pd.DataFrame({})
                workflows_serialized = WorkflowExportSerializer(
                    workflows, many=True
                ).data
                for i, workflow in enumerate(workflows):
                    df = Utility.concat_line(
                        df, {"0": workflows_serialized[i]["title"]}
                    )
                    df = Utility.concat_df(
                        df, Exporter.get_sobec(workflow, allowed_sets)
                    )
                    df = Utility.concat_line(df, {"0": ""})
                df.to_csv(path_or_buf=b, sep=",", index=False)
            return b.getvalue()

    def get_nodes_export(
        self, model_object, object_type, export_format, allowed_sets
    ):
        if object_type == "project":
            workflows = list(model_object.workflows.filter(deleted=False))
        else:
            workflows = [model_object]
        with BytesIO() as b:
            if export_format == "excel":
                with pd.ExcelWriter(b, engine="xlsxwriter") as writer:
                    for workflow in workflows:
                        df = self.get_workflow_nodes_table(
                            workflow, allowed_sets
                        )
                        sheet_name = (
                            Utility.get_alphanum(str(workflow))
                            + "_"
                            + str(workflow.pk)
                        )[:30]
                        df.to_excel(
                            writer,
                            sheet_name=sheet_name,
                            index=False,
                        )
            elif export_format == "csv":
                df = pd.DataFrame(
                    {},
                    columns=[
                        "type",
                        "title",
                        "description",
                        "column_order",
                        "id",
                    ],
                )
                workflows_serialized = WorkflowExportSerializer(
                    workflows, many=True
                ).data
                for i, workflow in enumerate(workflows):
                    df = Utility.concat_line(
                        df, {"title": workflows_serialized[i]["title"]}
                    )
                    df = Utility.concat_df(
                        df,
                        self.get_workflow_nodes_table(workflow, allowed_sets),
                    )
                    df = Utility.concat_line(df, {"title": ""})
                df.to_csv(path_or_buf=b, sep=",", index=False)
            return b.getvalue()

    @staticmethod
    def get_matrix_row_header(row):
        if row["type"] == "node":
            node = row["object"]
            return NodeExportSerializer(node).data["title"]
        else:
            week = row["object"]
            return WeekExportSerializer(week).data["title"]

    @staticmethod
    def evaluate_outcome(node, outcomes):
        outcome_ids = list(node.outcomes.all().values_list("id", flat=True))
        if outcomes[0].id in outcome_ids:
            outcomenode = OutcomeNode.objects.get(
                outcome=outcomes[0], node=node
            )
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

    def get_matrix_entry(self, row, outcomes):
        if row["type"] == "node":
            node = row["object"]
            return self.evaluate_outcome(node, outcomes)
        else:
            # week = row["object"]
            return ""

    @staticmethod
    def get_matrix_sum_line(rows, fn):
        total = 0
        values = []
        for row in reversed(rows):
            if row["type"] == "node":
                value = fn(row["object"])
                values += [value]
                if value is None or value == "":
                    value = 0
                try:
                    this_value = float(value)
                except Exception as e:
                    logger.log(logging.INFO, e)
                    this_value = 0
                total += this_value
            else:
                values += [total]
                total = 0

        return list(reversed(values))

    def get_program_matrix(self, workflow, simple, allowed_sets):
        if simple:
            outcomes = filter(
                lambda oc: Utility.check_allowed_sets(oc, allowed_sets),
                [
                    outcomeworkflow.outcome
                    for outcomeworkflow in OutcomeWorkflow.objects.filter(
                        workflow=workflow, outcome__deleted=False
                    )
                ],
            )
        else:
            outcomes = DAO.get_all_outcomes_ordered_filtered(
                workflow, Utility.allowed_sets_Q(allowed_sets)
            )

        rows = []
        for weekworkflow in WeekWorkflow.objects.filter(
            workflow=workflow, week__deleted=False
        ).order_by("rank"):
            week = weekworkflow.week
            # Add a line for the term
            rows += [{"type": "week", "object": week}]
            for node in (
                Node.objects.filter(Utility.allowed_sets_Q(allowed_sets))
                .filter(week=week, deleted=False)
                .order_by("nodeweek__rank")
            ):
                rows += [{"type": "node", "object": node}]

        # headers
        col = 0
        data = {}
        data[str(col)] = ["", ""] + [
            self.get_matrix_row_header(row) for row in rows
        ]
        col += 1

        for outcome in outcomes:
            outcome_data = OutcomeExportSerializer(outcome).data
            all_outcomes = DAO.get_all_outcomes_ordered_for_outcome(outcome)
            data[str(col)] = [outcome_data["code"], outcome_data["title"]] + [
                self.get_matrix_entry(row, all_outcomes) for row in rows
            ]
            col += 1

        data[str(col)] = ["" for x in data["0"]]
        col += 1

        data[str(col)] = [
            "",
            _("Specific Education"),
        ] + self.get_matrix_sum_line(
            rows,
            lambda x: x.linked_workflow.time_specific_hours
            if (x.linked_workflow is not None and x.represents_workflow)
            else x.time_specific_hours,
        )
        col += 1

        data[str(col)] = [
            "",
            _("General Education"),
        ] + self.get_matrix_sum_line(
            rows,
            lambda x: x.linked_workflow.time_general_hours
            if (x.linked_workflow is not None and x.represents_workflow)
            else x.time_general_hours,
        )
        col += 1

        data[str(col)] = ["", _("Total Hours")] + self.get_matrix_sum_line(
            rows,
            lambda x: x.linked_workflow.time_general_hours
            + x.linked_workflow.time_specific_hours
            if (x.linked_workflow is not None and x.represents_workflow)
            else x.time_general_hours + x.time_specific_hours,
        )
        col += 1

        data[str(col)] = ["" for x in data["0"]]
        col += 1

        data[str(col)] = ["", _("Theory")] + self.get_matrix_sum_line(
            rows,
            lambda x: x.linked_workflow.ponderation_theory
            if (x.linked_workflow is not None and x.represents_workflow)
            else x.ponderation_theory,
        )
        col += 1

        data[str(col)] = ["", _("Practical")] + self.get_matrix_sum_line(
            rows,
            lambda x: x.linked_workflow.ponderation_practical
            if (x.linked_workflow is not None and x.represents_workflow)
            else x.ponderation_practical,
        )
        col += 1

        data[str(col)] = ["", _("Practical")] + self.get_matrix_sum_line(
            rows,
            lambda x: x.linked_workflow.ponderation_individual
            if (x.linked_workflow is not None and x.represents_workflow)
            else x.ponderation_individual,
        )
        col += 1

        data[str(col)] = ["", _("Total")] + self.get_matrix_sum_line(
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

        data[str(col)] = ["", _("Credits")] + self.get_matrix_sum_line(
            rows,
            lambda x: x.linked_workflow.time_required
            if (x.linked_workflow is not None and x.represents_workflow)
            else x.time_required,
        )
        col += 1

        df = pd.DataFrame(data, columns=[str(x) for x in range(col)])
        return df

    @staticmethod
    def get_workflow_nodes_table(workflow, allowed_sets):
        entries = []

        for week in Week.objects.filter(
            workflow=workflow, deleted=False
        ).order_by("weekworkflow__rank"):
            entries += [WeekExportSerializer(week).data]
            entries += NodeExportSerializer(
                Node.objects.filter(week=week, deleted=False)
                .filter(Utility.allowed_sets_Q(allowed_sets))
                .order_by("nodeweek__rank"),
                many=True,
            ).data
        df = pd.DataFrame(
            entries,
            columns=["type", "title", "description", "column_order", "id"],
        )

        pd.set_option("display.max_colwidth", None)
        return df

    @staticmethod
    def get_sobec_outcome(workflow, outcome, allowed_sets):
        nodes = (
            Node.objects.filter(week__workflow=workflow)
            .filter(deleted=False)
            .filter(Utility.allowed_sets_Q(allowed_sets))
            .filter(
                Q(outcomes=outcome)
                | Q(
                    outcomes__parent_outcomes=outcome,
                    outcomes__parent_outcomes__deleted=False,
                )
                | Q(
                    outcomes__parent_outcomes__parent_outcomes=outcome,
                    outcomes__parent_outcomes__parent_outcomes__deleted=False,
                )
            )
            .distinct()
        )
        header = {
            "comp_code": outcome.code,
            "code": f"Pass X of the following courses ({nodes.count()})",
        }
        nodes_serialized = NodeExportSerializerWithTime(nodes, many=True).data
        return [header] + nodes_serialized

    def get_sobec(self, workflow, allowed_sets):
        outcomes = DAO.get_base_outcomes_ordered_filtered(
            workflow, Utility.allowed_sets_Q(allowed_sets)
        )
        data = []
        for outcome in outcomes:
            data += self.get_sobec_outcome(workflow, outcome, allowed_sets)

        df = pd.DataFrame(
            data,
            columns=[
                "comp_code",
                "code",
                "title",
                "ponderation_theory",
                "ponderation_practical",
                "ponderation_individual",
                "time_required",
            ],
        )

        df.rename(
            columns={
                "comp_code": _("Competency Code"),
                "code": _("Course Code"),
                "title": _("Title"),
                "ponderation_theory": _("Theory"),
                "ponderation_practical": _("Practical"),
                "ponderation_individual": _("Individual"),
                "time_required": _("Credits"),
            },
            inplace=True,
        )
        pd.set_option("display.max_colwidth", None)
        return df

    @staticmethod
    def get_saltise_analytics():
        df = analytics.get_base_dataframe()

        with BytesIO() as b:
            with pd.ExcelWriter(b, engine="xlsxwriter") as writer:
                analytics.get_workflow_table(df).to_excel(
                    writer,
                    sheet_name="Workflow Overview",
                )
                analytics.get_user_table(df).to_excel(
                    writer,
                    sheet_name="User Overview",
                )
                analytics.get_user_details_table(df).to_excel(
                    writer,
                    sheet_name="User Details",
                )

            return b.getvalue()
