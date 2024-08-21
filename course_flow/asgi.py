"""
@todo what is the file doing
https://asgi.readthedocs.io/en/latest/
"""
import os

import django
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

import course_flow.routes.websocket_urls

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "course_flow.settings")
django.setup()

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AuthMiddlewareStack(
            URLRouter(course_flow.routes.websocket_urls.websocket_url_patterns)
        ),
    }
)
