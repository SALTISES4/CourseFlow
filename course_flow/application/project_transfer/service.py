"""Application orchestration for importing a validated project snapshot."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Protocol
from uuid import UUID

from course_flow.application.project_transfer.contract import (
    ProjectSnapshotBundle,
)

IdentityPolicy = Literal["preserve", "regenerate"]


@dataclass(frozen=True)
class ProjectImportResult:
    project_uuid: UUID
    workflow_count: int
    node_count: int
    outcome_count: int


class ProjectSnapshotWriter(Protocol):
    def write(
        self,
        *,
        snapshot: ProjectSnapshotBundle,
        owner_id: int,
        identity_policy: IdentityPolicy,
    ) -> ProjectImportResult: ...


class ProjectImportService:
    """Transport-neutral entry point shared by commands and future APIs/jobs."""

    def __init__(self, writer: ProjectSnapshotWriter) -> None:
        self._writer = writer

    def import_project(
        self,
        *,
        snapshot: ProjectSnapshotBundle,
        owner_id: int,
        identity_policy: IdentityPolicy = "preserve",
    ) -> ProjectImportResult:
        if identity_policy not in ("preserve", "regenerate"):
            raise ValueError(f"unsupported identity policy: {identity_policy!r}")
        return self._writer.write(
            snapshot=snapshot,
            owner_id=owner_id,
            identity_policy=identity_policy,
        )
