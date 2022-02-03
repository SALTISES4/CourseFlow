import json

from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync

from .decorators import check_object_permission
from .models import ObjectPermission, Workflow


class WorkflowUpdateConsumer(WebsocketConsumer):
    
    def get_permission(self):
            workflow = Workflow.objects.get(pk=self.workflow_pk)
            self.VIEW = check_object_permission(
                workflow, self.user, ObjectPermission.PERMISSION_VIEW
            )
            self.EDIT = check_object_permission(
                workflow, self.user, ObjectPermission.PERMISSION_EDIT
            )
    
    def connect(self):
        self.workflow_pk = self.scope["url_route"]["kwargs"]["workflowPk"]
        self.room_group_name = "workflow_" + self.workflow_pk
        self.user = self.scope["user"]
        
        try:
            self.get_permission()
        except:
            return self.close()
        if self.VIEW or self.EDIT:
            async_to_sync(self.channel_layer.group_add)(
                self.room_group_name, self.channel_name
            )
            return self.accept()
        return self.close()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )
        try:
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {"type": "lock_update", "action": self.last_lock},
            )
        except AttributeError:
            pass

    def receive(self, text_data):
        if not self.EDIT:
            return
        text_data_json = json.loads(text_data)

        if text_data_json["type"] == "micro_update":
            action = text_data_json["action"]
            print("creating a micro update")
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {"type": "workflow_action", "action": action},
            )
        elif text_data_json["type"] == "lock_update":
            lock = text_data_json["lock"]
            if lock["lock"]:
                self.last_lock = {**lock, "lock": False}
            print("lock update")
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
#
#class WorkflowUpdateConsumer(AsyncWebsocketConsumer):
#    
#    
#    @database_sync_to_async
#    def get_permission(self):
#            workflow = Workflow.objects.get(pk=self.workflow_pk)
#            self.VIEW = check_object_permission(
#                workflow, self.user, ObjectPermission.PERMISSION_VIEW
#            )
#            self.EDIT = check_object_permission(
#                workflow, self.user, ObjectPermission.PERMISSION_EDIT
#            )
#    
#    async def connect(self):
#        self.workflow_pk = self.scope["url_route"]["kwargs"]["workflowPk"]
#        self.room_group_name = "workflow_" + self.workflow_pk
#        self.user = self.scope["user"]
#        
#        try:
#            await self.get_permission()
#        except:
#            return await self.close()
#
#        if self.VIEW or self.EDIT:
#            await self.channel_layer.group_add(
#                self.room_group_name, self.channel_name
#            )
#            return await self.accept()
#        return await self.close()
#
#    async def disconnect(self, close_code):
#        await self.channel_layer.group_discard(
#            self.room_group_name, self.channel_name
#        )
#        try:
#            await self.channel_layer.group_send(
#                self.room_group_name,
#                {"type": "lock_update", "action": self.last_lock},
#            )
#        except AttributeError:
#            pass
#
#    async def receive(self, text_data):
#        if not self.EDIT:
#            return
#        text_data_json = json.loads(text_data)
#
#        if text_data_json["type"] == "micro_update":
#            action = text_data_json["action"]
#            print("creating a micro update")
#            await self.channel_layer.group_send(
#                self.room_group_name,
#                {"type": "workflow_action", "action": action},
#            )
#        elif text_data_json["type"] == "lock_update":
#            lock = text_data_json["lock"]
#            if lock["lock"]:
#                self.last_lock = {**lock, "lock": False}
#            print("lock update")
#            await self.channel_layer.group_send(
#                self.room_group_name, {"type": "lock_update", "action": lock}
#            )
#        elif text_data_json["type"] == "connection_update":
#            user_data = text_data_json["user_data"]
#            await self.channel_layer.group_send(
#                self.room_group_name,
#                {"type": "connection_update", "action": user_data},
#            )
#
#    async def workflow_action(self, event):
#        if not self.VIEW:
#            return
#        # Send message to WebSocket
#        if event["type"] == "workflow_action":
#            await self.send(text_data=json.dumps(event))
#
#    async def lock_update(self, event):
#        if not self.VIEW:
#            return
#        # Send message to WebSocket
#        if event["type"] == "lock_update":
#            await self.send(text_data=json.dumps(event))
#
#    async def connection_update(self, event):
#        if not self.VIEW:
#            return
#        # Send message to WebSocket
#        if event["type"] == "connection_update":
#            await self.send(text_data=json.dumps(event))
