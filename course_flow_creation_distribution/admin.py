from django.contrib import admin

from .models import (
    Course,
    Preparation,
    Activity,
    Assesment,
    Artifact,
    Strategy,
    Node,
    LeftNodeIcon,
    RightNodeIcon,
    NodeStrategy,
    StrategyActivity,
    ComponentWeek,
    WeekCourse,
    Component,
    Week,
    Discipline,
)

admin.site.register(Course)
admin.site.register(Discipline)
admin.site.register(WeekCourse)
admin.site.register(Week)
admin.site.register(ComponentWeek)
admin.site.register(Component)
admin.site.register(Preparation)
admin.site.register(Assesment)
admin.site.register(Artifact)
admin.site.register(Activity)
admin.site.register(StrategyActivity)
admin.site.register(Strategy)
admin.site.register(NodeStrategy)
admin.site.register(Node)
admin.site.register(LeftNodeIcon)
admin.site.register(RightNodeIcon)
