from django.core.management.base import BaseCommand, CommandError
from course_flow.serializers import ActivitySerializer


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        fixtures = ["template_strategies.json"]
        serializer = ActivitySerializer(data=fixtures)
        if serializer.is_valid():
            serializer.save()
            self.stdout.write("Default strategies have been built")
        else:
            self.stdout.write("The fixtures are not valid")
