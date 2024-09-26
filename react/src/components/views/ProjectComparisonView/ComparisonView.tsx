import { apiPaths } from '@cf/router/apiRoutes'
import { ObjectSet } from '@cf/types/common'
import { CfObjectType, WFContext, WorkflowViewType } from '@cf/types/enum.js'
import { _t } from '@cf/utility/utilityFunctions'
// import closeMessageBox from '@cfComponents/__LEGACY/menuLegacy/components/closeMessageBox'
// import { renderMessageBox } from '@cfComponents/__LEGACY/menuLegacy/MenuComponents'
import * as Utility from '@cfUtility'
// @components
import RightSideBar from '@cfViews/components/rightSideBarContent/RightSideBar'
import WorkflowComparisonRendererComponent from '@cfViews/ProjectComparisonView/components/WorkflowComparisonRendererComponent'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { getWorkflowSelectMenuQuery } from '@XMLHTTP/API/workflow'
import { openWorkflowSelectMenu } from '@XMLHTTP/postTemp'
import { EProject } from '@XMLHTTP/types/entity'
import {
  GetWorkflowSelectMenuResp,
  GetWorkflowSelectQueryResp
} from '@XMLHTTP/types/query'
import * as React from 'react'
import * as reactDom from 'react-dom'
// import $ from 'jquery'

/**
 * Creates a sort of container for the workflows you want to compare,
 * allowing the user to load new workflows and remove them.
 * Also controls the sidebar and menubar (the latter not currently used here).
 * When a workflow is added a WorkflowComparisonRenderer component is created.
 */

type ObjectSetsType = ObjectSet & {
  hidden?: boolean
}

type StateType = {
  objectSets: ObjectSetsType[]
  workflows: number[]
}
type PropsType = {
  viewType: WorkflowViewType
  // turn this into config object
  projectData: EProject
  selectionManager: any
  readOnly: boolean
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
      .map((workflowId) => parseInt(workflowId))

    this.state = {
      workflows: workflows_added,
      objectSets: props.projectData.objectSets
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
    if (prev_props.viewType != this.props.viewType) {
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
    this.props.selectionManager.changeSelection(null, null)

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
    this.props.selectionManager.changeSelection(null, null)

    // force re-render the parent, see comment in react/src/components/views/ComparisonView/ComparisonView.tsx
    // this can be our state updater
    // but refactor when other bugs from 1st pass refactor addressed (?)
    this.props.parentRender(this.props.container, type)
  }

  openEdit() {}

  updateFunction = (responseData: GetWorkflowSelectMenuResp) => {
    if (responseData.workflowId != null) {
      const workflows = this.state.workflows.slice()
      workflows.push(responseData.workflowId)
      const treat = this
      this.setState({
        workflows: [...this.state.workflows, responseData.workflowId]
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
    const objectSets = this.state.objectSets.slice()

    const object = objectSets.find((objectSet) => objectSet.id === id)
    if (object) {
      hidden = !object.hidden
      object.hidden = hidden
    }

    this.setState({ objectSets: objectSets })

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
        href={COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
          String(0),
          String(data.id)
        )}
      >
        {/*green*/}
        <ArrowBackIosIcon />
        <div>{_t('Return to project')}</div>
      </a>,
      $('.titlebar .title')[0]
    )

    return (
      <>
        {portal}
        <div>
          <div>{_t('Comparing workflows for:')}</div>
          {/*<WorkflowTitle*/}
          {/*  data={data}*/}
          {/*  noHyperlink={true}*/}
          {/*  class_name="project-title"*/}
          {/*/>*/}
          placeholder title
        </div>
      </>
    )
  }

  ViewButtons = () => {
    return [
      {
        type: WorkflowViewType.WORKFLOW,
        name: _t('Workflow View'),
        disabled: []
      },
      {
        type: WorkflowViewType.OUTCOME_EDIT,
        name: Utility.capWords(_t('View') + ' outcomes'),
        disabled: []
      }
    ]
      .filter(
        (item) => item.disabled.indexOf(this.props.projectData.type) == -1
      )
      .map((item, index) => {
        const viewClasses = [
          'hover-shade',
          item.type === this.props.viewType ? 'active' : ''
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
    if (!this.props.readOnly)
      return (
        <div
          id="share-button"
          className="hover-shade"
          title={_t('Sharing')}
          // @todo move to dialog
          // onClick={
          //   renderMessageBox.bind(
          //   this,
          //   this.props.projectData,
          //   'share_menu',
          //   closeMessageBox
          // )
          // }
        >
          <img src={apiPaths.external.static_assets.icon + 'add_person.svg'} />
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
          <AddCircleIcon />
          <div>{_t('Load new workflow')}</div>
        </div>
      </button>
    </div>
  )

  WorkflowContent = () => {
    return this.state.workflows.map((workflowId) => (
      <WorkflowComparisonRendererComponent
        key={workflowId}
        removeFunction={this.removeWorkflow.bind(this, workflowId)}
        // @ts-ignore
        viewType={this.props.viewType}
        workflowId={workflowId}
        selectionManager={this.props.selectionManager}
        objectSets={this.state.objectSets}
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
    //   border: data.lock ? '2px solid ' + data.lock.userColour : undefined
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
              wfcontext={WFContext.COMPARISON}
              // parentRender={this.props.parentRender}
              readOnly={this.props.readOnly}
              data={data}
              toggleObjectSet={this.toggleObjectSet.bind(this)}
              objectSets={this.state.objectSets}
            />
          </div>
        </div>
      </>
    )
  }
}
export default ComparisonView
