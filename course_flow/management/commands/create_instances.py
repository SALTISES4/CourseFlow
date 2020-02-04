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
            print(serializer.errors)
            self.stdout.write("Default strategies have not been built")
