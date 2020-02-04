from django.core.management.base import BaseCommand, CommandError
from course_flow.serializers import ActivitySerializer
import json
from django.contrib.auth import get_user_model
from django.conf import settings
import os

User = get_user_model()


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("username", type=str, nargs='?', default=None)

    def handle(self, *args, **kwargs):
        if not User.objects.filter(username=kwargs["username"]).exists() and kwargs["username"] is not None:
            return self.stdout.write(
                "No user has the username '%s'" % kwargs["username"]
            )
        json_data = open(os.path.join(settings.STATIC_ROOT, 'course_flow/initial_data/template_strategies.json'))
        fixtures = json.load(json_data)
        fixtures["author"] = kwargs["username"]
        serializer = ActivitySerializer(data=fixtures)
        if serializer.is_valid():
            serializer.save()
            self.stdout.write("Default strategies have been built")
        else:
            self.stdout.write("Default strategies are not valid")
