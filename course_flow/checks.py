from django.conf import settings
from django.core.checks import Warning, register


@register()
def check_return_url(app_configs, **kwargs):
    errors = []
    if not hasattr(settings, "COURSE_FLOW_RETURN_URL"):
        errors.append(
            Warning(
                "COURSE_FLOW_RETURN_URL not found",
                hint="Provide a value for COURSE_FLOW_RETURN_URL in settings.py, allowing a return to your main project.",
                id="courseflow.E001",
            )
        )
    return errors
