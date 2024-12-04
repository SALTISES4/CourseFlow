import { CfObjectType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import { selectWeekById } from '@cfRedux/selectors/week.selector'
import { AppState } from '@cfRedux/types/type'
import React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = {
  data: any
  totalTheory: number
  totalPractical: number
  totalIndividual: number
  totalRequired: number
  totalTime: number
  generalEducation: number
  specificEducation: number
  objectSets: AppState['objectSet']
  nodes: any
}
type OwnProps = {
  rank?: number
  objectId?: number
}
type PropsType = ConnectedProps & OwnProps

/**
 * A block for a term in the competency matrix view. This shows
 * the time data.
 */
class MatrixWeekUnconnected extends React.Component<PropsType> {
  objectType: CfObjectType
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
          {this.props.generalEducation}
        </div>
        <div className="total-cell table-cell">
          {this.props.specificEducation}
        </div>
        <div className="total-cell table-cell">
          {this.props.generalEducation + this.props.specificEducation}
        </div>
        <div className="total-cell table-cell blank"></div>
        <div className="total-cell table-cell">{this.props.totalTheory}</div>
        <div className="total-cell table-cell">{this.props.totalPractical}</div>
        <div className="total-cell table-cell">
          {this.props.totalIndividual}
        </div>
        <div className="total-cell table-cell">{this.props.totalTime}</div>
        <div className="total-cell table-cell">{this.props.totalRequired}</div>
      </div>
    )
  }
}

// @todo needs rework
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  const data = selectWeekById(state, ownProps.objectId).data
  const nodeWeeks = Utility.filterThenSortById(state.nodeweek, data.nodeweekSet)
  const nodesData = Utility.filterThenSortById(
    state.node,
    nodeWeeks.map((nodeWeek) => nodeWeek.node)
  ).filter((node) => !Utility.checkSetHidden(node, state.objectSet))
  const linkedWfData = nodesData.map((node) => {
    if (node.representsWorkflow) {
      return { ...node, ...node.linkedWorkflowData }
    }
    return node
  })
  const generalEducation = linkedWfData.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.timeGeneralHours) {
        return previousValue + currentValue.timeGeneralHours
      }
      return previousValue
    },
    0
  )
  const specificEducation = linkedWfData.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.timeSpecificHours) {
        return previousValue + currentValue.timeSpecificHours
      }
      return previousValue
    },
    0
  )
  const totalTheory = linkedWfData.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderationTheory) {
      return previousValue + currentValue.ponderationTheory
    }
    return previousValue
  }, 0)
  const totalPractical = linkedWfData.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderationPractical) {
      return previousValue + currentValue.ponderationPractical
    }
    return previousValue
  }, 0)
  const totalIndividual = linkedWfData.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderationIndividual) {
      return previousValue + currentValue.ponderationIndividual
    }
    return previousValue
  }, 0)
  const totalTime = totalTheory + totalPractical + totalIndividual
  const totalRequired = linkedWfData.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.timeRequired) {
      return previousValue + parseFloat(currentValue.timeRequired)
    }
    return previousValue
  }, 0)

  return {
    data: data,
    totalTheory: totalTheory,
    totalPractical: totalPractical,
    totalIndividual: totalIndividual,
    totalRequired: totalRequired,
    totalTime: totalTime,
    generalEducation: generalEducation,
    specificEducation: specificEducation,
    objectSets: state.objectSet,
    nodes: nodesData
  }
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(MatrixWeekUnconnected)
