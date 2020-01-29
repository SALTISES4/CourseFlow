import os
import sys

from django.core.wsgi import get_wsgi_application

os.environ[
    "DJANGO_SETTINGS_MODULE"
] = "course_flow_creation_distribution.settings"

application = get_wsgi_application()

if __name__ == "__main__":
    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
