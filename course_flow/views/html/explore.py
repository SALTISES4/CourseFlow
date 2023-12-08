from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.views.generic import TemplateView
from rest_framework.renderers import JSONRenderer

from course_flow.models import Discipline
from course_flow.serializers import DisciplineSerializer, InfoBoxSerializer
from course_flow.views.json_api.search_api import get_explore_objects


class ExploreView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    def test_func(self):
        return (
            Group.objects.get(name=settings.TEACHER_GROUP)
            in self.request.user.groups.all()
        )

    template_name = "course_flow/react/explore.html"

    def get_context_data(self):
        initial_workflows, pages = get_explore_objects(
            self.request.user,
            "",
            20,
            True,
            {"sort": "created_on", "sort_reversed": True},
        )
        return {
            "initial_workflows": JSONRenderer()
            .render(
                InfoBoxSerializer(
                    initial_workflows,
                    context={"user": self.request.user},
                    many=True,
                ).data
            )
            .decode("utf-8"),
            "initial_pages": JSONRenderer().render(pages).decode("utf-8"),
            "disciplines": JSONRenderer()
            .render(
                DisciplineSerializer(Discipline.objects.all(), many=True).data
            )
            .decode("utf-8"),
        }
