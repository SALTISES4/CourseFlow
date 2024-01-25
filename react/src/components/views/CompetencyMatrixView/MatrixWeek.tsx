import * as React from 'react'
import { connect } from 'react-redux'

import { getWeekByID } from '@cfFindState'
import * as Utility from '@cfUtility'
import { CfObjectType } from '@cfModule/types/enum'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfParentComponents/ComponentWithToggleDrop'
import { AppState } from '@cfRedux/types/type'

type ConnectedProps = {
  data: any
  total_theory: number
  total_practical: number
  total_individual: number
  total_required: number
  total_time: number
  general_education: number
  specific_education: number
  object_sets: AppState['objectset']
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
    const data = this.props.data

    const default_text = data.week_type_display + ' ' + (this.props.rank + 1)

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
  const data = getWeekByID(state, ownProps.objectID).data
  const node_weeks = Utility.filterThenSortByID(
    state.nodeweek,
    data.nodeweek_set
  )
  const nodes_data = Utility.filterThenSortByID(
    state.node,
    node_weeks.map((node_week) => node_week.node)
  ).filter((node) => !Utility.checkSetHidden(node, state.objectset))
  const linked_wf_data = nodes_data.map((node) => {
    if (node.represents_workflow)
      return { ...node, ...node.linked_workflow_data }
    return node
  })
  const general_education = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.time_general_hours)
        return previousValue + currentValue.time_general_hours
      return previousValue
    },
    0
  )
  const specific_education = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.time_specific_hours)
        return previousValue + currentValue.time_specific_hours
      return previousValue
    },
    0
  )
  const total_theory = linked_wf_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderation_theory)
      return previousValue + currentValue.ponderation_theory
    return previousValue
  }, 0)
  const total_practical = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.ponderation_practical)
        return previousValue + currentValue.ponderation_practical
      return previousValue
    },
    0
  )
  const total_individual = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.ponderation_individual)
        return previousValue + currentValue.ponderation_individual
      return previousValue
    },
    0
  )
  const total_time = total_theory + total_practical + total_individual
  const total_required = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.time_required)
        return previousValue + parseFloat(currentValue.time_required)
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
    object_sets: state.objectset,
    nodes: nodes_data
  }
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(MatrixWeekUnconnected)
