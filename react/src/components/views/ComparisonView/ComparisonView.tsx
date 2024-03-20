import * as React from 'react'
import * as reactDom from 'react-dom'
import * as Utility from '@cfUtility'
// @components
import RightSideBar from '@cfCommonComponents/rightSideBarContent/RightSideBar'
import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'

import { renderMessageBox } from '@cfCommonComponents/menu/MenuComponents'
import closeMessageBox from '@cfCommonComponents/menu/components/closeMessageBox'
import { CfObjectType, ViewType } from '@cfModule/types/enum.js'
import WorkflowComparisonRendererComponent from '@cfViews/ComparisonView/components/WorkflowComparisonRendererComponent'
import { getWorkflowSelectMenuQuery } from '@XMLHTTP/API/workflow'
import { AppState } from '@cfRedux/types/type'
import { openWorkflowSelectMenu } from '@XMLHTTP/postTemp'
import {
  GetWorkflowSelectQueryResp,
  GetWorkflowSelectMenuResp
} from '@XMLHTTP/types/query'
import { EProject } from '@cfModule/XMLHTTP/types/entity'
// import $ from 'jquery'

/**
 * Creates a sort of container for the workflows you want to compare,
 * allowing the user to load new workflows and remove them.
 * Also controls the sidebar and menubar (the latter not currently used here).
 * When a workflow is added a WorkflowComparisonRenderer component is created.
 */

type StateType = {
  object_sets: AppState['objectset'] // @todo this is a guess, verify
  workflows: number[]
}
type PropsType = {
  view_type: ViewType
  // turn this into config object
  projectData: EProject
  selection_manager: any
  read_only: boolean
  parentRender: any
  container: any
}
class ComparisonView extends React.Component<PropsType, StateType> {
  // static contextType = WorkFlowConfigContext
  // declare context: React.ContextType<typeof WorkFlowConfigContext>

  private allowed_tabs: number[]
  private objectType: CfObjectType

  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WORKFLOW
    this.allowed_tabs = [0, 3]

    const querystring = window.location.search
    const url_params = new URLSearchParams(querystring)
    const workflows_added = url_params
      .getAll('workflows')
      .map((workflow_id) => parseInt(workflow_id))

    this.state = {
      workflows: workflows_added,
      object_sets: props.projectData.object_sets
    }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeSortable()
    this.updateTabs()
    window.addEventListener('click', (evt) => {
      if ($(evt.target).closest('.other-views').length == 0) {
        $('.views-dropdown').removeClass('toggled')
      }
    })
  }

  componentDidUpdate(prev_props: PropsType) {
    this.makeSortable()
    if (prev_props.view_type != this.props.view_type) {
      this.updateTabs()
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  makeSortable() {
    $('.workflow-array').sortable({
      axis: 'x',
      stop: function (evt, ui) {}
    })
  }

  updateTabs() {
    // Clear current selection
    this.props.selection_manager.changeSelection(null, null)

    // Determine disabled tabs
    const disabledTabs = [0, 1, 2, 3].filter(
      (tabIndex) => !this.allowed_tabs.includes(tabIndex)
    )

    // Initialize sidebar tabs with no disabled tabs
    $('#sidebar').tabs({ disabled: false })

    // Get the currently active tab
    const currentTab = $('#sidebar').tabs('option', 'active')

    // Check if the current tab is allowed, and if not, update accordingly
    if (!this.allowed_tabs.includes(currentTab)) {
      const newActiveTab =
        this.allowed_tabs.length === 0 ? false : this.allowed_tabs[0]
      $('#sidebar').tabs({ active: newActiveTab })
    }

    // Finally, disable the appropriate tabs
    $('#sidebar').tabs({ disabled: disabledTabs })
  }

  changeView(type) {
    this.props.selection_manager.changeSelection(null, null)

    // force re-render the parent, see comment in react/src/components/views/ComparisonView/ComparisonView.tsx
    // this can be our state updater
    // but refactor when other bugs from 1st pass refactor addressed (?)
    this.props.parentRender(this.props.container, type)
  }

  openEdit() {}

  updateFunction = (responseData: GetWorkflowSelectMenuResp) => {
    if (responseData.workflowID != null) {
      const workflows = this.state.workflows.slice()
      workflows.push(responseData.workflowID)
      const treat = this
      this.setState({
        workflows: [...this.state.workflows, responseData.workflowID]
      })
    }
  }

  loadWorkflow() {
    COURSEFLOW_APP.tinyLoader.startLoad()
    getWorkflowSelectMenuQuery(
      this.props.projectData.id,
      CfObjectType.WORKFLOW,
      false,
      true,
      (data: GetWorkflowSelectQueryResp) => {
        // @todo move this to dialog
        openWorkflowSelectMenu(data, (dataResp: GetWorkflowSelectMenuResp) =>
          this.updateFunction(dataResp)
        )
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  }

  removeWorkflow(workflowId: number) {
    const workflows = this.state.workflows.slice()
    workflows.splice(workflows.indexOf(workflowId), 1)
    this.setState({ workflows: workflows })
  }

  toggleObjectSet(id: number) {
    let hidden: boolean
    const object_sets = this.state.object_sets.slice()

    const object = object_sets.find((objectSet) => objectSet.id === id)
    if (object) {
      hidden = !object.hidden
      object.hidden = hidden
    }

    this.setState({ object_sets: object_sets })

    // @todo what is this doing?
    $(document).triggerHandler('object_set_toggled', { id: id, hidden: hidden })
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Header = () => {
    const data = this.props.projectData

    // PORTAL
    const portal = reactDom.createPortal(
      <a
        className="hover-shade no-underline"
        id="project-return"
        href={COURSEFLOW_APP.config.update_path['project'].replace(
          String(0),
          String(data.id)
        )}
      >
        <span className="green material-symbols-rounded">arrow_back_ios</span>
        <div>{window.gettext('Return to project')}</div>
      </a>,
      $('.titlebar .title')[0]
    )

    return (
      <>
        {portal}
        <div className="project-header">
          <div>{window.gettext('Comparing workflows for:')}</div>
          <WorkflowTitle
            data={data}
            no_hyperlink={true}
            class_name="project-title"
          />
        </div>
      </>
    )
  }

  ViewButtons = () => {
    return [
      {
        type: ViewType.WORKFLOW,
        name: window.gettext('Workflow View'),
        disabled: []
      },
      {
        type: ViewType.OUTCOME_EDIT,
        name: Utility.capWords(window.gettext('View') + ' outcomes'),
        disabled: []
      }
    ]
      .filter(
        (item) => item.disabled.indexOf(this.props.projectData.type) == -1
      )
      .map((item, index) => {
        const viewClasses = [
          'hover-shade',
          item.type === this.props.view_type ? 'active' : ''
        ].join(' ')

        return (
          <div
            key={index}
            id={'button_' + item.type}
            className={viewClasses}
            onClick={this.changeView.bind(this, item.type)}
          >
            {item.name}
          </div>
        )
      })
  }

  Share = () => {
    if (!this.props.read_only)
      return (
        <div
          id="share-button"
          className="hover-shade"
          title={window.gettext('Sharing')}
          // @todo move to dialog
          onClick={renderMessageBox.bind(
            this,
            this.props.projectData,
            'share_menu',
            closeMessageBox
          )}
        >
          <img src={COURSEFLOW_APP.config.icon_path + 'add_person.svg'} />
        </div>
      )
  }
  AddButton = () => (
    <div>
      <button
        id="load-workflow"
        className="primary-button"
        onClick={this.loadWorkflow.bind(this)}
      >
        <div className="flex-middle">
          <span className="material-symbols-rounded filled">add_circle</span>
          <div>{window.gettext('Load new workflow')}</div>
        </div>
      </button>
    </div>
  )

  WorkflowContent = () => {
    return this.state.workflows.map((workflowID) => (
      <WorkflowComparisonRendererComponent
        key={workflowID}
        removeFunction={this.removeWorkflow.bind(this, workflowID)}
        // @ts-ignore
        view_type={this.props.view_type}
        workflowID={workflowID}
        selection_manager={this.props.selection_manager}
        object_sets={this.state.object_sets}
      />
    ))
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.projectData

    // @todo, not used
    // const style: React.CSSProperties = {
    //   border: data.lock ? '2px solid ' + data.lock.user_colour : undefined
    // }

    // @todo, this share portal target does not exist
    // const sharePortal = reactDom.createPortal(
    //   <this.Share />,
    //   $('#visible-icons')[0]
    // )

    return (
      <>
        <div className="main-block">
          <div className="right-panel-wrapper">
            <div className="body-wrapper">
              <div id="workflow-wrapper" className="workflow-wrapper">
                <this.Header />
                <div className="workflow-view-select hide-print">
                  <this.ViewButtons />
                </div>
                <div className="workflow-container comparison-view">
                  <div className="workflow-array">
                    <this.WorkflowContent />
                  </div>
                  <this.AddButton />
                </div>
              </div>
            </div>

            <RightSideBar
              context="comparison"
              parentRender={this.props.parentRender}
              data={data}
              toggleObjectSet={this.toggleObjectSet.bind(this)}
              object_sets={this.state.object_sets}
            />
          </div>
        </div>
      </>
    )
  }
}
export default ComparisonView
