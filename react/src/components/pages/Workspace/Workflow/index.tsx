import WorkflowConfigProvider from '@cf/context/workFlowConfigContext'
import {
  canRenderChannels,
  canRenderEdges,
  canRenderNodes,
  canRenderShell,
  selectWorkflowLoadState,
  selectWorkflowMetaByUuid,
  useGraphBootstrap
} from '@cf/features/graph/state'
import Loader from '@cfComponents/UIPrimitives/Loader'
import ErrorView from '@cfPages/MsgViews/ErrorView'
import { RootState } from '@cfRedux/store'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { WorkflowSidebarContextProvider } from './Sidebar/hooks/useSidebar/context'

const Workflow = () => {
  const { id } = useParams<{ id: string }>()
  const workflowUuid = id ?? null

  useGraphBootstrap(workflowUuid)

  const shellReady = useSelector((state: RootState) =>
    workflowUuid ? canRenderShell(workflowUuid)(state) : false
  )
  const channelsReady = useSelector((state: RootState) =>
    workflowUuid ? canRenderChannels(workflowUuid)(state) : false
  )
  const nodesReady = useSelector((state: RootState) =>
    workflowUuid ? canRenderNodes(workflowUuid)(state) : false
  )
  const edgesReady = useSelector((state: RootState) =>
    workflowUuid ? canRenderEdges(workflowUuid)(state) : false
  )
  const workflowMeta = useSelector((state: RootState) =>
    workflowUuid ? selectWorkflowMetaByUuid(workflowUuid)(state) : null
  )
  const loadState = useSelector((state: RootState) =>
    workflowUuid ? selectWorkflowLoadState(workflowUuid)(state) : undefined
  )

  if (!workflowUuid) {
    return <ErrorView />
  }

  if (!shellReady && loadState?.workflowMeta !== 'failed') {
    return <Loader />
  }

  if (loadState?.workflowMeta === 'failed') {
    return <ErrorView />
  }

  // Temporary bootstrap gate for graph rewrite.
  // This intentionally avoids legacy websocket/workspace hydration path.
  return (
    <WorkflowSidebarContextProvider>
      <WorkflowConfigProvider
        initialValue={{
          editableMethods: {
            lockUpdate: () => undefined,
            microUpdate: () => undefined,
            changeField: () => undefined
          },
          ws: {
            wsConnected: false,
            connectedUsers: []
          }
        }}
      >
        <div style={{ padding: '1rem' }} data-test-id="graph-bootstrap-status">
          <h2>{workflowMeta?.title || 'Workflow'}</h2>
          <p>Graph hydration bootstrap active (new graph store path).</p>
          <ul>
            <li>shell: {String(shellReady)}</li>
            <li>channels: {String(channelsReady)}</li>
            <li>nodes: {String(nodesReady)}</li>
            <li>edges: {String(edgesReady)}</li>
          </ul>
        </div>
      </WorkflowConfigProvider>
    </WorkflowSidebarContextProvider>
  )
}

export default Workflow
