import os

import django
from channels.auth import AuthMiddlewareStack
from channels.http import AsgiHandler
from channels.routing import ProtocolTypeRouter, URLRouter

import course_flow.routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "course_flow.settings")
django.setup()

application = ProtocolTypeRouter(
    {
        "http": AsgiHandler(),
        "websocket": AuthMiddlewareStack(
            URLRouter(course_flow.routing.websocket_urlpatterns)
        ),
    }
)