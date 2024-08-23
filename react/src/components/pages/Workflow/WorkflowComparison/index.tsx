import React from 'react'
import * as reactDom from 'react-dom'
import Loader from '@cfCommonComponents/UIComponents/Loader'
import * as Reducers from '@cfReducers'
import { Provider } from 'react-redux'
import ComparisonWorkflowBase from '@cfViews/ComparisonView/ComparisonWorkflowBase'
import { createStore } from '@reduxjs/toolkit'
import Workflow from '@cfPages/Workflow/Workflow'
import { ViewType } from '@cfModule/types/enum.js'
import { EWorkflowDataPackage } from '@XMLHTTP/types'
import WorkFlowConfigProvider from '@cfModule/context/workFlowConfigContext'
import { getWorkflowDataQuery } from '@XMLHTTP/API/workflow'
import * as Constants from '@cfModule/constants'
import { getProjectById  } from '@XMLHTTP/API/project'

type WorkflowComparisonParams = {
  workflowID: number
  selectionManager: any
  container: string
  viewType: any
  initial_object_sets: any
  dataPackage: EWorkflowDataPackage
}

// @ts-ignore
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const defaultPermissions = {
  readOnly: false,
  viewComments: false,
  addComments: false
}

const getProjectPermissions = (userPermission) => {
  switch (userPermission) {
    case Constants.permission_keys['none']:
    case Constants.permission_keys['view']:
      return {
        ...defaultPermissions,
        readOnly: true
      }
    case Constants.permission_keys['comment']:
      return {
        ...defaultPermissions,
        readOnly: true,
        viewComments: true,
        addComments: true
      }

    case Constants.permission_keys['edit']:
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
export class WorkflowComparison extends Workflow {
  private initial_object_sets: any
  private projectData: any
  private userPermission: any

  constructor(props) {
    // need to get project data and use it here see
    // legacy comparison

    //     this.projectData = props.project_data
    // then swithc on the proejct permissiongs using
    // getProjectPermissions

    super(props)
    this.state = {
      ready: false,
      viewType: ViewType.WORKFLOW
    }
    this.updateView = this.updateView.bind(this)
    this.workflowID = 1

    // this is the only place this occurs in the whole app now
    // so probably still a hack
    // makeActiveSidebar('#project' + this.projectData.id)

    // this.initial_object_sets = initial_object_sets
  }
  componentDidMount() {
    const id = '1'

    getProjectById(id).then((response) => {
      console.log('getProjectById')
      console.log(response)
      this.setupNewData(response.data_package)
      this.init()
    })
  }

  setupNewData(response) {
    this.projectData = response.project_data
    this.userPermission = response.user_permission // @todo double check we're getting this from data object

    //@todo this a jquery global function and needs to be refactored / removed
    makeActiveSidebar('#project' + this.projectData.id)
  }

  onConnectionOpened(reconnect = false) {
    getWorkflowDataQuery(this.workflowID, (response) => {
      let data_flat = response.data_package
      if (this.initial_object_sets) {
        data_flat = {
          ...data_flat,
          objectset: this.initial_object_sets
        }
      }

      this.store = createStore(
        Reducers.rootWorkflowReducer,
        // @ts-ignore
        data_flat,
        composeEnhancers()
      )

      this.setState({
        ...this.state,
        ready: true
      })

      this.clear_queue(data_flat.workflow.edit_count)

      if (reconnect) {
        // @ts-ignore
        this.attempt_reconnect() // @todo where is this defined
      }
    })
  }

  render() {
    this.locks = {}

    if (
      this.state.viewType !== ViewType.WORKFLOW &&
      this.state.viewType !== ViewType.OUTCOME_EDIT
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
          <ComparisonWorkflowBase view_type={this.state.viewType} />
        </WorkFlowConfigProvider>
      </Provider>
    )
  }
}

export default WorkflowComparison
