"""Transport-layer permission seams (placeholders until policy rules land)."""

from course_flow_v2.api.permissions.project import can_view_project
from course_flow_v2.api.permissions.workflow import can_view_workflow

__all__ = ["can_view_project", "can_view_workflow"]
