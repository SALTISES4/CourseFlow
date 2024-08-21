import * as React from 'react'
import { connect } from 'react-redux'
import { TitleText } from '@cfCommonComponents/UIComponents/Titles'
import EditableComponentWithComments from '@cfParentComponents/EditableComponentWithComments'
import { getNodeByID } from '@cfFindState'
import GridNode from './GridNode'

import * as Utility from '@cfUtility'
import { AppState, TNodeweek } from '@cfRedux/types/type'
import {
  EditableComponentWithCommentsStateType,
  EditableComponentWithCommentsType
} from '@cfParentComponents/EditableComponentWithComments'
import { CfObjectType } from '@cfModule/types/enum'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
/**
 * A block representing a term in the grid view
 */

type OwnProps = {
  // renderer: any
  rank: number
  data: any
} & EditableComponentWithCommentsType

type ConnectedProps = {
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
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>

  constructor(props: PropsType) {
    super(props)

    // from this.renderer
    // view_comments
    // selection_manager
    this.objectType = CfObjectType.WEEK // @todo check addEditable
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const default_text = data.week_type_display + ' ' + (this.props.rank + 1)
    const nodes = this.props.nodes.map((node) => <GridNode data={node} />)

    const comments = this.context.view_comments ? <this.AddCommenting /> : <></>

    this.addEditable(data, true)

    return (
      <div
        className="week"
        ref={this.mainDiv}
        style={this.getBorderStyle()}
        onClick={(evt) =>
          this.context.selection_manager.changeSelection(evt, this)
        }
      >
        <div className="week-title">
          <TitleText title={data.title} defaultText={default_text} />
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
    data.nodeweek_set
  )
  const nodes_data = node_weeks
    .map((nodeweek) => getNodeByID(state, nodeweek.node).data)
    .filter((node) => !Utility.checkSetHidden(node, state.objectset))
  // let nodes_data = Utility.filterThenSortByID(state.node,node_weeks.map(node_week=>node_week.node)).filter(node=>!Utility.checkSetHidden(node,state.objectset));

  // @todo getNodeByID returns GetNodeByIDType
  // which does not contain represents_workflow property
  // so this will always be false, verify and remove check
  const override_data = nodes_data.map((node) => {
    // @ts-ignore
    if (node.represents_workflow)
      return {
        ...node,
        // @ts-ignore
        ...node.linked_workflow_data
      }
    else return node
  })

  const general_education = override_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.time_general_hours)
        return previousValue + currentValue.time_general_hours
      return previousValue
    },
    0
  )

  const specific_education = override_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.time_specific_hours)
        return previousValue + currentValue.time_specific_hours
      return previousValue
    },
    0
  )

  const total_theory = override_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderation_theory)
      return previousValue + currentValue.ponderation_theory
    return previousValue
  }, 0)

  const total_practical = override_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.ponderation_practical)
        return previousValue + currentValue.ponderation_practical
      return previousValue
    },
    0
  )

  const total_individual = override_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.ponderation_individual)
        return previousValue + currentValue.ponderation_individual
      return previousValue
    },
    0
  )

  const total_time = total_theory + total_practical + total_individual

  const total_required = override_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.time_required)
      return previousValue + parseInt(currentValue.time_required)
    return previousValue
  }, 0)

  return {
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
