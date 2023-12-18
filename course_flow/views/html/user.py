from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.generic import ListView
from django.views.generic.edit import UpdateView

from course_flow.decorators import ajax_login_required
from course_flow.models import CourseFlowUser, Notification


class UserNotificationsView(LoginRequiredMixin, ListView):
    model = Notification
    paginate_by = 25
    template_name = "course_flow/notifications.html"

    def get_queryset(self, **kwargs):
        return self.request.user.notifications.all()

    def get_form(self, *args, **kwargs):
        form = super(UpdateView, self).get_form()
        return form


@ajax_login_required
def logout_view(request):
    logout(request)
    return redirect(reverse("login"))
