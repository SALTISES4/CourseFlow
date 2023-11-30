import * as React from 'react'
import { LiveProjectSection } from './LiveProjectSection.js'
import {
  AssignmentTitle,
  DatePicker,
  SimpleWorkflow
} from '../../components/CommonComponents.js'
import * as Utility from '../../../UtilityFunctions.js'

export class LiveProjectOverview extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()

    let workflows = this.state.data.workflows.map((workflow) => (
      <SimpleWorkflow workflow_data={workflow} />
    ))
    if (workflows.length == 0)
      workflows = gettext('No workflows have been made visible to students.')
    let teachers = this.state.data.teachers.map((user) => (
      <tr>
        <td className="table-user">{Utility.getUserDisplay(user.user)}</td>
        <td>{user.completion}</td>
      </tr>
    ))
    let students = this.state.data.students.map((user) => (
      <tr>
        <td className="table-user">{Utility.getUserDisplay(user.user)}</td>
        <td>{user.completion}</td>
      </tr>
    ))

    let assignments = this.state.data.assignments.map((assignment) => (
      <tr>
        <td>
          <AssignmentTitle
            data={assignment}
            user_role={this.props.renderer.user_role}
          />
        </td>
        <td>{assignment.completion_info}</td>
        <td>
          <DatePicker default_value={assignment.end_date} disabled={true} />
        </td>
      </tr>
    ))

    return (
      <div className="workflow-details">
        <h3>{gettext('Teachers')}:</h3>
        <table className="overview-table">
          <tr>
            <th>{gettext('User')}</th>
            <th>{gettext('Assignments Complete')}</th>
          </tr>
          {teachers}
        </table>
        <h3>{gettext('Students')}:</h3>
        <table className="overview-table">
          <tr>
            <th>{gettext('User')}</th>
            <th>{gettext('Assignments Complete')}</th>
          </tr>
          {students}
        </table>
        <h3>{gettext('Visible Workflows')}:</h3>
        <div className="menu-grid">{workflows}</div>
        <h3>{gettext('Assignments')}:</h3>
        <table className="overview-table">
          <tr>
            <th>{gettext('Assignment')}</th>
            <th>{gettext('Completion')}</th>
            <th>{gettext('End Date')}</th>
          </tr>
          {assignments}
        </table>
      </div>
    )
  }
}
