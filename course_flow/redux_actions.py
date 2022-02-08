from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import F

from .models import Node


def dispatch_wf(workflow, action):
    workflow.edit_count = F("edit_count") + 1
    workflow.save()
    workflow.refresh_from_db()
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "workflow_" + str(workflow.pk),
        {
            "type": "workflow_action",
            "action": action,
            "edit_count": str(workflow.edit_count),
        },
    )


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


def dispatch_wf_lock(workflow, action):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "workflow_" + str(workflow.pk),
        {"type": "lock_update", "action": action},
    )

#def dispatch_wf(workflow, action):
#    workflow.edit_count = F("edit_count") + 1
#    workflow.save()
#    workflow.refresh_from_db()
#    channel_layer = get_channel_layer()
#    channel_layer.group_send(
#        "workflow_" + str(workflow.pk),
#        {
#            "type": "workflow_action",
#            "action": action,
#            "edit_count": str(workflow.edit_count),
#        },
#    )
#
#
#def dispatch_to_parent_wf(workflow, action):
#    channel_layer = get_channel_layer()
#    for parent_node in Node.objects.filter(linked_workflow=workflow):
#        parent_workflow = parent_node.get_workflow()
#        parent_workflow.edit_count = F("edit_count") + 1
#        parent_workflow.save()
#        parent_workflow.refresh_from_db()
#        channel_layer.group_send(
#            "workflow_" + str(parent_workflow.pk),
#            {
#                "type": "workflow_action",
#                "action": action,
#                "edit_count": parent_workflow.edit_count,
#            },
#        )
#
#
#def dispatch_wf_lock(workflow, action):
#    channel_layer = get_channel_layer()
#    channel_layer.group_send(
#        "workflow_" + str(workflow.pk),
#        {"type": "lock_update", "action": action},
#    )


# Actions for reduers
def unlock(object_id, object_type):
    return {
        "lock": False,
        "object_id": object_id,
        "object_type": object_type,
    }


def changeThroughID(through_type, old_id, new_id):
    return {
        "type": through_type + "/changeID",
        "payload": {"old_id": old_id, "new_id": new_id},
    }


def deleteSelfAction(id, objectType, parentID, extra_data):
    return {
        "type": objectType + "/deleteSelf",
        "payload": {"id": id, "parent_id": parentID, "extra_data": extra_data},
    }


def deleteSelfSoftAction(id, objectType, parentID, extra_data):
    return {
        "type": objectType + "/deleteSelfSoft",
        "payload": {"id": id, "parent_id": parentID, "extra_data": extra_data},
    }


def restoreSelfAction(id, objectType, parentID, throughparentID, throughparent_index, extra_data):
    return {
        "type": objectType + "/restoreSelf",
        "payload": {
            "id": id,
            "parent_id": parentID,
            "throughparent_id": throughparentID,
            "throughparent_index":throughparent_index,
            "extra_data": extra_data,
        },
    }


def insertBelowAction(response_data, objectType):
    return {"type": objectType + "/insertBelow", "payload": response_data}


def insertChildAction(response_data, objectType):
    return {"type": objectType + "/insertChild", "payload": response_data}


def setLinkedWorkflowAction(response_data):
    return {"type": "node/setLinkedWorkflow", "payload": response_data}


def newNodeAction(response_data):
    return {"type": "node/newNode", "payload": response_data}


def newOutcomeAction(response_data):
    return {"type": "outcome/newOutcome", "payload": response_data}


def newNodeLinkAction(response_data):
    return {"type": "nodelink/newNodeLink", "payload": response_data}


def changeField(id, objectType, json, changeFieldID=0):
    return {
        "type": objectType + "/changeField",
        "payload": {
            "id": id,
            "objectType": objectType,
            "json": json,
            "changeFieldID": changeFieldID,
        },
    }


def updateOutcomenodeDegreeAction(response_data):
    return {"type": "outcomenode/updateDegree", "payload": response_data}


def updateOutcomehorizontallinkDegreeAction(response_data):
    return {
        "type": "outcomehorizontallink/updateDegree",
        "payload": response_data,
    }


def updateChildOutcomehorizontallinkDegreeAction(response_data):
    return {
        "type": "childoutcomehorizontallink/updateDegree",
        "payload": response_data,
    }


def newStrategyAction(response_data):
    return {"type": "strategy/addStrategy", "payload": response_data}


def toggleStrategyAction(response_data):
    return {"type": "strategy/toggleStrategy", "payload": response_data}


def gridMenuItemAdded(response_data):
    return {"type": "gridmenu/itemAdded", "payload": response_data}


def replaceStoreData(data_package):
    return {"type": "replaceStoreData", "payload": data_package}

def refreshStoreData(data_package):
    return {"type": "refreshStoreData", "payload": data_package}


def updateHorizontalLinks(data_package):
    return {"type": "outcome/updateHorizontalLinks", "payload": data_package}
