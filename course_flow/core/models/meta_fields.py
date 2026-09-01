"""Shared typed-meta field definitions for workflow and grid-node rows."""

from django.db import models


class NodeActivityMetaFields(models.Model):
    """Mixin fields for activity-layer metadata (workflow or node row)."""

    context_classification = models.CharField(
        max_length=64, null=True, blank=True
    )
    task_classification = models.CharField(
        max_length=64, null=True, blank=True
    )
    time_required = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    time_units = models.CharField(
        max_length=16, null=True, blank=True
    )
    represents_workflow = models.BooleanField(default=False)

    class Meta:
        abstract = True


class NodeTaskMetaFields(models.Model):
    """Mixin fields for task-layer metadata (node rows only in current product rules)."""

    context_classification = models.CharField(
        max_length=64, null=True, blank=True
    )
    task_classification = models.CharField(
        max_length=64, null=True, blank=True
    )
    time_required = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    time_units = models.CharField(
        max_length=16, null=True, blank=True
    )
    represents_workflow = models.BooleanField(default=False)

    class Meta:
        abstract = True
