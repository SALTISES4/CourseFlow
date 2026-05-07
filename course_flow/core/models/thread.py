from course_flow.core.models.base import TimeStampedUUIDModel


class Thread(TimeStampedUUIDModel):
    class Meta:
        db_table = "cf_thread"
