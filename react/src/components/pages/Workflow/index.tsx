import Loader from '@cf/components/common/UIPrimitives/Loader'
import { WorkflowSidebarContextProvider } from '@cf/components/pages/Workflow/Sidebar/hooks/useSidebar/context'
import WorkflowTabs from '@cf/components/pages/Workflow/WorkflowTabs'
import ErrorView from '@cf/components/views/MsgViews/ErrorView'
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
import { RootState } from '@cf/redux/store'
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
  const workflowMeta = useSelector((state: RootState) =>
    workflowUuid ? selectWorkflowMetaByUuid(workflowUuid)(state) : null
  )
  const loadState = useSelector((state: RootState) =>
    workflowUuid ? selectWorkflowLoadState(workflowUuid)(state) : undefined
  )

  // if (!workflowUuid) {
  //   return <ErrorView />
  // }

  // if (!shellReady && loadState?.workflowMeta !== 'failed') {
  //   return <Loader />
  // }

  // if (loadState?.workflowMeta === 'failed') {
  //   return <ErrorView />
  // }

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
        {/*<div style={{ padding: '1rem' }} data-test-id="graph-bootstrap-status">*/}
        {/*  <h2>{workflowMeta?.workflowTitle || 'Workflow'}</h2>*/}
        {/*  <p>Graph hydration bootstrap active (new graph store path).</p>*/}
        {/*  <ul>*/}
        {/*    <li>shell: {String(shellReady)}</li>*/}
        {/*    <li>channels: {String(channelsReady)}</li>*/}
        {/*    <li>nodes: {String(nodesReady)}</li>*/}
        {/*    <li>edges: {String(edgesReady)}</li>*/}
        {/*  </ul>*/}
        {/*</div>*/}
        <WorkflowTabs />
      </WorkflowConfigProvider>
    </WorkflowSidebarContextProvider>
  )
}

export default Workflow
