export type GraphId = string
export type WorkflowId = string
export type EntityId = string

export type GraphLoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export interface WorkflowMetaEntity {
  id: WorkflowId
  title: string
  ownerId: string | null
  projectId: string | null
  revisionId: number
  dateCreated?: string
  modifiedOn?: string
}

export interface SectionEntity {
  id: EntityId
  workflowId: WorkflowId
  title: string
  position: number
  threadId: EntityId | null
}

export interface ChannelEntity {
  id: EntityId
  workflowId: WorkflowId
  title: string
  position: number
  threadId: EntityId | null
}

export interface NodeEntity {
  id: EntityId
  workflowId: WorkflowId
  sectionId: EntityId | null
  channelId: EntityId | null
  sectionRow: number | null
  unitId: EntityId | null
  threadId: EntityId | null
  outcomeIds: EntityId[]
}

export interface EdgeEntity {
  id: EntityId
  workflowId: WorkflowId
  sourceNodeId: EntityId
  targetNodeId: EntityId
  lineType: string
  sourcePort: string
  targetPort: string
}

export interface TagEntity {
  id: EntityId
  projectId: EntityId | null
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
  selectedNodeId: EntityId | null
  selectedEdgeId: EntityId | null
  hoveredNodeId: EntityId | null
  hoveredEdgeId: EntityId | null
  activePanel: 'none' | 'properties' | 'inspector' | 'comments'
  edgeDraft: {
    sourceNodeId: EntityId | null
    sourcePort: string | null
    targetNodeId: EntityId | null
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
  id: string
  workflowId: WorkflowId
  type: GraphOpType
  status: GraphOpStatus
  submittedAt: string
  targetIds: EntityId[]
  payload: Record<string, unknown>
}

export interface GraphDeltaNodes {
  created: NodeEntity[]
  updated: NodeEntity[]
  deleted: EntityId[]
}

export interface GraphDeltaEdges {
  created: EdgeEntity[]
  updated: EdgeEntity[]
  deleted: EntityId[]
}

export interface GraphDeltaTags {
  created: TagEntity[]
  updated: TagEntity[]
  deleted: EntityId[]
}

export interface GraphMutationEnvelope {
  workflowId: WorkflowId
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
  workflowId: WorkflowId
  nodeId: EntityId
  title: string
}

export interface MoveNodeInput {
  workflowId: WorkflowId
  nodeId: EntityId
  sectionId: EntityId | null
  channelId: EntityId | null
  sectionRow: number | null
}

export interface CreateEdgeInput {
  workflowId: WorkflowId
  sourceNodeId: EntityId
  targetNodeId: EntityId
  lineType?: string
  sourcePort?: string
  targetPort?: string
}

export interface DeleteEdgeInput {
  workflowId: WorkflowId
  edgeId: EntityId
}

export interface DeleteNodeInput {
  workflowId: WorkflowId
  nodeId: EntityId
}
