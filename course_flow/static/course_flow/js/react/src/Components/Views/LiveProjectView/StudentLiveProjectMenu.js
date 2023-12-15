import * as React from 'react'
import { AssignmentView } from '../LiveAssignmentView'
import {
  AssignmentTitle,
  DatePicker,
  SimpleWorkflow
} from '@cfCommonComponents'
import { setAssignmentCompletion } from '@cfPostFunctions'
import { LiveProjectSection } from './LiveProjectSection.js'
import { WorkflowForMenu } from '@cfLibrary'
import LiveProjectMenu from './LiveProjectMenu.js'

export class StudentLiveProjectOverview extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()

    let workflows = this.state.data.workflows.map((workflow) => (
      <SimpleWorkflow workflow_data={workflow} />
    ))
    if (workflows.length == 0)
      workflows = gettext('No workflows have been made visible to students.')

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
        <h3>{gettext('Your Incomplete Assignments')}:</h3>
        <table className="overview-table">
          <tr>
            <th>{gettext('Assignment')}</th>
            <th>{gettext('Completion')}</th>
            <th>{gettext('End Date')}</th>
          </tr>
          {assignments}
        </table>
        <h3>{gettext('Visible Workflows')}:</h3>
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
        <h3>{gettext('Workflows')}</h3>
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
        <AssignmentView renderer={this.props.renderer} data={assignment} />
      )
    )
    let assignments_upcoming = this.state.data.assignments_upcoming.map(
      (assignment) => (
        <AssignmentView renderer={this.props.renderer} data={assignment} />
      )
    )

    return (
      <div className="workflow-details">
        <h3>{gettext('Your Tasks')}:</h3>
        <h4>{gettext('Upcoming')}:</h4>
        <div>{assignments_upcoming}</div>
        <h4>{gettext('Past')}:</h4>
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
      { type: 'overview', name: gettext('Classroom Overview') },
      { type: 'assignments', name: gettext('My Assignments') },
      { type: 'workflows', name: gettext('My Workflows') }
    ]
  }

  getRole() {
    return 'student'
  }

  getContent() {
    switch (this.state.view_type) {
      case 'overview':
        return (
          <StudentLiveProjectOverview
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'assignments':
        return (
          <StudentLiveProjectAssignments
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'workflows':
        return (
          <StudentLiveProjectWorkflows
            renderer={this.props.renderer}
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
