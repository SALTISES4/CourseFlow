import * as React from 'react'
import { connect } from 'react-redux'
import { getNodeByID } from '@cfFindState'
import { Component } from '@cfParentComponents'

/**
 * The nodes (specifically the time data) in the matrix view
 */
class MatrixNodeUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'node'
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getTimeData(data) {
    return [
      <div className="table-cell">{data.time_general_hours}</div>,
      <div className="table-cell">{data.time_specific_hours}</div>,
      <div className="table-cell">
        {(data.time_general_hours || 0) + (data.time_specific_hours || 0)}
      </div>,
      <div className="table-cell blank" />,
      <div className="table-cell">{data.ponderation_theory}</div>,
      <div className="table-cell">{data.ponderation_practical}</div>,
      <div className="table-cell">{data.ponderation_individual}</div>,
      <div className="table-cell">
        {data.ponderation_theory +
          data.ponderation_practical +
          data.ponderation_individual}
      </div>,
      <div
        className="table-cell"
        titletext={this.props.renderer.time_choices[data.time_units].name}
      >
        {data.time_required}
      </div>
    ]
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data_override = data.represents_workflow
      ? { ...data, ...data.linked_workflow_data, id: data.id }
      : this.props.data

    return (
      <div className="matrix-time-row">
        <div className="table-cell blank" />
        {this.getTimeData(data_override)}
      </div>
    )
  }
}
const mapNodeStateToProps = (state, own_props) =>
  getNodeByID(state, own_props.objectID)
export default connect(mapNodeStateToProps, null)(MatrixNodeUnconnected)
