from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(
        r"ws/update/(?P<workflowPk>[0-9]+)/$",
        consumers.WorkflowUpdateConsumer.as_asgi(),
    ),
]