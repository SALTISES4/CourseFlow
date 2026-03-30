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
- Outcomes can orphan their threads when the outcome row is removed (e.g. workflow
  cascade). Cleaning those threads is a separate schema/task.
"""

from __future__ import annotations

from django.db.models.signals import post_delete
from django.dispatch import receiver

from course_flow_v2.core.models import Channel, Node, Section, Thread


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
