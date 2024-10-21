import { UserContext } from '@cf/context/userContext'
import WorkFlowConfigProvider from '@cf/context/workFlowConfigContext'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { useWorkflowWebsocketManager } from '@cfPages/Workspace/Workflow/hooks/useWorkflowWebsocketManager'
import WorkflowTabs from '@cfPages/Workspace/Workflow/WorkflowTabs'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import ErrorView from "@cfViews/ErrorView";
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
    userId: userContext?.id || 0,
    userName: userContext?.name || '',
    workflowId: Number(id)
  })

  const [state, setState] = useState({
    ready: false
  })

  /*******************************************************
   * Once the websocket id 'initialized' that measn connected
   * AND it performs the query
   * AND stores data in store
   * then this component is listens to store and in turn sets ready state
   *
   * @todo This might change:
   * it doesn't really make sense that we are waiting for the socket to open before
   * we fetch the workflow data.
   * socket is just about async updates, presumably that's why we have a queue manager? But we don't trust it right now
   * not only that but it doesn't make sense this is all one render blocking query
   * ..
   * maybe we don't need to use the store at all here
   * maybe we should be relyong on the RTK query cache

   *******************************************************/
  useEffect(() => {
    if (workflowData?.workflowPermissions) {
      setSelectionManager(
        new SelectionManager(workflowData.workflowPermissions.read)
      )
      setState((prevState) => ({ ...prevState, ready: true }))
      clearQueue(workflowData.editCount)
    }
  }, [workflowData, clearQueue])

  /**
   * Essentially we are going to clean up the workflow based redux store on component 'unmount'
   */
  useEffect(() => {
    // not sure if this is a good idea yeah
    // but essentially, when we navigate away from workflow we're going to
    // clear the 'workflow' bit of the store so we aren't in say,
    // library area with a defined workflow store
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
    <WorkFlowConfigProvider
      initialValue={{
        selectionManager: selectionManager!,
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
    </WorkFlowConfigProvider>
  )
}

export default Workflow
