import {
  createGraphEdge,
  createGraphOutcome,
  deleteChannel,
  deleteEdge,
  deleteNode,
  deleteOutcome as deleteOutcomeSdk,
  deleteSection,
  duplicateOutcome,
  getGraphView,
  insertGraphChannelBelow,
  insertGraphNodeBelow,
  insertGraphSectionBelow,
  linkNodeOutcome as linkNodeOutcomeSdk,
  linkNodeWorkflow as linkNodeWorkflowSdk,
  moveGraphNode,
  moveOutcome as moveOutcomeSdk,
  patchNode,
  patchNodeMeta,
  patchOutcome,
  placeGraphNode,
  reorderGraphChannels,
  reorderGraphSections,
  unlinkNodeOutcome as unlinkNodeOutcomeSdk,
  updateChannel,
  updateEdge,
  updateSection
} from '@cf/api/gen/sdk.gen'
import type {
  ChannelOut,
  ChannelOutResp,
  GraphChannelMutationOut,
  GraphEdgeMutationOut,
  GraphMetaOut,
  GraphMutationEnvelopeOut,
  GraphNodeMutationOut,
  GraphOutcomeMutationOut,
  GraphSectionMutationOut,
  GraphTagStubOut,
  GraphViewOut,
  SectionOut,
  SectionOutResp
} from '@cf/api/gen/types.gen'

import type {
  ChangeChannelMetaInput,
  ChangeNodeMetaInput,
  ChangeSectionMetaInput,
  ChannelEntity,
  CreateEdgeInput,
  CreateOutcomeInput,
  DeleteChannelInput,
  DeleteEdgeInput,
  DeleteNodeInput,
  DeleteOutcomeInput,
  DeleteSectionInput,
  DuplicateOutcomeInput,
  EdgeEntity,
  GraphEntity,
  GraphMutationEnvelope,
  GraphUuid,
  InsertChannelBelowInput,
  InsertNodeBelowInput,
  InsertSectionBelowInput,
  LinkNodeOutcomeInput,
  LinkNodeWorkflowInput,
  MoveNodeGridInput,
  MoveNodeInput,
  MoveOutcomeInput,
  NodeEntity,
  OutcomeEntity,
  PlaceNodeInput,
  RenameNodeInput,
  ReorderChannelsInput,
  ReorderSectionsInput,
  SectionEntity,
  TagEntity,
  ThreadCommentCount,
  UnlinkNodeOutcomeInput,
  UpdateEdgeInput,
  UpdateOutcomeInput,
  WorkflowEntity
} from './model/types'

function unwrapSdkData<T>(result: { data?: T; error?: unknown }): T {
  if (result.error != null) {
    throw result.error instanceof Error
      ? result.error
      : new Error(String(result.error))
  }
  if (result.data === undefined) {
    throw new Error('CourseFlow API returned no data')
  }
  return result.data
}

function mapGraphMetaToGraphEntity(meta: GraphMetaOut): GraphEntity {
  return {
    uuid: meta.uuid,
    workflowUuid: meta.rootWorkflowUuid ?? null,
    workflowType: meta.rootWorkflowType ?? null,
    workflowTitle: meta.rootWorkflowTitle ?? meta.workflowTitle,
    authorId: meta.authorId,
    workflowProjectId: meta.workflowProjectId,
    revisionId: meta.revisionId,
    dateCreated: meta.dateCreated,
    modifiedOn: meta.modifiedOn
  }
}

function mapGraphMetaToWorkflowEntity(
  meta: GraphMetaOut
): WorkflowEntity | null {
  if (!meta.rootWorkflowUuid) {
    return null
  }
  return {
    uuid: meta.rootWorkflowUuid,
    title: meta.rootWorkflowTitle ?? meta.workflowTitle,
    workflowType: meta.rootWorkflowType ?? null,
    projectId: meta.workflowProjectId,
    authorId: meta.authorId,
    dateCreated: meta.dateCreated,
    modifiedOn: meta.modifiedOn
  }
}

export type GraphResourceBundle = {
  graph: GraphEntity
  workflow: WorkflowEntity | null
  sections: SectionEntity[]
  channels: ChannelEntity[]
  nodes: NodeEntity[]
  edges: EdgeEntity[]
  outcomes: OutcomeEntity[]
  threadCommentCounts: ThreadCommentCount[]
}

function mapViewToBundle(view: GraphViewOut): GraphResourceBundle {
  const graph = mapGraphMetaToGraphEntity(view.graph)
  const workflow = mapGraphMetaToWorkflowEntity(view.graph)
  const graphUuid = graph.uuid

  const sections: SectionEntity[] = view.sections.map((section) => ({
    uuid: section.uuid,
    graphUuid,
    title: section.title,
    position: section.position,
    threadUuid: section.threadUuid ?? null
  }))

  const channels: ChannelEntity[] = view.channels.map((channel) => ({
    uuid: channel.uuid,
    graphUuid,
    title: channel.title,
    colour: channel.colour ?? '',
    position: channel.position,
    threadUuid: channel.threadUuid ?? null
  }))

  const nodes: NodeEntity[] = view.nodes.map((node) => ({
    uuid: node.uuid,
    nodeType: node.nodeType,
    ...mapNodeMetaFromApi(node),
    graphUuid,
    sectionUuid: node.sectionUuid ?? null,
    channelUuid: node.channelUuid ?? null,
    sectionRow: node.sectionRow ?? null,
    workflowUuid: node.workflowUuid ?? null,
    linkedWorkflowUuid: node.linkedWorkflowUuid ?? null,
    threadUuid: node.threadUuid ?? null,
    outcomeUuids: node.outcomeUuids ?? []
  }))

  const edges: EdgeEntity[] = view.edges.reduce<EdgeEntity[]>((acc, edge) => {
    if (edge.id == null) {
      console.error(
        '[graph normalize] missing edge id in GraphViewOut edge',
        edge
      )
      return acc
    }
    acc.push({
      edgeId: String(edge.id),
      graphUuid,
      sourceNodeUuid: edge.sourceNodeUuid,
      targetNodeUuid: edge.targetNodeUuid,
      title: edge.title ?? '',
      textPosition: edge.textPosition ?? 50,
      lineType: edge.lineType,
      sourcePort: edge.sourcePort,
      targetPort: edge.targetPort
    })
    return acc
  }, [])

  const outcomes: OutcomeEntity[] = (view.outcomes ?? []).map((outcome) => ({
    uuid: outcome.uuid,
    graphUuid,
    parentUuid: outcome.parentUuid ?? null,
    order: outcome.order,
    title: outcome.title ?? '',
    description: outcome.description ?? '',
    code: outcome.code ?? '',
    tagIds: outcome.tagIds ?? [],
    threadUuid: outcome.threadUuid ?? null
  }))

  return {
    graph,
    workflow,
    sections,
    channels,
    nodes,
    edges,
    outcomes,
    threadCommentCounts: view.threadCommentCounts ?? []
  }
}

export const fetchWorkflowGraphBundle = async (
  graphUuid: GraphUuid
): Promise<GraphResourceBundle> => {
  const result = await getGraphView({
    path: { uuid: graphUuid }
  })
  const view = unwrapSdkData<GraphViewOut>(result)
  return mapViewToBundle(view)
}

function mapNodeMetaFromApi(node: {
  title?: string
  description?: string
  contextClassification?: number | null
  taskClassification?: number | null
  timeRequired?: number | null
  timeUnits?: number | null
  representsWorkflow?: boolean
  ponderationTheory?: number | null
  ponderationPractice?: number | null
  ponderationIndividual?: number | null
  credits?: number | null
  specificEducation?: boolean
  tagIds?: number[]
}): Pick<
  NodeEntity,
  | 'title'
  | 'description'
  | 'contextClassification'
  | 'taskClassification'
  | 'timeRequired'
  | 'timeUnits'
  | 'representsWorkflow'
  | 'ponderationTheory'
  | 'ponderationPractice'
  | 'ponderationIndividual'
  | 'credits'
  | 'specificEducation'
  | 'tagIds'
> {
  return {
    title: node.title ?? '',
    description: node.description ?? '',
    contextClassification: node.contextClassification ?? null,
    taskClassification: node.taskClassification ?? null,
    timeRequired: node.timeRequired ?? null,
    timeUnits: node.timeUnits ?? null,
    representsWorkflow: node.representsWorkflow ?? false,
    ponderationTheory: node.ponderationTheory ?? null,
    ponderationPractice: node.ponderationPractice ?? null,
    ponderationIndividual: node.ponderationIndividual ?? null,
    credits: node.credits ?? null,
    specificEducation: node.specificEducation ?? false,
    tagIds: node.tagIds ?? []
  }
}

// Tags are not returned from the graph view projection; keep a seam for a dedicated loader later.
export const fetchWorkflowTags = async (
  _graphUuid: GraphUuid
): Promise<TagEntity[]> => []

function mapMutationChannel(
  graphUuid: GraphUuid,
  channel: GraphChannelMutationOut
): ChannelEntity {
  return {
    uuid: channel.uuid,
    graphUuid: channel.graphUuid ?? graphUuid,
    title: channel.title,
    colour: channel.colour ?? '',
    position: channel.position,
    threadUuid: channel.threadUuid ?? null
  }
}

function mapMutationSection(
  graphUuid: GraphUuid,
  section: GraphSectionMutationOut
): SectionEntity {
  return {
    uuid: section.uuid,
    graphUuid: section.graphUuid ?? graphUuid,
    title: section.title,
    position: section.position,
    threadUuid: section.threadUuid ?? null
  }
}

function mapMutationNode(
  graphUuid: GraphUuid,
  node: GraphNodeMutationOut
): NodeEntity {
  return {
    uuid: node.uuid,
    nodeType: node.nodeType,
    ...mapNodeMetaFromApi(node),
    graphUuid,
    sectionUuid: node.sectionUuid ?? null,
    channelUuid: node.channelUuid ?? null,
    sectionRow: node.sectionRow ?? null,
    workflowUuid: node.workflowUuid ?? null,
    linkedWorkflowUuid: node.linkedWorkflowUuid ?? null,
    threadUuid: node.threadUuid ?? null,
    outcomeUuids: node.outcomeUuids ?? []
  }
}

function mapMutationOutcome(
  graphUuid: GraphUuid,
  outcome: GraphOutcomeMutationOut
): OutcomeEntity {
  return {
    uuid: outcome.uuid,
    graphUuid: outcome.graphUuid ?? graphUuid,
    parentUuid: outcome.parentUuid ?? null,
    order: outcome.order,
    title: outcome.title ?? '',
    description: outcome.description ?? '',
    code: outcome.code ?? '',
    tagIds: outcome.tagIds ?? [],
    threadUuid: outcome.threadUuid ?? null
  }
}

function mapMutationEdge(
  graphUuid: GraphUuid,
  edge: GraphEdgeMutationOut
): EdgeEntity | null {
  if (edge.id == null) {
    console.error('[graph normalize] missing edge id in mutation edge', edge)
    return null
  }
  return {
    edgeId: String(edge.id),
    graphUuid,
    sourceNodeUuid: edge.sourceNodeUuid,
    targetNodeUuid: edge.targetNodeUuid,
    title: edge.title ?? '',
    textPosition: edge.textPosition ?? 50,
    lineType: edge.lineType,
    sourcePort: edge.sourcePort,
    targetPort: edge.targetPort
  }
}

function mapTagStub(tag: GraphTagStubOut): TagEntity {
  return {
    tagId: String(tag.id),
    projectId: null,
    label: '',
    translationPlural: ''
  }
}

function mapMutationEnvelope(
  payload: GraphMutationEnvelopeOut
): GraphMutationEnvelope {
  const graphId = payload.graphId
  const channelCreated = payload.changes.channels.created ?? []
  const channelUpdated = payload.changes.channels.updated ?? []
  const channelDeleted = payload.changes.channels.deleted ?? []
  const sectionCreated = payload.changes.sections.created ?? []
  const sectionUpdated = payload.changes.sections.updated ?? []
  const sectionDeleted = payload.changes.sections.deleted ?? []
  const tagCreated = payload.changes.tags.created ?? []
  const tagUpdated = payload.changes.tags.updated ?? []
  const tagDeleted = payload.changes.tags.deleted ?? []
  const outcomeCreated = payload.changes.outcomes?.created ?? []
  const outcomeUpdated = payload.changes.outcomes?.updated ?? []
  const outcomeDeleted = payload.changes.outcomes?.deleted ?? []

  return {
    graphUuid: graphId,
    revisionId: payload.revisionId,
    changes: {
      nodes: {
        created: payload.changes.nodes.created.map((n) =>
          mapMutationNode(graphId, n)
        ),
        updated: payload.changes.nodes.updated.map((n) =>
          mapMutationNode(graphId, n)
        ),
        deleted: payload.changes.nodes.deleted
      },
      channels: {
        created: channelCreated.map((c) => mapMutationChannel(graphId, c)),
        updated: channelUpdated.map((c) => mapMutationChannel(graphId, c)),
        deleted: channelDeleted
      },
      sections: {
        created: sectionCreated.map((s) => mapMutationSection(graphId, s)),
        updated: sectionUpdated.map((s) => mapMutationSection(graphId, s)),
        deleted: sectionDeleted
      },
      edges: {
        created: payload.changes.edges.created
          .map((e) => mapMutationEdge(graphId, e))
          .filter((e): e is EdgeEntity => e !== null),
        updated: payload.changes.edges.updated
          .map((e) => mapMutationEdge(graphId, e))
          .filter((e): e is EdgeEntity => e !== null),
        deleted: payload.changes.edges.deleted.map(String)
      },
      tags: {
        created: tagCreated.map(mapTagStub),
        updated: tagUpdated.map(mapTagStub),
        deleted: tagDeleted.map(String)
      },
      outcomes: {
        created: outcomeCreated.map((o) => mapMutationOutcome(graphId, o)),
        updated: outcomeUpdated.map((o) => mapMutationOutcome(graphId, o)),
        deleted: outcomeDeleted
      }
    },
    meta: {
      triggeredBy: payload.meta.triggeredBy,
      triggerEntityId: payload.meta.triggerEntityId
    }
  }
}

export const moveNodeCommand = async (
  input: MoveNodeInput
): Promise<GraphMutationEnvelope> => {
  const result = await patchNode({
    path: { uuid: String(input.nodeUuid) },
    body: {
      sectionUuid: input.sectionUuid,
      channelUuid: input.channelUuid,
      sectionRow: input.sectionRow
    }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const moveNodeGridCommand = async (
  input: MoveNodeGridInput
): Promise<GraphMutationEnvelope> => {
  const result = await moveGraphNode({
    path: { uuid: String(input.nodeUuid) },
    body: {
      toSectionUuid: input.toSectionUuid,
      toChannelUuid: input.toChannelUuid,
      rowHint: input.rowHint,
      mode: input.mode,
      edge: input.edge
    }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const linkNodeWorkflowCommand = async (
  input: LinkNodeWorkflowInput
): Promise<GraphMutationEnvelope> => {
  const result = await linkNodeWorkflowSdk({
    path: { uuid: String(input.nodeUuid) },
    body: {
      workflowUuid: input.workflowUuid
    }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const linkNodeOutcomeCommand = async (
  input: LinkNodeOutcomeInput
): Promise<GraphMutationEnvelope> => {
  const result = await linkNodeOutcomeSdk({
    path: { uuid: String(input.nodeUuid) },
    body: { outcomeUuid: input.outcomeUuid }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const unlinkNodeOutcomeCommand = async (
  input: UnlinkNodeOutcomeInput
): Promise<GraphMutationEnvelope> => {
  const result = await unlinkNodeOutcomeSdk({
    path: { uuid: String(input.nodeUuid) },
    body: { outcomeUuid: input.outcomeUuid }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const changeNodeMetaCommand = async (
  input: ChangeNodeMetaInput
): Promise<GraphMutationEnvelope> => {
  const { meta } = input
  const body: Record<string, unknown> = {}
  if (meta.title !== undefined) {
    body.title = meta.title
  }
  if (meta.description !== undefined) {
    body.description = meta.description
  }
  if (meta.contextClassification !== undefined) {
    body.contextClassification = meta.contextClassification
  }
  if (meta.taskClassification !== undefined) {
    body.taskClassification = meta.taskClassification
  }
  if (meta.timeRequired !== undefined) {
    body.timeRequired = meta.timeRequired
  }
  if (meta.timeUnits !== undefined) {
    body.timeUnits = meta.timeUnits
  }
  if (meta.representsWorkflow !== undefined) {
    body.representsWorkflow = meta.representsWorkflow
  }
  if (meta.ponderationTheory !== undefined) {
    body.ponderationTheory = meta.ponderationTheory
  }
  if (meta.ponderationPractice !== undefined) {
    body.ponderationPractice = meta.ponderationPractice
  }
  if (meta.ponderationIndividual !== undefined) {
    body.ponderationIndividual = meta.ponderationIndividual
  }
  if (meta.credits !== undefined) {
    body.credits = meta.credits
  }
  if (meta.specificEducation !== undefined) {
    body.specificEducation = meta.specificEducation
  }
  if (meta.tagIds !== undefined) {
    body.tagIds = meta.tagIds
  }
  const result = await patchNodeMeta({
    path: { uuid: String(input.nodeUuid) },
    body: body as never
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const insertNodeBelowCommand = async (
  input: InsertNodeBelowInput
): Promise<GraphMutationEnvelope> => {
  const result = await insertGraphNodeBelow({
    path: { uuid: String(input.graphUuid) },
    body: {
      nodeUuid: input.nodeUuid,
      mode: input.mode,
      duplicate: input.duplicate ?? false,
      edge: input.edge
    }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const placeNodeCommand = async (
  input: PlaceNodeInput
): Promise<GraphMutationEnvelope> => {
  const result = await placeGraphNode({
    path: { uuid: String(input.graphUuid) },
    body: {
      sectionUuid: input.sectionUuid,
      channelUuid: input.channelUuid,
      rowHint: input.rowHint,
      mode: input.mode,
      edge: input.edge
    }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const createEdgeCommand = async (
  input: CreateEdgeInput
): Promise<GraphMutationEnvelope> => {
  const result = await createGraphEdge({
    path: { uuid: String(input.graphUuid) },
    body: {
      sourceNodeUuid: input.sourceNodeUuid,
      targetNodeUuid: input.targetNodeUuid,
      lineType: input.lineType,
      sourcePort: input.sourcePort,
      targetPort: input.targetPort
    }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

function parseEdgeId(edgeId: string): number {
  const n = Number(edgeId)
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid edge id: ${edgeId}`)
  }
  return n
}

export const deleteEdgeCommand = async (
  input: DeleteEdgeInput
): Promise<GraphMutationEnvelope> => {
  const result = await deleteEdge({
    path: { edge_id: parseEdgeId(String(input.edgeId)) }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const updateEdgeCommand = async (
  input: UpdateEdgeInput
): Promise<GraphMutationEnvelope> => {
  const body: Record<string, unknown> = {}
  if (input.meta.title !== undefined) {
    body.title = input.meta.title
  }
  if (input.meta.textPosition !== undefined) {
    body.textPosition = input.meta.textPosition
  }
  if (input.meta.lineType !== undefined) {
    body.lineType = input.meta.lineType
  }
  const result = await updateEdge({
    path: { edge_id: parseEdgeId(String(input.edgeId)) },
    body: body as never
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const deleteNodeCommand = async (
  input: DeleteNodeInput
): Promise<GraphMutationEnvelope> => {
  const result = await deleteNode({
    path: { uuid: String(input.nodeUuid) }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const deleteChannelCommand = async (
  input: DeleteChannelInput
): Promise<GraphMutationEnvelope> => {
  const result = await deleteChannel({
    path: { uuid: String(input.channelUuid) }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const deleteSectionCommand = async (
  input: DeleteSectionInput
): Promise<GraphMutationEnvelope> => {
  const result = await deleteSection({
    path: { uuid: String(input.sectionUuid) }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const reorderChannelsCommand = async (
  input: ReorderChannelsInput
): Promise<GraphMutationEnvelope> => {
  const result = await reorderGraphChannels({
    path: { uuid: String(input.graphUuid) },
    body: { channelUuids: input.channelUuids }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const reorderSectionsCommand = async (
  input: ReorderSectionsInput
): Promise<GraphMutationEnvelope> => {
  const result = await reorderGraphSections({
    path: { uuid: String(input.graphUuid) },
    body: { sectionUuids: input.sectionUuids }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const insertSectionBelowCommand = async (
  input: InsertSectionBelowInput
): Promise<GraphMutationEnvelope> => {
  const result = await insertGraphSectionBelow({
    path: { uuid: String(input.graphUuid) },
    body: {
      sectionUuid: input.sectionUuid,
      duplicate: input.duplicate ?? false
    }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const insertChannelBelowCommand = async (
  input: InsertChannelBelowInput
): Promise<GraphMutationEnvelope> => {
  const result = await insertGraphChannelBelow({
    path: { uuid: String(input.graphUuid) },
    body: {
      channelUuid: input.channelUuid ?? null,
      duplicate: input.duplicate ?? false
    }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const renameNodeCommand = async (
  _input: RenameNodeInput
): Promise<GraphMutationEnvelope> => {
  throw new Error(
    'renameNode is not yet supported by the current backend graph mutation contract.'
  )
}

function mapSectionOut(section: SectionOut): SectionEntity {
  return {
    uuid: section.uuid,
    graphUuid: section.graphUuid,
    title: section.title,
    position: section.position,
    threadUuid: section.threadUuid ?? null
  }
}

/**
 * Resource PATCH `/api/section/{uuid}` — returns `SectionOutResp`, not a graph envelope.
 * Callers synthesize a minimal envelope for `applyGraphDelta` (sections.updated only).
 */
export const changeSectionMetaCommand = async (
  input: ChangeSectionMetaInput
): Promise<SectionEntity> => {
  const result = await updateSection({
    path: { uuid: String(input.sectionUuid) },
    body: input.meta
  })
  const resp = unwrapSdkData<SectionOutResp>(result)
  return mapSectionOut(resp.item)
}

function mapChannelOut(channel: ChannelOut): ChannelEntity {
  return {
    uuid: channel.uuid,
    graphUuid: channel.graphUuid,
    title: channel.title,
    colour: channel.colour ?? '',
    position: channel.position,
    threadUuid: channel.threadUuid ?? null
  }
}

/**
 * Resource PATCH `/api/channel/{uuid}` — returns `ChannelOutResp`, not a graph envelope.
 * Callers synthesize a minimal envelope for `applyGraphDelta` (channels.updated only).
 */
export const changeChannelMetaCommand = async (
  input: ChangeChannelMetaInput
): Promise<ChannelEntity> => {
  const result = await updateChannel({
    path: { uuid: String(input.channelUuid) },
    body: input.meta
  })
  const resp = unwrapSdkData<ChannelOutResp>(result)
  return mapChannelOut(resp.item)
}

export const createOutcomeCommand = async (
  input: CreateOutcomeInput
): Promise<GraphMutationEnvelope> => {
  const result = await createGraphOutcome({
    path: { uuid: String(input.graphUuid) },
    body: {
      parentUuid: input.parentUuid ?? null,
      insertIndex: input.insertIndex,
      title: input.title ?? '',
      description: input.description ?? '',
      code: input.code ?? '',
      tagIds: input.tagIds ?? []
    }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const updateOutcomeCommand = async (
  input: UpdateOutcomeInput
): Promise<GraphMutationEnvelope> => {
  const { meta } = input
  const body: Record<string, unknown> = {}
  if (meta.title !== undefined) {
    body.title = meta.title
  }
  if (meta.description !== undefined) {
    body.description = meta.description
  }
  if (meta.code !== undefined) {
    body.code = meta.code
  }
  if (meta.tagIds !== undefined) {
    body.tagIds = meta.tagIds
  }
  const result = await patchOutcome({
    path: { uuid: String(input.outcomeUuid) },
    body: body as never
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const deleteOutcomeCommand = async (
  input: DeleteOutcomeInput
): Promise<GraphMutationEnvelope> => {
  const result = await deleteOutcomeSdk({
    path: { uuid: String(input.outcomeUuid) }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const duplicateOutcomeCommand = async (
  input: DuplicateOutcomeInput
): Promise<GraphMutationEnvelope> => {
  const result = await duplicateOutcome({
    path: { uuid: String(input.outcomeUuid) }
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const moveOutcomeCommand = async (
  input: MoveOutcomeInput
): Promise<GraphMutationEnvelope> => {
  const body: Record<string, unknown> = {}
  if (input.parentUuidProvided) {
    body.parentUuid = input.parentUuid ?? null
  }
  if (input.insertIndex !== undefined) {
    body.insertIndex = input.insertIndex
  }
  if (input.beforeUuid !== undefined) {
    body.beforeUuid = input.beforeUuid
  }
  if (input.afterUuid !== undefined) {
    body.afterUuid = input.afterUuid
  }
  const result = await moveOutcomeSdk({
    path: { uuid: String(input.outcomeUuid) },
    body: body as never
  })
  return mapMutationEnvelope(unwrapSdkData(result))
}

export const buildSectionMetaMutationEnvelope = (
  graphUuid: GraphUuid,
  revisionId: number,
  section: SectionEntity
): GraphMutationEnvelope => ({
  graphUuid,
  revisionId,
  changes: {
    nodes: { created: [], updated: [], deleted: [] },
    channels: { created: [], updated: [], deleted: [] },
    sections: { created: [], updated: [section], deleted: [] },
    edges: { created: [], updated: [], deleted: [] },
    tags: { created: [], updated: [], deleted: [] },
    outcomes: { created: [], updated: [], deleted: [] }
  },
  meta: {
    triggeredBy: 'changeSectionMeta',
    triggerEntityId: section.uuid
  }
})

export const buildChannelMetaMutationEnvelope = (
  graphUuid: GraphUuid,
  revisionId: number,
  channel: ChannelEntity
): GraphMutationEnvelope => ({
  graphUuid,
  revisionId,
  changes: {
    nodes: { created: [], updated: [], deleted: [] },
    channels: { created: [], updated: [channel], deleted: [] },
    sections: { created: [], updated: [], deleted: [] },
    edges: { created: [], updated: [], deleted: [] },
    tags: { created: [], updated: [], deleted: [] },
    outcomes: { created: [], updated: [], deleted: [] }
  },
  meta: {
    triggeredBy: 'changeChannelMeta',
    triggerEntityId: channel.uuid
  }
})
