/** Root Workflow public identity from the v2 API (UUID string). */
export type WorkflowUuid = string

/** Graph/editor identity from the graph API (UUID string). */
export type GraphUuid = string

/** Node, section, channel, unit, thread, outcome: public UUID string from the API. */
export type ResourceUuid = string

/** Edge row identity from the API (integer primary key as string — edges have no UUID). */
export type EdgeKey = string

export type GraphLoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

/** Graph metadata (`GraphMetaOut`) keyed by graph UUID. */
export interface GraphEntity {
  uuid: GraphUuid
  workflowUuid: WorkflowUuid | null
  workflowType?: string | null
  workflowTitle?: string
  authorId: number | null
  workflowProjectId: number | null
  revisionId: number
  dateCreated?: string
  modifiedOn?: string
}

/** Workflow reference metadata that may be present in graph view payloads. */
export interface WorkflowEntity {
  uuid: WorkflowUuid
  title: string
  workflowType?: string | null
  projectId?: number | null
  authorId?: number | null
  dateCreated?: string
  modifiedOn?: string
}

/** Graph UUID scope (`SectionGraphOut.graphUuid` in OpenAPI). */
export interface SectionEntity {
  uuid: ResourceUuid
  graphUuid: GraphUuid
  title: string
  position: number
  threadUuid: ResourceUuid | null
}

/** Graph UUID scope (`ChannelGraphOut.graphUuid` in OpenAPI). */
export interface ChannelEntity {
  uuid: ResourceUuid
  graphUuid: GraphUuid
  title: string
  position: number
  threadUuid: ResourceUuid | null
}

export interface NodeEntity {
  uuid: ResourceUuid
  /** Semantic layer (`course` | `activity` | `task`); immutable after creation. */
  nodeType: string
  title: string
  description: string
  contextClassification: number | null
  taskClassification: number | null
  timeRequired: number | null
  timeUnits: number | null
  representsWorkflow: boolean
  tagIds: number[]
  /** Graph UUID (route id); selectors filter on this field. */
  graphUuid: GraphUuid
  sectionUuid: ResourceUuid | null
  channelUuid: ResourceUuid | null
  sectionRow: number | null
  /** Optional workflow reference FK on the node (`NodeGraphOut.workflowUuid`). */
  workflowUuid: WorkflowUuid | null
  threadUuid: ResourceUuid | null
  outcomeUuids: ResourceUuid[]
}

export interface EdgeEntity {
  edgeId: EdgeKey
  graphUuid: GraphUuid
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
  graph: GraphLoadStatus
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
  /** Grid node insert/move mode (legacy `workspace.node.insertMode`). */
  nodeInsertMode: 'manual' | 'row' | 'column'
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
  | 'moveNodeGrid'
  | 'insertNodeBelow'
  | 'placeNode'
  | 'renameNode'
  | 'createEdge'
  | 'deleteEdge'
  | 'deleteChannel'
  | 'deleteSection'
  | 'insertSectionBelow'
  | 'insertChannelBelow'
  | 'reorderChannels'
  | 'reorderSections'
  | 'changeSectionMeta'
  | 'linkNodeWorkflow'
  | 'changeNodeMeta'
  | 'linkNodeOutcome'
  | 'unlinkNodeOutcome'

export type GraphOpStatus = 'pending' | 'acked' | 'failed'

export interface PendingGraphOperation {
  uuid: string
  graphUuid: GraphUuid
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

export interface GraphDeltaChannels {
  created: ChannelEntity[]
  updated: ChannelEntity[]
  deleted: ResourceUuid[]
}

export interface GraphDeltaSections {
  created: SectionEntity[]
  updated: SectionEntity[]
  deleted: ResourceUuid[]
}

export interface GraphMutationEnvelope {
  graphUuid: GraphUuid
  revisionId: number
  changes: {
    nodes: GraphDeltaNodes
    edges: GraphDeltaEdges
    channels: GraphDeltaChannels
    sections: GraphDeltaSections
    tags: GraphDeltaTags
  }
  meta: {
    triggeredBy: string
    triggerEntityId: string
  }
}

export interface RenameNodeInput {
  graphUuid: GraphUuid
  nodeUuid: ResourceUuid
  title: string
}

/** Grid insert/move mode (manual is UI-only). */
export type GridInsertMode = 'row' | 'column'

export type GridDropEdge = 'top' | 'bottom'

export interface MoveNodeInput {
  graphUuid: GraphUuid
  nodeUuid: ResourceUuid
  sectionUuid: ResourceUuid | null
  channelUuid: ResourceUuid | null
  sectionRow: number | null
}

/** Backend computes final placement and sibling reflow. */
export interface MoveNodeGridInput {
  graphUuid: GraphUuid
  nodeUuid: ResourceUuid
  toSectionUuid: ResourceUuid
  toChannelUuid: ResourceUuid
  rowHint: number
  mode: GridInsertMode
  edge?: GridDropEdge
}

export interface InsertNodeBelowInput {
  graphUuid: GraphUuid
  nodeUuid: ResourceUuid
  mode: GridInsertMode
  duplicate?: boolean
  edge?: GridDropEdge
}

export interface PlaceNodeInput {
  graphUuid: GraphUuid
  sectionUuid: ResourceUuid
  channelUuid: ResourceUuid
  rowHint: number
  mode: GridInsertMode
  edge?: GridDropEdge
}

export interface CreateEdgeInput {
  graphUuid: GraphUuid
  sourceNodeUuid: ResourceUuid
  targetNodeUuid: ResourceUuid
  lineType?: string
  sourcePort?: string
  targetPort?: string
}

export interface DeleteEdgeInput {
  graphUuid: GraphUuid
  edgeId: EdgeKey
}

export interface DeleteNodeInput {
  graphUuid: GraphUuid
  nodeUuid: ResourceUuid
}

export interface DeleteChannelInput {
  graphUuid: GraphUuid
  channelUuid: ResourceUuid
}

export interface DeleteSectionInput {
  graphUuid: GraphUuid
  sectionUuid: ResourceUuid
}

export interface ReorderChannelsInput {
  graphUuid: GraphUuid
  channelUuids: ResourceUuid[]
}

export interface ReorderSectionsInput {
  graphUuid: GraphUuid
  sectionUuids: ResourceUuid[]
}

export interface InsertSectionBelowInput {
  graphUuid: GraphUuid
  sectionUuid: ResourceUuid
  duplicate?: boolean
}

export interface InsertChannelBelowInput {
  graphUuid: GraphUuid
  /** Omit or null to append at end of the channel list. */
  channelUuid?: ResourceUuid | null
  duplicate?: boolean
}

/** Partial section metadata (`SectionPatchIn` on the resource API). */
export interface SectionMetaPatch {
  title?: string
  position?: number
  threadUuid?: ResourceUuid | null
}

export interface ChangeSectionMetaInput {
  graphUuid: GraphUuid
  sectionUuid: ResourceUuid
  meta: SectionMetaPatch
}

/** Link a grid node to a library workflow, or clear link (root graph workflow). */
export interface LinkNodeWorkflowInput {
  graphUuid: GraphUuid
  nodeUuid: ResourceUuid
  workflowUuid: WorkflowUuid | null
  /** Optional metadata to upsert into canonical workflow cache for UI labels. */
  linkedWorkflow?: WorkflowEntity | null
}

/** Partial node metadata (`GraphNodeMetaPatchIn` on the resource API). */
export interface NodeMetaPatch {
  title?: string
  description?: string
  contextClassification?: number | null
  taskClassification?: number | null
  timeRequired?: number | null
  timeUnits?: number | null
  representsWorkflow?: boolean
  tagIds?: number[]
}

export interface ChangeNodeMetaInput {
  graphUuid: GraphUuid
  nodeUuid: ResourceUuid
  meta: NodeMetaPatch
}

export interface LinkNodeOutcomeInput {
  graphUuid: GraphUuid
  nodeUuid: ResourceUuid
  outcomeUuid: ResourceUuid
}

export interface UnlinkNodeOutcomeInput {
  graphUuid: GraphUuid
  nodeUuid: ResourceUuid
  outcomeUuid: ResourceUuid
}
