"""Read-only code and database catalogues required by frontend forms."""

from ninja import Router

from course_flow.api.auth import BearerAuth
from course_flow.api.schemas.reference_data import (
    ContextReferenceOptionOut,
    DisciplineReferenceOptionOut,
    ReferenceDataOut,
    TaskReferenceOptionOut,
    TimeUnitReferenceOptionOut,
)
from course_flow.core.models import Discipline
from course_flow.core.reference_data import (
    ACTIVITY_CONTEXT_OPTIONS,
    ACTIVITY_TASK_OPTIONS,
    COURSE_CONTEXT_OPTIONS,
    TIME_UNIT_OPTIONS,
)

router = Router(tags=["reference-data"], by_alias=True)


@router.get("", response=ReferenceDataOut, auth=BearerAuth(), operation_id="getReferenceData")
def get_reference_data(request):
    return ReferenceDataOut(
        disciplines=[
            DisciplineReferenceOptionOut(code=row.code, label=row.label)
            for row in Discipline.objects.order_by("label", "code")
        ],
        activity_contexts=[
            ContextReferenceOptionOut(value=value, label=label)
            for value, label in ACTIVITY_CONTEXT_OPTIONS
        ],
        course_contexts=[
            ContextReferenceOptionOut(value=value, label=label)
            for value, label in COURSE_CONTEXT_OPTIONS
        ],
        activity_task_classifications=[
            TaskReferenceOptionOut(value=value, label=label)
            for value, label in ACTIVITY_TASK_OPTIONS
        ],
        time_units=[
            TimeUnitReferenceOptionOut(value=value, label=label)
            for value, label in TIME_UNIT_OPTIONS
        ],
    )
