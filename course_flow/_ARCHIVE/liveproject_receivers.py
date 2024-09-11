#########################################################
# THIS FILE SHOULD BE ARCHIVED
#########################################################
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.db.models.signals import post_save, pre_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone

from course_flow.models.activity import Activity
from course_flow.models.column import Column
from course_flow.models.comment import Comment
from course_flow.models.course import Course
from course_flow.models.favourite import Favourite
from course_flow.models.liveprojectmodels.liveAssignment import LiveAssignment
from course_flow.models.liveprojectmodels.liveProject import LiveProject
from course_flow.models.liveprojectmodels.liveProjectUser import (
    LiveProjectUser,
)
from course_flow.models.liveprojectmodels.userAssignment import UserAssignment
from course_flow.models.node import Node
from course_flow.models.objectPermission import ObjectPermission
from course_flow.models.outcome import Outcome
from course_flow.models.program import Program
from course_flow.models.relations.columnWorkflow import ColumnWorkflow
from course_flow.models.relations.nodeLink import NodeLink
from course_flow.models.relations.nodeWeek import NodeWeek
from course_flow.models.relations.outcomeHorizontalLink import (
    OutcomeHorizontalLink,
)
from course_flow.models.relations.outcomeNode import OutcomeNode
from course_flow.models.relations.outcomeOutcome import OutcomeOutcome
from course_flow.models.relations.outcomeWorkflow import OutcomeWorkflow
from course_flow.models.relations.weekWorkflow import WeekWorkflow
from course_flow.models.relations.workflowProject import WorkflowProject
from course_flow.models.week import Week
from course_flow.models.workflow import Workflow
from course_flow.utils import get_all_outcomes_for_outcome

# The following receivers are part of a now-decomissioned Live Project mode.
# The receivers and tables are kept for backwards compatibility, in case
# the feature is once again needed.


# Do not delete
@receiver(pre_save, sender=LiveProjectUser)
def delete_existing_role(sender, instance, **kwargs):
    LiveProjectUser.objects.filter(
        user=instance.user,
        liveproject=instance.liveproject,
    ).delete()


# Do not delete
@receiver(post_save, sender=LiveProjectUser)
def delete_role_none(sender, instance, **kwargs):
    if instance.role_type == instance.ROLE_NONE:
        instance.delete()


# Do not delete
@receiver(pre_save, sender=LiveProject)
def add_all_workflows(sender, instance, **kwargs):
    if instance.default_all_workflows_visible:
        if LiveProject.objects.get(
            pk=instance.pk
        ).default_all_workflows_visible:
            return
        instance.visible_workflows.add(
            *Workflow.objects.filter(project=instance.project, deleted=False)
        )


# Do not delete
@receiver(post_save, sender=LiveProject)
def add_owner_to_liveproject(sender, instance, created, **kwargs):
    if created:
        LiveProjectUser.objects.create(
            liveproject=instance,
            user=instance.project.author,
            role_type=LiveProjectUser.ROLE_TEACHER,
        )


# Do not delete
@receiver(post_save, sender=WorkflowProject)
def add_to_visible_workflows(sender, instance, created, **kwargs):
    if created and abs(
        instance.workflow.created_on - timezone.now()
    ) < timezone.timedelta(seconds=10):
        project = instance.project
        if project is not None:
            try:
                liveproject = project.liveproject
                if liveproject.default_all_workflows_visible:
                    liveproject.visible_workflows.add(instance.workflow)
            except AttributeError:
                pass


# Do not delete
@receiver(pre_save, sender=Workflow)
def add_or_remove_visible_workflow_on_delete_restore(
    sender, instance, **kwargs
):
    workflow = Workflow.objects.get(pk=instance.pk)
    if workflow.deleted != instance.deleted:
        project = instance.get_project()
        if project is not None:
            try:
                liveproject = project.liveproject
                if instance.deleted:
                    liveproject.visible_workflows.remove(workflow)
                elif liveproject.default_all_workflows_visible:
                    liveproject.visible_workflows.add(workflow)
            except AttributeError:
                pass


# Do not delete
@receiver(post_save, sender=LiveProjectUser)
def add_user_to_assignments(sender, instance, created, **kwargs):
    if (
        instance.role_type == LiveProjectUser.ROLE_STUDENT
        and instance.liveproject.default_assign_to_all
    ):
        for assignment in LiveAssignment.objects.filter(
            liveproject=instance.liveproject,
        ).exclude(userassignment__user=instance.user):
            UserAssignment.objects.create(
                user=instance.user, assignment=assignment
            )

            @receiver(post_save, sender=LiveProjectUser)
            def add_user_to_assignments(sender, instance, created, **kwargs):
                if instance.role_type == LiveProjectUser.ROLE_NONE:
                    UserAssignment.objects.filter(
                        assignment__liveproject=instance.liveproject
                    ).delete()

            @receiver(post_save, sender=LiveAssignment)
            def live_assignment_creation_defaults(
                sender, instance, created, **kwargs
            ):
                if created:
                    liveproject = instance.liveproject
                    instance.self_reporting = (
                        liveproject.default_self_reporting
                    )
                    instance.single_completion = (
                        liveproject.default_single_completion
                    )
                    if liveproject.default_assign_to_all:
                        students = LiveProjectUser.objects.filter(
                            liveproject=liveproject,
                            role_type=LiveProjectUser.ROLE_STUDENT,
                        )
                        for student in students:
                            UserAssignment.objects.create(
                                user=student.user, assignment=instance
                            )
