from course_flow.apps import logger
from course_flow.sockets import redux_actions as actions


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
            action = actions.deleteSelfSoftAction(object_id, object_type, parent_id, extra_data)
            actions.dispatch_wf(workflow, action)

            if object_type in ["outcome", "outcome_base"]:
                actions.dispatch_to_parent_wf(workflow, action)
                for wf in linked_workflows:
                    actions.dispatch_wf(wf, action)
                    actions.dispatch_wf(
                        wf, actions.updateHorizontalLinks({"data": outcomes_to_update})
                    )
            else:
                for wf in linked_workflows:
                    actions.dispatch_parent_updated(wf)

            if object_type in ["workflow", "activity", "course", "program"] and parent_workflows:
                for parent_wf in parent_workflows:
                    actions.dispatch_child_updated(parent_wf, workflow)
        except AttributeError:
            logger.exception("An error occurred while dispatching workflow actions.")
