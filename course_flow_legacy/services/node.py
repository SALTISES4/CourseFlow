from django.core.exceptions import ValidationError

from course_flow_legacy.apps import logger
from course_flow_legacy.duplication_functions import fast_duplicate_workflow
from course_flow_legacy.models import OutcomeNode, User, WorkflowProject
from course_flow_legacy.models.workflow_objects.node import Node
from course_flow_legacy.models.workflow_objects.outcome import Outcome
from course_flow_legacy.models.workspace.workflow import Workflow


def duplicate_node(node: Node, author: User, new_workflow: Workflow, outcome_ids) -> Node:
    if new_workflow is not None:
        for new_column in new_workflow.columns.all():
            if new_column == node.column or new_column.parent_column == node.column:
                column = new_column
                break
    else:
        column = node.column
    new_node = Node.objects.create(
        title=node.title,
        description=node.description,
        author=author,
        node_type=node.node_type,
        column=column,
        task_classification=node.task_classification,
        context_classification=node.context_classification,
        has_autolink=node.has_autolink,
        represents_workflow=node.represents_workflow,
        time_required=node.time_required,
        time_units=node.time_units,
        is_original=False,
        parent_node=node,
        linked_workflow=node.linked_workflow,
        deleted=node.deleted,
    )

    for object_set in node.sets.all():
        if new_workflow is None:
            new_node.sets.add(object_set)

    for outcome in node.outcomes.all():
        if new_workflow is not None:
            new_outcome = Outcome.objects.get(parent_outcome=outcome, id__in=outcome_ids)
        else:
            new_outcome = outcome
        OutcomeNode.objects.create(
            outcome=new_outcome,
            node=new_node,
            rank=OutcomeNode.objects.get(node=node, outcome=outcome).rank,
        )

    return new_node


def set_linked_workflow(node: Node, workflow):
    """
    A helper function to set the linked workflow.
    Do not call if you are duplicating the parent workflow,
    that gets taken care of in another manner.  ????

    :param node:
    :param workflow:
    :return:
    """
    project = node.get_workflow().get_project()

    if WorkflowProject.objects.get(workflow=workflow).project == project:
        node.linked_workflow = workflow
        node.save()
    else:
        """
        1. no link workflow should not createa new project
        2. separate out create workflow
        """
        try:
            new_workflow = fast_duplicate_workflow(workflow, node.author, project)
            WorkflowProject.objects.create(workflow=new_workflow, project=project)
            node.linked_workflow = new_workflow
            node.save()
        except ValidationError as e:
            logger.exception("An error occurred")
        pass
