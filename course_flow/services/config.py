"""
CONTEXT PROCESSORS

Context processors in Django are functions that add specific
data to the context of every template across a project.
They help in making information like user details and settings
globally available to all templates.

Context processors are configured in the TEMPLATES settings.
where they are added to the context_processors list.

They should be used  judiciously due to potential performance impacts,
as they execute  for every template rendered.
"""
from django.urls import reverse

from course_flow.forms import CreateProject
from course_flow.models import Discipline
from course_flow.serializers import DisciplineSerializer, FormFieldsSerializer


class ConfigService:
    @staticmethod
    def get_app_disciplines():
        return DisciplineSerializer(Discipline.objects.order_by("title"), many=True).data

    @staticmethod
    def get_app_paths():
        return {
            "post_paths": {
                "new_outcome": reverse("json_api:json-api-post-new-outcome-for-workflow"),
                "insert_child": reverse("json_api:json-api-post-insert-child"),
                "inserted_at": reverse("json_api:json-api-post-inserted-at"),
                "update_outcomehorizontallink_degree": reverse(
                    "json_api:json-api-post-update-outcomehorizontallink-degree"
                ),
                "update_outcomenode_degree": reverse(
                    "json_api:json-api-post-update-outcomenode-degree"
                ),
                "update_object_set": reverse("json_api:json-api-post-update-object-set"),
                # generic
                "insert_sibling": reverse("json_api:json-api-post-insert-sibling"),
            },
            "get_paths": {
                "get_public_workflow_child_data": reverse(
                    "json_api:json-api-get-public-workflow-child-data",
                    kwargs={"pk": "0"},
                ),
                "get_public_parent_workflow_info": reverse(
                    "json_api:json-api-get-public-parent-workflow-info",
                    kwargs={"pk": "0"},
                ),
            },
        }
