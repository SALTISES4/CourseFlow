from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext as _

from course_flow.models.objectPermission import ObjectPermission, Permission
from course_flow.models.project import Project
from course_flow.serializers import InfoBoxSerializer


class ProjectService:
    @staticmethod
    def get_my_projects(user, add, **kwargs):
        for_add = kwargs.get("for_add", False)
        permission_filter = {}
        if for_add:
            permission_filter[
                "permission_type"
            ] = Permission.PERMISSION_EDIT.value

        data_package = {
            "owned_projects": {
                "title": _("My Projects"),
                "sections": [
                    {
                        "title": _("Add new"),
                        "object_type": "project",
                        "objects": InfoBoxSerializer(
                            Project.objects.filter(author=user, deleted=False),
                            many=True,
                            context={"user": user},
                        ).data,
                    }
                ],
                "add": add,
                "duplicate": "copy",
                "emptytext": _(
                    "Projects are used to organize your Programs, Courses, and Activities. Projects you create will be shown here. Click the button above to create a or import a project to get started."
                ),
            },
            "edit_projects": {
                "title": _("Shared With Me"),
                "sections": [
                    {
                        "title": _("Projects I've Been Added To"),
                        "object_type": "project",
                        "objects": InfoBoxSerializer(
                            [
                                user_permission.content_object
                                for user_permission in ObjectPermission.objects.filter(
                                    user=user,
                                    content_type=ContentType.objects.get_for_model(
                                        Project
                                    ),
                                    project__deleted=False,
                                    **permission_filter,
                                )
                            ],
                            many=True,
                            context={"user": user},
                        ).data,
                    }
                ],
                "duplicate": "import",
                "emptytext": _(
                    "Projects shared with you by others (for which you have either view or edit permissions) will appear here."
                ),
            },
        }
        if not for_add:
            data_package["deleted_projects"] = {
                "title": _("Restore Projects"),
                "sections": [
                    {
                        "title": _("Restore Projects"),
                        "object_type": "project",
                        "objects": InfoBoxSerializer(
                            list(
                                Project.objects.filter(
                                    author=user, deleted=True
                                )
                            )
                            + [
                                user_permission.content_object
                                for user_permission in ObjectPermission.objects.filter(
                                    user=user,
                                    content_type=ContentType.objects.get_for_model(
                                        Project
                                    ),
                                    project__deleted=True,
                                )
                            ],
                            many=True,
                            context={"user": user},
                        ).data,
                    }
                ],
                "emptytext": _(
                    "Projects you have deleted can be restored from here."
                ),
            }
        return data_package
