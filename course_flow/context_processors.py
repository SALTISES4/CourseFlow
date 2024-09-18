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

from course_flow.services.config import (
    get_app_config,
    get_sidebar,
    get_topbar,
    get_update_notifications,
)
from course_flow.services.workflow import WorkflowService


def add_global_context(request: HttpRequest):
    """
    # global processors, not for common html content data
    :param request:
    :return:
    """
    config = get_app_config()
    return {
        "globalContextData": JSONRenderer()
        .render(
            {
                "sidebar": get_sidebar(request),
                "topbar": get_topbar(request),
                "notifications": get_update_notifications(request),
                "path": config["path"],
                "disciplines": config["disciplines"],
                "workflow_choices": WorkflowService.get_workflow_choices(),
            }
        )
        .decode("utf-8")
    }
