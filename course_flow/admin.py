from django.contrib import admin

from .models import (
    Node,
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
    StrategyActivity,
    ComponentWeek,
    WeekCourse,
    ComponentProgram,
)

admin.site.register(Node)
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
admin.site.register(StrategyActivity)
admin.site.register(ComponentWeek)
admin.site.register(WeekCourse)
admin.site.register(ComponentProgram)
