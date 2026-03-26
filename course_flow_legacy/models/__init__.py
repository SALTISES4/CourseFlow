from django.contrib.auth import get_user_model

from ._constants import *

# from ._common import title_max_length
from .comment import Comment
from .discipline import Discipline
from .favourite import Favourite

# to delete but wrapped up in migrations
from .liveprojectmodels import (
    LiveAssignment,
    LiveProject,
    LiveProjectUser,
    UserAssignment,
)
from .notification import Notification
from .objectPermission import ObjectPermission
from .objectset import ObjectSet
from .relations.columnWorkflow import ColumnWorkflow
from .relations.nodeLink import NodeLink
from .relations.nodeWeek import NodeWeek
from .relations.outcomeHorizontalLink import OutcomeHorizontalLink
from .relations.outcomeNode import OutcomeNode
from .relations.outcomeOutcome import OutcomeOutcome
from .relations.outcomeWorkflow import OutcomeWorkflow
from .relations.weekWorkflow import WeekWorkflow
from .relations.workflowProject import WorkflowProject
from .updateNotification import UpdateNotification
from .workflow_objects.column import Column
from .workflow_objects.node import Node
from .workflow_objects.outcome import Outcome
from .workflow_objects.week import Week
from .workspace.activity import Activity
from .workspace.course import Course
from .workspace.program import Program
from .workspace.project import Project
from .workspace.workflow import Workflow

User = get_user_model()
