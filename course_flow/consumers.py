import json

from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync


class WorkflowUpdateConsumer(WebsocketConsumer):
    def connect(self):
        self.workflow_pk = self.scope['url_route']['kwargs']['workflowPk']
        self.room_group_name = 'workflow_'+self.workflow_pk
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        print("connected")
        print(self.room_group_name)
        self.accept()

    def disconnect(self, close_code):
        print("disconnecting")
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type':'workflow_message',
                'message':message
            }
        )
    
    def workflow_message(self, event):
        message = event['message']
        print("got a message from group")
        print(message)
        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'message': message
        }))
