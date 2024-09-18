"""
What is this file doing
"""
import logging

from django.apps import AppConfig
from django.core.checks import register

from .checks import check_return_url

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


class CourseFlowConfig(AppConfig):
    name = "course_flow"
    verbose_name = "Course Flow"

    def ready(self):
        register(check_return_url)
