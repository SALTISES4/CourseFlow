// @ts-nocheck
import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import { getSortedOutcomeIDFromOutcomeWorkflowSet } from '@cfFindState'
import NodeOutcomeView from '@cfCommonComponents/workflow/Node/NodeOutcomeView'
import {
  AppState,
  Column,
  Columnworkflow,
  NodeType,
  Nodeweek,
  Week,
  Weekworkflow
} from '@cfRedux/type'
import OutcomeBase from '@cfViews/OutcomeTableView/OutcomeBase'
import OutcomeLegend from '@cfViews/OutcomeTableView/OutcomeLegend'
import { CfObjectType } from '@cfModule/types/enum'

/**
 * The outcome table.
 */

type ConnectedProps = Pick<
  AppState,
  | 'weekworkflow'
  | 'week'
  | 'nodeweek'
  | 'node'
  | 'objectset'
  | 'column'
  | 'outcomeworkflow'
  | 'outcome'
  | 'columnworkflow'
  | 'workflow'
>
type OwnProps = any

type PropsType = ConnectedProps & OwnProps
class OutcomeTableViewUnconnected extends React.Component<PropsType> {
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WORKFLOW // @todo check addEditable
    //  this.state = {}
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getOutcomesSorted() {
    return getSortedOutcomeIDFromOutcomeWorkflowSet(
      this.props.outcome,
      this.props.outcomeworkflow,
      this.props.workflow.outcomeworkflow_set,
      this.props.objectset
    )
  }

  getNodecategory() {
    const week_order = Utility.filterThenSortByID<Weekworkflow>(
      this.props.weekworkflow,
      this.props.workflow.weekworkflow_set
    ).map((weekworkflow) => weekworkflow.week)

    const weeks_ordered = Utility.filterThenSortByID<Week>(
      this.props.week,
      week_order
    )

    const nodeweek_order = [].concat(
      ...weeks_ordered.map((week) => week.nodeweek_set)
    )
    let nodeweeks_ordered = Utility.filterThenSortByID<Nodeweek>(
      this.props.nodeweek,
      nodeweek_order
    )

    const node_order = nodeweeks_ordered.map((nodeweek) => nodeweek.node)

    const nodes_ordered = Utility.filterThenSortByID<NodeType>(
      this.props.node,
      node_order
    ).filter((node) => !Utility.checkSetHidden(node, this.props.object_sets))

    switch (parseInt(this.props.workflow.outcomes_sort)) {
      case 0: {
        const nodes_allowed = nodes_ordered.map((node) => node.id)
        nodeweeks_ordered = nodeweeks_ordered.filter(
          (nodeweek) => nodes_allowed.indexOf(nodeweek.node) >= 0
        )
        const nodes_by_week = {}
        for (let i = 0; i < nodeweeks_ordered.length; i++) {
          const nodeweek = nodeweeks_ordered[i]
          Utility.pushOrCreate(nodes_by_week, nodeweek.week, nodeweek.node)
        }
        return weeks_ordered.map((week, index) => {
          return {
            title: week.title || week.week_type_display + ' ' + (index + 1),
            nodes: nodes_by_week[week.id] || []
          }
        })
      }

      case 1: {
        const column_order = Utility.filterThenSortByID<Columnworkflow>(
          this.props.columnworkflow,
          this.props.workflow.columnworkflow_set
        ).map((columnworkflow) => columnworkflow.column)
        const columns_ordered = Utility.filterThenSortByID<Column>(
          this.props.column,
          column_order
        )
        const nodes_by_column = {}
        for (let i = 0; i < nodes_ordered.length; i++) {
          const node = nodes_ordered[i]
          Utility.pushOrCreate(nodes_by_column, node.column, node.id)
        }
        return columns_ordered.map((column, index) => {
          return {
            title: column.title || column.column_type_display,
            nodes: nodes_by_column[column_order[index]] || []
          }
        })
      }

      case 2: {
        const workflow_type = ['activity', 'course', 'program'].indexOf(
          this.props.workflow.type
        )
        const task_ordered = this.props.renderer.task_choices.filter(
          (x) =>
            x.type == 0 ||
            (x.type > 100 * workflow_type && x.type < 100 * (workflow_type + 1))
        )
        const nodes_by_task = {}
        for (let i = 0; i < nodes_ordered.length; i++) {
          const node = nodes_ordered[i]
          Utility.pushOrCreate(nodes_by_task, node.task_classification, node.id)
        }
        return task_ordered.map((task) => {
          return { title: task.name, nodes: nodes_by_task[task.type] || [] }
        })
      }

      case 3: {
        const workflow_type = ['activity', 'course', 'program'].indexOf(
          this.props.workflow.type
        )
        const context_ordered = this.props.renderer.context_choices.filter(
          (x) =>
            x.type == 0 ||
            (x.type > 100 * workflow_type && x.type < 100 * (workflow_type + 1))
        )
        const nodes_by_context = {}
        for (let i = 0; i < nodes_ordered.length; i++) {
          const node = nodes_ordered[i]
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
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const nodecategory = this.getNodecategory()

    // @todo looks like trying to cache?
    // const nodecategory_json = JSON.stringify(nodecategory)
    // if (this.nodecategory_json === nodecategory_json)
    //   nodecategory = this.nodecategory
    // else {
    //   this.nodecategory = nodecategory
    //   this.nodecategory_json = nodecategory_json
    // }

    const outcomes_sorted = this.getOutcomesSorted()

    let has_nodes = false
    for (let i = 0; i < nodecategory.length; i++) {
      if (nodecategory[i].nodes.length > 0) {
        has_nodes = true
        break
      }
    }

    if (outcomes_sorted.length === 0 || !has_nodes) {
      let text
      if (this.props.renderer.view_type === 'outcometable') {
        text = window.gettext(
          'This view renders a table showing the relationships between nodes and outcomes. Add outcomes and nodes to the workflow to get started.'
        )
      }

      //else text = gettext("This view renders a table showing the relationships between this workflow's outcomes and the outcomes of their linked workflows. To use this feature, you must link the nodes in this workflow to child workflows (ex. program nodes to course workflows) and ensure that those child workflows have their own sets of outcomes.");
      return <div className="emptytext">{text}</div>
    } else {
      const nodes = nodecategory.map((nodecategory) => (
        <div className="table-group">
          <div className="table-cell nodewrapper blank-cell" />
          <div className="table-cell nodewrapper total-cell">
            <div className="node-category-header">{nodecategory.title}</div>
          </div>
          {nodecategory.nodes.map((node) => (
            <NodeOutcomeView
              // renderer={this.props.renderer}  // renderer not used?
              objectID={node}
            />
          ))}
        </div>
      ))

      const outcomes = outcomes_sorted.map((category) => (
        <div>
          {
            // @todo  should object_sets be set?
            // @ts-ignore
            this.props?.object_sets?.length > 0 && (
              <div className="outcome-row outcome-category">
                <div className="outcome-head">
                  <h4>{category.objectset.title}</h4>
                </div>
              </div>
            )
          }
          {category.outcomes.map((outcome) => (
            <OutcomeBase
              key={outcome}
              renderer={this.props.renderer}
              objectID={outcome}
              nodecategory={nodecategory}
              type="outcome_table"
              outcome_type={'asdf'}
            />
          ))}
        </div>
      ))

      return (
        <div className="workflow-details">
          <OutcomeLegend
            renderer={this.props.renderer}
            //  outcomes_type={this.props.workflow.outcomes_type} @todo this was supplied by redux
          />
          <div className="outcome-table node-rows">
            <div className="outcome-row node-row">
              <div className="outcome-wrapper">
                <div className="outcome-head empty" />
              </div>
              <div className="outcome-cells">{nodes}</div>
              <div className="table-cell blank-cell">
                <div className="node-category-header" />
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

const mapStateToProps = (state: AppState): ConnectedProps => {
  return {
    // workflow_type: state.workflow.type,
    // outcomes_type: state.workflow.outcomes_type,
    // outcomeworkflow_order: state.workflow.outcomeworkflow_set,
    // weekworkflow_order: state.workflow.weekworkflow_set,
    // columnworkflow_order: state.workflow.columnworkflow_set,
    // outcomes_sort: state.workflow.outcomes_sort,
    workflow: state.workflow,
    weekworkflow: state.weekworkflow,
    week: state.week,
    nodeweek: state.nodeweek,
    node: state.node,
    objectset: state.objectset,
    columnworkflow: state.columnworkflow,
    column: state.column,
    outcomeworkflow: state.outcomeworkflow,
    outcome: state.outcome
  }
}
const OutcomeTableView = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(OutcomeTableViewUnconnected)

export default OutcomeTableView
