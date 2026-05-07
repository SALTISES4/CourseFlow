from course_flow.application.services.auth_service import AuthService
from course_flow.application.services.channel_service import ChannelService
from course_flow.application.services.graph_mutation_service import (
    GraphMutationService,
)
from course_flow.application.services.graph_projection_service import (
    GraphProjectionService,
)
from course_flow.application.services.graph_service import GraphService
from course_flow.application.services.library_service import LibraryService
from course_flow.application.services.notification_service import (
    NotificationService,
)
from course_flow.application.services.project_detail_service import (
    ProjectDetailService,
)
from course_flow.application.services.project_graph_projection_service import (
    ProjectGraphProjectionService,
)
from course_flow.application.services.project_relations_service import (
    ProjectRelationsService,
)
from course_flow.application.services.project_service import ProjectService
from course_flow.application.services.section_service import SectionService
from course_flow.application.services.thread_comment_service import (
    ThreadCommentService,
)
from course_flow.application.services.user_service import UserService
from course_flow.infrastructure.repositories.django_channel_repository import (
    DjangoChannelRepository,
)
from course_flow.infrastructure.repositories.django_graph_repository import (
    DjangoGraphRepository,
)
from course_flow.infrastructure.repositories.django_project_repository import (
    DjangoProjectRepository,
)
from course_flow.infrastructure.repositories.django_section_repository import (
    DjangoSectionRepository,
)

_auth_service = AuthService()
_project_graph_projection_service = ProjectGraphProjectionService()
_project_detail_service = ProjectDetailService()
_graph_projection_service = GraphProjectionService()
_graph_mutation_service = GraphMutationService()
_project_service = ProjectService(DjangoProjectRepository())
_project_relations_service = ProjectRelationsService()
_graph_service = GraphService(DjangoGraphRepository())
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


def get_graph_projection_service() -> GraphProjectionService:
    return _graph_projection_service


def get_graph_mutation_service() -> GraphMutationService:
    return _graph_mutation_service


def get_project_service() -> ProjectService:
    return _project_service


def get_project_relations_service() -> ProjectRelationsService:
    return _project_relations_service


def get_graph_service() -> GraphService:
    return _graph_service


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
