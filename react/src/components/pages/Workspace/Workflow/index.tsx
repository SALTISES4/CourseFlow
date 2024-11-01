import { UserContext } from '@cf/context/userContext'
import WorkflowConfigProvider from '@cf/context/workFlowConfigContext'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { useWorkflowWebsocketManager } from '@cfPages/Workspace/Workflow/hooks/useWorkflowWebsocketManager'
import { EditableContextProvider } from '@cfPages/Workspace/Workflow/Sidebar/hooks/useEditable/context'
import { WorkflowSidebarContextProvider } from '@cfPages/Workspace/Workflow/Sidebar/hooks/useSidebar/context'
import WorkflowTabs from '@cfPages/Workspace/Workflow/WorkflowTabs'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import ErrorView from '@cfViews/MsgViews/ErrorView'
import { useGetWorkflowByIdQuery } from '@XMLHTTP/API/workflow.rtk'
import React, { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

const Workflow = () => {
  const userContext = useContext(UserContext)
  const { id } = useParams<{ id: string }>()
  const workflowId = Number(id)
  const navigate = useNavigate

  const workflowData = useSelector((state: AppState) => state.workflow) // Replace with actual Redux state selector
  const dispatch = useDispatch()

  const [selectionManager, setSelectionManager] =
    useState<SelectionManager | null>(null)

  const { onError } = useGenericMsgHandler()
  const { isError, error } = useGetWorkflowByIdQuery({ id: workflowId })

  /*******************************************************
   * Listen to the websocket hook service layer
   * this layer acts as an implementer for the socket service
   * but it does domain specific things,
   * i.e. it fetches the workflow and populates redux store
   * this maybe could be looked at again but it's fine for now
   *******************************************************/
  const {
    isWsInit,
    connectedUsers,
    clearQueue,
    microUpdate,
    changeField,
    lockUpdate
  } = useWorkflowWebsocketManager({
    user: userContext.user || null,
    workflowId: Number(id)
  })

  const [state, setState] = useState({
    ready: false
  })

  /*******************************************************
   * Once the websocket is 'initialized' that means:
   * WS connected
   * AND it performs the query
   * AND stores data in store
   * then this component listens to store and in turn, sets ready state
   *
   * @todo This might change:
   * it doesn't make sense that we are waiting for the socket to open before
   * we fetch the workflow data.
   * socket is just about async updates, presumably that's why we have a queue manager? But we don't trust it right now.
   * Not only that but it doesn't make sense this is all one render blocking query
   * ..
   * maybe we don't need to use the store at all here
   * maybe we should be relying on the RTK query cache
   *******************************************************/
  useEffect(() => {
    if (workflowData && workflowData.workflowPermissions) {
      setSelectionManager(
        new SelectionManager(workflowData.workflowPermissions.read)
      )
      setState((prevState) => ({ ...prevState, ready: true }))
      clearQueue(workflowData.editCount)
    }
  }, [workflowData, clearQueue])

  /**
   * Clean up the workflow based redux store on component 'unmount'
   */
  useEffect(() => {
    // When we navigate away from workflow,
    // clear the 'workflow' bit of the store so we aren't in for example,
    // library area with a defined workflow store
    // this approach could use work refinement
    return () => {
      dispatch(ActionCreator.clearWorkflowData())
    }
  }, [])

  /*******************************************************
   *
   *******************************************************/
  if (isError) {
    return <ErrorView />
  }
  if (!state.ready) {
    return <Loader />
  }

  return (
    <WorkflowSidebarContextProvider>
      <EditableContextProvider>
        <WorkflowConfigProvider
          initialValue={{
            selectionManager: selectionManager,
            editableMethods: {
              lockUpdate,
              microUpdate,
              changeField
            },
            ws: {
              wsConnected: isWsInit,
              connectedUsers
            }
          }}
        >
          <WorkflowTabs />
        </WorkflowConfigProvider>
      </EditableContextProvider>
    </WorkflowSidebarContextProvider>
  )
}

export default Workflow
