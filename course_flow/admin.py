from django.contrib import admin

from .models import (
    Node,
    Column,
    Week,
    Activity,
    Course,
    Program,
    NodeWeek,
    NodeLink,
    WeekWorkflow,
    ColumnWorkflow,
    Workflow,
    Project,
    WorkflowProject,
    OutcomeProject,
    Outcome,
    OutcomeNode,
    OutcomeOutcome,
    
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
