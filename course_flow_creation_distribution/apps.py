from django.apps import AppConfig


class CourseFlowCreationDistributionConfig(AppConfig):
    name = "course_flow_creation_distribution"

    def ready(self):
        from django_lti_tool_provider.views import LTIView  # noqa
        from .lti import ApplicationHookManager  # noqa

        LTIView.register_authentication_manager(ApplicationHookManager())
