import { apiUrl } from '@cf/api/apiBaseUrl'
import { getAuthFetchHeaders } from '@cf/api/authHeaders'
import { apiPaths } from '@cf/router/apiRoutes'
import { generatePath } from 'react-router-dom'

import type {
  ChannelEntity,
  CreateEdgeInput,
  DeleteEdgeInput,
  DeleteNodeInput,
  EdgeEntity,
  GraphMutationEnvelope,
  MoveNodeInput,
  NodeEntity,
  RenameNodeInput,
  SectionEntity,
  TagEntity,
  WorkflowMetaEntity,
  WorkflowUuid
} from './model/types'

const v2Workflow = apiPaths.json_api_v2.workflow
const v2Node = apiPaths.json_api_v2.node
const v2Edge = apiPaths.json_api_v2.edge

type WorkflowMetaResponse = {
  item: {
    uuid: string
    title: string
    owner_id: number
    project_id: number | null
    revision_id: number
    date_created: string
    modified_on: string
  }
}

type WorkflowGraphResponse = {
  workflow: {
    uuid: string
    title: string
    owner_id: number
    project_id: number | null
    revision_id: number
    date_created: string
    modified_on: string
  }
  sections: Array<{
    uuid: string
    workflow_uuid: string
    title: string
    position: number
    thread_uuid: string | null
  }>
  channels: Array<{
    uuid: string
    workflow_uuid: string
    title: string
    position: number
    thread_uuid: string | null
  }>
  nodes: Array<{
    uuid: string
    section_uuid: string | null
    channel_uuid: string | null
    section_row: number | null
    unit_uuid: string | null
    thread_uuid: string | null
    outcome_uuids: string[]
  }>
  edges: Array<{
    id: number
    source_node_uuid: string
    target_node_uuid: string
    line_type: string
    source_port: string
    target_port: string
  }>
}

type GraphMutationEnvelopeResponse = {
  workflow_id: string
  revision_id: number
  changes: {
    nodes: {
      created: WorkflowGraphResponse['nodes']
      updated: WorkflowGraphResponse['nodes']
      deleted: string[]
    }
    edges: {
      created: WorkflowGraphResponse['edges']
      updated: WorkflowGraphResponse['edges']
      deleted: number[]
    }
    tags: {
      created: Array<{
        id: number
        label?: string
        translation_plural?: string
      }>
      updated: Array<{
        id: number
        label?: string
        translation_plural?: string
      }>
      deleted: number[]
    }
  }
  meta: {
    triggered_by: string
    trigger_entity_id: string
  }
}

const withAuthFetch = (overrides: RequestInit = {}): RequestInit => ({
  credentials: 'include',
  headers: getAuthFetchHeaders(),
  ...overrides
})

const assertOk = async (response: Response) => {
  if (response.ok) {
    return
  }
  const body = await response.text()
  throw new Error(`Graph API request failed (${response.status}): ${body}`)
}

export const fetchWorkflowMeta = async (
  workflowUuid: WorkflowUuid
): Promise<WorkflowMetaEntity> => {
  const response = await fetch(
    apiUrl(
      generatePath(v2Workflow.detail, { uuid: String(workflowUuid) })
    ),
    withAuthFetch({ method: 'GET' })
  )
  await assertOk(response)
  const payload = (await response.json()) as WorkflowMetaResponse
  const item = payload.item
  return {
    uuid: item.uuid,
    title: item.title,
    ownerId: String(item.owner_id),
    projectId:
      item.project_id === null ? null : String(item.project_id),
    revisionId: item.revision_id,
    dateCreated: item.date_created,
    modifiedOn: item.modified_on
  }
}

export type GraphResourceBundle = {
  workflowMeta: WorkflowMetaEntity
  sections: SectionEntity[]
  channels: ChannelEntity[]
  nodes: NodeEntity[]
  edges: EdgeEntity[]
}

export const fetchWorkflowGraphBundle = async (
  workflowUuid: WorkflowUuid
): Promise<GraphResourceBundle> => {
  const response = await fetch(
    apiUrl(
      generatePath(v2Workflow.graph, { uuid: String(workflowUuid) })
    ),
    withAuthFetch({ method: 'GET' })
  )
  await assertOk(response)
  const payload = (await response.json()) as WorkflowGraphResponse

  const workflowMeta: WorkflowMetaEntity = {
    uuid: payload.workflow.uuid,
    title: payload.workflow.title,
    ownerId: String(payload.workflow.owner_id),
    projectId:
      payload.workflow.project_id === null
        ? null
        : String(payload.workflow.project_id),
    revisionId: payload.workflow.revision_id,
    dateCreated: payload.workflow.date_created,
    modifiedOn: payload.workflow.modified_on
  }

  const wfUuid = workflowMeta.uuid

  const sections: SectionEntity[] = payload.sections.map((section) => ({
    uuid: section.uuid,
    workflowUuid: section.workflow_uuid,
    title: section.title,
    position: section.position,
    threadUuid: section.thread_uuid
  }))

  const channels: ChannelEntity[] = payload.channels.map((channel) => ({
    uuid: channel.uuid,
    workflowUuid: channel.workflow_uuid,
    title: channel.title,
    position: channel.position,
    threadUuid: channel.thread_uuid
  }))

  const nodes: NodeEntity[] = payload.nodes.map((node) => ({
    uuid: node.uuid,
    workflowUuid: wfUuid,
    sectionUuid: node.section_uuid,
    channelUuid: node.channel_uuid,
    sectionRow: node.section_row,
    unitUuid: node.unit_uuid,
    threadUuid: node.thread_uuid,
    outcomeUuids: node.outcome_uuids
  }))

  const edges: EdgeEntity[] = payload.edges.map((edge) => ({
    edgeId: String(edge.id),
    workflowUuid: wfUuid,
    sourceNodeUuid: edge.source_node_uuid,
    targetNodeUuid: edge.target_node_uuid,
    lineType: edge.line_type,
    sourcePort: edge.source_port,
    targetPort: edge.target_port
  }))

  return { workflowMeta, sections, channels, nodes, edges }
}

// Tags are not returned from current workflow graph projection.
// Keep a dedicated loader seam so tags can be fetched independently later.
export const fetchWorkflowTags = async (
  _workflowUuid: WorkflowUuid
): Promise<TagEntity[]> => []

const mapMutationNode = (
  workflowUuid: WorkflowUuid,
  node: WorkflowGraphResponse['nodes'][number]
): NodeEntity => ({
  uuid: node.uuid,
  workflowUuid,
  sectionUuid: node.section_uuid,
  channelUuid: node.channel_uuid,
  sectionRow: node.section_row,
  unitUuid: node.unit_uuid,
  threadUuid: node.thread_uuid,
  outcomeUuids: node.outcome_uuids
})

const mapMutationEdge = (
  workflowUuid: WorkflowUuid,
  edge: WorkflowGraphResponse['edges'][number]
): EdgeEntity => ({
  edgeId: String(edge.id),
  workflowUuid,
  sourceNodeUuid: edge.source_node_uuid,
  targetNodeUuid: edge.target_node_uuid,
  lineType: edge.line_type,
  sourcePort: edge.source_port,
  targetPort: edge.target_port
})

const mapMutationEnvelope = (
  payload: GraphMutationEnvelopeResponse
): GraphMutationEnvelope => ({
  workflowUuid: payload.workflow_id,
  revisionId: payload.revision_id,
  changes: {
    nodes: {
      created: payload.changes.nodes.created.map((n) =>
        mapMutationNode(payload.workflow_id, n)
      ),
      updated: payload.changes.nodes.updated.map((n) =>
        mapMutationNode(payload.workflow_id, n)
      ),
      deleted: payload.changes.nodes.deleted
    },
    edges: {
      created: payload.changes.edges.created.map((e) =>
        mapMutationEdge(payload.workflow_id, e)
      ),
      updated: payload.changes.edges.updated.map((e) =>
        mapMutationEdge(payload.workflow_id, e)
      ),
      deleted: payload.changes.edges.deleted.map(String)
    },
    tags: {
      created: payload.changes.tags.created.map((t) => ({
        tagId: String(t.id),
        projectId: null,
        label: t.label ?? '',
        translationPlural: t.translation_plural ?? ''
      })),
      updated: payload.changes.tags.updated.map((t) => ({
        tagId: String(t.id),
        projectId: null,
        label: t.label ?? '',
        translationPlural: t.translation_plural ?? ''
      })),
      deleted: payload.changes.tags.deleted.map(String)
    }
  },
  meta: {
    triggeredBy: payload.meta.triggered_by,
    triggerEntityId: payload.meta.trigger_entity_id
  }
})

const postJson = async <TResponse>(
  url: string,
  body: unknown
): Promise<TResponse> => {
  const response = await fetch(
    url,
    withAuthFetch({
      method: 'POST',
      body: JSON.stringify(body)
    })
  )
  await assertOk(response)
  return (await response.json()) as TResponse
}

const patchJson = async <TResponse>(
  url: string,
  body: unknown
): Promise<TResponse> => {
  const response = await fetch(
    url,
    withAuthFetch({
      method: 'PATCH',
      body: JSON.stringify(body)
    })
  )
  await assertOk(response)
  return (await response.json()) as TResponse
}

const deleteJson = async <TResponse>(url: string): Promise<TResponse> => {
  const response = await fetch(url, withAuthFetch({ method: 'DELETE' }))
  await assertOk(response)
  return (await response.json()) as TResponse
}

export const moveNodeCommand = async (
  input: MoveNodeInput
): Promise<GraphMutationEnvelope> => {
  const payload = await patchJson<GraphMutationEnvelopeResponse>(
    apiUrl(
      generatePath(v2Node.detail, {
        nodeUuid: String(input.nodeUuid)
      })
    ),
    {
      section_uuid: input.sectionId,
      channel_uuid: input.channelId,
      section_row: input.sectionRow
    }
  )
  return mapMutationEnvelope(payload)
}

export const createEdgeCommand = async (
  input: CreateEdgeInput
): Promise<GraphMutationEnvelope> => {
  const payload = await postJson<GraphMutationEnvelopeResponse>(
    apiUrl(
      generatePath(v2Workflow.edges, {
        workflowUuid: String(input.workflowUuid)
      })
    ),
    {
      source_node_uuid: input.sourceNodeUuid,
      target_node_uuid: input.targetNodeUuid,
      line_type: input.lineType ?? '',
      source_port: input.sourcePort ?? '',
      target_port: input.targetPort ?? ''
    }
  )
  return mapMutationEnvelope(payload)
}

export const deleteEdgeCommand = async (
  input: DeleteEdgeInput
): Promise<GraphMutationEnvelope> => {
  const payload = await deleteJson<GraphMutationEnvelopeResponse>(
    apiUrl(
      generatePath(v2Edge.detail, {
        edgeId: String(input.edgeId)
      })
    )
  )
  return mapMutationEnvelope(payload)
}

export const deleteNodeCommand = async (
  input: DeleteNodeInput
): Promise<GraphMutationEnvelope> => {
  const payload = await deleteJson<GraphMutationEnvelopeResponse>(
    apiUrl(
      generatePath(v2Node.detail, {
        nodeUuid: String(input.nodeUuid)
      })
    )
  )
  return mapMutationEnvelope(payload)
}

export const renameNodeCommand = async (
  _input: RenameNodeInput
): Promise<GraphMutationEnvelope> => {
  throw new Error(
    'renameNode is not yet supported by the current backend graph mutation contract.'
  )
}
