import logging

from django.core.management.base import BaseCommand

from course_flow.apps import logger
from course_flow.models.discipline import Discipline


class Command(BaseCommand):
    def add_arguments(self, parser):
        pass

    def handle(self, *args, **kwargs):
        for title in [
            "Physics",
            "Chemistry",
            "Biology",
            "Environmental Science",
            "Science (General)",
            "Mathematics",
            "Philosophy",
            "Computer Science",
            "Engineering",
            "Anthropology",
            "Economics",
            "Geography",
            "Political Science",
            "Psychology",
            "Sociology",
            "Social Work",
            "Social Sciences (General)",
            "Performing Arts",
            "Visual Arts",
            "History",
            "Literature",
            "Law",
            "Theology",
            "Humanities (General)",
            "Medicine",
            "Nursing",
            "Business",
            "English",
            "French",
            "Languages",
            "Design",
            "Other",
        ]:
            try:
                Discipline.objects.get(title=title)
            except Exception as e:
                logger.exception("An error occurred")
                Discipline.objects.create(title=title)
