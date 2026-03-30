from course_flow_v2.application.services.auth_service import AuthService
from course_flow_v2.application.services.project_graph_projection_service import (
    ProjectGraphProjectionService,
)
from course_flow_v2.application.services.project_service import ProjectService
from course_flow_v2.application.services.thread_comment_service import (
    ThreadCommentService,
)
from course_flow_v2.application.services.workflow_graph_mutation_service import (
    WorkflowGraphMutationService,
)
from course_flow_v2.application.services.workflow_graph_projection_service import (
    WorkflowGraphProjectionService,
)
from course_flow_v2.application.services.workflow_service import (
    WorkflowService,
)
from course_flow_v2.infrastructure.repositories.django_project_repository import (
    DjangoProjectRepository,
)
from course_flow_v2.infrastructure.repositories.django_workflow_repository import (
    DjangoWorkflowRepository,
)

_auth_service = AuthService()
_project_graph_projection_service = ProjectGraphProjectionService()
_workflow_graph_projection_service = WorkflowGraphProjectionService()
_workflow_graph_mutation_service = WorkflowGraphMutationService()
_project_service = ProjectService(DjangoProjectRepository())
_workflow_service = WorkflowService(DjangoWorkflowRepository())
_thread_comment_service = ThreadCommentService()


def get_auth_service() -> AuthService:
    return _auth_service


def get_project_graph_projection_service() -> ProjectGraphProjectionService:
    return _project_graph_projection_service


def get_workflow_graph_projection_service() -> WorkflowGraphProjectionService:
    return _workflow_graph_projection_service


def get_workflow_graph_mutation_service() -> WorkflowGraphMutationService:
    return _workflow_graph_mutation_service


def get_project_service() -> ProjectService:
    return _project_service


def get_workflow_service() -> WorkflowService:
    return _workflow_service


def get_thread_comment_service() -> ThreadCommentService:
    return _thread_comment_service
