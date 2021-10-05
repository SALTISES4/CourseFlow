from django.apps import AppConfig
from django.conf import settings
from django.core.checks import register

from .checks import check_return_url


class CourseFlowConfig(AppConfig):
    name = "course_flow"
    verbose_name = "Course Flow"

    def ready(self):
        register(check_return_url)

        if (
            hasattr(settings, "COURSE_FLOW_LTI_ACCESS")
            and settings.COURSE_FLOW_LTI_ACCESS
        ):
            from django_lti_tool_provider.views import LTIView  # noqa

            from .lti import ApplicationHookManager  # noqa

            LTIView.register_authentication_manager(ApplicationHookManager())
