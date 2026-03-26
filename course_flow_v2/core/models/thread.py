from course_flow_v2.core.models.base import TimeStampedUUIDModel


class Thread(TimeStampedUUIDModel):
    class Meta:
        db_table = "cf2_thread"
