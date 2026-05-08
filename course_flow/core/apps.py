from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "course_flow.core"
    label = "cf_core"
    verbose_name = "CourseFlow V2 core"

    def ready(self) -> None:
        import course_flow.core.signals  # noqa: F401
