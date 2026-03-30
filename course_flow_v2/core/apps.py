from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "course_flow_v2.core"
    label = "cf2_core"
    verbose_name = "CourseFlow V2 core"

    def ready(self) -> None:
        import course_flow_v2.core.signals  # noqa: F401
