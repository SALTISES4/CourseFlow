/** Root Workflow public identity from the v2 API (UUID string). */
export type WorkflowUuid = string

/** Graph/editor identity from the graph API (UUID string). */
export type GraphUuid = string

/** Node, section, channel, unit, thread, outcome: public UUID string from the API. */
export type ResourceUuid = string

export type ThreadCommentCount = {
  threadUuid: ResourceUuid
  commentCount: number
}

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
  /** Hex colour (e.g. `#6738ff`); empty string uses cyclic theme default in the UI. */
  colour: string
  position: number
  threadUuid: ResourceUuid | null
}

export interface NodeEntity {
  uuid: ResourceUuid
  /** Semantic layer (`course` | `activity` | `task`); immutable after creation. */
  nodeType: string
  title: string
  description: string
  contextClassification: ContextClassification | null
  taskClassification: TaskClassification | null
  timeRequired: number | null
  timeUnits: TimeUnit | null
  representsWorkflow: boolean
  ponderationTheory: number | null
  ponderationPractice: number | null
  ponderationIndividual: number | null
  credits: number | null
  specificEducation: boolean
  tagIds: number[]
  /** Graph UUID (route id); selectors filter on this field. */
  graphUuid: GraphUuid
  sectionUuid: ResourceUuid | null
  channelUuid: ResourceUuid | null
  sectionRow: number | null
  /** Parent graph workflow for this grid cell (`NodeGraphOut.workflowUuid`). */
  workflowUuid: WorkflowUuid | null
  /** Optional symbolic link to another library workflow (`NodeGraphOut.linkedWorkflowUuid`). */
  linkedWorkflowUuid: WorkflowUuid | null
  threadUuid: ResourceUuid | null
  outcomeUuids: ResourceUuid[]
}

export interface EdgeEntity {
  edgeId: EdgeKey
  graphUuid: GraphUuid
  sourceNodeUuid: ResourceUuid
  targetNodeUuid: ResourceUuid
  title: string
  textPosition: number
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

export interface OutcomeEntity {
  uuid: ResourceUuid
  graphUuid: GraphUuid
  parentUuid: ResourceUuid | null
  order: number
  title: string
  description: string
  code: string
  tagIds: number[]
  threadUuid: ResourceUuid | null
}

export interface GraphResourceLoadState {
  graph: GraphLoadStatus
  sections: GraphLoadStatus
  channels: GraphLoadStatus
  nodes: GraphLoadStatus
  edges: GraphLoadStatus
  tags: GraphLoadStatus
  outcomes: GraphLoadStatus
}

export interface GraphUiState {
  selectedNodeUuid: ResourceUuid | null
  selectedEdgeId: EdgeKey | null
  hoveredNodeUuid: ResourceUuid | null
  hoveredEdgeId: EdgeKey | null
  activePanel: 'none' | 'properties' | 'inspector' | 'comments'
  /** Grid node insert/move mode (legacy `workspace.node.insertMode`). */
  nodeInsertMode: 'manual' | 'row' | 'column'
  /** Presentation-only section collapse state for the currently mounted graph. */
  collapsedSectionUuids: ResourceUuid[]
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
  | 'updateEdge'
  | 'deleteEdge'
  | 'deleteChannel'
  | 'deleteSection'
  | 'insertSectionBelow'
  | 'insertChannelBelow'
  | 'reorderChannels'
  | 'reorderSections'
  | 'changeSectionMeta'
  | 'changeChannelMeta'
  | 'linkNodeWorkflow'
  | 'changeNodeMeta'
  | 'linkNodeOutcome'
  | 'unlinkNodeOutcome'
  | 'createOutcome'
  | 'updateOutcome'
  | 'deleteOutcome'
  | 'duplicateOutcome'
  | 'moveOutcome'

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

export interface GraphDeltaOutcomes {
  created: OutcomeEntity[]
  updated: OutcomeEntity[]
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
    outcomes: GraphDeltaOutcomes
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
  sourcePort: string
  targetPort: string
}

export interface DeleteEdgeInput {
  graphUuid: GraphUuid
  edgeId: EdgeKey
}

/** Partial edge metadata (`GraphEdgePatchIn` on the resource API). */
export interface EdgeMetaPatch {
  title?: string
  textPosition?: number
  lineType?: string
}

export interface UpdateEdgeInput {
  graphUuid: GraphUuid
  edgeId: EdgeKey
  meta: EdgeMetaPatch
  sourceNodeUuid?: ResourceUuid
  targetNodeUuid?: ResourceUuid
  sourcePort?: string
  targetPort?: string
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

/** Partial channel metadata (`ChannelPatchIn` on the resource API). */
export interface ChannelMetaPatch {
  title?: string
  colour?: string
  position?: number
  threadUuid?: ResourceUuid | null
}

export interface ChangeChannelMetaInput {
  graphUuid: GraphUuid
  channelUuid: ResourceUuid
  meta: ChannelMetaPatch
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
  contextClassification?: ContextClassification | null
  taskClassification?: TaskClassification | null
  timeRequired?: number | null
  timeUnits?: TimeUnit | null
  representsWorkflow?: boolean
  ponderationTheory?: number | null
  ponderationPractice?: number | null
  ponderationIndividual?: number | null
  credits?: number | null
  specificEducation?: boolean
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

export interface OutcomeMetaPatch {
  title?: string
  description?: string
  code?: string
  tagIds?: number[]
}

export interface CreateOutcomeInput {
  graphUuid: GraphUuid
  parentUuid?: ResourceUuid | null
  insertIndex?: number
  title?: string
  description?: string
  code?: string
  tagIds?: number[]
}

export interface UpdateOutcomeInput {
  graphUuid: GraphUuid
  outcomeUuid: ResourceUuid
  meta: OutcomeMetaPatch
}

export interface DeleteOutcomeInput {
  graphUuid: GraphUuid
  outcomeUuid: ResourceUuid
}

export interface DuplicateOutcomeInput {
  graphUuid: GraphUuid
  outcomeUuid: ResourceUuid
}

export interface MoveOutcomeInput {
  graphUuid: GraphUuid
  outcomeUuid: ResourceUuid
  parentUuid?: ResourceUuid | null
  parentUuidProvided?: boolean
  insertIndex?: number
  beforeUuid?: ResourceUuid
  afterUuid?: ResourceUuid
}
import type {
  ContextClassification,
  TaskClassification,
  TimeUnit
} from '@cf/api/gen/types.gen'
