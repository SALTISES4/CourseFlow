from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.views.generic import TemplateView

from course_flow.models.models import User


class SALTISEAnalyticsView(
    LoginRequiredMixin, UserPassesTestMixin, TemplateView
):
    template_name = "course_flow/admin/saltise_analytics.html"

    def test_func(self):
        return (
            Group.objects.get(name="SALTISE_Staff")
            in self.request.user.groups.all()
        )

    def get_context_data(self, **kwargs):
        context = super(TemplateView, self).get_context_data(**kwargs)
        context["notified_users"] = User.objects.filter(
            courseflow_user__notifications=True
        )
        return context
