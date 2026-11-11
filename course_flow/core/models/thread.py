from typing import TYPE_CHECKING

from course_flow.core.models.base import TimeStampedUUIDModel

if TYPE_CHECKING:
    from course_flow.core.models.channel import Channel
    from course_flow.core.models.node import Node
    from course_flow.core.models.outcome import Outcome
    from course_flow.core.models.section import Section


class Thread(TimeStampedUUIDModel):
    if TYPE_CHECKING:
        channel: Channel
        node: Node
        outcome: Outcome
        section: Section

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        db_table = "cf_thread"
