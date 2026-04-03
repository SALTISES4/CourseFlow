from course_flow_v2.application.services.auth_service import AuthService
from course_flow_v2.application.services.channel_service import ChannelService
from course_flow_v2.application.services.library_service import LibraryService
from course_flow_v2.application.services.notification_service import (
    NotificationService,
)
from course_flow_v2.application.services.project_detail_service import (
    ProjectDetailService,
)
from course_flow_v2.application.services.project_graph_projection_service import (
    ProjectGraphProjectionService,
)
from course_flow_v2.application.services.project_relations_service import (
    ProjectRelationsService,
)
from course_flow_v2.application.services.project_service import ProjectService
from course_flow_v2.application.services.section_service import SectionService
from course_flow_v2.application.services.thread_comment_service import (
    ThreadCommentService,
)
from course_flow_v2.application.services.user_service import UserService
from course_flow_v2.application.services.workflow_graph_mutation_service import (
    WorkflowGraphMutationService,
)
from course_flow_v2.application.services.workflow_graph_projection_service import (
    WorkflowGraphProjectionService,
)
from course_flow_v2.application.services.workflow_service import (
    WorkflowService,
)
from course_flow_v2.infrastructure.repositories.django_channel_repository import (
    DjangoChannelRepository,
)
from course_flow_v2.infrastructure.repositories.django_project_repository import (
    DjangoProjectRepository,
)
from course_flow_v2.infrastructure.repositories.django_section_repository import (
    DjangoSectionRepository,
)
from course_flow_v2.infrastructure.repositories.django_workflow_repository import (
    DjangoWorkflowRepository,
)

_auth_service = AuthService()
_project_graph_projection_service = ProjectGraphProjectionService()
_project_detail_service = ProjectDetailService()
_workflow_graph_projection_service = WorkflowGraphProjectionService()
_workflow_graph_mutation_service = WorkflowGraphMutationService()
_project_service = ProjectService(DjangoProjectRepository())
_project_relations_service = ProjectRelationsService()
_workflow_service = WorkflowService(DjangoWorkflowRepository())
_channel_service = ChannelService(DjangoChannelRepository())
_section_service = SectionService(DjangoSectionRepository())
_thread_comment_service = ThreadCommentService()
_user_service = UserService()
_notification_service = NotificationService()
_library_service = LibraryService()


def get_auth_service() -> AuthService:
    return _auth_service


def get_project_graph_projection_service() -> ProjectGraphProjectionService:
    return _project_graph_projection_service


def get_project_detail_service() -> ProjectDetailService:
    return _project_detail_service


def get_workflow_graph_projection_service() -> WorkflowGraphProjectionService:
    return _workflow_graph_projection_service


def get_workflow_graph_mutation_service() -> WorkflowGraphMutationService:
    return _workflow_graph_mutation_service


def get_project_service() -> ProjectService:
    return _project_service


def get_project_relations_service() -> ProjectRelationsService:
    return _project_relations_service


def get_workflow_service() -> WorkflowService:
    return _workflow_service


def get_channel_service() -> ChannelService:
    return _channel_service


def get_section_service() -> SectionService:
    return _section_service


def get_thread_comment_service() -> ThreadCommentService:
    return _thread_comment_service


def get_user_service() -> UserService:
    return _user_service


def get_notification_service() -> NotificationService:
    return _notification_service


def get_library_service() -> LibraryService:
    return _library_service
