import * as React from 'react'
import WorkflowCard from '@cfCommonComponents/cards/WorkflowCard'
import MenuTab from '@cfCommonComponents/menu/components/MenuTab'
import closeMessageBox from '@cfCommonComponents/menu/components/closeMessageBox'
import { setLinkedWorkflow } from '@XMLHTTP/API/update'
import { GridWrap } from '@cfModule/mui/helper'
// import $ from 'jquery'

/*
Creates a set of sections (tabs) of workflow/project card grids.
Currently this is shaped in the back-end, this is definitely something
that could (should?) be changed. This was part of my earliest work,
when I was still trying to put a lot of what should have been front-end logic
into the back-end.

Used for selecting a workflow in a menu when linking a workflow, choosing a target project
for duplication, etc.
*/
type StateProps = {
  selected: any
  selected_type: any
}
type PropsType = {
  type: any
  data: any
  actionFunction: any
}

class WorkflowsMenu extends React.Component<PropsType, StateProps> {
  private current_project: any
  private project_workflows: any
  constructor(props) {
    super(props)
    this.state = {} as StateProps

    // @todo unpack this
    if (this.props.type === 'target_project_menu') {
      try {
        //  this.current_project = project_data // @todo this doesn't make sense
      } catch (err) {}

      try {
        // this.current_project = workflow_data_package.project // @todo this doesn't make sense
      } catch (err) {}

      if (this.current_project) {
        // this.state.selected = this.current_project.id @todo this doesn't make sense
      }
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

  workflowSelected(selected_id, selected_type) {
    this.setState({ selected: selected_id, selected_type: selected_type })
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Title = () => {
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

  Actions = () => {
    const actions = []
    if (this.props.type === 'linked_workflow_menu') {
      let text = window.gettext('link to node')
      if (
        this.state.selected &&
        this.project_workflows.indexOf(this.state.selected) < 0
      )
        text = window.gettext('Copy to Current Project and ') + text
      actions.push(
        <button
          id="set-linked-workflow-cancel"
          className="secondary-button"
          onClick={this.props.actionFunction}
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
          }}
        >
          {text}
        </button>
      )
    } else if (
      this.props.type === 'added_workflow_menu' ||
      this.props.type === 'workflow_select_menu'
    ) {
      let text = ''
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
    } else if (this.props.type === 'target_project_menu') {
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
    const data_package = this.props.data.data_package
    let no_hyperlink = false
    if (
      this.props.type === 'linked_workflow_menu' ||
      this.props.type === 'added_workflow_menu' ||
      this.props.type === 'target_project_menu' ||
      this.props.type === 'workflow_select_menu'
    )
      no_hyperlink = true
    const tabs = []
    const tab_li = []
    let i = 0

    for (const prop in data_package) {
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

    const current_project = this.current_project ? (
      <>
        <h4 className={'big-space'}>{window.gettext('Current project')}</h4>,
        <GridWrap>
          <WorkflowCard
            workflowData={this.current_project}
            selected={this.state.selected === this.current_project.id}
            noHyperlink={no_hyperlink}
            type={this.props.type} // @todo i don't think this is used
            dispatch={null} // @todo i don't think this is used
            selectAction={this.workflowSelected.bind(this)}
          />
        </GridWrap>
        <hr className={'big-space'} />,
        <h4 className={'big-space'}>
          {window.gettext('Or select from your projects')}
        </h4>
      </>
    ) : (
      <></>
    )
    //@todo: I don't think the evt.stopPropagation should be here, I think
    //it should be on the Dialog component, but idk how to add it to that.
    //Needed to prevent clicks on dialog from unselecting workflow components.
    return (
      <div
        className="message-wrap"
        onMouseDown={(evt) => {
          evt.stopPropagation()
        }}
      >
        <this.Title />
        {current_project}
        <div className="home-tabs" id="workflow-tabs">
          <ul>{tab_li}</ul>
          {tabs}
        </div>
        <div className="action-bar">
          <this.Actions />
        </div>
      </div>
    )
  }
}

export default WorkflowsMenu
