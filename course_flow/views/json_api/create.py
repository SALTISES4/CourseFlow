import json
import math

from django.core.exceptions import ValidationError
from django.http import HttpRequest, JsonResponse

from course_flow.decorators import (
    user_can_edit,
    user_can_view,
    user_can_view_or_none,
    user_is_teacher,
)
from course_flow.duplication_functions import (
    duplicate_column,
    fast_duplicate_week,
)
from course_flow.forms import CreateProject
from course_flow.models import (
    Column,
    Node,
    Notification,
    ObjectPermission,
    ObjectSet,
    Outcome,
    Project,
    User,
    Week,
    Workflow,
)
from course_flow.models.relations import (
    ColumnWorkflow,
    NodeWeek,
    OutcomeNode,
    OutcomeOutcome,
    OutcomeWorkflow,
    WeekWorkflow,
)
from course_flow.serializers import (
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    serializer_lookups_shallow,
)
from course_flow.sockets import redux_actions as actions
from course_flow.utils import get_model_from_str

#########################################################
# JSON API to create workflow objects
#########################################################


#########################################################
# ??
#########################################################


#########################################################
# ?
#########################################################
