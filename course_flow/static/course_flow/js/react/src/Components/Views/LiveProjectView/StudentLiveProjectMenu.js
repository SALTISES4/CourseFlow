import * as React from 'react'
import { AssignmentView } from '../LiveAssignmentView'
import { AssignmentTitle, DatePicker, SimpleWorkflow } from '@cfUIComponents'
import { setAssignmentCompletion } from '@XMLHTTP/PostFunctions'
import LiveProjectSection from './LiveProjectSection.js'
import { WorkflowForMenu } from '@cfCommonComponents'
import LiveProjectMenu from './LiveProjectMenu.js'

// LiveProjectSection does not use renderer
export class StudentLiveProjectOverview extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()

    let workflows = this.state.data.workflows.map((workflow) => (
      <SimpleWorkflow workflow_data={workflow} />
    ))
    if (workflows.length == 0)
      workflows = window.gettext(
        'No workflows have been made visible to students.'
      )

    let assignments = this.state.data.assignments
      .filter((assignment) => assignment.user_assignment.completed == false)
      .map((assignment) => (
        <tr>
          <td>
            <AssignmentTitle
              data={assignment}
              user_role={this.props.renderer.user_role}
            />
          </td>
          <td>
            <input
              type="checkbox"
              disabled={!assignment.self_reporting}
              onChange={this.toggleAssignment.bind(
                this,
                assignment.user_assignment.id
              )}
            />
          </td>
          <td>
            <DatePicker default_value={assignment.end_date} disabled={true} />
          </td>
        </tr>
      ))

    return (
      <div className="workflow-details">
        <h3>{window.gettext('Your Incomplete Assignments')}:</h3>
        <table className="overview-table">
          <tr>
            <th>{window.gettext('Assignment')}</th>
            <th>{window.gettext('Completion')}</th>
            <th>{window.gettext('End Date')}</th>
          </tr>
          {assignments}
        </table>
        <h3>{window.gettext('Visible Workflows')}:</h3>
        <div className="menu-grid">{workflows}</div>
      </div>
    )
  }

  toggleAssignment(id, evt) {
    setAssignmentCompletion(id, evt.target.checked)
  }
}

/**
 *
 */
class StudentLiveProjectWorkflows extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()
    let workflows_added = this.state.data.workflows_added.map((workflow) => (
      <WorkflowForMenu workflow_data={workflow} />
    ))
    return (
      <div className="workflow-details">
        <h3>{window.gettext('Workflows')}</h3>
        <div className="menu-grid">{workflows_added}</div>
      </div>
    )
  }
}

/**
 *
 */
class StudentLiveProjectAssignments extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()
    let assignments_past = this.state.data.assignments_past.map(
      (assignment) => (
        // @todo renderer IS used in this component
        <AssignmentView renderer={this.props.renderer} data={assignment} />
      )
    )
    let assignments_upcoming = this.state.data.assignments_upcoming.map(
      (assignment) => (
        // @todo renderer IS used in this component
        <AssignmentView renderer={this.props.renderer} data={assignment} />
      )
    )

    return (
      <div className="workflow-details">
        <h3>{window.gettext('Your Tasks')}:</h3>
        <h4>{window.gettext('Upcoming')}:</h4>
        <div>{assignments_upcoming}</div>
        <h4>{window.gettext('Past')}:</h4>
        <div>{assignments_past}</div>
      </div>
    )
  }
}

/**
 *
 */
class StudentLiveProjectMenu extends LiveProjectMenu {
  getViewButtons() {
    return [
      { type: 'overview', name: window.gettext('Classroom Overview') },
      { type: 'assignments', name: window.gettext('My Assignments') },
      { type: 'workflows', name: window.gettext('My Workflows') }
    ]
  }

  getRole() {
    return 'student'
  }

  getContent() {
    switch (this.state.view_type) {
      case 'overview':
        return (
          // @todo renderer IS used in this component
          <StudentLiveProjectOverview
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'assignments':
        return (
          // @todo renderer IS used in this component
          <StudentLiveProjectAssignments
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'workflows':
        return (
          // @todo renderer NOT used in this component
          <StudentLiveProjectWorkflows
            // renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
    }
  }

  updateFunction(new_state) {
    this.setState(new_state)
  }
}

export default StudentLiveProjectMenu
