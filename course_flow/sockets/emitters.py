from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import F

from course_flow.models.workflow_objects.node import Node


class WorkflowUpdateEmitter:
    @staticmethod
    def emit_workflow_update(workflow, action):
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
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                "type": "workflow_action",
                "action": action,
                "edit_count": str(workflow.edit_count),
            },
        )

    @staticmethod
    def dispatch_to_parent_wf(workflow, action):
        channel_layer = get_channel_layer()
        for parent_node in Node.objects.filter(linked_workflow=workflow):
            parent_workflow = parent_node.get_workflow()
            parent_workflow.edit_count = F("edit_count") + 1
            parent_workflow.save()
            parent_workflow.refresh_from_db()
            async_to_sync(channel_layer.group_send)(
                "workflow_" + str(parent_workflow.pk),
                {
                    "type": "workflow_action",
                    "action": action,
                    "edit_count": parent_workflow.edit_count,
                },
            )

    @staticmethod
    def emit_parent_updated(workflow):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "workflow_" + str(workflow.pk),
            {
                "type": "workflow_parent_updated",
                "edit_count": workflow.edit_count,
            },
        )

    @staticmethod
    def emit_child_updated(workflow, child_workflow):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "workflow_" + str(workflow.pk),
            {
                "type": "workflow_child_updated",
                "edit_count": workflow.edit_count,
                "child_workflow_id": child_workflow.pk,
            },
        )

    @staticmethod
    def dispatch_wf_lock(workflow, action):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "workflow_" + str(workflow.pk),
            {"type": "lock_update", "action": action},
        )

    ##########################################################
    # EVENT PAYLOAD BUILDERS
    #########################################################
    @staticmethod
    def unlock(object_id, object_type):
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
    def change_through_id(through_type, old_id, new_id, extra_data):
        return {
            "type": through_type + "/changeID",
            "payload": {"old_id": old_id, "new_id": new_id, **extra_data},
        }

    @staticmethod
    def delete_self_action(id, objectType, parentId, extra_data):
        return {
            "type": objectType + "/deleteSelf",
            "payload": {"id": id, "parent_id": parentId, "extra_data": extra_data},
        }

    @staticmethod
    def delete_self_soft_action(id, objectType, parentId, extra_data):
        return {
            "type": objectType + "/deleteSelfSoft",
            "payload": {
                "id": id,
                "parent_id": parentId,
                "extra_data": extra_data,
            },
        }

    @staticmethod
    def restore_self_action(
        id, objectType, parentId, throughparentId, throughparent_index, extra_data
    ):
        return {
            "type": objectType + "/restoreSelf",
            "payload": {
                "id": id,
                "parent_id": parentId,
                "throughparent_id": throughparentId,
                "throughparent_index": throughparent_index,
                "extra_data": extra_data,
            },
        }

    @staticmethod
    def insert_below_action(response_data, objectType):
        return {"type": objectType + "/insertBelow", "payload": response_data}

    @staticmethod
    def insert_child_action(response_data, objectType):
        return {"type": objectType + "/insertChild", "payload": response_data}

    @staticmethod
    def set_linked_workflow_action(response_data):
        return {"type": "node/setLinkedWorkflow", "payload": response_data}

    @staticmethod
    def new_node_action(response_data):
        return {"type": "node/newNode", "payload": response_data}

    @staticmethod
    def new_outcome_action(response_data):
        return {"type": "outcome/newOutcome", "payload": response_data}

    @staticmethod
    def new_node_link_action(response_data):
        return {"type": "nodelink/newNodeLink", "payload": response_data}

    @staticmethod
    def change_field(id, objectType, json, changeFieldID=0):
        return {
            "type": objectType + "/changeField",
            "payload": {
                "id": id,
                "objectType": objectType,
                "json": json,
                "changeFieldID": changeFieldID,
            },
        }

    @staticmethod
    def change_field_many(ids, objectType, json, changeFieldID=0):
        return {
            "type": objectType + "/changeFieldMany",
            "payload": {
                "ids": ids,
                "objectType": objectType,
                "json": json,
                "changeFieldID": changeFieldID,
            },
        }

    @staticmethod
    def update_outcomenode_degree_action(response_data):
        return {"type": "outcomenode/updateDegree", "payload": response_data}

    @staticmethod
    def update_outcomehorizontallink_degree_action(response_data):
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
    # def gridMenuItemAdded(response_data):
    #     return {"type": "gridmenu/itemAdded", "payload": response_data}

    # never called
    # def replaceStoreData(data_package):
    #     return {"type": "replaceStoreData", "payload": data_package}

    # never called
    # def refreshStoreData(data_package):
    #     print("am i being called refreshStoreData")
    #     return {"type": "refreshStoreData", "payload": data_package}
