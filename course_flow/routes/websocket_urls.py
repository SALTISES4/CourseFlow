from django.urls import re_path

from course_flow.sockets import consumers

websocket_url_patterns = [
    re_path(
        r"ws/update/(?P<workflowPk>[0-9]+)/$",
        consumers.WorkflowUpdateConsumer.as_asgi(),
    ),
]
