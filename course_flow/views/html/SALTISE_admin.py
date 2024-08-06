from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.models import Group
from django.views.generic import TemplateView


class SALTISEAdminView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    template_name = "course_flow/admin/saltise_admin.html"

    def test_func(self):
        return (
            Group.objects.get(name="SALTISE_Staff")
            in self.request.user.groups.all()
        )
