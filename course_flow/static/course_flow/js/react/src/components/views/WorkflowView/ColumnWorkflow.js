import * as React from 'react'
import { connect } from 'react-redux'
import Column from './Column.js'
import { getColumnWorkflowByID } from '@cfFindState'

/**
 * Represents the column-workflow throughmodel
 */
class ColumnWorkflow extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'columnworkflow'
    this.objectClass = '.column-workflow'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let my_class = 'column-workflow column-' + data.id
    if (data.no_drag) my_class += ' no-drag'
    return (
      <div
        className={my_class}
        ref={this.maindiv}
        id={data.id}
        data-child-id={data.column}
      >
        <Column
          objectID={data.column}
          parentID={this.props.parentID}
          throughParentID={data.id}
          renderer={this.props.renderer}
        />
      </div>
    )
  }
}
const mapColumnWorkflowStateToProps = (state, own_props) =>
  getColumnWorkflowByID(state, own_props.objectID)
export default connect(mapColumnWorkflowStateToProps, null)(ColumnWorkflow)
