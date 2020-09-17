from django.contrib import admin

from .models import (
    Node,
    Column,
    Strategy,
    Activity,
    Preparation,
    Assessment,
    Artifact,
    Component,
    Week,
    Course,
    Program,
    NodeStrategy,
    StrategyWorkflow,
    ColumnWorkflow,
    ComponentWeek,
)

admin.site.register(Node)
admin.site.register(Column)
admin.site.register(ColumnWorkflow)
admin.site.register(Strategy)
admin.site.register(Activity)
admin.site.register(Preparation)
admin.site.register(Assessment)
admin.site.register(Artifact)
admin.site.register(Component)
admin.site.register(Week)
admin.site.register(Course)
admin.site.register(Program)
admin.site.register(NodeStrategy)
admin.site.register(StrategyWorkflow)
admin.site.register(ComponentWeek)
