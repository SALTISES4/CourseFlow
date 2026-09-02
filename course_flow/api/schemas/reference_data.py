from pydantic import Field

from course_flow.api.common.schemas import CamelSchema
from course_flow.core.enum import (
    ContextClassification,
    TaskClassification,
    TimeUnit,
)


class DisciplineReferenceOptionOut(CamelSchema):
    code: str


class ContextReferenceOptionOut(CamelSchema):
    value: ContextClassification


class TaskReferenceOptionOut(CamelSchema):
    value: TaskClassification


class TimeUnitReferenceOptionOut(CamelSchema):
    value: TimeUnit


class ReferenceDataOut(CamelSchema):
    disciplines: list[DisciplineReferenceOptionOut] = Field(default_factory=list)
    activity_contexts: list[ContextReferenceOptionOut] = Field(default_factory=list)
    course_contexts: list[ContextReferenceOptionOut] = Field(default_factory=list)
    activity_task_classifications: list[TaskReferenceOptionOut] = Field(
        default_factory=list
    )
    time_units: list[TimeUnitReferenceOptionOut] = Field(default_factory=list)
