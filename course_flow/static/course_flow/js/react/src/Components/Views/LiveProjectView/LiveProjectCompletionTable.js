import * as React from 'react'
import { LiveProjectSection } from './LiveProjectSection.js'
import { AssignmentViewSmall } from '../LiveAssignmentView'
import * as Utility from '@cfUtility'
import { setAssignmentCompletion } from '@cfPostFunctions'

class LiveProjectCompletionTable extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()
    let data = this.state.liveproject
    let head = this.state.data.assignments.map((assignment) => (
      <th className="table-cell nodewrapper">
        <AssignmentViewSmall renderer={this.props.renderer} data={assignment} />
      </th>
    ))
    let assignment_ids = this.state.data.assignments.map(
      (assignment) => assignment.id
    )
    let body = this.state.data.table_rows.map((row, row_index) => (
      <tr className="outcome-row">
        <td className="user-head outcome-head">
          {Utility.getUserDisplay(row.user)}
        </td>
        {assignment_ids.map((id) => {
          let assignment = row.assignments.find(
            (row_element) => row_element.assignment == id
          )
          if (!assignment) return <td className="table-cell"></td>
          return (
            <td className="table-cell">
              <input
                onChange={this.toggleCompletion.bind(
                  this,
                  assignment.id,
                  row_index
                )}
                type="checkbox"
                checked={assignment.completed}
              />
            </td>
          )
        })}
        <td className="table-cell total-cell grand-total-cell">
          {row.assignments.reduce(
            (total, assignment) => total + assignment.completed,
            0
          ) +
            '/' +
            row.assignments.length}
        </td>
      </tr>
    ))

    return (
      <div className="workflow-details">
        <h3>{window.gettext('Table')}:</h3>
        <table className="user-table outcome-table node-rows">
          <tr className="outcome-row node-row">
            <th className="user-head outcome-head empty"></th>
            {head}
            <th className="table-cell nodewrapper total-cell grand-total-cell">
              <div className="total-header">{window.gettext('Total')}:</div>
            </th>
          </tr>
          {body}
        </table>
      </div>
    )
  }

  toggleCompletion(id, row_index, evt) {
    setAssignmentCompletion(id, evt.target.checked)
    let new_data = { ...this.state.data }
    new_data.table_rows = new_data.table_rows.slice()
    new_data.table_rows[row_index] = { ...new_data.table_rows[row_index] }
    new_data.table_rows[row_index].assignments =
      new_data.table_rows[row_index].assignments.slice()
    let index = new_data.table_rows[row_index].assignments.findIndex(
      (assignment) => assignment.id == id
    )
    new_data.table_rows[row_index].assignments[index] = {
      ...new_data.table_rows[row_index].assignments[index],
      completed: evt.target.checked
    }
    this.setState({ data: new_data })
  }
}

export default LiveProjectCompletionTable
