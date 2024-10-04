from course_flow.serializers.container import (
    ColumnSerializerShallow,
    NodeWeekSerializerShallow,
    WeekSerializerShallow,
)
from course_flow.serializers.node import (
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
)
from course_flow.serializers.outcome import (
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
)
from course_flow.serializers.project import ProjectSerializerShallow
from course_flow.serializers.workflow import (
    ActivitySerializerShallow,
    CourseSerializerShallow,
    ProgramSerializerShallow,
    WorkflowSerializerShallow,
)
from course_flow.serializers.workflow_objects import (
    ColumnWorkflowSerializerShallow,
    WeekWorkflowSerializerShallow,
)
from course_flow.serializers.workspace import ObjectSetSerializerShallow

# no...
serializer_lookups_shallow = {
    "nodelink": NodeLinkSerializerShallow,
    "node": NodeSerializerShallow,
    "nodeweek": NodeWeekSerializerShallow,
    "week": WeekSerializerShallow,
    "weekworkflow": WeekWorkflowSerializerShallow,
    "column": ColumnSerializerShallow,
    "columnworkflow": ColumnWorkflowSerializerShallow,
    "workflow": WorkflowSerializerShallow,
    "activity": ActivitySerializerShallow,
    "course": CourseSerializerShallow,
    "program": ProgramSerializerShallow,
    "project": ProjectSerializerShallow,
    "outcome": OutcomeSerializerShallow,
    "outcomeoutcome": OutcomeOutcomeSerializerShallow,
    "outcomeworkflow": OutcomeWorkflowSerializerShallow,
    "objectset": ObjectSetSerializerShallow,
}
