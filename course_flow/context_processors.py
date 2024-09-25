"""
CONTEXT PROCESSORS

Context processors in Django are functions that add specific
data to the context of every template across a project.
They help in making information like user details and settings
globally available to all templates.

Context processors are configured in the TEMPLATES settings.
where they are added to the context_processors list.

They should be used  judiciously due to potential performance impacts,
as they execute  for every template rendered.
"""
from django.http import HttpRequest
from rest_framework.renderers import JSONRenderer

from course_flow.services.config import ConfigService
from course_flow.services.library import LibraryService
from course_flow.services.notifications import get_app_update_notifications
from course_flow.services.workflow import WorkflowService


def add_global_context(request: HttpRequest):
    """
    # global processors, not for common html content data
    :param request:
    :return:
    """
    if "course_flow" in request.resolver_match.namespace:
        return {
            "globalContextData": JSONRenderer()
            .render(
                {
                    "favourites": LibraryService.get_top_favourites(
                        request.user
                    ),
                    "forms": {
                        "create_project": ConfigService.get_create_project_form()
                    },
                    "app_notifications": get_app_update_notifications(
                        request.user
                    ),
                    "workflow_choices": WorkflowService.get_workflow_choices(),
                    "path": ConfigService.get_app_paths(),
                    "disciplines": ConfigService.get_app_disciplines(),
                }
            )
            .decode("utf-8")
        }

    return {}
