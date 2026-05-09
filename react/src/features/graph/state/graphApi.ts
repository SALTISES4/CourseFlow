import {
  createGraphEdge,
  deleteEdge,
  deleteNode,
  getGraphView,
  patchNode
} from '@cf/api/gen/sdk.gen'
import type {
  GraphEdgeMutationOut,
  GraphMetaOut,
  GraphMutationEnvelopeOut,
  GraphNodeMutationOut,
  GraphTagStubOut,
  GraphViewOut
} from '@cf/api/gen/types.gen'

import type {
  ChannelEntity,
  CreateEdgeInput,
  DeleteEdgeInput,
  DeleteNodeInput,
  EdgeEntity,
  GraphEntity,
  GraphUuid,
  GraphMutationEnvelope,
  MoveNodeInput,
  NodeEntity,
  RenameNodeInput,
  SectionEntity,
  TagEntity,
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

function mapGraphMetaToWorkflowEntity(meta: GraphMetaOut): WorkflowEntity | null {
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
    position: channel.position,
    threadUuid: channel.threadUuid ?? null
  }))

  const nodes: NodeEntity[] = view.nodes.map((node) => ({
    uuid: node.uuid,
    graphUuid,
    sectionUuid: node.sectionUuid ?? null,
    channelUuid: node.channelUuid ?? null,
    sectionRow: node.sectionRow ?? null,
    workflowUuid: node.workflowUuid ?? null,
    threadUuid: node.threadUuid ?? null,
    outcomeUuids: node.outcomeUuids ?? []
  }))

  const edges: EdgeEntity[] = view.edges.reduce<EdgeEntity[]>((acc, edge) => {
    if (edge.id == null) {
      console.error('[graph normalize] missing edge id in GraphViewOut edge', edge)
      return acc
    }
    acc.push({
      edgeId: String(edge.id),
      graphUuid,
      sourceNodeUuid: edge.sourceNodeUuid,
      targetNodeUuid: edge.targetNodeUuid,
      lineType: edge.lineType,
      sourcePort: edge.sourcePort,
      targetPort: edge.targetPort
    })
    return acc
  }, [])

  return { graph, workflow, sections, channels, nodes, edges }
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

// Tags are not returned from the graph view projection; keep a seam for a dedicated loader later.
export const fetchWorkflowTags = async (
  _graphUuid: GraphUuid
): Promise<TagEntity[]> => []

function mapMutationNode(graphUuid: GraphUuid, node: GraphNodeMutationOut): NodeEntity {
  return {
    uuid: node.uuid,
    graphUuid,
    sectionUuid: node.sectionUuid ?? null,
    channelUuid: node.channelUuid ?? null,
    sectionRow: node.sectionRow ?? null,
    workflowUuid: node.workflowUuid ?? null,
    threadUuid: node.threadUuid ?? null,
    outcomeUuids: node.outcomeUuids ?? []
  }
}

function mapMutationEdge(graphUuid: GraphUuid, edge: GraphEdgeMutationOut): EdgeEntity | null {
  if (edge.id == null) {
    console.error('[graph normalize] missing edge id in mutation edge', edge)
    return null
  }
  return {
    edgeId: String(edge.id),
    graphUuid,
    sourceNodeUuid: edge.sourceNodeUuid,
    targetNodeUuid: edge.targetNodeUuid,
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
  const tagCreated = payload.changes.tags.created ?? []
  const tagUpdated = payload.changes.tags.updated ?? []
  const tagDeleted = payload.changes.tags.deleted ?? []

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

export const deleteNodeCommand = async (
  input: DeleteNodeInput
): Promise<GraphMutationEnvelope> => {
  const result = await deleteNode({
    path: { uuid: String(input.nodeUuid) }
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
