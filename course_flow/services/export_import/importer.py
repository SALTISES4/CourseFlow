import logging
import re

from course_flow.apps import logger
from course_flow.models.node import Node
from course_flow.models.outcome import Outcome
from course_flow.models.relations.nodeWeek import NodeWeek
from course_flow.models.relations.outcomeOutcome import OutcomeOutcome
from course_flow.models.relations.outcomeWorkflow import OutcomeWorkflow
from course_flow.models.relations.weekWorkflow import WeekWorkflow
from course_flow.models.week import Week
from course_flow.serializers import (
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
)
from course_flow.services import Utility
from course_flow.sockets import redux_actions as actions


class Importer:
    def add_to_outcome_parent_with_depth(
        self, to_add, base_outcome, required_depth
    ):
        if base_outcome.depth == required_depth:
            return OutcomeOutcome.objects.create(
                child=to_add,
                parent=base_outcome,
                rank=base_outcome.children.all().count(),
            )
        else:
            return self.add_to_outcome_parent_with_depth(
                to_add, base_outcome.parent_outcomes.first(), required_depth
            )

    def import_outcomes(self, df, workflow, user):
        last_outcome = None
        for index, row in df.iterrows():
            code = str(row["code"])
            if (
                code is not None
                and isinstance(code, str)
                and code.find(".") >= 0
            ):
                code = re.search("([^.]+$)", code).group(0)
            title = row["title"]
            description = row["description"]

            try:
                depth = int(row["depth"])
            except ValueError as e:
                logger.exception("An error occurred")
                depth = 0
            if last_outcome is None:
                depth = 0
            elif depth > 2:
                depth = last_outcome.depth
            elif last_outcome.depth + 1 < depth:
                depth = last_outcome.depth + 1

            outcome = Outcome.objects.create(author=user, depth=depth)
            serializer = OutcomeSerializerShallow(
                outcome,
                data={
                    "title": title,
                    "description": description,
                    "code": code,
                },
                partial=True,
            )
            Utility.save_serializer(serializer)
            if depth == 0:
                outcomeworkflow = OutcomeWorkflow.objects.create(
                    workflow=workflow,
                    outcome=outcome,
                    rank=workflow.outcomes.all().count(),
                )
                response_data = {
                    "new_model": OutcomeSerializerShallow(outcome).data,
                    "new_through": OutcomeWorkflowSerializerShallow(
                        outcomeworkflow
                    ).data,
                    "parentID": workflow.id,
                }
                actions.dispatch_wf(
                    workflow, actions.newOutcomeAction(response_data)
                )
                actions.dispatch_to_parent_wf(
                    workflow, actions.newOutcomeAction(response_data)
                )
            else:
                outcomeoutcome = self.add_to_outcome_parent_with_depth(
                    outcome, last_outcome, depth - 1
                )

                new_model_serialized = OutcomeSerializerShallow(outcome).data
                new_through_serialized = OutcomeOutcomeSerializerShallow(
                    outcomeoutcome
                ).data
                response_data = {
                    "new_model": new_model_serialized,
                    "new_through": new_through_serialized,
                    "parentID": outcomeoutcome.parent.id,
                }
                actions.dispatch_wf(
                    workflow,
                    actions.insertChildAction(response_data, "outcome"),
                )
                actions.dispatch_to_parent_wf(
                    workflow,
                    actions.insertChildAction(response_data, "outcome"),
                )
            try:
                if isinstance(code, str) and code.isnumeric():
                    if outcome.depth == 0:
                        rank = OutcomeWorkflow.objects.get(
                            outcome=outcome
                        ).rank
                    else:
                        rank = OutcomeOutcome.objects.get(child=outcome).rank
                    if int(code) == rank or int(code) == rank + 1:
                        outcome.code = ""
                        outcome.save()
            except ValueError as e:
                logger.exception("An error occurred")
                pass

            last_outcome = outcome

    @staticmethod
    def import_nodes(df, workflow, user):
        week_rank = -1
        week = None
        for index, row in df.iterrows():
            type = row.get("type", "node")
            if type == "week":
                week_rank += 1
                created = False
                try:
                    week = workflow.weeks.filter(deleted=False).order_by(
                        "weekworkflow__rank"
                    )[week_rank]
                    weekworkflow = WeekWorkflow.objects.get(week=week)
                except IndexError as e:
                    logger.exception("An error occurred")
                    week = Week.objects.create(
                        author=user,
                        week_type=workflow.get_subclass().WORKFLOW_TYPE,
                    )
                    weekworkflow = WeekWorkflow.objects.create(
                        week=week,
                        workflow=workflow,
                        rank=workflow.weeks.all().count(),
                    )
                    created = True
                title = row.get("title", "")
                description = row.get("description", "")
                data = {}

                if title is not None and title != "":
                    data["title"] = title
                if description is not None and description != "":
                    data["description"] = description

                serializer = WeekSerializerShallow(
                    week,
                    data=data,
                    partial=True,
                )
                Utility.save_serializer(serializer)
                if created:
                    response_data = {
                        "new_model": WeekSerializerShallow(week).data,
                        "new_through": WeekWorkflowSerializerShallow(
                            weekworkflow
                        ).data,
                        "parentID": workflow.id,
                    }
                    actions.dispatch_wf(
                        workflow,
                        actions.insertBelowAction(response_data, "week"),
                    )
                else:
                    actions.dispatch_wf(
                        workflow,
                        actions.changeField(week.id, "week", data, False),
                    )

            elif type == "node":
                if week is None:
                    week = (
                        workflow.weeks.filter(deleted=False)
                        .order_by("weekworkflow__rank")
                        .first()
                    )
                try:
                    column_rank = int(row.get("column_order", 0))
                    column = workflow.columns.filter(deleted=False).order_by(
                        "columnworkflow__rank"
                    )[column_rank]
                except (IndexError, ValueError):
                    column = (
                        workflow.columns.filter(deleted=False)
                        .order_by("columnworkflow__rank")
                        .first()
                    )

                node = Node.objects.create(
                    author=user,
                    column=column,
                    has_autolink=False,
                    node_type=workflow.get_subclass().WORKFLOW_TYPE,
                )

                title = row.get("title", "")
                description = row.get("description", "")
                data = {}

                if title is not None and title != "":
                    data["title"] = title

                if description is not None and description != "":
                    data["description"] = description

                serializer = NodeSerializerShallow(
                    node, data=data, partial=True
                )

                Utility.save_serializer(serializer)

                nodeweek = NodeWeek.objects.create(
                    node=node, week=week, rank=week.nodes.all().count()
                )

                response_data = {
                    "new_model": NodeSerializerShallow(node).data,
                    "new_through": NodeWeekSerializerShallow(nodeweek).data,
                    "parentID": week.id,
                }

                actions.dispatch_wf(
                    workflow, actions.insertBelowAction(response_data, "node")
                )
