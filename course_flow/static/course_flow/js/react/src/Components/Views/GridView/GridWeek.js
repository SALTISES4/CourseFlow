import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponentWithComments, TitleText } from '@cfCommonComponents'

import { getWeekByID, getNodeByID } from '@cfFindState'
import GridNode from './GridNode.js'

import * as Utility from '@cfUtility'
/**
 * A block representing a term in the grid view
 */
class GridWeekUnconnected extends EditableComponentWithComments {
  constructor(props) {
    super(props)
    this.objectType = 'week'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data

    let default_text = data.week_type_display + ' ' + (this.props.rank + 1)
    let nodes = this.props.nodes.map((node) => (
      <GridNode renderer={this.props.renderer} data={node} />
    ))

    let comments
    if (this.props.renderer.view_comments) comments = this.addCommenting()

    return (
      <div
        className="week"
        ref={this.maindiv}
        style={this.get_border_style()}
        onClick={(evt) =>
          this.props.renderer.selection_manager.changeSelection(evt, this)
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
        {this.addEditable(data, true)}
        <div className="mouseover-actions">{comments}</div>
        <div className="side-actions">
          <div className="comment-indicator-container"></div>
        </div>
      </div>
    )
  }
}
const mapWeekStateToProps = (state, own_props) => {
  let data = own_props.data
  let node_weeks = Utility.filterThenSortByID(state.nodeweek, data.nodeweek_set)
  let nodes_data = node_weeks
    .map((nodeweek) => getNodeByID(state, nodeweek.node).data)
    .filter((node) => !Utility.checkSetHidden(node, state.objectset))
  // let nodes_data = Utility.filterThenSortByID(state.node,node_weeks.map(node_week=>node_week.node)).filter(node=>!Utility.checkSetHidden(node,state.objectset));

  let override_data = nodes_data.map((node) => {
    if (node.represents_workflow)
      return { ...node, ...node.linked_workflow_data }
    else return node
  })
  let general_education = override_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.time_general_hours)
        return previousValue + currentValue.time_general_hours
      return previousValue
    },
    0
  )
  let specific_education = override_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.time_specific_hours)
        return previousValue + currentValue.time_specific_hours
      return previousValue
    },
    0
  )
  let total_theory = override_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderation_theory)
      return previousValue + currentValue.ponderation_theory
    return previousValue
  }, 0)
  let total_practical = override_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderation_practical)
      return previousValue + currentValue.ponderation_practical
    return previousValue
  }, 0)
  let total_individual = override_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderation_individual)
      return previousValue + currentValue.ponderation_individual
    return previousValue
  }, 0)
  let total_time = total_theory + total_practical + total_individual
  let total_required = override_data.reduce((previousValue, currentValue) => {
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
export default connect(mapWeekStateToProps, null)(GridWeekUnconnected)
