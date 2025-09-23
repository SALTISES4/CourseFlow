import json
from enum import Enum
from pprint import pprint

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

from course_flow.apps import logger
from course_flow.decorators import check_object_permission
from course_flow.models.objectPermission import Permission
from course_flow.models.workspace.workflow import Workflow


class WsEventType(Enum):
    WORKFLOW_ACTION = "workflow_action"
    MICRO_UPDATE = "micro_update"
    LOCK_UPDATE = "lock_update"
    CONNECTION_UPDATE = "connection_update"
    WORKFLOW_PARENT_UPDATED = "workflow_parent_updated"
    WORKFLOW_CHILD_UPDATED = "workflow_child_updated"


#########################################################
# TODO: figure out why this not async, maybe DB limitation
#########################################################
class WorkflowUpdateConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.user = None
        self.room_group_name = None
        self.workflow_pk = None
        self.EDIT = None
        self.VIEW = None

    def get_permission(self):
        workflow = Workflow.objects.get(pk=self.workflow_pk)
        self.VIEW = check_object_permission(workflow, self.user, Permission.PERMISSION_VIEW.value)
        self.EDIT = check_object_permission(workflow, self.user, Permission.PERMISSION_EDIT.value)

    def connect(self):
        self.workflow_pk = self.scope["url_route"]["kwargs"]["workflowPk"]
        # set the channel group
        self.room_group_name = "workflow_" + self.workflow_pk
        self.user = self.scope["user"]

        try:
            self.get_permission()
        except Exception as e:
            logger.exception("An error occurred")
            return self.close()

        if self.VIEW or self.EDIT:
            async_to_sync(self.channel_layer.group_add)(self.room_group_name, self.channel_name)
            return self.accept()

        return self.close()

    def disconnect(self, close_code):
        try:
            async_to_sync(self.channel_layer.group_send)(
                {
                    "type": "lock_update",
                    "action": self.last_lock
                }
            )
        except AttributeError as e:
            logger.exception("An error occurred")

        async_to_sync(self.channel_layer.group_discard)(self.room_group_name, self.channel_name)

    def receive(self, text_data=None, bytes_data=None):
        """
        this method handles incoming WS
        1. as of now, it doesn't appear that we handle incoming WS anywhere else
        2. incoming websockets have no effect on store (DB)
          - i.e. we just use them to send out other messages on various channels
          - editing locks
          - connected users
          -  workflow updates...?

        :param text_data:
        :param bytes_data:
        :return:
        """
        pprint("receiving update")
        pprint(text_data)
        pprint(bytes_data)

        # is user does not have permission to EDIT
        # don't update group?
        # @todo verify
        if not self.EDIT:
            return

        text_data_json = json.loads(text_data)

        #########################################################
        # MICRO_UPDATE
        #########################################################

        #########################################################
        # IMPORTANT:
        # incoming type does not necessarily match the type handler
        # ex if text_data_json["type"] == WsEventType.MICRO_UPDATE.value:
        # this is mapped to "type": "workflow_action"
        # however no other event maps to workflow_action
        # unclear still why incoming type is not also workflow_action
        # TBD
        #########################################################
        if text_data_json["type"] == WsEventType.MICRO_UPDATE.value:
            action = text_data_json["action"]

            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": "workflow_action",
                    "action": action,
                }
            )

        #########################################################
        # LOCK_UPDATE
        #########################################################
        elif text_data_json["type"] == WsEventType.LOCK_UPDATE.value:
            lock = text_data_json["lock"]

            if lock["lock"]:
                self.last_lock = {**lock, "lock": False}

            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": WsEventType.LOCK_UPDATE.value,
                    "action": lock,
                }
            )

        #########################################################
        # CONNECTION_UPDATE
        # client sends a 'heart beat' like use connection msg
        # to show if user is online
        # see: startUserUpdates in client
        #########################################################
        elif text_data_json["type"] == WsEventType.CONNECTION_UPDATE.value:
            user_data = text_data_json["payload"]

            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    "type": WsEventType.CONNECTION_UPDATE.value,
                    "action": user_data
                }
            )

    #########################################################
    # TYPE HANDLERS
    #  if
    #########################################################
    def workflow_action(self, event):
        if not self.VIEW:
            return
        # redundant
        # if event["type"] == "workflow_action":
        self.send(text_data=json.dumps(event))

    def lock_update(self, event):
        if not self.VIEW:
            return
        # redundant
        # if event["type"] == "lock_update":
        self.send(text_data=json.dumps(event))

    def connection_update(self, event):
        pprint("connection update")
        if not self.VIEW:
            return
        # redundant
        # if event["type"] == "connection_update":
        self.send(text_data=json.dumps(event))

    def workflow_parent_updated(self, event):
        if not self.VIEW:
            return
        # redundant
        # if event["type"] == "workflow_parent_updated":
        self.send(text_data=json.dumps(event))

    def workflow_child_updated(self, event):
        if not self.VIEW:
            return
        # redundant
        # if event["type"] == "workflow_child_updated":
        self.send(text_data=json.dumps(event))
