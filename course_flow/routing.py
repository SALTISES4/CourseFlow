from django.urls import re_path

from course_flow.sockets import consumers

websocket_urlpatterns = [
    re_path(
        r"ws/update/(?P<workflowPk>[0-9]+)/$",
        consumers.WorkflowUpdateConsumer.as_asgi(),
    ),
]
