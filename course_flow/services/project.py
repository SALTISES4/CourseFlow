from django.contrib.contenttypes.models import ContentType

from course_flow.models.objectPermission import ObjectPermission, Permission
from course_flow.models.project import Project
from course_flow.serializers import LibraryObjectSerializer


class ProjectService:
    @staticmethod
    def get_my_projects(user):
        """
        get all projects that the user has access to
        not sure if this is better as an extension of get library objets

        :param user:
        :return:
        """
        permission_filter = {"permission_type": Permission.PERMISSION_EDIT.value}

        owned_projects = LibraryObjectSerializer(
            Project.objects.filter(author=user, deleted=False),
            many=True,
            context={"user": user},
        ).data

        edit_projects = LibraryObjectSerializer(
            [
                user_permission.content_object
                for user_permission in ObjectPermission.objects.filter(
                    user=user,
                    content_type=ContentType.objects.get_for_model(Project),
                    project__deleted=False,
                    **permission_filter,
                )
            ],
            many=True,
            context={"user": user},
        ).data

        deleted_projects = LibraryObjectSerializer(
            list(Project.objects.filter(author=user, deleted=True))
            + [
                user_permission.content_object
                for user_permission in ObjectPermission.objects.filter(
                    user=user,
                    content_type=ContentType.objects.get_for_model(Project),
                    project__deleted=True,
                )
            ],
            many=True,
            context={"user": user},
        ).data

        return {
            "owned_projects": owned_projects,
            "edit_projects": edit_projects,
            "deleted_projects": deleted_projects,
        }
