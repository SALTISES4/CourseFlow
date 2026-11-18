"""
Shared typed-meta field definitions for workflow and grid-node rows.
"""

from typing import TYPE_CHECKING

from django.db import models


class NodeActivityMetaFields(models.Model):
    """
    Mixin fields for activity-layer metadata (workflow or node row).
    """

    if TYPE_CHECKING:
        id: int

    context_classification = models.CharField(max_length=64, null=True, blank=True)
    task_classification = models.CharField(max_length=64, null=True, blank=True)
    time_required_minutes = models.PositiveBigIntegerField(null=True, blank=True)
    represents_workflow = models.BooleanField(default=False)

    class Meta:
        abstract = True


class NodeTaskMetaFields(models.Model):
    """
    Mixin fields for task-layer metadata (node rows only in current product rules).
    """

    if TYPE_CHECKING:
        id: int

    context_classification = models.CharField(max_length=64, null=True, blank=True)
    task_classification = models.CharField(max_length=64, null=True, blank=True)
    time_required_minutes = models.PositiveBigIntegerField(null=True, blank=True)
    represents_workflow = models.BooleanField(default=False)

    class Meta:
        abstract = True
