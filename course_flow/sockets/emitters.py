from pprint import pprint

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import F
from djangorestframework_camel_case.util import camelize

from course_flow.models import Workflow
from course_flow.models.workflow_objects.node import Node
from course_flow.sockets.consumers import WsEventType


class WorkflowUpdateEmitter:
    @staticmethod
    def emit_workflow_update(workflow: Workflow, action):
        """
        Updates the workflow's edit count, saves the changes, and emits a message
        over the channel layer to notify subscribers of the action taken on the workflow.

        Args:
        - workflow: The workflow instance to update.
        - action: The action performed on the workflow that subscribers need to be notified about.
        """
        workflow.edit_count = F("edit_count") + 1
        workflow.save()
        workflow.refresh_from_db()
        channel_layer = get_channel_layer()
        room_group_name = "workflow_" + str(workflow.pk)

        message = {
            "type": "workflow_action",
            "action": action,
            "edit_count": str(workflow.edit_count),
        }
        camel_case_message = camelize(message)

        async_to_sync(channel_layer.group_send)(room_group_name, camel_case_message)

    @staticmethod
    def dispatch_to_parent_wf(workflow: Workflow, action) -> None:
        channel_layer = get_channel_layer()

        for parent_node in Node.objects.filter(linked_workflow=workflow):
            parent_workflow = parent_node.get_workflow()
            parent_workflow.edit_count = F("edit_count") + 1
            parent_workflow.save()
            parent_workflow.refresh_from_db()

            message = {
                "type": WsEventType.WORKFLOW_ACTION.value,
                "action": action,
                "edit_count": parent_workflow.edit_count,
            }

            camel_case_message = camelize(message)

            async_to_sync(channel_layer.group_send)(
                "workflow_" + str(parent_workflow.pk),
                camel_case_message,
            )

    @staticmethod
    def emit_parent_updated(workflow: Workflow) -> None:
        channel_layer = get_channel_layer()

        message = {
            "type": WsEventType.WORKFLOW_PARENT_UPDATED.value,
            "edit_count": workflow.edit_count,
        }
        camel_case_message = camelize(message)

        async_to_sync(channel_layer.group_send)(
            "workflow_" + str(workflow.pk),
            camel_case_message,
        )

    @staticmethod
    def emit_child_updated(workflow: Workflow, child_workflow: Workflow) -> None:
        channel_layer = get_channel_layer()

        message = {
            "type": "workflow_child_updated",
            "edit_count": workflow.edit_count,
            "child_workflow_id": child_workflow.pk,
        }
        camel_case_message = camelize(message)

        async_to_sync(channel_layer.group_send)(
            "workflow_" + str(workflow.pk),
            camel_case_message,
        )

    @staticmethod
    def dispatch_wf_lock(workflow: Workflow, action) -> None:
        channel_layer = get_channel_layer()

        message = {
            "type": "lock_update",
            "action": action,
        }
        camel_case_message = camelize(message)

        async_to_sync(channel_layer.group_send)(
            "workflow_" + str(workflow.pk),
            camel_case_message,
        )

    ##########################################################
    # EVENT PAYLOAD CREATORS
    # developer has reused the same idea as action creators
    #########################################################
    @staticmethod
    def unlock(object_id: int, object_type) -> dict:
        return {
            "lock": False,
            "object_id": object_id,
            "object_type": object_type,
        }

    # everything below needs to be reviewed
    # an event system with payload is fine
    # but the events should bot be dynamically routed like this
    # it's also a problem that there is this tight coupling to the redux
    # event naming
    @staticmethod
    def change_through_id(through_type, old_id: int, new_id: int, extra_data) -> dict:
        return {
            "type": through_type + "/changeID",
            "payload": {"old_id": old_id, "new_id": new_id, **extra_data},
        }

    @staticmethod
    def delete_self_action(object_id: int, objectType, parent_id: int, extra_data) -> dict:
        return {
            "type": objectType + "/deleteSelf",
            "payload": {"id": object_id, "parent_id": parent_id, "extra_data": extra_data},
        }

    @staticmethod
    def delete_self_soft_action(object_id: int, objectType, parent_id: int, extra_data) -> dict:
        return {
            "type": objectType + "/deleteSelfSoft",
            "payload": {
                "id": object_id,
                "parent_id": parent_id,
                "extra_data": extra_data,
            },
        }

    @staticmethod
    def restore_self_action(
        object_id: int, objectType, parent_id: int, throughparentId, throughparent_index, extra_data
    ) -> dict:
        return {
            "type": objectType + "/restoreSelf",
            "payload": {
                "id": object_id,
                "parent_id": parent_id,
                "throughparent_id": throughparentId,
                "throughparent_index": throughparent_index,
                "extra_data": extra_data,
            },
        }

    @staticmethod
    def insert_below_action(response_data, object_type) -> dict:
        return {"type": object_type + "/insertBelow", "payload": response_data}

    @staticmethod
    def insert_child_action(response_data, object_type) -> dict:
        return {"type": object_type + "/insertChild", "payload": response_data}

    @staticmethod
    def set_linked_workflow_action(response_data) -> dict:
        return {"type": "node/setLinkedWorkflow", "payload": response_data}

    @staticmethod
    def new_node_action(response_data) -> dict:
        return {"type": "node/newNode", "payload": response_data}

    @staticmethod
    def new_outcome_action(response_data) -> dict:
        return {"type": "outcome/newOutcome", "payload": response_data}

    @staticmethod
    def new_node_link_action(response_data) -> dict:
        return {"type": "nodelink/newNodeLink", "payload": response_data}

    @staticmethod
    def prepare_change_field_payload(
        object_id: int, object_type: str, json, publishing_user_id: int = None
    ) -> dict:
        return {
            "type": object_type + "/changeField",
            "payload": {
                "id": object_id,
                "object_type": object_type,
                "json": json,
                "publishing_user_id": publishing_user_id,
            },
        }

    @staticmethod
    def change_field_many(object_ids: [int], object_type, json, publishing_user_id) -> dict:
        """
        no...
        """
        return {
            "type": object_type + "/changeFieldMany",
            "payload": {
                "ids": object_ids,
                "object_type": object_type,
                "json": json,
                "publishing_user_id": publishing_user_id,
            },
        }

    @staticmethod
    def update_outcomenode_degree_action(response_data) -> dict:
        return {"type": "outcomenode/updateDegree", "payload": response_data}

    @staticmethod
    def update_outcomehorizontallink_degree_action(response_data) -> dict:
        return {
            "type": "outcomehorizontallink/updateDegree",
            "payload": response_data,
        }

    # never called
    # def updateChildOutcomehorizontallinkDegreeAction(response_data):
    # return {
    #     "type": "childoutcomehorizontallink/updateDegree",
    #     "payload": response_data,
    # }

    @staticmethod
    def new_strategy_action(response_data):
        return {"type": "strategy/addStrategy", "payload": response_data}

    @staticmethod
    def toggle_strategy_action(response_data):
        return {"type": "strategy/toggleStrategy", "payload": response_data}

    @staticmethod
    def update_horizontal_links(data_package):
        return {"type": "outcome/updateHorizontalLinks", "payload": data_package}

    # never called
    # def replaceStoreData(data_package):
    #     return {"type": "replaceStoreData", "payload": data_package}

    # never called
    # def refreshStoreData(data_package):
    #     print("am i being called refreshStoreData")
    #     return {"type": "refreshStoreData", "payload": data_package}
