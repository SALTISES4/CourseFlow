"""
@todo What is this file doing?

@todo should not be in project root
"""
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.utils.translation import gettext as _
from rest_framework.renderers import JSONRenderer

from course_flow.models.column import Column
from course_flow.models.node import Node
from course_flow.models.objectPermission import ObjectPermission
from course_flow.models.project import Project
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.models.week import Week
from course_flow.models.workflow import Workflow
from course_flow.serializers import InfoBoxSerializer, ProjectSerializerShallow
from course_flow.utils import get_model_from_str, get_user_permission


def get_workflow_choices():
    return {
        "column_choices": [
            {"type": choice[0], "name": choice[1]}
            for choice in Column._meta.get_field("column_type").choices
        ],
        "context_choices": [
            {"type": choice[0], "name": choice[1]}
            for choice in Node._meta.get_field(
                "context_classification"
            ).choices
        ],
        "task_choices": [
            {"type": choice[0], "name": choice[1]}
            for choice in Node._meta.get_field("task_classification").choices
        ],
        "time_choices": [
            {"type": choice[0], "name": choice[1]}
            for choice in Node._meta.get_field("time_units").choices
        ],
        "outcome_type_choices": [
            {"type": choice[0], "name": choice[1]}
            for choice in Workflow._meta.get_field("outcomes_type").choices
        ],
        "outcome_sort_choices": [
            {"type": choice[0], "name": choice[1]}
            for choice in Workflow._meta.get_field("outcomes_sort").choices
        ],
        "strategy_classification_choices": [
            {"type": choice[0], "name": choice[1]}
            for choice in Week._meta.get_field(
                "strategy_classification"
            ).choices
        ],
    }


def get_workflow_context_data(workflow, user):
    data_package = {}

    user_permission = get_user_permission(workflow, user)

    data_package["is_strategy"] = workflow.is_strategy

    if not workflow.is_strategy:
        project = WorkflowProject.objects.get(workflow=workflow).project
        parent_project = ProjectSerializerShallow(
            project, context={"user": user}
        ).data
        data_package["project"] = parent_project

    resp = {
        "is_strategy": (
            JSONRenderer().render(workflow.is_strategy).decode("utf-8")
        ),
        "data_package": data_package,
        "user_permission": user_permission,
    }

    return resp


def get_my_projects(user, add, **kwargs):
    for_add = kwargs.get("for_add", False)
    permission_filter = {}
    if for_add:
        permission_filter["permission_type"] = ObjectPermission.PERMISSION_EDIT

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
                        list(Project.objects.filter(author=user, deleted=True))
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


# Retrieves a package of workflows and projects matching the specifications.
def get_workflow_data_package(user, project, **kwargs):
    type_filter = kwargs.get("type_filter", "workflow")
    self_only = kwargs.get("self_only", False)
    get_strategies = kwargs.get("get_strategies", False)
    this_project_sections = []
    all_published_sections = []
    for this_type in ["program", "course", "activity"]:
        if type_filter == "workflow" or type_filter == this_type:
            this_project_sections.append(
                {
                    "title": "",
                    "object_type": this_type,
                    "is_strategy": get_strategies,
                    "objects": get_workflow_info_boxes(
                        user,
                        this_type,
                        project=project,
                        this_project=True,
                        get_strategies=get_strategies,
                    ),
                }
            )
            if not self_only:
                all_published_sections.append(
                    {
                        "title": "",
                        "object_type": this_type,
                        "is_strategy": get_strategies,
                        "objects": get_workflow_info_boxes(
                            user,
                            this_type,
                            get_strategies=get_strategies,
                            get_favourites=True,
                        ),
                    }
                )
    if type_filter == "project":
        this_project_sections.append(
            {
                "title": "",
                "object_type": type_filter,
                "is_strategy": get_strategies,
                "objects": get_workflow_info_boxes(user, type_filter),
            }
        )
        if not self_only:
            all_published_sections.append(
                {
                    "title": "",
                    "object_type": type_filter,
                    "is_strategy": get_strategies,
                    "objects": get_workflow_info_boxes(
                        user, type_filter, get_favourites=True
                    ),
                }
            )

    first_header = _("This Project")
    empty_text = _("There are no applicable workflows in this project.")
    if project is None:
        first_header = _("Owned By You")
        empty_text = _("You do not own any projects. Create a project first.")
    data_package = {
        "current_project": {
            "title": first_header,
            "sections": this_project_sections,
            "emptytext": _(empty_text),
        },
    }
    if not self_only:
        data_package["all_published"] = {
            "title": _("Your Favourites"),
            "sections": all_published_sections,
            "emptytext": _(
                "You have no relevant favourites. Use the Explore menu to find and favourite content by other users."
            ),
        }
    return data_package


def get_workflow_info_boxes(user, workflow_type, **kwargs):
    project = kwargs.get("project", None)
    this_project = kwargs.get("this_project", True)
    get_strategies = kwargs.get("get_strategies", False)
    get_favourites = kwargs.get("get_favourites", False)
    model = get_model_from_str(workflow_type)
    permissions_view = {
        "user_permissions__user": user,
        "user_permissions__permission_type": ObjectPermission.PERMISSION_EDIT,
    }
    permissions_edit = {
        "user_permissions__user": user,
        "user_permissions__permission_type": ObjectPermission.PERMISSION_EDIT,
    }
    items = []
    if project is not None:
        # Add everything from the current project
        if this_project:
            items += model.objects.filter(
                project=project, is_strategy=False, deleted=False
            )
        # Add everything from other projects that the user has access to
        else:
            items += (
                list(
                    model.objects.filter(
                        author=user, is_strategy=False, deleted=False
                    ).exclude(project=project)
                )
                + list(
                    model.objects.filter(**permissions_edit)
                    .exclude(
                        project=project,
                    )
                    .exclude(project=None)
                    .exclude(Q(deleted=True) | Q(project__deleted=True))
                )
                + list(
                    model.objects.filter(**permissions_view)
                    .exclude(
                        project=project, deleted=False, project__deleted=True
                    )
                    .exclude(project=None)
                    .exclude(Q(deleted=True) | Q(project__deleted=True))
                )
            )
    else:
        favourites_and_strategies = {}
        published_or_user = {}
        if get_strategies:
            favourites_and_strategies["is_strategy"] = True
        elif workflow_type != "project":
            favourites_and_strategies["is_strategy"] = False
        if get_favourites:
            favourites_and_strategies["favourited_by__user"] = user
            published_or_user["published"] = True
        else:
            published_or_user["author"] = user
        if workflow_type == "project":
            exclude = Q(deleted=True)
        else:
            exclude = Q(deleted=True) | Q(project__deleted=True)
        items += (
            list(
                model.objects.filter(
                    **published_or_user,
                    **favourites_and_strategies,
                ).exclude(exclude)
            )
            + list(
                model.objects.filter(
                    **permissions_edit,
                    **favourites_and_strategies,
                ).exclude(exclude)
            )
            + list(
                model.objects.filter(
                    **permissions_view,
                    **favourites_and_strategies,
                ).exclude(exclude)
            )
        )

    return InfoBoxSerializer(items, many=True, context={"user": user}).data
