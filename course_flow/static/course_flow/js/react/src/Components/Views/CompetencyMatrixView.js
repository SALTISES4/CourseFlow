import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'
import {
  Component,
  EditableComponentWithComments,
  OutcomeTitle,
  TitleText,
  NodeTitle
} from '../components/CommonComponents/CommonComponents.js'
import * as Constants from '../../Constants.js'
import {
  getSortedOutcomeIDFromOutcomeWorkflowSet,
  getOutcomeByID,
  getWeekWorkflowByID,
  getWeekByID,
  getNodeWeekByID,
  getNodeByID,
  getOutcomeNodeByID,
  getTableOutcomeNodeByID
} from '../../FindState.js'
import { WorkflowOutcomeLegend } from '../components/WorkflowLegend.js'
import { TableOutcomeBase } from './OutcomeView.js'
import { NodeOutcomeView } from './NodeView.js'
import * as Utility from '../../UtilityFunctions.js'

class CompetencyMatrixView extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
  }
  render() {
    let nodecategory = this.getNodecategory()
    let nodecategory_json = JSON.stringify(nodecategory)
    if (this.nodecategory_json == nodecategory_json)
      nodecategory = this.nodecategory
    else {
      this.nodecategory = nodecategory
      this.nodecategory_json = nodecategory_json
    }
    let outcomes_sorted = this.getOutcomesSorted()

    let has_nodes = false
    for (let i = 0; i < nodecategory.length; i++) {
      if (nodecategory[i].nodes.length > 0) {
        has_nodes = true
        break
      }
    }

    if (outcomes_sorted.length == 0 || !has_nodes) {
      let text
      if (this.props.renderer.view_type == 'outcometable')
        text = gettext(
          'This view renders a table showing the relationships between nodes and outcomes. Add outcomes and nodes to the workflow to get started.'
        )
      else
        text = gettext(
          "This view renders a table showing the relationships between this workflow's outcomes and the outcomes of their linked workflows. To use this feature, you must link the nodes in this workflow to child workflows (ex. program nodes to course workflows) and ensure that those child workflows have their own sets of outcomes."
        )
      return <div className="emptytext">{text}</div>
    } else {
      let nodes
      nodes = nodecategory.map((nodecategory) => (
        <div className="table-group">
          <div className="table-cell nodewrapper blank-cell"></div>
          <div className="table-cell nodewrapper total-cell">
            <div className="node-category-header">{nodecategory.title}</div>
          </div>
          {nodecategory.nodes.map((node) => (
            <NodeOutcomeView renderer={this.props.renderer} objectID={node} />
          ))}
        </div>
      ))
      let blank_line = nodecategory.map((nodecategory) => (
        <div className="table-group">
          <div className="table-cell blank-cell"></div>
          <div className="table-cell total-cell blank-cell"></div>
          {nodecategory.nodes.map((node) => (
            <div className="table-cell nodewrapper blank-cell"></div>
          ))}
        </div>
      ))
      let outcomes = outcomes_sorted.map((category) => (
        <div className="table-body">
          {this.props.object_sets.length > 0 && (
            <div className="outcome-row outcome-category">
              <div className="outcome-wrapper">
                <div className="outcome-head">
                  <h4>{category.objectset.title}</h4>
                </div>
              </div>
              <div className="outcome-cells">{blank_line}</div>
              <div className="table-cell blank-cell"></div>
              <div className="table-cell blank-cell total-cell grand-total-cell"></div>
            </div>
          )}
          {category.outcomes.map((outcome) => (
            <TableOutcomeBase
              key={outcome}
              renderer={this.props.renderer}
              objectID={outcome}
              nodecategory={nodecategory}
              outcomes_type={this.props.outcomes_type}
              type="competency_matrix"
            />
          ))}
        </div>
      ))
      let blank_row = Array(10).fill(
        <div className="table-cell empty-cell"></div>
      )
      let weeks = nodecategory.map((category) => (
        <div className="matrix-time-week">
          <MatrixWeekView
            objectID={category.id}
            renderer={this.props.renderer}
          />
          {category.nodes.map((node) => (
            <MatrixNodeView objectID={node} renderer={this.props.renderer} />
          ))}
          <div className="matrix-time-row">{blank_row}</div>
        </div>
      ))
      let time_header = (
        <div className="matrix-time-row">
          <div className="table-cell outcome-wrapper">
            <div className="outcome-head">
              <h4>{gettext('Hours')}</h4>
            </div>
          </div>
          <div className="table-cell outcome-wrapper">
            <div className="outcome-head">{gettext('General Education')}</div>
          </div>
          <div className="table-cell outcome-wrapper">
            <div className="outcome-head">{gettext('Specific Education')}</div>
          </div>
          <div className="table-cell outcome-wrapper">
            <div className="outcome-head">{gettext('Total Hours')}</div>
          </div>
          <div className="table-cell outcome-wrapper">
            <div className="outcome-head">
              <h4>{gettext('Ponderation')}</h4>
            </div>
          </div>
          <div className="table-cell outcome-wrapper">
            <div className="outcome-head">{gettext('Theory')}</div>
          </div>
          <div className="table-cell outcome-wrapper">
            <div className="outcome-head">{gettext('Practical')}</div>
          </div>
          <div className="table-cell outcome-wrapper">
            <div className="outcome-head">{gettext('Individual Work')}</div>
          </div>
          <div className="table-cell outcome-wrapper">
            <div className="outcome-head">{gettext('Total')}</div>
          </div>
          <div className="table-cell outcome-wrapper">
            <div className="outcome-head">{gettext('Credits')}</div>
          </div>
        </div>
      )
      let totals = this.getTotals()
      let grand_total = (
        <div className="matrix-time-row">
          <div className="total-cell grand-total-cell table-cell blank"></div>
          <div className="total-cell grand-total-cell table-cell">
            {totals.general_education}
          </div>
          <div className="total-cell grand-total-cell table-cell">
            {totals.specific_education}
          </div>
          <div className="total-cell grand-total-cell table-cell">
            {totals.general_education + totals.specific_education}
          </div>
          <div className="total-cell grand-total-cell table-cell blank"></div>
          <div className="total-cell grand-total-cell table-cell">
            {totals.total_theory}
          </div>
          <div className="total-cell grand-total-cell table-cell">
            {totals.total_practical}
          </div>
          <div className="total-cell grand-total-cell table-cell">
            {totals.total_individual}
          </div>
          <div className="total-cell grand-total-cell table-cell">
            {totals.total_time}
          </div>
          <div className="total-cell grand-total-cell table-cell">
            {totals.total_required}
          </div>
        </div>
      )
      return (
        <div className="competency-matrix node-rows">
          <div className="outcome-row node-row">
            <div className="outcome-wrapper">
              <div className="outcome-head empty"></div>
            </div>
            <div className="outcome-cells">{nodes}</div>
            <div className="table-cell blank-cell">
              <div className="node-category-header"></div>
            </div>
            <div className="table-cell total-cell grand-total-cell">
              <div className="total-header">Grand Total</div>
            </div>
          </div>
          {outcomes}
          <div className="matrix-time-block">
            {time_header}
            {weeks}
            {grand_total}
          </div>
        </div>
      )
    }
  }

  getOutcomesSorted() {
    return getSortedOutcomeIDFromOutcomeWorkflowSet(
      this.props.outcomes,
      this.props.outcomeworkflows,
      this.props.outcomeworkflow_order,
      this.props.object_sets
    )
  }

  getNodecategory() {
    let week_order = Utility.filterThenSortByID(
      this.props.weekworkflows,
      this.props.weekworkflow_order
    ).map((weekworkflow) => weekworkflow.week)
    let weeks_ordered = Utility.filterThenSortByID(this.props.weeks, week_order)
    let nodeweek_order = [].concat(
      ...weeks_ordered.map((week) => week.nodeweek_set)
    )
    let nodeweeks_ordered = Utility.filterThenSortByID(
      this.props.nodeweeks,
      nodeweek_order
    )
    let node_order = nodeweeks_ordered.map((nodeweek) => nodeweek.node)
    let nodes_ordered = Utility.filterThenSortByID(
      this.props.nodes,
      node_order
    ).filter((node) => !Utility.checkSetHidden(node, this.props.object_sets))

    let nodes_allowed = nodes_ordered.map((node) => node.id)
    nodeweeks_ordered = nodeweeks_ordered.filter(
      (nodeweek) => nodes_allowed.indexOf(nodeweek.node) >= 0
    )
    let nodes_by_week = {}
    for (let i = 0; i < nodeweeks_ordered.length; i++) {
      let nodeweek = nodeweeks_ordered[i]
      Utility.pushOrCreate(nodes_by_week, nodeweek.week, nodeweek.node)
    }
    return weeks_ordered.map((week, index) => {
      return {
        title: week.title || week.week_type_display + ' ' + (index + 1),
        id: week.id,
        nodes: nodes_by_week[week.id] || []
      }
    })
  }

  getTotals() {
    let nodes_data = this.props.nodes.filter(
      (node) => !Utility.checkSetHidden(node, this.props.objectset)
    )
    let linked_wf_data = nodes_data.map((node) => {
      if (node.represents_workflow)
        return { ...node, ...node.linked_workflow_data }
      return node
    })
    let general_education = linked_wf_data.reduce(
      (previousValue, currentValue) => {
        if (currentValue && currentValue.time_general_hours)
          return previousValue + currentValue.time_general_hours
        return previousValue
      },
      0
    )
    let specific_education = linked_wf_data.reduce(
      (previousValue, currentValue) => {
        if (currentValue && currentValue.time_specific_hours)
          return previousValue + currentValue.time_specific_hours
        return previousValue
      },
      0
    )
    let total_theory = linked_wf_data.reduce((previousValue, currentValue) => {
      if (currentValue && currentValue.ponderation_theory)
        return previousValue + currentValue.ponderation_theory
      return previousValue
    }, 0)
    let total_practical = linked_wf_data.reduce(
      (previousValue, currentValue) => {
        if (currentValue && currentValue.ponderation_practical)
          return previousValue + currentValue.ponderation_practical
        return previousValue
      },
      0
    )
    let total_individual = linked_wf_data.reduce(
      (previousValue, currentValue) => {
        if (currentValue && currentValue.ponderation_individual)
          return previousValue + currentValue.ponderation_individual
        return previousValue
      },
      0
    )
    let total_time = total_theory + total_practical + total_individual
    let total_required = linked_wf_data.reduce(
      (previousValue, currentValue) => {
        if (currentValue && currentValue.time_required)
          return previousValue + parseFloat(currentValue.time_required)
        return previousValue
      },
      0
    )

    return {
      total_theory: total_theory,
      total_practical: total_practical,
      total_individual: total_individual,
      total_required: total_required,
      total_time: total_time,
      general_education: general_education,
      specific_education: specific_education
    }
  }
}
const mapStateToProps = (state, own_props) => {
  return {
    weekworkflows: state.weekworkflow,
    weeks: state.week,
    nodeweeks: state.nodeweek,
    nodes: state.node,
    object_sets: state.objectset,
    weekworkflow_order: state.workflow.weekworkflow_set,
    outcomes_sort: state.workflow.outcomes_sort,
    outcomeworkflow_order: state.workflow.outcomeworkflow_set,
    outcomeworkflows: state.outcomeworkflow,
    outcomes: state.outcome
  }
}
const mapDispatchToProps = {}
export default connect(mapStateToProps, null)(CompetencyMatrixView)

class MatrixWeekViewUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'week'
  }

  render() {
    let data = this.props.data

    let default_text = data.week_type_display + ' ' + (this.props.rank + 1)

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
const mapWeekStateToProps = (state, own_props) => {
  let data = getWeekByID(state, own_props.objectID).data
  let node_weeks = Utility.filterThenSortByID(state.nodeweek, data.nodeweek_set)
  let nodes_data = Utility.filterThenSortByID(
    state.node,
    node_weeks.map((node_week) => node_week.node)
  ).filter((node) => !Utility.checkSetHidden(node, state.objectset))
  let linked_wf_data = nodes_data.map((node) => {
    if (node.represents_workflow)
      return { ...node, ...node.linked_workflow_data }
    return node
  })
  let general_education = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.time_general_hours)
        return previousValue + currentValue.time_general_hours
      return previousValue
    },
    0
  )
  let specific_education = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.time_specific_hours)
        return previousValue + currentValue.time_specific_hours
      return previousValue
    },
    0
  )
  let total_theory = linked_wf_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderation_theory)
      return previousValue + currentValue.ponderation_theory
    return previousValue
  }, 0)
  let total_practical = linked_wf_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.ponderation_practical)
      return previousValue + currentValue.ponderation_practical
    return previousValue
  }, 0)
  let total_individual = linked_wf_data.reduce(
    (previousValue, currentValue) => {
      if (currentValue && currentValue.ponderation_individual)
        return previousValue + currentValue.ponderation_individual
      return previousValue
    },
    0
  )
  let total_time = total_theory + total_practical + total_individual
  let total_required = linked_wf_data.reduce((previousValue, currentValue) => {
    if (currentValue && currentValue.time_required)
      return previousValue + parseFloat(currentValue.time_required)
    return previousValue
  }, 0)

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
export const MatrixWeekView = connect(
  mapWeekStateToProps,
  null
)(MatrixWeekViewUnconnected)

class MatrixNodeViewUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'node'
  }

  render() {
    let data = this.props.data
    let data_override
    if (data.represents_workflow)
      data_override = { ...data, ...data.linked_workflow_data, id: data.id }
    else data_override = data

    let css_class =
      'node column-' + data.column + ' ' + Constants.node_keys[data.node_type]

    let style = {}
    style.backgroundColor = Constants.getColumnColour(this.props.column)

    return (
      <div className="matrix-time-row">
        <div className="table-cell blank"></div>
        {this.getTimeData(data_override)}
      </div>
    )
  }

  getTimeData(data) {
    return [
      <div className="table-cell">{data.time_general_hours}</div>,
      <div className="table-cell">{data.time_specific_hours}</div>,
      <div className="table-cell">
        {(data.time_general_hours || 0) + (data.time_specific_hours || 0)}
      </div>,
      <div className="table-cell blank"></div>,
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
}
const mapNodeStateToProps = (state, own_props) =>
  getNodeByID(state, own_props.objectID)
export const MatrixNodeView = connect(
  mapNodeStateToProps,
  null
)(MatrixNodeViewUnconnected)
