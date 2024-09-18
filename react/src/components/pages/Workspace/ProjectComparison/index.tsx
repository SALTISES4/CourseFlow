// @ts-nocheck
import * as Constants from '@cf/constants'
import WorkFlowConfigProvider from '@cf/context/workFlowConfigContext'
import legacyWithRouter from '@cf/HOC/legacyWithRouter'
import { WorkflowViewType } from '@cf/types/enum.js'
import Loader from '@cfComponents/UIPrimitives/Loader'
import Workflow, { WorkflowClass } from '@cfPages/Workspace/Workflow'
import * as Reducers from '@cfRedux/Reducers'
import ComparisonWorkflowBase from '@cfViews/ProjectComparisonView/ComparisonWorkflowBase'
import { createStore } from '@reduxjs/toolkit'
import { getProjectById } from '@XMLHTTP/API/project'
import { getWorkflowQuery } from '@XMLHTTP/API/workflow'
import React from 'react'
import { Provider } from 'react-redux'

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__

const defaultPermissions = {
  readOnly: false,
  viewComments: false,
  addComments: false
}

const getProjectPermissions = (userPermission) => {
  switch (userPermission) {
    case Constants.permissionKeys['none']:
    case Constants.permissionKeys['view']:
      return {
        ...defaultPermissions,
        readOnly: true
      }
    case Constants.permissionKeys['comment']:
      return {
        ...defaultPermissions,
        readOnly: true,
        viewComments: true,
        addComments: true
      }

    case Constants.permissionKeys['edit']:
      return {
        ...defaultPermissions,
        readOnly: false,
        viewComments: true,
        addComments: true
      }
    default:
      return defaultPermissions
  }
}

/****************************************
 *  @WorkflowComparisonRenderer
 *  @todo this is possibly where the channel leak is
 * ****************************************/
export class ProjectComparison extends WorkflowClass {
  private initialObjectSets: any
  private projectData: any
  private userPermission: any

  constructor(props) {
    // need to get project data and use it here see
    // legacy comparison

    //     this.projectData = props.projectData
    // then swithc on the proejct permissiongs using
    // getProjectPermissions

    super(props)
    this.state = {
      ready: false,
      viewType: WorkflowViewType.WORKFLOW
    }
    this.updateView = this.updateView.bind(this)
    this.workflowId = 1

    // this is the only place this occurs in the whole app now
    // so probably still a hack
    // makeActiveSidebar('#project' + this.projectData.id)

    // this.initialObjectSets = initialObjectSets
  }
  componentDidMount() {
    const id = '1'

    getProjectById(id).then((response) => {
      this.setupNewData(response.dataPackage)
      // this.init()
    })
  }

  setupNewData(response) {
    this.projectData = response.projectData
    this.userPermission = response.userPermission // @todo double check we're getting this from data object

    //@todo this a jquery global function and needs to be refactored / removed
    makeActiveSidebar('#project' + this.projectData.id)
  }

  onConnectionOpened(reconnect = false) {
    // this makes no sense....
    getWorkflowQuery(this.workflowId, (response) => {
      let dataFlat = response.dataPackage
      if (this.initialObjectSets) {
        dataFlat = {
          ...dataFlat,
          objectset: this.initialObjectSets
        }
      }

      this.store = createStore(
        Reducers.rootWorkflowReducer,
        {},
        composeEnhancers()
      )

      this.setState({
        ...this.state,
        ready: true
      })

      this.clearQueue(dataFlat.workflow.editCount)

      if (reconnect) {
        // @ts-ignore
        this.attemptReconnect() // @todo where is this defined
      }
    })
  }

  render() {
    this.locks = {}

    if (
      this.state.viewType !== WorkflowViewType.WORKFLOW &&
      this.state.viewType !== WorkflowViewType.OUTCOME_EDIT
    ) {
      return <>comparsion view not supported</>
    }

    if (!this.state.ready) {
      return <Loader />
    }

    return (
      <Provider store={this.store}>
        <WorkFlowConfigProvider initialValue={this}>
          {/*
          see:
            getWorkflowContextQuery(t
            deep in react/src/components/workflowViews/ComparisonView/components/WorkflowComparisonRendererComponent.tsx

            for why this is not rendering
            don't bother troubleshooting this until you are ready to unpack that
          */}
          <ComparisonWorkflowBase viewType={this.state.viewType} />
        </WorkFlowConfigProvider>
      </Provider>
    )
  }
}

export { ProjectComparison as ProjectComparisonClass }
export default legacyWithRouter(ProjectComparison)
