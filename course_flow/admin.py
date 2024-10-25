"""
@todo what is this file doing
"""
from django.contrib import admin

from course_flow.models import LiveAssignment  # to remove
from course_flow.models import LiveProject  # to remove
from course_flow.models import LiveProjectUser  # to remove
from course_flow.models import (
    Activity,
    Column,
    ColumnWorkflow,
    Comment,
    Course,
    Discipline,
    Favourite,
    Node,
    NodeLink,
    NodeWeek,
    ObjectPermission,
    ObjectSet,
    Outcome,
    OutcomeHorizontalLink,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    Program,
    Project,
    UpdateNotification,
    UserAssignment,
    Week,
    WeekWorkflow,
    Workflow,
    WorkflowProject,
)

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
admin.site.register(LiveProject)  # to remove
admin.site.register(LiveProjectUser)  # to remove
admin.site.register(LiveAssignment)  # to remove
admin.site.register(UserAssignment)  # what is this
admin.site.register(UpdateNotification)
