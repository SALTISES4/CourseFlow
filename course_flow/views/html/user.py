from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.generic import ListView
from django.views.generic.edit import UpdateView

from course_flow.decorators import ajax_login_required
from course_flow.models import CourseFlowUser, Notification


class UserUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = CourseFlowUser
    fields = ["first_name", "last_name", "notifications"]
    template_name = "course_flow/courseflowuser_update.html"

    def test_func(self):
        user = self.request.user
        courseflow_user = CourseFlowUser.objects.filter(user=user).first()
        if courseflow_user is None:
            courseflow_user = CourseFlowUser.objects.create(
                first_name=user.first_name, last_name=user.last_name, user=user
            )
        self.kwargs["pk"] = courseflow_user.pk
        return True

    def get_form(self, *args, **kwargs):
        form = super(UpdateView, self).get_form()
        return form

    def get_success_url(self):
        return reverse("course_flow:user-update")


class UserNotificationsView(LoginRequiredMixin, ListView):
    model = Notification
    paginate_by = 25
    template_name = "course_flow/notifications.html"

    def get_queryset(self, **kwargs):
        return self.request.user.notifications.all()

    def get_form(self, *args, **kwargs):
        form = super(UpdateView, self).get_form()
        return form


@login_required
def UserUpdateView(request):
    return render(request, "course_flow/profile-settings.html")


@ajax_login_required
def logout_view(request):
    logout(request)
    return redirect(reverse("login"))
