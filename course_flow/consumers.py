import json

from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

from .models import Workflow, ObjectPermission
from .decorators import check_object_permission



class WorkflowUpdateConsumer(WebsocketConsumer):
    def connect(self):
        self.workflow_pk = self.scope['url_route']['kwargs']['workflowPk']
        self.room_group_name = 'workflow_'+self.workflow_pk
        self.user = self.scope["user"]
        
        try:
            workflow = Workflow.objects.get(pk=self.workflow_pk)
            self.VIEW = check_object_permission(workflow,self.user,ObjectPermission.PERMISSION_VIEW)
            self.EDIT = check_object_permission(workflow,self.user,ObjectPermission.PERMISSION_EDIT)
        except:
            return False
        
        if self.VIEW or self.EDIT:
            async_to_sync(self.channel_layer.group_add)(
                self.room_group_name,
                self.channel_name
            )
            self.accept()

    def disconnect(self, close_code):
        print("disconnecting")
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
        try:
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'lock_update',
                    'action':self.last_lock
                }
            )
        except AttributeError:
            pass
        
    def receive(self, text_data):
        if not self.EDIT:return
        text_data_json = json.loads(text_data)
        print(text_data)

        if text_data_json["type"]=="micro_update":
            action = text_data_json['action']
            print(action)
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'workflow_action',
                    'action':action
                }
            )
        elif text_data_json["type"]=="lock_update":
            lock = text_data_json['lock']
            print(lock)
            if lock["lock"]:
                self.last_lock={**lock,"lock":False}
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'lock_update',
                    'action':lock
                }
            )
        elif text_data_json["type"]=="connection_update":
            user_data = text_data_json['user_data']
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'connection_update',
                    'action':user_data
                }
            )
            
            
    def workflow_action(self, event):
        message = event['action']
        print("got a message from group")
        print(message)
        # Send message to WebSocket
        if(event["type"]=="workflow_action"):
            self.send(text_data=json.dumps(
                event
            ))     
            
    def lock_update(self, event):
        message = event['action']
        print("got a message from group")
        print(message)
        # Send message to WebSocket
        if(event["type"]=="lock_update"):
            self.send(text_data=json.dumps(
                event
            ))
            
    def  connection_update(self,event):
        message = event['action']
        print("got a message from group")
        print(message)
        # Send message to WebSocket
        if(event["type"]=="connection_update"):
            self.send(text_data=json.dumps(
                event
            ))
            
