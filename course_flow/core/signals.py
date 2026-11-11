"""
Maintain related objects that Django's foreign-key directions do not delete.

Channel, Section, Node, and Workflow reference objects that they own. Deleting
those owners does not automatically delete the referenced objects, so post-delete
handlers remove them explicitly. Creation handlers initialize required threads,
teams, and typed metadata.

Deleting an Outcome can leave its thread orphaned. That lifecycle is not handled
here.
"""

from __future__ import annotations

from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from course_flow.core.enum import NodeType, WorkflowType
from course_flow.core.models import (
    Activitymeta,
    Channel,
    Coursemeta,
    Graph,
    Node,
    Outcome,
    Programmeta,
    Project,
    Section,
    Taskmeta,
    Team,
    Thread,
    Workflow,
)


@receiver(post_delete, sender=Channel)
def delete_thread_after_channel_delete(sender, instance, **kwargs) -> None:
    tid = instance.thread_id
    if tid:
        Thread.objects.filter(pk=tid).delete()


@receiver(post_delete, sender=Section)
def delete_thread_after_section_delete(sender, instance, **kwargs) -> None:
    tid = instance.thread_id
    if tid:
        Thread.objects.filter(pk=tid).delete()


@receiver(post_delete, sender=Node)
def delete_thread_after_node_delete(sender, instance, **kwargs) -> None:
    tid = instance.thread_id
    if tid:
        Thread.objects.filter(pk=tid).delete()


@receiver(pre_save, sender=Node)
def ensure_thread_on_node_create(sender, instance: Node, **kwargs) -> None:
    if instance._state.adding and instance.thread_id is None:
        instance.thread = Thread.objects.create()


@receiver(pre_save, sender=Channel)
def ensure_thread_on_channel_create(sender, instance: Channel, **kwargs) -> None:
    if instance._state.adding and instance.thread_id is None:
        instance.thread = Thread.objects.create()


@receiver(pre_save, sender=Section)
def ensure_thread_on_section_create(sender, instance: Section, **kwargs) -> None:
    if instance._state.adding and instance.thread_id is None:
        instance.thread = Thread.objects.create()


@receiver(pre_save, sender=Outcome)
def ensure_thread_on_outcome_create(sender, instance: Outcome, **kwargs) -> None:
    if instance._state.adding and instance.thread_id is None:
        instance.thread = Thread.objects.create()


@receiver(post_save, sender=Project)
def ensure_project_team_on_project_create(
    sender, instance: Project, created: bool, **kwargs
) -> None:
    if created:
        Team.objects.get_or_create(project=instance)


@receiver(post_delete, sender=Workflow)
def delete_graph_after_workflow_delete(sender, instance: Workflow, **kwargs) -> None:
    """
    Delete the graph owned by a deleted workflow.
    """
    gid = instance.graph_id
    if gid:
        Graph.objects.filter(pk=gid).delete()


@receiver(post_save, sender=Workflow)
def ensure_workflow_typed_meta_on_workflow_create(
    sender, instance: Workflow, created: bool, **kwargs
) -> None:
    if not created:
        return
    # Task workflows do not get taskmeta rows (taskmeta is for grid nodes only).
    if instance.workflow_type == WorkflowType.PROGRAM:
        Programmeta.objects.get_or_create(workflow=instance)
    elif instance.workflow_type == WorkflowType.COURSE:
        Coursemeta.objects.get_or_create(workflow=instance)
    elif instance.workflow_type == WorkflowType.ACTIVITY:
        Activitymeta.objects.get_or_create(workflow=instance)


@receiver(post_save, sender=Node)
def ensure_node_typed_meta_on_node_create(
    sender, instance: Node, created: bool, **kwargs
) -> None:
    if not created:
        return
    if instance.node_type == NodeType.COURSE:
        Coursemeta.objects.get_or_create(node=instance)
    elif instance.node_type == NodeType.ACTIVITY:
        Activitymeta.objects.get_or_create(node=instance)
    elif instance.node_type == NodeType.TASK:
        Taskmeta.objects.get_or_create(node=instance)
