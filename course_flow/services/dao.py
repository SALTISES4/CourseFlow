import logging

from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext as _

import course_flow.models.project
from course_flow import models
from course_flow.apps import logger
from course_flow.models.objectPermission import Permission


class DAO:
    owned_throughmodels = [
        "node",
        "nodeweek",
        "week",
        "weekworkflow",
        "workflow",
        "workflowproject",
        "project",
        "columnworkflow",
        "workflow",
        "workflowproject",
        "project",
        "outcome",
        "outcomeoutcome",
        "outcome",
    ]

    @staticmethod
    def get_model_from_str(model_str: str):
        return ContentType.objects.get(model=model_str).model_class()

    @staticmethod
    def get_parent_model_str(model_str: str) -> str:
        return DAO.owned_throughmodels[
            DAO.owned_throughmodels.index(model_str) + 1
        ]

    @staticmethod
    def get_parent_model(model_str: str):
        return ContentType.objects.get(
            model=DAO.get_parent_model_str(model_str)
        ).model_class()

    @staticmethod
    def get_descendant_outcomes(outcome):
        return models.Outcome.objects.filter(
            Q(parent_outcomes=outcome)
            | Q(parent_outcomes__parent_outcomes=outcome)
        )

    @staticmethod
    def get_all_outcomes_for_outcome(outcome):
        outcomes = models.Outcome.objects.filter(
            Q(parent_outcomes=outcome)
            | Q(parent_outcomes__parent_outcomes=outcome)
        ).prefetch_related(
            "outcome_horizontal_links", "child_outcome_links", "sets"
        )
        outcomeoutcomes = models.OutcomeOutcome.objects.filter(
            Q(parent=outcome) | Q(parent__parent_outcomes=outcome)
        )
        return outcomes, outcomeoutcomes

    @staticmethod
    def get_all_outcomes_for_workflow(workflow):
        outcomes = models.Outcome.objects.filter(
            Q(workflow=workflow)
            | Q(parent_outcomes__workflow=workflow)
            | Q(parent_outcomes__parent_outcomes__workflow=workflow)
        ).prefetch_related(
            "outcome_horizontal_links", "child_outcome_links", "sets"
        )
        outcomeoutcomes = models.OutcomeOutcome.objects.filter(
            Q(parent__workflow=workflow)
            | Q(parent__parent_outcomes__workflow=workflow)
        )
        return outcomes, outcomeoutcomes

    @staticmethod
    def get_all_outcomes_ordered_for_outcome(outcome):
        outcomes = [outcome]
        for outcomeoutcome in outcome.child_outcome_links.filter(
            child__deleted=False
        ).order_by("rank"):
            outcomes += DAO.get_all_outcomes_ordered_for_outcome(
                outcomeoutcome.child
            )
        return outcomes

    @staticmethod
    def get_all_outcomes_ordered(workflow):
        outcomes = []
        for outcomeworkflow in workflow.outcomeworkflow_set.filter(
            outcome__deleted=False
        ).order_by("rank"):
            outcomes += DAO.get_all_outcomes_ordered_for_outcome(
                outcomeworkflow.outcome
            )
        return outcomes

    @staticmethod
    def get_base_outcomes_ordered_filtered(workflow, extra_filter):
        return (
            models.Outcome.objects.filter(workflow=workflow, deleted=False)
            .filter(extra_filter)
            .order_by("outcomeworkflow__rank")
        )

    @staticmethod
    def get_all_outcomes_ordered_filtered(workflow, extra_filter):
        outcomes = []
        for outcome in (
            models.Outcome.objects.filter(workflow=workflow, deleted=False)
            .filter(extra_filter)
            .order_by("outcomeworkflow__rank")
        ):
            outcomes += DAO.get_all_outcomes_ordered_for_outcome(outcome)
        return outcomes

    @staticmethod
    def get_unique_outcomenodes(node):
        return (
            node.outcomenode_set.exclude(
                Q(outcome__deleted=True)
                | Q(outcome__parent_outcomes__deleted=True)
                | Q(outcome__parent_outcomes__parent_outcomes__deleted=True)
            )
            .exclude(outcome__parent_outcomes__node=node)
            .exclude(outcome__parent_outcomes__parent_outcomes__node=node)
            .order_by(
                "outcome__parent_outcome_links__parent__parent_outcome_links__parent__outcomeworkflow__rank",
                "outcome__parent_outcome_links__parent__outcomeworkflow__rank",
                "outcome__outcomeworkflow__rank",
                "outcome__parent_outcome_links__parent__parent_outcome_links__rank",
                "outcome__parent_outcome_links__rank",
            )
        )

    @staticmethod
    def get_outcomenodes(node):
        return node.outcomenode_set.exclude(
            Q(outcome__deleted=True)
            | Q(outcome__parent_outcomes__deleted=True)
            | Q(outcome__parent_outcomes__parent_outcomes__deleted=True)
        ).order_by(
            "outcome__parent_outcome_links__parent__parent_outcome_links__parent__outcomeworkflow__rank",
            "outcome__parent_outcome_links__parent__outcomeworkflow__rank",
            "outcome__outcomeworkflow__rank",
            "outcome__parent_outcome_links__parent__parent_outcome_links__rank",
            "outcome__parent_outcome_links__rank",
        )

    @staticmethod
    def get_unique_outcomehorizontallinks(outcome):
        return (
            outcome.outcome_horizontal_links.exclude(
                Q(parent_outcome__deleted=True)
                | Q(parent_outcome__parent_outcomes__deleted=True)
                | Q(
                    parent_outcome__parent_outcomes__parent_outcomes__deleted=True
                )
            )
            .exclude(
                parent_outcome__parent_outcomes__reverse_horizontal_outcomes=outcome
            )
            .exclude(
                parent_outcome__parent_outcomes__parent_outcomes__reverse_horizontal_outcomes=outcome
            )
            .order_by(
                "parent_outcome__parent_outcome_links__parent__parent_outcome_links__parent__outcomeworkflow__rank",
                "parent_outcome__parent_outcome_links__parent__outcomeworkflow__rank",
                "parent_outcome__outcomeworkflow__rank",
                "parent_outcome__parent_outcome_links__parent__parent_outcome_links__rank",
                "parent_outcome__parent_outcome_links__rank",
            )
        )

    @staticmethod
    def get_parent_nodes_for_workflow(workflow):
        nodes = (
            models.Node.objects.filter(linked_workflow=workflow)
            .exclude(
                Q(deleted=True)
                | Q(week__deleted=True)
                | Q(week__workflow__deleted=True)
            )
            .prefetch_related("outcomenode_set")
        )
        return nodes

    @staticmethod
    def get_nondeleted_favourites(user):
        return list(
            course_flow.models.project.Project.objects.filter(
                favourited_by__user=user
            )
        ) + list(models.Workflow.objects.filter(favourited_by__user=user))

    @staticmethod
    def check_possible_parent(workflow, parent_workflow, same_project):
        order = ["activity", "course", "program"]
        try:
            if (
                order.index(workflow.type)
                == order.index(parent_workflow.type) - 1
            ):
                if same_project:
                    if workflow.get_project() == parent_workflow.get_project():
                        return True
                else:
                    return True
        except IndexError as e:
            logger.exception("An error occurred")
            pass
        return False

    @staticmethod
    def get_user_permission(obj, user):
        if obj.type in ["workflow", "course", "activity", "program"]:
            obj = models.Workflow.objects.get(pk=obj.pk)

        if user is None or not user.is_authenticated:
            return Permission.PERMISSION_NONE.value

        if obj.author == user:
            return Permission.PERMISSION_EDIT.value

        permissions = models.ObjectPermission.objects.filter(
            user=user,
            content_type=ContentType.objects.get_for_model(obj),
            object_id=obj.id,
        )

        if permissions.count() == 0:
            return Permission.PERMISSION_NONE.value

        return permissions.first().permission_type

    @staticmethod
    def user_workflow_url(workflow, user):
        user_permission = DAO.get_user_permission(workflow, user)
        can_view = False
        is_public = workflow.public_view

        if user is not None and user.is_authenticated and workflow.published:
            if (
                Group.objects.get(name=settings.TEACHER_GROUP)
                in user.groups.all()
            ):
                can_view = True

        if user_permission != Permission.PERMISSION_NONE.value:
            can_view = True

        if can_view:
            return reverse(
                "course_flow:workflow-detail", kwargs={"pk": workflow.pk}
            )

        if is_public:
            return reverse(
                "course_flow:workflow-public", kwargs={"pk": workflow.pk}
            )

        if user is None or not user.is_authenticated:
            return "nouser"

        return "noaccess"

    @staticmethod
    def user_project_url(project, user):
        user_permission = DAO.get_user_permission(project, user)
        if not user.is_authenticated:
            return "noaccess"
        if user_permission != Permission.PERMISSION_NONE.value:
            return reverse(
                "course_flow:project-detail", kwargs={"pk": project.pk}
            )
        return ""

    #########################################################
    # NOTIFICATION
    #########################################################
    @staticmethod
    def make_user_notification(
        source_user, target_user, notification_type, content_object, **kwargs
    ):
        if source_user is not target_user:
            extra_text = kwargs.get("extra_text", None)
            comment = kwargs.get("comment", None)
            text = ""
            if source_user is not None:
                text += source_user.username + " "
            else:
                text += _("Someone ")
            if notification_type == models.Notification.TYPE_SHARED:
                text += _("added you to the ")
            elif notification_type == models.Notification.TYPE_COMMENT:
                text += _("notified you in a comment in ")
            else:
                text += _(" notified you for ")
            text += _(content_object.type) + " " + content_object.__str__()
            if extra_text is not None:
                text += ": " + extra_text
            models.Notification.objects.create(
                user=target_user,
                source_user=source_user,
                notification_type=notification_type,
                content_object=content_object,
                text=text,
                comment=comment,
            )

            # clear any notifications older than two months
            target_user.notifications.filter(
                created_on__lt=timezone.now() - timezone.timedelta(days=60)
            ).delete()
