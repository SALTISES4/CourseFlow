from django.apps import AppConfig


class CourseFlowConfig(AppConfig):
    name = "course_flow"

    def ready(self):
        from django_lti_tool_provider.views import LTIView  # noqa
        from .lti import ApplicationHookManager  # noqa

        LTIView.register_authentication_manager(ApplicationHookManager())
