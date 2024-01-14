// @ts-nocheck
import * as React from 'react'
import * as reactDom from 'react-dom'
import * as Utility from '@cfUtility'
// @components
import RightSideBar from '@cfCommonComponents/rightSideBarContent/RightSideBar'
import { WorkflowTitle } from '@cfUIComponents'

import { renderMessageBox } from '@cfCommonComponents/menu/MenuComponents'
import closeMessageBox from '@cfCommonComponents/menu/components/closeMessageBox'
import { CfObjectType, ViewType } from '@cfModule/types/enum.js'
import WorkflowComparisonRendererComponent from '@cfViews/ComparisonView/components/WorkflowComparisonRendererComponent'
import { getWorkflowSelectMenu } from '@XMLHTTP/API/workflow'
// import $ from 'jquery'

/**
 * Creates a sort of container for the workflows you want to compare,
 * allowing the user to load new workflows and remove them.
 * Also controls the sidebar and menubar (the latter not currently used here).
 * When a workflow is added a WorkflowComparisonRenderer component is created.
 */
class ComparisonView extends React.Component {
  constructor(props) {
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
      object_sets: props.data.object_sets
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

  componentDidUpdate(prev_props) {
    this.makeSortable()
    if (prev_props.view_type != this.props.view_type) this.updateTabs()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getHeader() {
    const data = this.props.data

    // PORTAL
    const portal = reactDom.createPortal(
      <a
        className="hover-shade no-underline"
        id="project-return"
        href={COURSEFLOW_APP.config.update_path['project'].replace(0, data.id)}
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

  makeSortable() {
    $('.workflow-array').sortable({
      axis: 'x',
      stop: function (evt, ui) {}
    })
  }

  updateTabs() {
    //If the view type has changed, enable only appropriate tabs, and change the selection to none
    this.props.renderer.selection_manager.changeSelection(null, null)
    const disabled_tabs = []
    for (let i = 0; i < 4; i++)
      if (this.allowed_tabs.indexOf(i) < 0) disabled_tabs.push(i)
    $('#sidebar').tabs({ disabled: false })
    const current_tab = $('#sidebar').tabs('option', 'active')
    if (this.allowed_tabs.indexOf(current_tab) < 0) {
      if (this.allowed_tabs.length == 0) $('#sidebar').tabs({ active: false })
      else $('#sidebar').tabs({ active: this.allowed_tabs[0] })
    }
    $('#sidebar').tabs({ disabled: disabled_tabs })
  }

  changeView(type) {
    this.props.renderer.selection_manager.changeSelection(null, null)

    // ?? pass in the parent renderer container as its own new container, how is this working?
    this.props.renderer.render(this.props.renderer.container, type)
  }

  openEdit() {}

  loadWorkflow() {
    const renderer = this.props.renderer
    COURSEFLOW_APP.tinyLoader.startLoad()
    getWorkflowSelectMenu(
      this.props.data.id,
      'workflow',
      false,
      true,
      (response_data) => {
        if (response_data.workflowID != null) {
          const workflows = this.state.workflows.slice()
          workflows.push(response_data.workflowID)
          this.setState({ workflows: workflows })
        }
      },
      () => {
        renderer.tiny_loader.endLoad()
      }
    )
  }

  removeWorkflow(workflow_id) {
    const workflows = this.state.workflows.slice()
    workflows.splice(workflows.indexOf(workflow_id), 1)
    this.setState({ workflows: workflows })
  }

  toggleObjectSet(id) {
    const object_sets = this.state.object_sets.slice()
    let hidden
    for (let i = 0; i < object_sets.length; i++) {
      if (object_sets[i].id === id) {
        hidden = !object_sets[i].hidden
        object_sets[i].hidden = hidden
        break
      }
    }
    this.setState({ object_sets: object_sets })
    $(document).triggerHandler('object_set_toggled', { id: id, hidden: hidden })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const renderer = this.props.renderer

    let share
    if (!this.props.renderer.read_only)
      share = (
        <div
          id="share-button"
          className="hover-shade"
          title={window.gettext('Sharing')}
          onClick={renderMessageBox.bind(
            this,
            data,
            'share_menu',
            closeMessageBox
          )}
        >
          <img src={COURSEFLOW_APP.config.icon_path + 'add_person.svg'} />
        </div>
      )

    const view_buttons = [
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
      .filter((item) => item.disabled.indexOf(data.type) == -1)
      .map((item) => {
        let view_class = 'hover-shade'
        if (item.type == renderer.view_type) view_class += ' active'
        return (
          <div
            id={'button_' + item.type}
            className={view_class}
            onClick={this.changeView.bind(this, item.type)}
          >
            {item.name}
          </div>
        )
      })

    const view_buttons_sorted = view_buttons

    const workflow_content = this.state.workflows.map((workflowID) => (
      <WorkflowComparisonRendererComponent
        removeFunction={this.removeWorkflow.bind(this, workflowID)}
        view_type={renderer.view_type}
        workflowID={workflowID}
        key={workflowID}
        tiny_loader={this.props.tiny_loader}
        selection_manager={this.props.selection_manager}
        object_sets={this.state.object_sets}
      />
    ))
    const add_button = (
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

    const style: React.CSSProperties = {
      border: data.lock ? '2px solid ' + data.lock.user_colour : undefined
    }

    return (
      <div className="main-block">
        <div className="right-panel-wrapper">
          <div className="body-wrapper">
            <div id="workflow-wrapper" className="workflow-wrapper">
              {this.getHeader()}
              <div className="workflow-view-select hide-print">
                {view_buttons_sorted}
              </div>
              <div className="workflow-container comparison-view">
                <div className="workflow-array">{workflow_content}</div>
                {add_button}
              </div>
            </div>
          </div>
          <RightSideBar
            context="comparison"
            renderer={this.props.renderer}
            data={data}
            toggleObjectSet={this.toggleObjectSet.bind(this)}
            object_sets={this.state.object_sets}
          />
        </div>
      </div>
    )
  }
}
export default ComparisonView
