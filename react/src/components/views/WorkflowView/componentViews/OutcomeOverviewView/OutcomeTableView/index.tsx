import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import { _t } from '@cf/utility/Utility.class'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import {getSortedOutcomeIdFromOutcomeWorkflowSet} from "@cfRedux/selectors/helpers";
import {
  AppState,
  TColumn,
  TColumnworkflow,
  TNode,
  TNodeweek,
  TWeek,
  TWeekworkflow
} from '@cfRedux/types/type'
import NodeOutcomeView from '@cfViews/WorkflowView/componentViews/OutcomeOverviewView/common/NodeOutcomeView'
import * as React from 'react'
import { connect } from 'react-redux'

import OutcomeBase from './components/OutcomeBase'
import OutcomeLegend from './components/OutcomeLegend'

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
  static contextType = WorkflowConfigContext
  declare context: React.ContextType<typeof WorkflowConfigContext>

  private objectType: CfObjectType
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WORKFLOW // @todo check addEditable
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getOutcomesSorted() {
    return getSortedOutcomeIdFromOutcomeWorkflowSet(
      this.props.outcome,
      this.props.outcomeworkflow,
      this.props.workflow.outcomeworkflowSet,
      this.props.objectset
    )
  }

  getNodecategory() {
    const weekOrder = Utility.filterThenSortById<TWeekworkflow>(
      this.props.weekworkflow,
      this.props.workflow.weekworkflowSet
    ).map((weekworkflow) => weekworkflow.week)

    const weeksOrdered = Utility.filterThenSortById<TWeek>(
      this.props.week,
      weekOrder
    )

    const nodeweekOrder = [].concat(
      ...weeksOrdered.map((week) => week.nodeweekSet)
    )
    let nodeweeksOrdered = Utility.filterThenSortById<TNodeweek>(
      this.props.nodeweek,
      nodeweekOrder
    )

    const nodeOrder = nodeweeksOrdered.map((nodeweek) => nodeweek.node)

    const nodesOrdered = Utility.filterThenSortById<TNode>(
      this.props.node,
      nodeOrder
    ).filter((node) => !Utility.checkSetHidden(node, this.props.objectSets))

    switch (parseInt(this.props.workflow.outcomesSort)) {
      case 0: {
        const nodesAllowed = nodesOrdered.map((node) => node.id)
        nodeweeksOrdered = nodeweeksOrdered.filter(
          (nodeweek) => nodesAllowed.indexOf(nodeweek.node) >= 0
        )
        const nodesByWeek = {}
        for (let i = 0; i < nodeweeksOrdered.length; i++) {
          const nodeweek = nodeweeksOrdered[i]
          Utility.pushOrCreate(nodesByWeek, nodeweek.week, nodeweek.node)
        }
        return weeksOrdered.map((week, index) => {
          return {
            title: week.title || week.weekTypeDisplay + ' ' + (index + 1),
            nodes: nodesByWeek[week.id] || []
          }
        })
      }

      case 1: {
        const columnOrder = Utility.filterThenSortById<TColumnworkflow>(
          this.props.columnworkflow,
          this.props.workflow.columnworkflowSet
        ).map((columnworkflow) => columnworkflow.column)
        const columnsOrdered = Utility.filterThenSortById<TColumn>(
          this.props.column,
          columnOrder
        )
        const nodesByColumn = {}
        for (let i = 0; i < nodesOrdered.length; i++) {
          const node = nodesOrdered[i]
          Utility.pushOrCreate(nodesByColumn, node.column, node.id)
        }
        return columnsOrdered.map((column, index) => {
          return {
            title: column.title || column.columnTypeDisplay,
            nodes: nodesByColumn[columnOrder[index]] || []
          }
        })
      }

      case 2: {
        const workflowType = ['activity', 'course', 'program'].indexOf(
          this.props.workflow.type
        )
        const taskOrdered = this.props.renderer.taskChoices.filter(
          (x) =>
            x.type == 0 ||
            (x.type > 100 * workflowType && x.type < 100 * (workflowType + 1))
        )
        const nodesByTask = {}
        for (let i = 0; i < nodesOrdered.length; i++) {
          const node = nodesOrdered[i]
          Utility.pushOrCreate(nodesByTask, node.taskClassification, node.id)
        }
        return taskOrdered.map((task) => {
          return { title: task.name, nodes: nodesByTask[task.type] || [] }
        })
      }

      case 3: {
        const workflowType = ['activity', 'course', 'program'].indexOf(
          this.props.workflow.type
        )
        const contextOrdered = this.props.renderer.contextChoices.filter(
          (x) =>
            x.type == 0 ||
            (x.type > 100 * workflowType && x.type < 100 * (workflowType + 1))
        )
        const nodesByContext = {}
        for (let i = 0; i < nodesOrdered.length; i++) {
          const node = nodesOrdered[i]
          Utility.pushOrCreate(
            nodesByContext,
            node.contextClassification,
            node.id
          )
        }
        return contextOrdered.map((context) => {
          return {
            title: context.name,
            nodes: nodesByContext[context.type] || []
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

    const outcomesSorted = this.getOutcomesSorted()

    let hasNodes = false
    for (let i = 0; i < nodecategory.length; i++) {
      if (nodecategory[i].nodes.length > 0) {
        hasNodes = true
        break
      }
    }

    if (outcomesSorted.length === 0 || !hasNodes) {
      let text
      if (this.context.workflowView === WorkflowViewType.OUTCOME_TABLE) {
        text = _t(
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
              objectId={node}
            />
          ))}
        </div>
      ))

      const outcomes = outcomesSorted.map((category) => (
        <div>
          {this.props?.objectSets?.length > 0 && (
            <div className="outcome-row outcome-category">
              <div className="outcome-head">
                <h4>{category.objectset.title}</h4>
              </div>
            </div>
          )}
          {category.outcomes.map((outcome) => (
            <OutcomeBase
              key={outcome}
              objectId={outcome}
              nodecategory={nodecategory}
              type="outcome_table"
              //outcome_type={'asdf'}
            />
          ))}
        </div>
      ))

      return (
        <div className="workflow-details">
          <OutcomeLegend
          //  outcomesType={this.props.workflow.outcomesType} @todo this was supplied by redux
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
