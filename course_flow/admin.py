from django.contrib import admin

from course_flow.models.activity import Activity
from course_flow.models.column import Column
from course_flow.models.comment import Comment
from course_flow.models.course import Course
from course_flow.models.discipline import Discipline
from course_flow.models.favourite import Favourite
from course_flow.models.liveAssignment import LiveAssignment
from course_flow.models.liveProject import LiveProject
from course_flow.models.models import Project
from course_flow.models.node import Node
from course_flow.models.objectPermission import ObjectPermission
from course_flow.models.objectset import ObjectSet
from course_flow.models.outcome import Outcome
from course_flow.models.program import Program
from course_flow.models.relations.columnWorkflow import ColumnWorkflow
from course_flow.models.relations.liveProjectUser import LiveProjectUser
from course_flow.models.relations.nodeLink import NodeLink
from course_flow.models.relations.nodeWeek import NodeWeek
from course_flow.models.relations.outcomeHorizontalLink import (
    OutcomeHorizontalLink,
)
from course_flow.models.relations.outcomeNode import OutcomeNode
from course_flow.models.relations.outcomeOutcome import OutcomeOutcome
from course_flow.models.relations.outcomeWorkflow import OutcomeWorkflow
from course_flow.models.relations.weekWorkflow import WeekWorkflow
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.models.updateNotification import UpdateNotification
from course_flow.models.userAssignment import UserAssignment
from course_flow.models.week import Week
from course_flow.models.workflow import Workflow

admin.site.register(Node)
admin.site.register(Column)
admin.site.register(ColumnWorkflow)
admin.site.register(Week)
admin.site.register(Activity)
admin.site.register(Course)
admin.site.register(Program)
admin.site.register(NodeWeek)
admin.site.register(NodeLink)
admin.site.register(WeekWorkflow)
admin.site.register(Workflow)
admin.site.register(Project)
admin.site.register(WorkflowProject)
admin.site.register(Outcome)
admin.site.register(OutcomeNode)
admin.site.register(OutcomeOutcome)
admin.site.register(OutcomeWorkflow)
admin.site.register(ObjectPermission)
admin.site.register(ObjectSet)
admin.site.register(OutcomeHorizontalLink)
admin.site.register(Discipline)
admin.site.register(Favourite)
admin.site.register(Comment)
admin.site.register(LiveProject)
admin.site.register(LiveProjectUser)
admin.site.register(LiveAssignment)
admin.site.register(UserAssignment)
admin.site.register(UpdateNotification)
