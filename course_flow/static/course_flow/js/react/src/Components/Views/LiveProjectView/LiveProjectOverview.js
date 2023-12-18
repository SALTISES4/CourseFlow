import * as React from 'react'
import * as Utility from '@cfUtility'
// @local
import LiveProjectSection from './LiveProjectSection.js'
// @components
import { AssignmentTitle, DatePicker } from '@cfUIComponents'
import WorkflowCardSimple from '@cfCommonComponents/../../components/Workflow/WorkflowCards/WorkflowCardSimple'

class LiveProjectOverview extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()

    let workflows = this.state.data.workflows.map((workflow, index) => (
      <WorkflowCardSimple key={index} workflow_data={workflow} />
    ))
    if (workflows.length === 0)
      workflows = window.gettext(
        'No workflows have been made visible to students.'
      )
    let teachers = this.state.data.teachers.map((user, index) => (
      <tr key={index}>
        <td className="table-user">{Utility.getUserDisplay(user.user)}</td>
        <td>{user.completion}</td>
      </tr>
    ))
    let students = this.state.data.students.map((user, index) => (
      <tr key={index}>
        <td className="table-user">{Utility.getUserDisplay(user.user)}</td>
        <td>{user.completion}</td>
      </tr>
    ))

    let assignments = this.state.data.assignments.map((assignment) => (
      <tr key={index}>
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
        <h3>{window.gettext('Teachers')}:</h3>
        <table className="overview-table">
          <tr>
            <th>{window.gettext('User')}</th>
            <th>{window.gettext('Assignments Complete')}</th>
          </tr>
          {teachers}
        </table>
        <h3>{window.gettext('Students')}:</h3>
        <table className="overview-table">
          <tr>
            <th>{window.gettext('User')}</th>
            <th>{window.gettext('Assignments Complete')}</th>
          </tr>
          {students}
        </table>
        <h3>{window.gettext('Visible Workflows')}:</h3>
        <div className="menu-grid">{workflows}</div>
        <h3>{window.gettext('Assignments')}:</h3>
        <table className="overview-table">
          <tr>
            <th>{window.gettext('Assignment')}</th>
            <th>{window.gettext('Completion')}</th>
            <th>{window.gettext('End Date')}</th>
          </tr>
          {assignments}
        </table>
      </div>
    )
  }
}
export default LiveProjectOverview
