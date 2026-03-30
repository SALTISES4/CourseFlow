import WorkflowConfigProvider from '@cf/context/workFlowConfigContext'
import {
  canRenderChannels,
  canRenderEdges,
  canRenderNodes,
  canRenderShell,
  selectWorkflowLoadState,
  selectWorkflowMetaById,
  useGraphBootstrap
} from '@cf/features/graph/state'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { WorkflowSidebarContextProvider } from '@cfPages/Workspace/Workflow/Sidebar/hooks/useSidebar/context'
import { RootState } from '@cfRedux/store'
import ErrorView from '@cfViews/MsgViews/ErrorView'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

const Workflow = () => {
  const { id } = useParams<{ id: string }>()
  const workflowId = id ?? null

  useGraphBootstrap(workflowId)

  const shellReady = useSelector((state: RootState) =>
    workflowId ? canRenderShell(workflowId)(state) : false
  )
  const channelsReady = useSelector((state: RootState) =>
    workflowId ? canRenderChannels(workflowId)(state) : false
  )
  const nodesReady = useSelector((state: RootState) =>
    workflowId ? canRenderNodes(workflowId)(state) : false
  )
  const edgesReady = useSelector((state: RootState) =>
    workflowId ? canRenderEdges(workflowId)(state) : false
  )
  const workflowMeta = useSelector((state: RootState) =>
    workflowId ? selectWorkflowMetaById(workflowId)(state) : null
  )
  const loadState = useSelector((state: RootState) =>
    workflowId ? selectWorkflowLoadState(workflowId)(state) : undefined
  )

  if (!workflowId) {
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
