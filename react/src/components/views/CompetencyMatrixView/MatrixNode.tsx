import * as React from 'react'
import { connect } from 'react-redux'
import { getNodeByID, TGetNodeByID } from '@cfFindState'
import { CfObjectType } from '@cfModule/types/enum.js'
import ComponentWithToggleDrop from '@cfParentComponents/ComponentWithToggleDrop'
import { AppState } from '@cfRedux/types/type'

type ConnectedProps = TGetNodeByID
type OwnProps = {
  objectID: number
}
type PropsType = ConnectedProps & OwnProps

/**
 * The nodes (specifically the time data) in the matrix view
 */
class MatrixNodeUnconnected extends ComponentWithToggleDrop<PropsType> {
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.NODE
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  TimeData = ({ data }) => {
    return (
      <>
        <div className="table-cell">{data.time_general_hours}</div>
        <div className="table-cell">{data.time_specific_hours}</div>
        <div className="table-cell">
          {(data.time_general_hours || 0) + (data.time_specific_hours || 0)}
        </div>
        <div className="table-cell blank" />
        <div className="table-cell">{data.ponderation_theory}</div>
        <div className="table-cell">{data.ponderation_practical}</div>
        <div className="table-cell">{data.ponderation_individual}</div>
        <div className="table-cell">
          {data.ponderation_theory +
            data.ponderation_practical +
            data.ponderation_individual}
        </div>
        <div
          className="table-cell"
          // @todo this atrribute is not allowed on a div
          // @ts-ignore
          titletext={this.props.renderer.time_choices[data.time_units].name}
        >
          {data.time_required}
        </div>
      </>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const data_override = data.represents_workflow
      ? {
          ...data,
          ...data.linked_workflow_data,
          id: data.id
        }
      : data

    return (
      <div className="matrix-time-row">
        <div className="table-cell blank" />
        <this.TimeData data={data_override} />
      </div>
    )
  }
}
const mapStateToProps = (state: AppState, ownProps: OwnProps): TGetNodeByID => {
  return getNodeByID(state, ownProps.objectID)
}

const MatrixNode = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(MatrixNodeUnconnected)

export default MatrixNode
