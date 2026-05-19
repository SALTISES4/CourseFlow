"""Program → course → activity → task layering rules."""

from __future__ import annotations

from course_flow.core.enum import NodeType, WorkflowType

# Root graphs may be program, course, or activity — never task.
ROOT_WORKFLOW_TYPES: frozenset[WorkflowType] = frozenset(
    {
        WorkflowType.PROGRAM,
        WorkflowType.COURSE,
        WorkflowType.ACTIVITY,
    }
)

# Child grid nodes are exactly one layer below their containing graph workflow.
WORKFLOW_CHILD_NODE_TYPE: dict[WorkflowType, NodeType] = {
    WorkflowType.PROGRAM: NodeType.COURSE,
    WorkflowType.COURSE: NodeType.ACTIVITY,
    WorkflowType.ACTIVITY: NodeType.TASK,
}


class InvalidWorkflowTypeError(ValueError):
    pass


class InvalidNodeTypeError(ValueError):
    pass


def assert_allowed_root_workflow_type(workflow_type: str) -> WorkflowType:
    try:
        wt = WorkflowType(workflow_type)
    except ValueError as exc:
        raise InvalidWorkflowTypeError(f"unknown workflow type: {workflow_type!r}") from exc
    if wt == WorkflowType.TASK:
        raise InvalidWorkflowTypeError(
            "workflow type 'task' is not allowed at the graph root"
        )
    if wt not in ROOT_WORKFLOW_TYPES:
        raise InvalidWorkflowTypeError(f"workflow type {workflow_type!r} is not allowed")
    return wt


def child_node_type_for_workflow(workflow_type: str) -> NodeType:
    wt = assert_allowed_root_workflow_type(workflow_type)
    return WORKFLOW_CHILD_NODE_TYPE[wt]


def child_node_type_value_for_workflow(workflow_type: str) -> str:
    return child_node_type_for_workflow(workflow_type).value
