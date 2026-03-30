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
  WorkflowId,
  WorkflowMetaEntity
} from './model/types'

type WorkflowMetaResponse = {
  id: number
  uuid: string
  title: string
  owner_id: number
  project_id: number | null
  revision_id: number
  date_created: string
  modified_on: string
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
      created: Array<{ id: number; label?: string; translation_plural?: string }>
      updated: Array<{ id: number; label?: string; translation_plural?: string }>
      deleted: number[]
    }
  }
  meta: {
    triggered_by: string
    trigger_entity_id: string
  }
}

const defaultRequestInit: RequestInit = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include'
}

const assertOk = async (response: Response) => {
  if (response.ok) {
    return
  }
  const body = await response.text()
  throw new Error(`Graph API request failed (${response.status}): ${body}`)
}

export const fetchWorkflowMeta = async (
  workflowId: WorkflowId
): Promise<WorkflowMetaEntity> => {
  const response = await fetch(`/api/workflow/${workflowId}`, defaultRequestInit)
  await assertOk(response)
  const payload = (await response.json()) as WorkflowMetaResponse
  return {
    id: payload.uuid,
    title: payload.title,
    ownerId: String(payload.owner_id),
    projectId:
      payload.project_id === null ? null : String(payload.project_id),
    revisionId: payload.revision_id,
    dateCreated: payload.date_created,
    modifiedOn: payload.modified_on
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
  workflowId: WorkflowId
): Promise<GraphResourceBundle> => {
  const response = await fetch(
    `/api/workflow/${workflowId}/graph`,
    defaultRequestInit
  )
  await assertOk(response)
  const payload = (await response.json()) as WorkflowGraphResponse

  const workflowMeta: WorkflowMetaEntity = {
    id: payload.workflow.uuid,
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

  const sections: SectionEntity[] = payload.sections.map((section) => ({
    id: section.uuid,
    workflowId: section.workflow_uuid,
    title: section.title,
    position: section.position,
    threadId: section.thread_uuid
  }))

  const channels: ChannelEntity[] = payload.channels.map((channel) => ({
    id: channel.uuid,
    workflowId: channel.workflow_uuid,
    title: channel.title,
    position: channel.position,
    threadId: channel.thread_uuid
  }))

  const nodes: NodeEntity[] = payload.nodes.map((node) => ({
    id: node.uuid,
    workflowId,
    sectionId: node.section_uuid,
    channelId: node.channel_uuid,
    sectionRow: node.section_row,
    unitId: node.unit_uuid,
    threadId: node.thread_uuid,
    outcomeIds: node.outcome_uuids
  }))

  const edges: EdgeEntity[] = payload.edges.map((edge) => ({
    id: String(edge.id),
    workflowId,
    sourceNodeId: edge.source_node_uuid,
    targetNodeId: edge.target_node_uuid,
    lineType: edge.line_type,
    sourcePort: edge.source_port,
    targetPort: edge.target_port
  }))

  return { workflowMeta, sections, channels, nodes, edges }
}

// Tags are not returned from current workflow graph projection.
// Keep a dedicated loader seam so tags can be fetched independently later.
export const fetchWorkflowTags = async (
  _workflowId: WorkflowId
): Promise<TagEntity[]> => []

const mapMutationNode = (
  workflowId: WorkflowId,
  node: WorkflowGraphResponse['nodes'][number]
): NodeEntity => ({
  id: node.uuid,
  workflowId,
  sectionId: node.section_uuid,
  channelId: node.channel_uuid,
  sectionRow: node.section_row,
  unitId: node.unit_uuid,
  threadId: node.thread_uuid,
  outcomeIds: node.outcome_uuids
})

const mapMutationEdge = (
  workflowId: WorkflowId,
  edge: WorkflowGraphResponse['edges'][number]
): EdgeEntity => ({
  id: String(edge.id),
  workflowId,
  sourceNodeId: edge.source_node_uuid,
  targetNodeId: edge.target_node_uuid,
  lineType: edge.line_type,
  sourcePort: edge.source_port,
  targetPort: edge.target_port
})

const mapMutationEnvelope = (
  payload: GraphMutationEnvelopeResponse
): GraphMutationEnvelope => ({
  workflowId: payload.workflow_id,
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
        id: String(t.id),
        projectId: null,
        label: t.label ?? '',
        translationPlural: t.translation_plural ?? ''
      })),
      updated: payload.changes.tags.updated.map((t) => ({
        id: String(t.id),
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
  const response = await fetch(url, {
    method: 'POST',
    headers: defaultRequestInit.headers,
    credentials: defaultRequestInit.credentials,
    body: JSON.stringify(body)
  })
  await assertOk(response)
  return (await response.json()) as TResponse
}

const patchJson = async <TResponse>(
  url: string,
  body: unknown
): Promise<TResponse> => {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: defaultRequestInit.headers,
    credentials: defaultRequestInit.credentials,
    body: JSON.stringify(body)
  })
  await assertOk(response)
  return (await response.json()) as TResponse
}

const deleteJson = async <TResponse>(url: string): Promise<TResponse> => {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: defaultRequestInit.headers,
    credentials: defaultRequestInit.credentials
  })
  await assertOk(response)
  return (await response.json()) as TResponse
}

export const moveNodeCommand = async (
  input: MoveNodeInput
): Promise<GraphMutationEnvelope> => {
  const payload = await patchJson<GraphMutationEnvelopeResponse>(
    `/api/workflow/${input.workflowId}/nodes/${input.nodeId}`,
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
    `/api/workflow/${input.workflowId}/edges`,
    {
      source_node_uuid: input.sourceNodeId,
      target_node_uuid: input.targetNodeId,
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
    `/api/workflow/${input.workflowId}/edges/${input.edgeId}`
  )
  return mapMutationEnvelope(payload)
}

export const deleteNodeCommand = async (
  input: DeleteNodeInput
): Promise<GraphMutationEnvelope> => {
  const payload = await deleteJson<GraphMutationEnvelopeResponse>(
    `/api/workflow/${input.workflowId}/nodes/${input.nodeId}`
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
