from course_flow_v2.application.services.project_service import ProjectService
from course_flow_v2.application.services.workflow_service import WorkflowService
from course_flow_v2.infrastructure.repositories.django_project_repository import (
    DjangoProjectRepository,
)
from course_flow_v2.infrastructure.repositories.django_workflow_repository import (
    DjangoWorkflowRepository,
)

_project_service = ProjectService(DjangoProjectRepository())
_workflow_service = WorkflowService(DjangoWorkflowRepository())


def get_project_service() -> ProjectService:
    return _project_service


def get_workflow_service() -> WorkflowService:
    return _workflow_service
