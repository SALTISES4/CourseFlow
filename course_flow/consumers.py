import json

from channels.generic.websocket import WebsocketConsumer, AsyncWebsocketConsumer


class WorkflowUpdateConsumer(WebsocketConsumer):
    def connect(self):
        print("connected")
        self.accept()

    def disconnect(self, close_code):
        print("disconnecting")
        print(close_code)
        pass

    def receive(self, text_data):
        print("got message")
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        self.send(text_data=json.dumps({"message": message}))
