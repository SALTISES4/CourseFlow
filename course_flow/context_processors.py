from rest_framework.renderers import JSONRenderer

from course_flow.models import UpdateNotification
from course_flow.serializers import UpdateNotificationSerializer


def update_notifications(request):
    try:
        if "course_flow" in request.resolver_match.namespace:
            last_update = UpdateNotification.objects.last()
            if last_update is not None:
                last_update_serialized = (
                    JSONRenderer()
                    .render(UpdateNotificationSerializer(last_update).data)
                    .decode("utf-8")
                )
                return {"update_notifications": last_update_serialized}
    except Exception:
        pass
    return {"update_notifications": {}}
