from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.views.generic import TemplateView
from rest_framework.renderers import JSONRenderer

from course_flow.models import Discipline
from course_flow.serializers import DisciplineSerializer, InfoBoxSerializer
from course_flow.views.json_api.search import get_explore_objects


class ExploreView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )

    template_name = "course_flow/react/common_entrypoint.html"

    def get_context_data(self):
        current_user = self.request.user
        context = {}

        initial_workflows, pages = get_explore_objects(
            current_user,
            "",
            20,
            True,
            {"sort": "created_on", "sort_reversed": True},
        )

        context_data = {
            "initial_workflows": (
                InfoBoxSerializer(
                    initial_workflows,
                    context={"user": self.request.user},
                    many=True,
                ).data
            ),
            "initial_pages": pages,
            "disciplines": DisciplineSerializer(
                Discipline.objects.all(), many=True
            ).data,
            "user_id": current_user.id if current_user else 0,
        }
        context["contextData"] = (
            JSONRenderer().render(context_data).decode("utf-8")
        )
        context["path_id"] = "explore"
        context["title"] = "Explore"

        return context
