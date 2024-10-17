import { CfObjectType } from '@cf/types/enum'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import EditableComponentWithComments from '@cfEditableComponents/EditableComponentWithComments'
import {
  EditableComponentWithCommentsStateType,
  EditableComponentWithCommentsType
} from '@cfEditableComponents/EditableComponentWithComments'
import { getNodeByID } from '@cfFindState'
import { AppState, TNodeweek, TWorkflow } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import * as React from 'react'
import { connect } from 'react-redux'

import GridNode from './GridNode'

/**
 * A block representing a term in the grid view
 */
type OwnProps = {
  // renderer: any
  rank: number
  data: any
} & EditableComponentWithCommentsType

type ConnectedProps = {
  workflow: TWorkflow
  nodes: any
  general_education: number
  specific_education: number
  total_theory: number
  total_practical: number
  total_individual: number
  total_time: number
  total_required: number
}

type PropsType = OwnProps & ConnectedProps

class GridWeekUnconnected extends EditableComponentWithComments<
  PropsType,
  EditableComponentWithCommentsStateType
> {
  constructor(props: PropsType) {
    super(props)

    // from this.renderer
    // viewComments
    // selectionManager
    this.objectType = CfObjectType.WEEK // @todo check addEditable
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const defaultText = data.weekTypeDisplay + ' ' + (this.props.rank + 1)
    const nodes = this.props.nodes.map((node) => <GridNode data={node} />)

    const comments = this.props.workflow.workflowPermissions.viewComments ? (
      <this.AddCommenting />
    ) : (
      <></>
    )

    this.addEditable(data, true)

    return (
      <div
        className="week"
        ref={this.mainDiv}
        style={this.getBorderStyle()}
        onClick={(evt) =>
          this.context.selectionManager.changeSelection({ evt, newSelection: this })
        }
      >
        <div className="week-title">
          <TitleText text={data.title} defaultText={defaultText} />
          <div className="grid-ponderation">
            {this.props.total_theory +
              '/' +
              this.props.total_practical +
              '/' +
              this.props.total_individual}
          </div>
        </div>
        {nodes}
        {/*{this.addEditable(data, true)}*/}
        <div className="mouseover-actions">{comments}</div>
        <div className="side-actions">
          <div className="comment-indicator-container"></div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  const data = ownProps.data

  const node_weeks = Utility.filterThenSortByID<TNodeweek>(
    state.nodeweek,
    data.nodeweekSet
  )
  const nodes_data = node_weeks
    .map((nodeweek) => getNodeByID(state, nodeweek.node).data)
    .filter((node) => !Utility.checkSetHidden(node, state.objectset))
  // let nodes_data = Utility.filterThenSortByID(state.node,node_weeks.map(node_week=>node_week.node)).filter(node=>!Utility.checkSetHidden(node,state.objectset));

  // @todo getNodeByID returns GetNodeByIDType
  // which does not contain representsWorkflow property
  // so this will always be false, verify and remove check
  const override_data = nodes_data.map((node) => {
    // @ts-ignore
    if (node.representsWorkflow)
      return {
        ...node,
        // @ts-ignore
        ...node.linkedWorkflowData
      }
    else return node
  })

  const general_education = override_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.timeGeneralHours)
        return previousValue + currentValue.timeGeneralHours
      return previousValue
    },
    0
  )

  const specific_education = override_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.timeSpecificHours)
        return previousValue + currentValue.timeSpecificHours
      return previousValue
    },
    0
  )

  const total_theory = override_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderationTheory)
      return previousValue + currentValue.ponderationTheory
    return previousValue
  }, 0)

  const total_practical = override_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.ponderationPractical)
        return previousValue + currentValue.ponderationPractical
      return previousValue
    },
    0
  )

  const total_individual = override_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.ponderationIndividual)
        return previousValue + currentValue.ponderationIndividual
      return previousValue
    },
    0
  )

  const total_time = total_theory + total_practical + total_individual

  const total_required = override_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.timeRequired)
      return previousValue + parseInt(currentValue.timeRequired)
    return previousValue
  }, 0)

  return {
    workflow: state.workflow,
    nodes: override_data,
    general_education: general_education,
    specific_education: specific_education,
    total_theory: total_theory,
    total_practical: total_practical,
    total_individual: total_individual,
    total_time: total_time,
    total_required: total_required
  }
}
const GridWeek = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(GridWeekUnconnected)

export default GridWeek
