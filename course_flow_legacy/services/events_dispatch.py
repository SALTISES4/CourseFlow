from course_flow_legacy.apps import logger
from course_flow_legacy.sockets.emitters import WorkflowUpdateEmitter


class EventsDispatch:
    @staticmethod
    def dispatch_delete_action(
        object_id,
        object_type,
        parent_id,
        extra_data,
        workflow,
        linked_workflows,
        outcomes_to_update,
        parent_workflows=None,
    ):
        """Helper to handle dispatching delete actions to workflows."""
        try:
            action = WorkflowUpdateEmitter.delete_self_soft_action(
                object_id, object_type, parent_id, extra_data
            )
            WorkflowUpdateEmitter.emit_workflow_update(workflow, action)

            if object_type in ["outcome", "outcome_base"]:
                WorkflowUpdateEmitter.dispatch_to_parent_wf(workflow, action)
                for wf in linked_workflows:
                    WorkflowUpdateEmitter.emit_workflow_update(wf, action)
                    WorkflowUpdateEmitter.emit_workflow_update(
                        wf,
                        WorkflowUpdateEmitter.update_horizontal_links({"data": outcomes_to_update}),
                    )
            else:
                for wf in linked_workflows:
                    WorkflowUpdateEmitter.emit_parent_updated(wf)

            if object_type in ["workflow", "activity", "course", "program"] and parent_workflows:
                for parent_wf in parent_workflows:
                    WorkflowUpdateEmitter.emit_child_updated(parent_wf, workflow)
        except AttributeError:
            logger.exception("An error occurred while dispatching workflow WorkflowUpdateEmitter.")
