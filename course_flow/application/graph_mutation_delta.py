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
    edges_created: list[dict] = field(default_factory=list)
    edges_updated: list[dict] = field(default_factory=list)
    edges_deleted: list[int] = field(default_factory=list)

    def add_node_created(self, payload: dict) -> None:
        self.nodes_created.append(payload)

    def add_node_updated(self, payload: dict) -> None:
        self.nodes_updated.append(payload)

    def add_node_deleted(self, node_uuid: UUID) -> None:
        self.nodes_deleted.append(node_uuid)

    def add_edge_created(self, payload: dict) -> None:
        self.edges_created.append(payload)

    def add_edge_updated(self, payload: dict) -> None:
        self.edges_updated.append(payload)

    def add_edge_deleted(self, edge_id: int) -> None:
        self.edges_deleted.append(edge_id)

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
                "tags": {
                    "created": [],
                    "updated": [],
                    "deleted": [],
                },
            },
            "meta": {
                "triggered_by": triggered_by,
                "trigger_entity_id": trigger_entity_id,
            },
        }
