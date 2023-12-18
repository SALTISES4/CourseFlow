import * as React from 'react'
import { setLinkedWorkflow } from '@XMLHTTP/PostFunctions'
import MenuTab from '../components/MenuTab.js'
import closeMessageBox from '../components/closeMessageBox.js'
import WorkflowCard from '@cfComponents/Workflow/WorkflowCards/WorkflowCard'

/*
Creates a set of sections (tabs) of workflow/project card grids.
Currently this is shaped in the back-end, this is definitely something
that could (should?) be changed. This was part of my earliest work,
when I was still trying to put a lot of what should have been front-end logic
into the back-end.

Used for selecting a workflow in a menu when linking a workflow, choosing a target project
for duplication, etc.
*/
class WorkflowsMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    if (this.props.type === 'target_project_menu') {
      try {
        this.current_project = project_data
      } catch (err) {}
      try {
        this.current_project = workflow_data_package.project
      } catch (err) {}
      if (this.current_project) this.state.selected = this.current_project.id
    }
    if (
      this.props.type === 'linked_workflow_menu' ||
      this.props.type === 'added_workflow_menu'
    )
      this.project_workflows = props.data.data_package.current_project.sections
        .map((section) => section.objects.map((object) => object.id))
        .flat()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    // @todo
    $('#workflow-tabs').tabs({ active: 0 })
    $('#workflow-tabs .tab-header').on('click', () => {
      this.setState({ selected: null })
    })
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getTitle() {
    switch (this.props.type) {
      case 'linked_workflow_menu':
      case 'added_workflow_menu':
      case 'workflow_select_menu':
        return <h2>{window.gettext('Select a workflow')}</h2>
      case 'target_project_menu':
        return <h2>{window.gettext('Select a project')}</h2>
    }
    return null
  }

  workflowSelected(selected_id, selected_type) {
    this.setState({ selected: selected_id, selected_type: selected_type })
  }

  getActions() {
    var actions = []
    if (this.props.type === 'linked_workflow_menu') {
      var text = window.gettext('link to node')
      if (
        this.state.selected &&
        this.project_workflows.indexOf(this.state.selected) < 0
      )
        text = window.gettext('Copy to Current Project and ') + text
      actions.push(
        <button
          id="set-linked-workflow-cancel"
          className="secondary-button"
          onClick={closeMessageBox}
        >
          {window.gettext('Cancel')}
        </button>
      )
      actions.push(
        <button
          id="set-linked-workflow-none"
          className="secondary-button"
          onClick={() => {
            setLinkedWorkflow(
              this.props.data.node_id,
              -1,
              this.props.actionFunction
            )
            closeMessageBox()
          }}
        >
          {window.gettext('Set to None')}
        </button>
      )
      actions.push(
        <button
          id="set-linked-workflow"
          disabled={!this.state.selected}
          className="primary-button"
          onClick={() => {
            setLinkedWorkflow(
              this.props.data.node_id,
              this.state.selected,
              this.props.actionFunction
            )
            closeMessageBox()
          }}
        >
          {text}
        </button>
      )
    } else if (
      this.props.type === 'added_workflow_menu' ||
      this.props.type === 'workflow_select_menu'
    ) {
      var text
      if (this.props.type === 'added_workflow_menu') {
        text = window.gettext('Select')
        if (
          this.state.selected &&
          this.project_workflows.indexOf(this.state.selected) < 0
        )
          text = window.gettext('Copy to Current Project')
      } else {
        text = window.gettext('Select')
      }
      actions.push(
        <button
          id="set-linked-workflow-cancel"
          className="secondary-button"
          onClick={closeMessageBox}
        >
          {window.gettext('Cancel')}
        </button>
      )
      actions.push(
        <button
          id="set-linked-workflow"
          className="primary-button"
          disabled={!this.state.selected}
          onClick={() => {
            this.props.actionFunction({ workflowID: this.state.selected })
            closeMessageBox()
          }}
        >
          {text}
        </button>
      )
    } else if (this.props.type == 'target_project_menu') {
      actions.push(
        <button
          id="set-linked-workflow-cancel"
          className="secondary-button"
          onClick={closeMessageBox}
        >
          {window.gettext('Cancel')}
        </button>
      )
      actions.push(
        <button
          id="set-linked-workflow"
          className="primary-button"
          disabled={!this.state.selected}
          onClick={() => {
            this.props.actionFunction({ parentID: this.state.selected })
            closeMessageBox()
          }}
        >
          {window.gettext('Select project')}
        </button>
      )
    }
    return actions
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    var data_package = this.props.data.data_package
    let no_hyperlink = false
    if (
      this.props.type === 'linked_workflow_menu' ||
      this.props.type === 'added_workflow_menu' ||
      this.props.type === 'target_project_menu' ||
      this.props.type === 'workflow_select_menu'
    )
      no_hyperlink = true
    var tabs = []
    var tab_li = []
    var i = 0
    for (var prop in data_package) {
      tab_li.push(
        <li className="tab-header">
          <a className="hover-shade" href={'#tabs-' + i}>
            {data_package[prop].title}
          </a>
        </li>
      )
      tabs.push(
        <MenuTab
          no_hyperlink={no_hyperlink}
          data={data_package[prop]}
          type={this.props.type}
          identifier={i}
          selected_id={this.state.selected}
          selectAction={this.workflowSelected.bind(this)}
        />
      )
      i++
    }
    let current_project
    if (this.current_project) {
      current_project = [
        <h4 className={'big-space'}>{window.gettext('Current project')}</h4>,
        <div className="menu-grid">
          <WorkflowCard
            workflow_data={this.current_project}
            selected={this.state.selected === this.current_project.id}
            no_hyperlink={no_hyperlink}
            type={this.props.type}
            dispatch={this.props.dispatch}
            selectAction={this.workflowSelected.bind(this)}
          />
        </div>,
        <hr className={'big-space'} />,
        <h4 className={'big-space'}>
          {window.gettext('Or select from your projects')}
        </h4>
      ]
    }
    return (
      <div className="message-wrap">
        {this.getTitle()}
        {current_project}
        <div className="home-tabs" id="workflow-tabs">
          <ul>{tab_li}</ul>
          {tabs}
        </div>
        <div className="action-bar">{this.getActions()}</div>
      </div>
    )
  }
}

export default WorkflowsMenu
