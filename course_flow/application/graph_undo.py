from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictInt, StrictStr

UNDO_SCHEMA_VERSION = 1


class GraphUndoPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")


class DeleteCreatedEdgeUndoPayload(GraphUndoPayload):
    edge_id: StrictInt = Field(gt=0)


class RecreateDeletedEdgeUndoPayload(GraphUndoPayload):
    source_node_uuid: UUID
    target_node_uuid: UUID
    title: StrictStr = Field(max_length=255)
    text_position: StrictInt = Field(ge=0, le=100)
    line_type: StrictStr = Field(max_length=64)
    source_port: StrictStr = Field(min_length=1, max_length=64)
    target_port: StrictStr = Field(min_length=1, max_length=64)
