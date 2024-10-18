import { CfObjectType } from '@cf/types/enum.js'
import { _t } from '@cf/utility/utilityFunctions'
import ComponentWithToggleDrop from '@cfEditableComponents/ComponentWithToggleDrop'
import { TGetNodeByID, getNodeByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import { connect } from 'react-redux'

type ConnectedProps = TGetNodeByID
type OwnProps = {
  objectId: number
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
   * COMPONENTS
   *******************************************************/
  TimeData = ({ data }) => {
    return (
      <>
        <div className="table-cell">{data.timeGeneralHours}</div>
        <div className="table-cell">{data.timeSpecificHours}</div>
        <div className="table-cell">
          {(data.timeGeneralHours || 0) + (data.timeSpecificHours || 0)}
        </div>
        <div className="table-cell blank" />
        <div className="table-cell">{data.ponderationTheory}</div>
        <div className="table-cell">{data.ponderationPractical}</div>
        <div className="table-cell">{data.ponderationIndividual}</div>
        <div className="table-cell">
          {data.ponderationTheory +
            data.ponderationPractical +
            data.ponderationIndividual}
        </div>
        <div
          className="table-cell"
          // @todo this atrribute is not allowed on a div
          // @ts-ignore
          titletext={this.props.renderer.time_choices[data.timeUnits].name}
        >
          {data.timeRequired}
        </div>
      </>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const data_override = data.representsWorkflow
      ? {
          ...data,
          ...data.linkedWorkflowData,
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
  return getNodeByID(state, ownProps.objectId)
}

const MatrixNode = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(MatrixNodeUnconnected)

export default MatrixNode
