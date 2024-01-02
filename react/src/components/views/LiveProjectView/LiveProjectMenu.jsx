import * as React from 'react'
import * as reactDom from 'react-dom'

import WorkflowVisibility from './WorkflowVisibility'
import LiveProjectSection from './LiveProjectSection'
import LiveProjectOverview from './LiveProjectOverview'
import LiveProjectStudents from './LiveProjectStudents'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'
import LiveProjectCompletionTable from './LiveProjectCompletionTable'
import LiveProjectSettings from './LiveProjectSettings'
import LiveProjectAssignments from './LiveProjectAssignments'
import { setWorkflowVisibilityQuery } from '@XMLHTTP/PostFunctions'

/**
 *
 */
class LiveProjectWorkflows extends LiveProjectSection {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  switchVisibility(pk, visibility) {
    let workflows_added = this.state.data.workflows_added.slice()
    let workflows_not_added = this.state.data.workflows_not_added.slice()
    if (visibility == 'visible') {
      for (let i = 0; i < workflows_not_added.length; i++) {
        if (workflows_not_added[i].id == pk) {
          let removed = workflows_not_added.splice(i, 1)
          setWorkflowVisibilityQuery(this.props.objectID, pk, true)
          workflows_added.push(removed[0])
        }
      }
    } else {
      for (let i = 0; i < workflows_added.length; i++) {
        if (workflows_added[i].id == pk) {
          let removed = workflows_added.splice(i, 1)
          setWorkflowVisibilityQuery(this.props.objectID, pk, false)
          workflows_not_added.push(removed[0])
        }
      }
    }
    this.setState({
      data: {
        ...this.state.data,
        workflows_added: workflows_added,
        workflows_not_added: workflows_not_added
      }
    })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (!this.state.data) return this.defaultRender()
    let workflows_added = this.state.data.workflows_added.map((workflow) => (
      <WorkflowVisibility
        workflowData={workflow}
        visibility="visible"
        visibilityFunction={this.switchVisibility.bind(this)}
      />
    ))
    let workflows_not_added = this.state.data.workflows_not_added.map(
      (workflow) => (
        <WorkflowVisibility
          workflowData={workflow}
          visibility="not_visible"
          visibilityFunction={this.switchVisibility.bind(this)}
        />
      )
    )
    return (
      <div className="workflow-details">
        <h3>{window.gettext('Visible Workflows')}</h3>
        <div className="menu-grid">{workflows_added}</div>
        <h3>{window.gettext('Other Workflows')}</h3>
        <div className="menu-grid">{workflows_not_added}</div>
      </div>
    )
  }
}

/**
 *
 */
class LiveProjectMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ...props.project,
      liveproject: this.props.liveproject,
      view_type: 'overview'
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getViewButtons() {
    return [
      { type: 'overview', name: window.gettext('Classroom Overview') },
      { type: 'students', name: window.gettext('Students') },
      { type: 'assignments', name: window.gettext('Assignments') },
      { type: 'workflows', name: window.gettext('Workflow Visibility') },
      { type: 'completion_table', name: window.gettext('Completion Table') },
      { type: 'settings', name: window.gettext('Classroom Settings') }
    ]
  }

  getRole() {
    return 'teacher'
  }

  openEdit() {
    return null
  }

  changeView(view_type) {
    this.setState({ view_type: view_type })
  }

  getHeader() {
    return null
  }

  getContent() {
    switch (this.state.view_type) {
      case 'overview':
        return (
          // @todo renderer IS used in this component
          // but only user_role, how is that different from getRole?
          <LiveProjectOverview
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'students':
        return (
          // @todo  renderer NOT used in this component
          <LiveProjectStudents
            // renderer={this.props.renderer}
            role={this.getRole()}
            liveproject={this.state.liveproject}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'assignments':
        return (
          // @todo  renderer IS used in this component
          <LiveProjectAssignments
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'workflows':
        return (
          // @todo  renderer NOT used in this component
          <LiveProjectWorkflows
            // renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'completion_table':
        return (
          //@todo   renderer IS used in this component
          <LiveProjectCompletionTable
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'settings':
        return (
          // @todo renderer NOT used in this component
          <LiveProjectSettings
            updateLiveProject={this.updateFunction.bind(this)}
            // renderer={this.props.renderer}
            role={this.getRole()}
            liveproject={this.state.liveproject}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
    }
  }

  updateFunction(new_state) {
    this.setState(new_state)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.project

    let overflow_links = []
    if (this.props.renderer.user_permission > 0) {
      overflow_links.push(
        <a
          id="project"
          className="hover-shade"
          href={COURSEFLOW_APP.config.update_path.project.replace('0', data.id)}
        >
          {window.gettext('Edit Project')}
        </a>
      )
    }

    let view_buttons = this.getViewButtons().map((item) => {
      let view_class = 'hover-shade'
      if (item.type === this.state.view_type) view_class += ' active'
      return (
        <a
          id={'button_' + item.type}
          className={view_class}
          onClick={this.changeView.bind(this, item.type)}
        >
          {item.name}
        </a>
      )
    })

    return (
      <div className="project-menu">
        <div className="project-header">
          <WorkflowCard
            noHyperlink={true}
            workflowData={this.state.liveproject}
            selectAction={this.openEdit.bind(this)}
          />
          {this.getHeader()}
        </div>

        <div className="workflow-view-select hide-print">{view_buttons}</div>
        <div className="workflow-container">{this.getContent()}</div>
        {reactDom.createPortal(overflow_links, $('#overflow-links')[0])}
      </div>
    )
  }
}

export default LiveProjectMenu
