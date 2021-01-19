from django.contrib import admin

from .models import (
    Node,
    Column,
    Week,
    Activity,
    Course,
    Program,
    NodeWeek,
    WeekWorkflow,
    ColumnWorkflow,
    Workflow,
)

admin.site.register(Node)
admin.site.register(Column)
admin.site.register(ColumnWorkflow)
admin.site.register(Week)
admin.site.register(Activity)
admin.site.register(Course)
admin.site.register(Program)
admin.site.register(NodeWeek)
admin.site.register(WeekWorkflow)
admin.site.register(Workflow)
