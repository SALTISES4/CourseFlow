"""Accumulate graph mutation deltas and build the canonical mutation envelope (internal API)."""

from __future__ import annotations

from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class GraphMutationDeltaBuilder:
    """Narrow helper to collect created/updated/deleted graph entities for one mutation."""

    nodes_created: list[dict] = field(default_factory=list)
    nodes_updated: list[dict] = field(default_factory=list)
    nodes_deleted: list[UUID] = field(default_factory=list)
    channels_created: list[dict] = field(default_factory=list)
    channels_updated: list[dict] = field(default_factory=list)
    channels_deleted: list[UUID] = field(default_factory=list)
    sections_created: list[dict] = field(default_factory=list)
    sections_updated: list[dict] = field(default_factory=list)
    sections_deleted: list[UUID] = field(default_factory=list)
    edges_created: list[dict] = field(default_factory=list)
    edges_updated: list[dict] = field(default_factory=list)
    edges_deleted: list[int] = field(default_factory=list)
    outcomes_created: list[dict] = field(default_factory=list)
    outcomes_updated: list[dict] = field(default_factory=list)
    outcomes_deleted: list[UUID] = field(default_factory=list)

    def add_node_created(self, payload: dict) -> None:
        self.nodes_created.append(payload)

    def add_node_updated(self, payload: dict) -> None:
        self.nodes_updated.append(payload)

    def add_node_deleted(self, node_uuid: UUID) -> None:
        self.nodes_deleted.append(node_uuid)

    def add_channel_created(self, payload: dict) -> None:
        self.channels_created.append(payload)

    def add_channel_updated(self, payload: dict) -> None:
        self.channels_updated.append(payload)

    def add_channel_deleted(self, channel_uuid: UUID) -> None:
        self.channels_deleted.append(channel_uuid)

    def add_section_created(self, payload: dict) -> None:
        self.sections_created.append(payload)

    def add_section_updated(self, payload: dict) -> None:
        self.sections_updated.append(payload)

    def add_section_deleted(self, section_uuid: UUID) -> None:
        self.sections_deleted.append(section_uuid)

    def add_edge_created(self, payload: dict) -> None:
        self.edges_created.append(payload)

    def add_edge_updated(self, payload: dict) -> None:
        self.edges_updated.append(payload)

    def add_edge_deleted(self, edge_id: int) -> None:
        self.edges_deleted.append(edge_id)

    def add_outcome_created(self, payload: dict) -> None:
        self.outcomes_created.append(payload)

    def add_outcome_updated(self, payload: dict) -> None:
        self.outcomes_updated.append(payload)

    def add_outcome_deleted(self, outcome_uuid: UUID) -> None:
        self.outcomes_deleted.append(outcome_uuid)

    def build_envelope(
        self,
        *,
        graph_uuid: UUID,
        revision_id: int,
        triggered_by: str,
        trigger_entity_id: str,
    ) -> dict:
        """Return a dict matching ``GraphMutationEnvelopeOut`` (snake_case JSON keys)."""

        return {
            "graph_id": graph_uuid,
            "revision_id": revision_id,
            "changes": {
                "nodes": {
                    "created": list(self.nodes_created),
                    "updated": list(self.nodes_updated),
                    "deleted": list(self.nodes_deleted),
                },
                "edges": {
                    "created": list(self.edges_created),
                    "updated": list(self.edges_updated),
                    "deleted": list(self.edges_deleted),
                },
                "channels": {
                    "created": list(self.channels_created),
                    "updated": list(self.channels_updated),
                    "deleted": list(self.channels_deleted),
                },
                "sections": {
                    "created": list(self.sections_created),
                    "updated": list(self.sections_updated),
                    "deleted": list(self.sections_deleted),
                },
                "tags": {
                    "created": [],
                    "updated": [],
                    "deleted": [],
                },
                "outcomes": {
                    "created": list(self.outcomes_created),
                    "updated": list(self.outcomes_updated),
                    "deleted": list(self.outcomes_deleted),
                },
            },
            "meta": {
                "triggered_by": triggered_by,
                "trigger_entity_id": trigger_entity_id,
            },
        }
