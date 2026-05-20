"""
Cascade helpers for ownership directions Django FKs do not express directly.

Audit (Part A):
- ``Channel.thread`` / ``Section.thread`` point *from* parent *to* ``Thread``; deleting the
  parent does not auto-delete the thread via FK direction. We delete the linked thread in
  ``post_delete`` on ``Channel`` / ``Section``.
- ``Node.thread`` points *from* node *to* thread; deleting the node does not delete the
  thread. We delete the linked thread in ``post_delete`` on ``Node``.
- ``Outcome`` rows reference ``Thread`` with ``PROTECT``; deleting a thread that is still
  referenced by an ``Outcome`` will raise ``ProtectedError`` (deterministic failure).
- ``Tag`` is decoupled from ``Project`` with ``SET_NULL`` so project deletion does not
  delete tag rows (shared / reusable tag records per product rules).
- ``NodeOutcome`` / ``Edge`` already CASCADE from ``Node``; shared ``Outcome`` entities
  are not deleted when a node is deleted—only join rows are.

Ambiguity / follow-up:
- Outcomes can orphan their threads when the outcome row is removed (e.g. graph
  cascade). Cleaning those threads is a separate schema/task.
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
    """When a workflow row is removed, drop its graph so project/user cascades do not orphan graphs."""
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
