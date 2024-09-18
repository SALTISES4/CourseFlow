import json

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from course_flow.serializers import WorkflowSerializerShallow

User = get_user_model()


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("path", type=str)
        parser.add_argument("username", type=str, nargs="?", default=None)

    def handle(self, *args, **kwargs):
        if (
            not User.objects.filter(username=kwargs["username"]).exists()
            and kwargs["username"] is not None
        ):
            return self.stdout.write(
                "No user has the username '%s'" % kwargs["username"]
            )
        json_data = open(kwargs["path"])
        fixtures = json.load(json_data)
        fixtures["author"] = kwargs["username"]

        # serializer = ActivitySerializer(data=fixtures)
        serializer = WorkflowSerializerShallow(data=fixtures)

        if serializer.is_valid():
            serializer.save()
            self.stdout.write("Default strategies have been built")
        else:
            self.stdout.write("Default strategies are not valid")
