/** Workflow public identity from the v2 API (UUID string). */
export type WorkflowUuid = string

/** Node, section, channel, unit, thread, outcome: public UUID string from the API. */
export type ResourceUuid = string

/** Edge row identity from the API (integer primary key as string — edges have no UUID). */
export type EdgeKey = string

export type GraphLoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

/** Mirrors `GraphMetaOut` from the OpenAPI graph contract. */
export interface WorkflowMetaEntity {
  uuid: WorkflowUuid
  workflowTitle: string
  authorId: number | null
  workflowProjectId: number | null
  revisionId: number
  dateCreated?: string
  modifiedOn?: string
}

/** Graph UUID scope (`SectionGraphOut.graphUuid` in OpenAPI). */
export interface SectionEntity {
  uuid: ResourceUuid
  workflowUuid: WorkflowUuid
  title: string
  position: number
  threadUuid: ResourceUuid | null
}

/** Graph UUID scope (`ChannelGraphOut.graphUuid` in OpenAPI). */
export interface ChannelEntity {
  uuid: ResourceUuid
  workflowUuid: WorkflowUuid
  title: string
  position: number
  threadUuid: ResourceUuid | null
}

export interface NodeEntity {
  uuid: ResourceUuid
  /** Graph UUID (route id); selectors filter on this field. */
  workflowUuid: WorkflowUuid
  sectionUuid: ResourceUuid | null
  channelUuid: ResourceUuid | null
  sectionRow: number | null
  /** Optional workflow row FK on the node (`NodeGraphOut.workflowUuid`). */
  nodeWorkflowUuid: ResourceUuid | null
  threadUuid: ResourceUuid | null
  outcomeUuids: ResourceUuid[]
}

export interface EdgeEntity {
  edgeId: EdgeKey
  workflowUuid: WorkflowUuid
  sourceNodeUuid: ResourceUuid
  targetNodeUuid: ResourceUuid
  lineType: string
  sourcePort: string
  targetPort: string
}

export interface TagEntity {
  tagId: string
  projectId: string | null
  label: string
  translationPlural: string
}

export interface GraphResourceLoadState {
  workflowMeta: GraphLoadStatus
  sections: GraphLoadStatus
  channels: GraphLoadStatus
  nodes: GraphLoadStatus
  edges: GraphLoadStatus
  tags: GraphLoadStatus
}

export interface GraphUiState {
  selectedNodeUuid: ResourceUuid | null
  selectedEdgeId: EdgeKey | null
  hoveredNodeUuid: ResourceUuid | null
  hoveredEdgeId: EdgeKey | null
  activePanel: 'none' | 'properties' | 'inspector' | 'comments'
  edgeDraft: {
    sourceNodeUuid: ResourceUuid | null
    sourcePort: string | null
    targetNodeUuid: ResourceUuid | null
    targetPort: string | null
  }
}

export type GraphOpType =
  | 'createNode'
  | 'deleteNode'
  | 'moveNode'
  | 'renameNode'
  | 'createEdge'
  | 'deleteEdge'

export type GraphOpStatus = 'pending' | 'acked' | 'failed'

export interface PendingGraphOperation {
  uuid: string
  workflowUuid: WorkflowUuid
  type: GraphOpType
  status: GraphOpStatus
  submittedAt: string
  targetIds: ResourceUuid[]
  payload: Record<string, unknown>
}

export interface GraphDeltaNodes {
  created: NodeEntity[]
  updated: NodeEntity[]
  deleted: ResourceUuid[]
}

export interface GraphDeltaEdges {
  created: EdgeEntity[]
  updated: EdgeEntity[]
  deleted: EdgeKey[]
}

export interface GraphDeltaTags {
  created: TagEntity[]
  updated: TagEntity[]
  deleted: string[]
}

export interface GraphMutationEnvelope {
  workflowUuid: WorkflowUuid
  revisionId: number
  changes: {
    nodes: GraphDeltaNodes
    edges: GraphDeltaEdges
    tags: GraphDeltaTags
  }
  meta: {
    triggeredBy: string
    triggerEntityId: string
  }
}

export interface RenameNodeInput {
  workflowUuid: WorkflowUuid
  nodeUuid: ResourceUuid
  title: string
}

export interface MoveNodeInput {
  workflowUuid: WorkflowUuid
  nodeUuid: ResourceUuid
  sectionUuid: ResourceUuid | null
  channelUuid: ResourceUuid | null
  sectionRow: number | null
}

export interface CreateEdgeInput {
  workflowUuid: WorkflowUuid
  sourceNodeUuid: ResourceUuid
  targetNodeUuid: ResourceUuid
  lineType?: string
  sourcePort?: string
  targetPort?: string
}

export interface DeleteEdgeInput {
  workflowUuid: WorkflowUuid
  edgeId: EdgeKey
}

export interface DeleteNodeInput {
  workflowUuid: WorkflowUuid
  nodeUuid: ResourceUuid
}
