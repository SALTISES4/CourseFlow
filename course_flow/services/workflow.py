from course_flow.models import Activity, Course, Notification
from course_flow.models.objectset import ObjectSet
from course_flow.models.relations import NodeLink, NodeWeek
from course_flow.models.relations.outcomeNode import OutcomeNode
from course_flow.serializers import (
    ColumnSerializerShallow,
    ColumnWorkflowSerializerShallow,
    LibraryObjectSerializer,
    NodeLinkSerializerShallow,
    NodeSerializerShallow,
    NodeWeekSerializerShallow,
    ObjectSetSerializerShallow,
    OutcomeNodeSerializerShallow,
    OutcomeOutcomeSerializerShallow,
    OutcomeSerializerShallow,
    OutcomeWorkflowSerializerShallow,
    WeekSerializerShallow,
    WeekWorkflowSerializerShallow,
    WorkflowSerializerShallow,
    serializer_lookups_shallow,
)

"""
@todo What is this file doing?

@todo should not be in project root
"""
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.utils.translation import gettext as _

from course_flow.models.objectPermission import Permission
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.models.workflow_objects.column import Column
from course_flow.models.workflow_objects.node import Node
from course_flow.models.workflow_objects.week import Week
from course_flow.models.workspace.workflow import Workflow
from course_flow.serializers import ProjectSerializerShallow
from course_flow.services import DAO


class WorkflowService:
    @staticmethod
    def get_workflow_data_package(user, project, **kwargs):
        """

        what does this mean...?

        Retrieves a package of workflows and projects matching the specifications
        :param user:
        :param project:
        :param kwargs:
        :return:
        """
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
                        "objects": WorkflowService.get_workflow_info_boxes(
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
                            "objects": WorkflowService.get_workflow_info_boxes(
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
                    "objects": WorkflowService.get_workflow_info_boxes(user, type_filter),
                }
            )
            if not self_only:
                all_published_sections.append(
                    {
                        "title": "",
                        "object_type": type_filter,
                        "is_strategy": get_strategies,
                        "objects": WorkflowService.get_workflow_info_boxes(
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

    @staticmethod
    def get_workflow_info_boxes(user, workflow_type, **kwargs):
        project = kwargs.get("project", None)
        this_project = kwargs.get("this_project", True)
        get_strategies = kwargs.get("get_strategies", False)
        get_favourites = kwargs.get("get_favourites", False)
        model = DAO.get_model_from_str(workflow_type)
        permissions_view = {
            "user_permissions__user": user,
            "user_permissions__permission_type": Permission.PERMISSION_EDIT.value,
        }
        permissions_edit = {
            "user_permissions__user": user,
            "user_permissions__permission_type": Permission.PERMISSION_EDIT.value,
        }
        items = []
        if project is not None:
            # Add everything from the current project
            if this_project:
                items += model.objects.filter(project=project, is_strategy=False, deleted=False)
            # Add everything from other projects that the user has access to
            else:
                items += (
                    list(
                        model.objects.filter(author=user, is_strategy=False, deleted=False).exclude(
                            project=project
                        )
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
                            project=project,
                            deleted=False,
                            project__deleted=True,
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

        return LibraryObjectSerializer(items, many=True, context={"user": user}).data

    @staticmethod
    def get_workflow_choices():
        return {
            "columnChoices": [
                {"type": choice[0], "name": choice[1]}
                for choice in Column._meta.get_field("column_type").choices
            ],
            "contextChoices": [
                {"type": choice[0], "name": choice[1]}
                for choice in Node._meta.get_field("context_classification").choices
            ],
            "taskChoices": [
                {"type": choice[0], "name": choice[1]}
                for choice in Node._meta.get_field("task_classification").choices
            ],
            "timeChoices": [
                {"type": choice[0], "name": choice[1]}
                for choice in Node._meta.get_field("time_units").choices
            ],
            "outcomeTypeChoices": [
                {"type": choice[0], "name": choice[1]}
                for choice in Workflow._meta.get_field("outcomes_type").choices
            ],
            "outcomeSortChoices": [
                {"type": choice[0], "name": choice[1]}
                for choice in Workflow._meta.get_field("outcomes_sort").choices
            ],
            "strategyClassificationChoices": [
                {"type": choice[0], "name": choice[1]}
                for choice in Week._meta.get_field("strategy_classification").choices
            ],
        }

    # @staticmethod
    # def get_workflow(workflow, user):
    #     data_package = {}
    #
    #     user_permission = DAO.get_user_permission(workflow, user)
    #
    #     if not workflow.is_strategy:
    #         project = WorkflowProject.objects.get(workflow=workflow).project
    #         parent_project = ProjectSerializerShallow(
    #             project, context={"user": user}
    #         ).data
    #         data_package["project"] = parent_project
    #
    #     resp = {
    #         "data_package": data_package,
    #         "user_permission": user_permission,
    #     }
    #
    #     return resp

    # @staticmethod
    # def get_workflow_data_flat(workflow, user):
    #     SerializerClass = serializer_lookups_shallow[workflow.type]
    #     columnworkflows = workflow.columnworkflow_set.all()
    #     weekworkflows = workflow.weekworkflow_set.all()
    #     columns = workflow.columns.all()
    #     weeks = workflow.weeks.all()
    #     nodeweeks = NodeWeek.objects.filter(week__workflow=workflow)
    #     nodes = Node.objects.filter(week__workflow=workflow).prefetch_related(
    #         "outcomenode_set",
    #         "liveassignment_set",
    #     )
    #     nodelinks = NodeLink.objects.filter(source_node__in=nodes)
    #
    #     if not workflow.is_strategy:
    #         outcomeworkflows = workflow.outcomeworkflow_set.all()
    #         outcomes, outcomeoutcomes = DAO.get_all_outcomes_for_workflow(workflow)
    #         outcomenodes = OutcomeNode.objects.filter(
    #             node__week__workflow=workflow
    #         )
    #         objectsets = ObjectSet.objects.filter(project__workflows=workflow)
    #
    #     data_flat = {
    #         "workflow": SerializerClass(workflow, context={"user": user}).data,
    #         "columnworkflow": ColumnWorkflowSerializerShallow(
    #             columnworkflows, many=True
    #         ).data,
    #         "column": ColumnSerializerShallow(columns, many=True).data,
    #         "weekworkflow": WeekWorkflowSerializerShallow(
    #             weekworkflows, many=True
    #         ).data,
    #         "week": WeekSerializerShallow(weeks, many=True).data,
    #         "nodeweek": NodeWeekSerializerShallow(nodeweeks, many=True).data,
    #         "nodelink": NodeLinkSerializerShallow(nodelinks, many=True).data,
    #         "node": NodeSerializerShallow(
    #             nodes, many=True, context={"user": user}
    #         ).data,
    #     }
    #
    #     if not workflow.is_strategy:
    #         data_flat["outcomeworkflow"] = OutcomeWorkflowSerializerShallow(
    #             outcomeworkflows, many=True
    #         ).data
    #         data_flat["outcome"] = OutcomeSerializerShallow(
    #             outcomes, many=True, context={"type": workflow.type + " outcome"}
    #         ).data
    #         data_flat["outcomeoutcome"] = OutcomeOutcomeSerializerShallow(
    #             outcomeoutcomes, many=True
    #         ).data
    #         data_flat["outcomenode"] = OutcomeNodeSerializerShallow(
    #             outcomenodes, many=True
    #         ).data
    #         data_flat["objectset"] = ObjectSetSerializerShallow(
    #             objectsets, many=True
    #         ).data
    #         if (
    #             workflow.type == "course"
    #             and user is not None
    #             and user.is_authenticated
    #         ):
    #             data_flat["strategy"] = WorkflowSerializerShallow(
    #                 Course.objects.filter(
    #                     author=user, is_strategy=True, deleted=False
    #                 ),
    #                 many=True,
    #                 context={"user": user},
    #             ).data
    #             data_flat["saltise_strategy"] = WorkflowSerializerShallow(
    #                 Course.objects.filter(
    #                     from_saltise=True,
    #                     is_strategy=True,
    #                     published=True,
    #                     deleted=False,
    #                 ),
    #                 many=True,
    #                 context={"user": user},
    #             ).data
    #         elif (
    #             workflow.type == "activity"
    #             and user is not None
    #             and user.is_authenticated
    #         ):
    #             data_flat["strategy"] = WorkflowSerializerShallow(
    #                 Activity.objects.filter(
    #                     author=user, is_strategy=True, deleted=False
    #                 ),
    #                 many=True,
    #                 context={"user": user},
    #             ).data
    #             data_flat["saltise_strategy"] = WorkflowSerializerShallow(
    #                 Activity.objects.filter(
    #                     from_saltise=True,
    #                     is_strategy=True,
    #                     published=True,
    #                     deleted=False,
    #                 ),
    #                 many=True,
    #                 context={"user": user},
    #             ).data
    #
    #     if user.pk is not None:
    #         data_flat["unread_comments"] = [
    #             x.comment.id
    #             for x in Notification.objects.filter(
    #                 user=user,
    #                 content_type=ContentType.objects.get_for_model(Workflow),
    #                 object_id=workflow.pk,
    #                 is_unread=True,
    #             ).exclude(comment=None)
    #         ]
    #
    #     return data_flat

    @staticmethod
    def get_workflow_full(workflow, user):
        # Determine the serializer class
        SerializerClass = serializer_lookups_shallow[workflow.type]

        # Fetch related objects
        columnworkflows = workflow.columnworkflow_set.all()
        weekworkflows = workflow.weekworkflow_set.all()
        columns = workflow.columns.all()
        weeks = workflow.weeks.all()
        nodeweeks = NodeWeek.objects.filter(week__workflow=workflow)
        nodes = Node.objects.filter(week__workflow=workflow).prefetch_related(
            "outcomenode_set", "liveassignment_set"
        )
        nodelinks = NodeLink.objects.filter(source_node__in=nodes)

        # Initialize data
        data = {
            "workflow": SerializerClass(workflow, context={"user": user}).data,
            "columnworkflow": ColumnWorkflowSerializerShallow(columnworkflows, many=True).data,
            "column": ColumnSerializerShallow(columns, many=True).data,
            "weekworkflow": WeekWorkflowSerializerShallow(weekworkflows, many=True).data,
            "week": WeekSerializerShallow(weeks, many=True).data,
            "nodeweek": NodeWeekSerializerShallow(nodeweeks, many=True).data,
            "nodelink": NodeLinkSerializerShallow(nodelinks, many=True).data,
            "node": NodeSerializerShallow(nodes, many=True, context={"user": user}).data,
        }

        # If the workflow is not a strategy, add additional data
        if not workflow.is_strategy:
            WorkflowService.add_workflow_outcomes(data, workflow, user)
            # Add strategies based on the workflow type
            WorkflowService.add_strategies(data, workflow, user)
            WorkflowService.add_project(data, workflow, user)

        # Add unread comments if the user is authenticated
        if user and user.pk:
            data["unread_comments"] = WorkflowService.add_unread_comments(data, workflow, user)

        return data

    @staticmethod
    def add_project(data, workflow, user):
        project = WorkflowProject.objects.get(workflow=workflow).project
        parent_project = ProjectSerializerShallow(project, context={"user": user}).data

        data["parent_project"] = parent_project

    @staticmethod
    def add_workflow_outcomes(data, workflow, user):
        # Fetch and serialize additional objects for non-strategy workflows
        outcomeworkflows = workflow.outcomeworkflow_set.all()
        outcomes, outcomeoutcomes = DAO.get_all_outcomes_for_workflow(workflow)
        outcomenodes = OutcomeNode.objects.filter(node__week__workflow=workflow)
        objectsets = ObjectSet.objects.filter(project__workflows=workflow)

        data.update(
            {
                "outcomeworkflow": OutcomeWorkflowSerializerShallow(
                    outcomeworkflows, many=True
                ).data,
                "outcome": OutcomeSerializerShallow(
                    outcomes,
                    many=True,
                    context={"type": workflow.type + " outcome"},
                ).data,
                "outcomeoutcome": OutcomeOutcomeSerializerShallow(outcomeoutcomes, many=True).data,
                "outcomenode": OutcomeNodeSerializerShallow(outcomenodes, many=True).data,
                "objectset": ObjectSetSerializerShallow(objectsets, many=True).data,
            }
        )

    @staticmethod
    def add_strategies(data, workflow, user):
        # Add strategies for "course" and "activity" types
        if user and user.is_authenticated:
            if workflow.type == "course":
                data["strategy"] = WorkflowSerializerShallow(
                    Course.objects.filter(author=user, is_strategy=True, deleted=False),
                    many=True,
                    context={"user": user},
                ).data
                data["saltise_strategy"] = WorkflowSerializerShallow(
                    Course.objects.filter(
                        from_saltise=True,
                        is_strategy=True,
                        published=True,
                        deleted=False,
                    ),
                    many=True,
                    context={"user": user},
                ).data
            elif workflow.type == "activity":
                data["strategy"] = WorkflowSerializerShallow(
                    Activity.objects.filter(author=user, is_strategy=True, deleted=False),
                    many=True,
                    context={"user": user},
                ).data
                data["saltise_strategy"] = WorkflowSerializerShallow(
                    Activity.objects.filter(
                        from_saltise=True,
                        is_strategy=True,
                        published=True,
                        deleted=False,
                    ),
                    many=True,
                    context={"user": user},
                ).data

    @staticmethod
    def add_unread_comments(data, workflow, user):
        # Get unread comments for the user on the specific workflow
        comments = [
            x.comment.id
            for x in Notification.objects.filter(
                user=user,
                content_type=ContentType.objects.get_for_model(Workflow),
                object_id=workflow.pk,
                is_unread=True,
            ).exclude(comment=None)
        ]
        data["unread_comments"] = comments
