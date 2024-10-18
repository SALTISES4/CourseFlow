from django.contrib.auth import get_user_model

# from ._common import title_max_length
from .comment import Comment
from .discipline import Discipline
from .favourite import Favourite
from .notification import Notification
from .objectPermission import ObjectPermission
from .objectset import ObjectSet
from .updateNotification import UpdateNotification

from .workflow_objects.node import Node
from .workflow_objects.week import Week
from .workflow_objects.outcome import Outcome
from .workflow_objects.column import Column

from .workspace.workflow import Workflow
from .workspace.project import Project
from .workspace.activity import Activity
from .workspace.program import Program
from .workspace.course import Course

from .relations.columnWorkflow import ColumnWorkflow
from .relations.nodeLink import NodeLink
from .relations.nodeWeek import NodeWeek
from .relations.outcomeHorizontalLink import OutcomeHorizontalLink
from .relations.outcomeNode import OutcomeNode
from .relations.outcomeOutcome import OutcomeOutcome
from .relations.outcomeWorkflow import OutcomeWorkflow
from .relations.weekWorkflow import WeekWorkflow
from .relations.workflowProject import WorkflowProject

from .liveprojectmodels import LiveProject
from .liveprojectmodels import LiveAssignment
from .liveprojectmodels import LiveProjectUser
from .liveprojectmodels import UserAssignment

User = get_user_model()
