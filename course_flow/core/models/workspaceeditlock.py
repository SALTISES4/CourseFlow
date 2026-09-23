import uuid

from django.db import models

from course_flow.core.models.project import Project
from course_flow.core.models.user import User
from course_flow.core.models.workflow import Workflow


class WorkspaceEditLock(models.Model):
    """One short-lived edit lease for exactly one project or workflow."""

    project = models.OneToOneField(
        Project,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="edit_lock",
    )
    workflow = models.OneToOneField(
        Workflow,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="edit_lock",
    )
    holder = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="workspace_edit_locks",
    )
    version = models.UUIDField(default=uuid.uuid4, editable=False)
    expires_at = models.DateTimeField()
    date_created = models.DateTimeField(auto_now_add=True)
    modified_on = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cf_workspace_edit_lock"
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(project__isnull=False, workflow__isnull=True)
                    | models.Q(project__isnull=True, workflow__isnull=False)
                ),
                name="cf_workspace_edit_lock_exactly_one_resource",
            )
        ]
        indexes = [
            models.Index(
                fields=["expires_at"],
                name="cf_workspac_expires_001c54_idx",
            )
        ]
