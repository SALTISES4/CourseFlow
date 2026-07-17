from course_flow.application.services.auth_service import AuthService
from course_flow.application.services.authorization_service import (
    AuthorizationService,
)
from course_flow.application.services.channel_service import ChannelService
from course_flow.application.services.graph_mutation_service import (
    GraphMutationService,
)
from course_flow.application.services.graph_view_service import (
    GraphViewService,
)
from course_flow.application.services.library_service import LibraryService
from course_flow.application.services.notification_service import (
    NotificationService,
)
from course_flow.application.services.project_detail_service import (
    ProjectDetailService,
)
from course_flow.application.services.project_graph_view_service import (
    ProjectGraphViewService,
)
from course_flow.application.services.project_relations_service import (
    ProjectRelationsService,
)
from course_flow.application.services.project_service import ProjectService
from course_flow.application.services.resource_lifecycle_service import (
    ResourceLifecycleService,
)
from course_flow.application.services.section_service import SectionService
from course_flow.application.services.thread_comment_service import (
    ThreadCommentService,
)
from course_flow.application.services.user_service import UserService
from course_flow.application.services.workflow_copy_service import (
    WorkflowCopyService,
)
from course_flow.application.services.workflow_service import WorkflowService
from course_flow.infrastructure.repositories.django_channel_repository import (
    DjangoChannelRepository,
)
from course_flow.infrastructure.repositories.django_project_repository import (
    DjangoProjectRepository,
)
from course_flow.infrastructure.repositories.django_section_repository import (
    DjangoSectionRepository,
)
from course_flow.infrastructure.repositories.django_workflow_repository import (
    DjangoWorkflowRepository,
)

_auth_service = AuthService()
_authorization_service = AuthorizationService()
_project_graph_view_service = ProjectGraphViewService()
_project_detail_service = ProjectDetailService()
_graph_view_service = GraphViewService()
_graph_mutation_service = GraphMutationService()
_project_service = ProjectService(DjangoProjectRepository())
_resource_lifecycle_service = ResourceLifecycleService()
_project_relations_service = ProjectRelationsService()
_workflow_service = WorkflowService(DjangoWorkflowRepository())
_workflow_copy_service = WorkflowCopyService(_authorization_service)
_channel_service = ChannelService(DjangoChannelRepository())
_section_service = SectionService(DjangoSectionRepository())
_thread_comment_service = ThreadCommentService()
_user_service = UserService()
_notification_service = NotificationService()
_library_service = LibraryService()


def get_auth_service() -> AuthService:
    return _auth_service


def get_authorization_service() -> AuthorizationService:
    return _authorization_service


def get_project_graph_view_service() -> ProjectGraphViewService:
    return _project_graph_view_service


def get_project_detail_service() -> ProjectDetailService:
    return _project_detail_service


def get_graph_view_service() -> GraphViewService:
    return _graph_view_service


def get_graph_mutation_service() -> GraphMutationService:
    return _graph_mutation_service


def get_project_service() -> ProjectService:
    return _project_service


def get_resource_lifecycle_service() -> ResourceLifecycleService:
    return _resource_lifecycle_service


def get_project_relations_service() -> ProjectRelationsService:
    return _project_relations_service


def get_workflow_service() -> WorkflowService:
    return _workflow_service


def get_workflow_copy_service() -> WorkflowCopyService:
    return _workflow_copy_service


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
