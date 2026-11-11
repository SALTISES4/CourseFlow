from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    from django_stubs_ext.db.models.manager import RelatedManager

    from course_flow.core.models.channel import Channel
    from course_flow.core.models.section import Section
    from course_flow.core.models.workflow import Workflow

from course_flow.core.models.base import TimeStampedUUIDModel


class Graph(TimeStampedUUIDModel):
    if TYPE_CHECKING:
        channels: RelatedManager[Channel]
        sections: RelatedManager[Section]
        workflow: Workflow

    revision_id = models.PositiveIntegerField(
        default=0,
        help_text="Monotonic graph revision; incremented on graph-affecting mutations only.",
    )

    class Meta:  # pyright: ignore[reportIncompatibleVariableOverride]
        db_table = "cf_graph"
