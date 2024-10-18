import { CfObjectType } from '@cf/types/enum'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import { getWeekById } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = {
  data: any
  total_theory: number
  total_practical: number
  total_individual: number
  total_required: number
  total_time: number
  general_education: number
  specific_education: number
  objectSets: AppState['objectset']
  nodes: any
}
type OwnProps = {
  rank?: number
} & ComponentWithToggleProps
type PropsType = ConnectedProps & OwnProps

/**
 * A block for a term in the competency matrix view. This shows
 * the time data.
 */
class MatrixWeekUnconnected extends ComponentWithToggleDrop<PropsType> {
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WEEK
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    // const data = this.props.data

    //  const defaultText = data.weekTypeDisplay + ' ' + (this.props.rank + 1)

    return (
      <div className="matrix-time-row">
        <div className="total-cell table-cell blank"></div>
        <div className="total-cell table-cell">
          {this.props.general_education}
        </div>
        <div className="total-cell table-cell">
          {this.props.specific_education}
        </div>
        <div className="total-cell table-cell">
          {this.props.general_education + this.props.specific_education}
        </div>
        <div className="total-cell table-cell blank"></div>
        <div className="total-cell table-cell">{this.props.total_theory}</div>
        <div className="total-cell table-cell">
          {this.props.total_practical}
        </div>
        <div className="total-cell table-cell">
          {this.props.total_individual}
        </div>
        <div className="total-cell table-cell">{this.props.total_time}</div>
        <div className="total-cell table-cell">{this.props.total_required}</div>
      </div>
    )
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  const data = getWeekById(state, ownProps.objectId).data
  const node_weeks = Utility.filterThenSortByID(
    state.nodeweek,
    data.nodeweekSet
  )
  const nodes_data = Utility.filterThenSortByID(
    state.node,
    node_weeks.map((node_week) => node_week.node)
  ).filter((node) => !Utility.checkSetHidden(node, state.objectset))
  const linked_wf_data = nodes_data.map((node) => {
    if (node.representsWorkflow)
      return { ...node, ...node.linkedWorkflowData }
    return node
  })
  const general_education = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.timeGeneralHours)
        return previousValue + currentValue.timeGeneralHours
      return previousValue
    },
    0
  )
  const specific_education = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.timeSpecificHours)
        return previousValue + currentValue.timeSpecificHours
      return previousValue
    },
    0
  )
  const total_theory = linked_wf_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderationTheory)
      return previousValue + currentValue.ponderationTheory
    return previousValue
  }, 0)
  const total_practical = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.ponderationPractical)
        return previousValue + currentValue.ponderationPractical
      return previousValue
    },
    0
  )
  const total_individual = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.ponderationIndividual)
        return previousValue + currentValue.ponderationIndividual
      return previousValue
    },
    0
  )
  const total_time = total_theory + total_practical + total_individual
  const total_required = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.timeRequired)
        return previousValue + parseFloat(currentValue.timeRequired)
      return previousValue
    },
    0
  )

  return {
    data: data,
    total_theory: total_theory,
    total_practical: total_practical,
    total_individual: total_individual,
    total_required: total_required,
    total_time: total_time,
    general_education: general_education,
    specific_education: specific_education,
    objectSets: state.objectset,
    nodes: nodes_data
  }
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(MatrixWeekUnconnected)
