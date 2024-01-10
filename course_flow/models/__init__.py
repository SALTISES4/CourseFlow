from django.contrib.auth import get_user_model

from ._common import title_max_length
from .activity import Activity
from .column import Column
from .comment import Comment
from .course import Course
from .discipline import Discipline
from .favourite import Favourite
from .liveAssignment import LiveAssignment
from .liveProject import LiveProject
from .node import Node
from .notification import Notification
from .objectPermission import ObjectPermission
from .objectset import ObjectSet
from .outcome import Outcome
from .program import Program
from .project import Project
from .updateNotification import UpdateNotification
from .userAssignment import UserAssignment
from .week import Week
from .workflow import Workflow

from .relations.columnWorkflow import ColumnWorkflow
from .relations.liveProjectUser import LiveProjectUser
from .relations.nodeLink import NodeLink
from .relations.nodeWeek import NodeWeek
from .relations.outcomeHorizontalLink import OutcomeHorizontalLink
from .relations.outcomeNode import OutcomeNode
from .relations.outcomeOutcome import OutcomeOutcome
from .relations.outcomeWorkflow import OutcomeWorkflow
from .relations.weekWorkflow import WeekWorkflow
from .relations.workflowProject import WorkflowProject

User = get_user_model()
