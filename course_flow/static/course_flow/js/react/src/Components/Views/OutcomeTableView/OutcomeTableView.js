import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import { getSortedOutcomeIDFromOutcomeWorkflowSet } from '@cfFindState'
import { NodeOutcomeView } from '@cfCommonComponents'
import OutcomeBase from './OutcomeBase.js'
import { WorkflowOutcomeLegend } from '../../components/WorkflowLegend.js'

/**
 * The outcome table.
 */
class OutcomeTableView extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
    this.state = {}
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
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

    switch (parseInt(this.props.outcomes_sort)) {
      case 0:
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
            nodes: nodes_by_week[week.id] || []
          }
        })
      case 1:
        let column_order = Utility.filterThenSortByID(
          this.props.columnworkflows,
          this.props.columnworkflow_order
        ).map((columnworkflow) => columnworkflow.column)
        let columns_ordered = Utility.filterThenSortByID(
          this.props.columns,
          column_order
        )
        let nodes_by_column = {}
        for (let i = 0; i < nodes_ordered.length; i++) {
          let node = nodes_ordered[i]
          Utility.pushOrCreate(nodes_by_column, node.column, node.id)
        }
        return columns_ordered.map((column, index) => {
          return {
            title: column.title || column.column_type_display,
            nodes: nodes_by_column[column_order[index]] || []
          }
        })
      case 2:
        var workflow_type = ['activity', 'course', 'program'].indexOf(
          this.props.workflow_type
        )
        let task_ordered = this.props.renderer.task_choices.filter(
          (x) =>
            x.type == 0 ||
            (x.type > 100 * workflow_type && x.type < 100 * (workflow_type + 1))
        )
        let nodes_by_task = {}
        for (let i = 0; i < nodes_ordered.length; i++) {
          let node = nodes_ordered[i]
          Utility.pushOrCreate(nodes_by_task, node.task_classification, node.id)
        }
        return task_ordered.map((task) => {
          return { title: task.name, nodes: nodes_by_task[task.type] || [] }
        })
      case 3:
        var workflow_type = ['activity', 'course', 'program'].indexOf(
          this.props.workflow_type
        )
        let context_ordered = this.props.renderer.context_choices.filter(
          (x) =>
            x.type == 0 ||
            (x.type > 100 * workflow_type && x.type < 100 * (workflow_type + 1))
        )
        let nodes_by_context = {}
        for (let i = 0; i < nodes_ordered.length; i++) {
          let node = nodes_ordered[i]
          Utility.pushOrCreate(
            nodes_by_context,
            node.context_classification,
            node.id
          )
        }
        return context_ordered.map((context) => {
          return {
            title: context.name,
            nodes: nodes_by_context[context.type] || []
          }
        })
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let nodecategory = this.getNodecategory()
    let nodecategory_json = JSON.stringify(nodecategory)
    if (this.nodecategory_json === nodecategory_json)
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

    if (outcomes_sorted.length === 0 || !has_nodes) {
      let text
      if (this.props.renderer.view_type === 'outcometable')
        text = gettext(
          'This view renders a table showing the relationships between nodes and outcomes. Add outcomes and nodes to the workflow to get started.'
        )

      //else text = gettext("This view renders a table showing the relationships between this workflow's outcomes and the outcomes of their linked workflows. To use this feature, you must link the nodes in this workflow to child workflows (ex. program nodes to course workflows) and ensure that those child workflows have their own sets of outcomes.");
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
      let outcomes = outcomes_sorted.map((category) => (
        <div>
          {this.props.object_sets.length > 0 && (
            <div className="outcome-row outcome-category">
              <div className="outcome-head">
                <h4>{category.objectset.title}</h4>
              </div>
            </div>
          )}
          {category.outcomes.map((outcome) => (
            <OutcomeBase
              key={outcome}
              renderer={this.props.renderer}
              objectID={outcome}
              nodecategory={nodecategory}
              outcomes_type={this.props.outcomes_type}
              type="outcome_table"
            />
          ))}
        </div>
      ))

      return (
        <div className="workflow-details">
          <WorkflowOutcomeLegend
            renderer={this.props.renderer}
            outcomes_type={this.props.outcomes_type}
          />
          <div className="outcome-table node-rows">
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
          </div>
        </div>
      )
    }
  }
}
const mapStateToProps = (state, own_props) => {
  return {
    workflow_type: state.workflow.type,
    outcomes_type: state.workflow.outcomes_type,
    weekworkflows: state.weekworkflow,
    weeks: state.week,
    nodeweeks: state.nodeweek,
    nodes: state.node,
    object_sets: state.objectset,
    weekworkflow_order: state.workflow.weekworkflow_set,
    columnworkflow_order: state.workflow.columnworkflow_set,
    columnworkflows: state.columnworkflow,
    columns: state.column,
    outcomes_sort: state.workflow.outcomes_sort,
    outcomeworkflow_order: state.workflow.outcomeworkflow_set,
    outcomeworkflows: state.outcomeworkflow,
    outcomes: state.outcome
  }
}
const mapDispatchToProps = {}
export default connect(mapStateToProps, null)(OutcomeTableView)
