from django.contrib.auth.mixins import LoginRequiredMixin
from rest_framework.generics import ListAPIView

from course_flow.models.discipline import Discipline
from course_flow.serializers import DisciplineSerializer


class DisciplineListView(LoginRequiredMixin, ListAPIView):
    queryset = Discipline.objects.order_by("title")
    serializer_class = DisciplineSerializer
