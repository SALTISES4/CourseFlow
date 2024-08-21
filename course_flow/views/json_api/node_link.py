import json

from django.core.exceptions import ValidationError
from django.http import HttpRequest, JsonResponse

from course_flow.decorators import user_can_edit
from course_flow.models import Node
from course_flow.models.relations import NodeLink
from course_flow.serializers import NodeLinkSerializerShallow
from course_flow.sockets import redux_actions as actions
from course_flow.utils import get_model_from_str


@user_can_edit("nodePk")
@user_can_edit(False)
def json_api_post_new_node_link(request: HttpRequest) -> JsonResponse:
    body = json.loads(request.body)
    node_id = body.get("nodePk")
    target_id = body.get("objectID")
    target_type = body.get("objectType")
    source_port = body.get("sourcePort")
    target_port = body.get("targetPort")
    node = Node.objects.get(pk=node_id)
    target = get_model_from_str(target_type).objects.get(pk=target_id)
    try:
        node_link = NodeLink.objects.create(
            author=node.author,
            source_node=node,
            target_node=target,
            source_port=source_port,
            target_port=target_port,
        )
    except ValidationError:
        return JsonResponse({"action": "error"})

    response_data = {
        "new_model": NodeLinkSerializerShallow(node_link).data,
    }
    actions.dispatch_wf(
        node.get_workflow(), actions.newNodeLinkAction(response_data)
    )
    return JsonResponse({"action": "posted"})
