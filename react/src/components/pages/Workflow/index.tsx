import Loader from '@cf/components/common/UIPrimitives/Loader'
import { WorkflowSidebarContextProvider } from '@cf/components/pages/Workflow/Sidebar/hooks/useSidebar/context'
import WorkflowTabs from '@cf/components/pages/Workflow/WorkflowTabs'
import { selectGraphByUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import {
  canRenderChannels,
  canRenderEdges,
  canRenderNodes,
  canRenderShell,
  selectWorkflowLoadState
} from '@cf/features/graph/state/selectors/readiness.selectors'
import { useGraphBootstrap } from '@cf/features/graph/state/useGraphBootstrap'
import { RootState } from '@cf/redux/store'
import ErrorView from '@cfPages/MsgViews/ErrorView'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

const Workflow = () => {
  const { uuid } = useParams<{ uuid: string }>()
  const workflowUuid = uuid ?? null

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
  const graphMeta = useSelector((state: RootState) =>
    workflowUuid ? selectGraphByUuid(workflowUuid)(state) : null
  )
  const loadState = useSelector((state: RootState) =>
    workflowUuid ? selectWorkflowLoadState(workflowUuid)(state) : undefined
  )

  if (!workflowUuid) {
    return <ErrorView />
  }

  if (!shellReady && loadState?.graph !== 'failed') {
    return <Loader />
  }

  if (loadState?.graph === 'failed') {
    return <ErrorView />
  }

  return (
    <WorkflowSidebarContextProvider>
      <div style={{ padding: '1rem' }} data-test-id="graph-bootstrap-status">
        <h2>{graphMeta?.workflowTitle || 'Workflow'}</h2>
        <p>Graph hydration bootstrap active (new graph store path).</p>
        <ul>
          <li>shell: {String(shellReady)}</li>
          <li>channels: {String(channelsReady)}</li>
          <li>nodes: {String(nodesReady)}</li>
          <li>edges: {String(edgesReady)}</li>
        </ul>
      </div>
      <WorkflowTabs />
    </WorkflowSidebarContextProvider>
  )
}

export default Workflow
