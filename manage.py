#!/usr/bin/env python
import os
import sys

from dotenv import load_dotenv


def main():
    load_dotenv()

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "course_flow.settings")

    if len(sys.argv) == 2 and sys.argv[1] == "runserver":
        port = os.getenv("DJANGO_PORT", '8000')

        if port:
            sys.argv.append(port)

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()

# if __name__ == "__main__":
#     os.environ.setdefault("DJANGO_SETTINGS_MODULE", "course_flow.settings")
#     from django.core.management import execute_from_command_line
#
#     execute_from_command_line(sys.argv)
