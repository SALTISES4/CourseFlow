from django.conf import settings
from django.contrib.auth.mixins import UserPassesTestMixin
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType

from course_flow.decorators import (
    check_object_enrollment,
    check_object_permission,
)
from course_flow.models import (
    LiveProjectUser,
    Notification,
    ObjectPermission,
    Project,
)


class ContentPublicViewMixin(UserPassesTestMixin):
    def test_func(self):
        return self.get_object().public_view


class UserCanViewMixin(UserPassesTestMixin):
    def test_func(self):
        view_object = self.get_object()
        if Group.objects.get(
            name=settings.TEACHER_GROUP
        ) in self.request.user.groups.all() and (
            check_object_permission(
                view_object,
                self.request.user,
                ObjectPermission.PERMISSION_VIEW,
            )
        ):
            ObjectPermission.update_last_viewed(self.request.user, view_object)
            Notification.objects.filter(
                object_id=view_object.id,
                content_type=ContentType.objects.get_for_model(view_object),
                user=self.request.user,
                is_unread=True,
                notification_type=Notification.TYPE_SHARED,
            ).update(is_unread=False)
            return True
        return False


class UserCanViewOrEnrolledMixin(UserPassesTestMixin):
    def test_func(self):
        view_object = self.get_object()
        if Group.objects.get(
            name=settings.TEACHER_GROUP
        ) in self.request.user.groups.all() and (
            check_object_permission(
                view_object,
                self.request.user,
                ObjectPermission.PERMISSION_VIEW,
            )
        ):
            ObjectPermission.update_last_viewed(self.request.user, view_object)
            return True
        else:
            try:
                if check_object_enrollment(
                    view_object,
                    self.request.user,
                    LiveProjectUser.ROLE_STUDENT,
                ):
                    ObjectPermission.update_last_viewed(
                        self.request.user, view_object
                    )
                    return True
            except AttributeError:
                return False
        return False


class UserEnrolledMixin(UserPassesTestMixin):
    def test_func(self):
        liveproject = self.get_object().get_live_project()
        if liveproject is None:
            return False
        project = liveproject.project
        if liveproject is None:
            return False
        if (
            LiveProjectUser.objects.filter(
                user=self.request.user, liveproject=liveproject
            )
            .exclude(role_type=LiveProjectUser.ROLE_NONE)
            .count()
            > 0
        ):
            return True
        elif project.author == self.request.user:
            LiveProjectUser.objects.create(
                user=self.request.user,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_TEACHER,
            )
            return True
        return False


class UserEnrolledAsTeacherMixin(UserPassesTestMixin):
    def test_func(self):
        liveproject = self.get_object().get_live_project()

        project = liveproject.project
        if liveproject is None:
            return False
        if (
            LiveProjectUser.objects.filter(
                user=self.request.user,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_TEACHER,
            ).count()
            > 0
        ):
            return True
        elif project.author == self.request.user:
            LiveProjectUser.objects.create(
                user=self.request.user,
                liveproject=liveproject,
                role_type=LiveProjectUser.ROLE_TEACHER,
            )
            return True
        return False


class UserCanEditMixin(UserPassesTestMixin):
    def test_func(self):
        view_object = self.get_object()
        if Group.objects.get(
            name=settings.TEACHER_GROUP
        ) in self.request.user.groups.all() and (
            check_object_permission(
                view_object,
                self.request.user,
                ObjectPermission.PERMISSION_EDIT,
            )
        ):
            ObjectPermission.update_last_viewed(self.request.user, view_object)
            return True
        return False


class UserCanEditProjectMixin(UserPassesTestMixin):
    def test_func(self):
        project = Project.objects.get(pk=self.kwargs["projectPk"])
        return Group.objects.get(
            name=settings.TEACHER_GROUP
        ) in self.request.user.groups.all() and (
            check_object_permission(
                project, self.request.user, ObjectPermission.PERMISSION_EDIT
            )
        )
