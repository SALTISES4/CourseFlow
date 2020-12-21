from django.contrib import admin

from .models import (
    Node,
    Column,
    Strategy,
    Activity,
    Course,
    Program,
    NodeStrategy,
    StrategyWorkflow,
    ColumnWorkflow,
    Workflow,
)

admin.site.register(Node)
admin.site.register(Column)
admin.site.register(ColumnWorkflow)
admin.site.register(Strategy)
admin.site.register(Activity)
admin.site.register(Course)
admin.site.register(Program)
admin.site.register(NodeStrategy)
admin.site.register(StrategyWorkflow)
admin.site.register(Workflow)
