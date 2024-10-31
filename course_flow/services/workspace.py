from django.db.models import Q

from course_flow.models import Node, Workflow
from course_flow.models.relations import (
    ColumnWorkflow,
    NodeWeek,
    OutcomeOutcome,
    OutcomeWorkflow,
    WeekWorkflow,
)
from course_flow.services import DAO


class WorkspaceService:
    @staticmethod
    def get_parent_id(object_type, model):
        """
        Helper to get parent_id based on object type.
        """
        if object_type == "week":
            return WeekWorkflow.objects.get(week=model).id
        elif object_type == "column":
            return ColumnWorkflow.objects.get(column=model).id
        elif object_type == "node":
            return NodeWeek.objects.get(node=model).id
        elif object_type == "nodelink":
            return Node.objects.get(outgoing_links=model).id
        elif object_type == "outcome" and model.depth == 0:
            return OutcomeWorkflow.objects.get(outcome=model).id
        elif object_type == "outcome":
            return OutcomeOutcome.objects.get(child=model).id
        return None

    @staticmethod
    def determine_linked_workflows(object_type, model):
        """
        Helper to determine linked and parent workflows based on object type.
        """
        linked_workflows = []
        parent_workflows = []
        if object_type == "node":
            linked_workflows = Workflow.objects.filter(linked_nodes=model)
        elif object_type == "week":
            linked_workflows = Workflow.objects.filter(linked_nodes__week=model)
        elif object_type in ["workflow", "activity", "course", "program"]:
            linked_workflows = Workflow.objects.filter(linked_nodes__week__workflow__id=model.id)
            parent_workflows = [
                node.get_workflow() for node in Node.objects.filter(linked_workflow=model)
            ]
        elif object_type == "outcome":
            linked_workflows = Workflow.objects.filter(
                Q(
                    linked_nodes__outcomes__in=[model.id]
                    + list(DAO.get_descendant_outcomes(model).values_list("pk", flat=True))
                )
            )
        # return list(linked_workflows), list(parent_workflows)
        return linked_workflows, parent_workflows
