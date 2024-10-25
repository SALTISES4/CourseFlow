import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

from course_flow.apps import logger
from course_flow.decorators import check_object_permission
from course_flow.models.objectPermission import Permission
from course_flow.models.workspace.workflow import Workflow


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
                {"type": "lock_update", "action": self.last_lock},
            )
        except AttributeError as e:
            logger.exception("An error occurred")
            pass

        async_to_sync(self.channel_layer.group_discard)(self.room_group_name, self.channel_name)

    def receive(self, text_data=None, bytes_data=None):
        if not self.EDIT:
            return
        text_data_json = json.loads(text_data)
        if text_data_json["type"] == "micro_update":
            action = text_data_json["action"]
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {"type": "workflow_action", "action": action},
            )
        elif text_data_json["type"] == "lock_update":
            lock = text_data_json["lock"]
            if lock["lock"]:
                self.last_lock = {**lock, "lock": False}
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name, {"type": "lock_update", "action": lock}
            )
        elif text_data_json["type"] == "connection_update":
            user_data = text_data_json["user_data"]
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {"type": "connection_update", "action": user_data},
            )

    def workflow_action(self, event):
        if not self.VIEW:
            return
        # Send message to WebSocket
        if event["type"] == "workflow_action":
            self.send(text_data=json.dumps(event))

    def lock_update(self, event):
        if not self.VIEW:
            return
        # Send message to WebSocket
        if event["type"] == "lock_update":
            self.send(text_data=json.dumps(event))

    def connection_update(self, event):
        if not self.VIEW:
            return
        # Send message to WebSocket
        if event["type"] == "connection_update":
            self.send(text_data=json.dumps(event))

    def workflow_parent_updated(self, event):
        if not self.VIEW:
            return
        # Send message to WebSocket
        if event["type"] == "workflow_parent_updated":
            self.send(text_data=json.dumps(event))

    def workflow_child_updated(self, event):
        if not self.VIEW:
            return
        # Send message to WebSocket
        if event["type"] == "workflow_child_updated":
            self.send(text_data=json.dumps(event))
