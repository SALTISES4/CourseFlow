import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum.js'
import { _t } from '@cf/utility/utilityFunctions'
import { getSortedOutcomeIDFromOutcomeWorkflowSet } from '@cfFindState'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import { AppState } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import NodeOutcomeView from '@cfViews/components/Node/NodeOutcomeView'
import OutcomeBase from '@cfViews/WorkflowView/componentViews/OutcomeTableView/components/OutcomeBase'
import OutcomeLegend from '@cfViews/WorkflowView/componentViews/OutcomeTableView/components/OutcomeLegend'
import * as React from 'react'
import { connect } from 'react-redux'

import MatrixNode from './MatrixNode'
import MatrixWeek from './MatrixWeek'

const GrandTotals = ({ totals }) => {
  return (
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
}

type ConnectedProps = {
  weekworkflows: AppState['weekworkflow']
  weeks: AppState['week']
  nodeweeks: AppState['nodeweek']
  nodes: AppState['node']
  objectSets: AppState['objectset']
  weekworkflow_order: any // @todo why isn't this set, does it exist?
  // weekworkflow_order: AppState['weekworkflowSet'] // @todo why isn't this set, does it exist?
  outcomesSort: any // @todo why isn't this set, does it exist?
  // outcomesSort: AppState['outcomesSort'] // @todo why isn't this set, does it exist?
  // outcomeworkflow_order: AppState['outcomeworkflow_order'] // @todo why isn't this set, does it exist?
  outcomeworkflow_order: any
  outcomeworkflows: AppState['outcomeworkflow']
  outcomes: AppState['outcome']
}
type OwnProps = {
  objectId?: number
  outcomesType?: any
  objectset?: any // is this not from store ?
  viewType?: WorkflowViewType // @todo can this just come from context?
}
type PropsType = ConnectedProps & OwnProps

/**
 * The component for the competency matrix view of the
 * workflow.
 */
class CompetencyMatrixViewUnconnected extends React.Component<PropsType> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>
  // private nodecategory_json: string
  private objectType: CfObjectType

  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WORKFLOW
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getOutcomesSorted() {
    return getSortedOutcomeIDFromOutcomeWorkflowSet(
      this.props.outcomes,
      this.props.outcomeworkflows,
      this.props.outcomeworkflow_order,
      this.props.objectSets
    )
  }

  getNodecategory() {
    const week_order = Utility.filterThenSortByID(
      this.props.weekworkflows,
      this.props.weekworkflow_order
    ).map((weekworkflow) => weekworkflow.week)

    const weeks_ordered = Utility.filterThenSortByID(
      this.props.weeks,
      week_order
    )

    const nodeweek_order = [].concat(
      ...weeks_ordered.map((week) => week.nodeweekSet)
    )

    let nodeweeks_ordered = Utility.filterThenSortByID(
      this.props.nodeweeks,
      nodeweek_order
    )

    const node_order = nodeweeks_ordered.map((nodeweek) => nodeweek.node)
    const nodes_ordered = Utility.filterThenSortByID(
      this.props.nodes,
      node_order
    ).filter((node) => !Utility.checkSetHidden(node, this.props.objectSets))

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
        title: week.title || week.weekTypeDisplay + ' ' + (index + 1),
        id: week.id,
        nodes: nodes_by_week[week.id] || []
      }
    })
  }

  getTotals(): {
    total_theory: number
    total_practical: number
    total_individual: number
    total_required: number
    total_time: number
    general_education: number
    specific_education: number
  } {
    const nodes_data = this.props.nodes.filter(
      // @todo is this objectset different approach than in state
      (node) => !Utility.checkSetHidden(node, this.props.objectset)
    )

    const linked_wf_data = nodes_data.map((node) => {
      if (node.representsWorkflow)
        return {
          ...node,
          // @ts-ignore
          ...node.linkedWorkflowData
        }
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

    const total_theory = linked_wf_data.reduce(
      (previousValue, currentValue) => {
        if (currentValue && currentValue.ponderationTheory)
          return previousValue + currentValue.ponderationTheory
        return previousValue
      },
      0
    )

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
      total_theory: total_theory,
      total_practical: total_practical,
      total_individual: total_individual,
      total_required: total_required,
      total_time: total_time,
      general_education: general_education,
      specific_education: specific_education
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const nodecategory = this.getNodecategory()
    // const nodecategory_json = JSON.stringify(nodecategory)

    // caching hack
    // if (this.nodecategory_json == nodecategory_json)
    //   nodecategory = this.nodecategory
    // else {
    //   this.nodecategory = nodecategory
    //   this.nodecategory_json = nodecategory_json
    // }

    const outcomesSorted = this.getOutcomesSorted()

    const TimeHeader = (
      <div className="matrix-time-row">
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">
            <h4>{_t('Hours')}</h4>
          </div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{_t('General Education')}</div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{_t('Specific Education')}</div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{_t('Total Hours')}</div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">
            <h4>{_t('Ponderation')}</h4>
          </div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{_t('Theory')}</div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{_t('Practical')}</div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{_t('Individual Work')}</div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{_t('Total')}</div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{_t('Credits')}</div>
        </div>
      </div>
    )

    let has_nodes = false
    for (let i = 0; i < nodecategory.length; i++) {
      if (nodecategory[i].nodes.length > 0) {
        has_nodes = true
        break
      }
    }

    if (outcomesSorted.length == 0 || !has_nodes) {
      const text =
        this.context.workflowView == WorkflowViewType.OUTCOMETABLE
          ? _t(
              'This view renders a table showing the relationships between nodes and outcomes. Add outcomes and nodes to the workflow to get started.'
            )
          : _t(
              "This view renders a table showing the relationships between this workflow's outcomes and the outcomes of their linked workflows. To use this feature, you must link the nodes in this workflow to child workflows (ex. program nodes to course workflows) and ensure that those child workflows have their own sets of outcomes."
            )

      return <div className="emptytext">{text}</div>
    } else {
      const nodes = nodecategory.map((nodecategory) => (
        <div className="table-group">
          <div className="table-cell nodewrapper blank-cell"></div>
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

      const blank_line = nodecategory.map((nodecategory) => (
        <div className="table-group">
          <div className="table-cell blank-cell"></div>
          <div className="table-cell total-cell blank-cell"></div>
          {nodecategory.nodes.map((node) => (
            <div className="table-cell nodewrapper blank-cell"></div>
          ))}
        </div>
      ))

      const outcomes = outcomesSorted.map((category) => (
        <div className="table-body">
          {
            // @todo should this be set?
            // @ts-ignore
            this.props?.objectSets?.length > 0 && (
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
            )
          }
          {category.outcomes.map((outcome) => (
            <OutcomeBase
              key={outcome}
              // renderer={this.props.renderer}
              objectId={outcome}
              nodecategory={nodecategory}
              outcome_type={this.props.outcomesType}
              type="competency_matrix"
            />
          ))}
        </div>
      ))
      const blank_row = Array(10).fill(
        <div className="table-cell empty-cell"></div>
      )

      const weeks = nodecategory.map((category) => (
        <div className="matrix-time-week">
          <MatrixWeek objectId={category.id} />
          {category.nodes.map((node) => (
            <MatrixNode objectId={node} />
          ))}
          <div className="matrix-time-row">{blank_row}</div>
        </div>
      ))

      const totals = this.getTotals()

      return (
        <div className="workflow-details">
          <OutcomeLegend outcomesType={this.props.outcomesType} />
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
              {TimeHeader}
              {weeks}
              <GrandTotals totals={totals} />
            </div>
          </div>
        </div>
      )
    }
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return {
    weekworkflows: state.weekworkflow,
    weeks: state.week,
    nodeweeks: state.nodeweek,
    nodes: state.node,
    objectSets: state.objectset,
    weekworkflow_order: state.workflow.weekworkflowSet,
    outcomesSort: state.workflow.outcomesSort,
    outcomeworkflow_order: state.workflow.outcomeworkflowSet,
    outcomeworkflows: state.outcomeworkflow,
    outcomes: state.outcome
  }
}
const CompetencyMatrixView = connect<
  ConnectedProps,
  object,
  OwnProps,
  AppState
>(
  mapStateToProps,
  null
)(CompetencyMatrixViewUnconnected)

export default CompetencyMatrixView
