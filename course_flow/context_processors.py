from rest_framework.renderers import JSONRenderer

from course_flow.models import UpdateNotification
from course_flow.serializers import UpdateNotificationSerializer


def update_notifications(request):
    if "course-flow" in request.path:
        updates = UpdateNotification.objects.order_by("-created_on")
        if updates.count() > 0:
            last_update = updates.first()
            last_update_serialized = (
                JSONRenderer()
                .render(UpdateNotificationSerializer(last_update).data)
                .decode("utf-8")
            )
            return {"update_notifications": last_update_serialized}
        return {"update_notifications": {}}
