import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import { getSortedOutcomeIDFromOutcomeWorkflowSet } from '@cfFindState'
import OutcomeBase from '@cfViews/OutcomeTableView/OutcomeBase'
import MatrixNode from './MatrixNode'
import MatrixWeek from './MatrixWeek'
import OutcomeLegend from '@cfViews/OutcomeTableView/OutcomeLegend'
import NodeOutcomeView from '@cfCommonComponents/workflow/Node/NodeOutcomeView'
import { CfObjectType, ViewType } from '@cfModule/types/enum.js'
import { AppState } from '@cfRedux/types/type'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'

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
  object_sets: AppState['objectset']
  weekworkflow_order: any // @todo why isn't this set, does it exist?
  // weekworkflow_order: AppState['weekworkflow_set'] // @todo why isn't this set, does it exist?
  outcomes_sort: any // @todo why isn't this set, does it exist?
  // outcomes_sort: AppState['outcomes_sort'] // @todo why isn't this set, does it exist?
  // outcomeworkflow_order: AppState['outcomeworkflow_order'] // @todo why isn't this set, does it exist?
  outcomeworkflow_order: any
  outcomeworkflows: AppState['outcomeworkflow']
  outcomes: AppState['outcome']
}
type OwnProps = {
  objectID?: number
  outcomes_type?: any
  objectset?: any // is this not from store ?
  view_type?: ViewType // @todo can this just come from context?
}
type PropsType = ConnectedProps & OwnProps

/**
 * The component for the competency matrix view of the
 * workflow.
 */
class CompetencyMatrixViewUnconnected extends React.Component<PropsType> {
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
      this.props.object_sets
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
      ...weeks_ordered.map((week) => week.nodeweek_set)
    )

    let nodeweeks_ordered = Utility.filterThenSortByID(
      this.props.nodeweeks,
      nodeweek_order
    )

    const node_order = nodeweeks_ordered.map((nodeweek) => nodeweek.node)
    const nodes_ordered = Utility.filterThenSortByID(
      this.props.nodes,
      node_order
    ).filter((node) => !Utility.checkSetHidden(node, this.props.object_sets))

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
        id: week.id,
        nodes: nodes_by_week[week.id] || []
      }
    })
  }

  getTotals(): {
    total_theory: any
    total_practical: any
    total_individual: any
    total_required: any
    total_time: any
    general_education: any
    specific_education: any
  } {
    const nodes_data = this.props.nodes.filter(
      // @todo is this objectset different approach than in state
      (node) => !Utility.checkSetHidden(node, this.props.objectset)
    )

    console.log('CompetencyMatrixView.tsx nodes_data for typing')
    console.log(nodes_data)
    const linked_wf_data = nodes_data.map((node) => {
      if (node.represents_workflow)
        return {
          ...node,
          // @ts-ignore
          ...node.linked_workflow_data
        }
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

    const total_theory = linked_wf_data.reduce(
      (previousValue, currentValue) => {
        if (currentValue && currentValue.ponderation_theory)
          return previousValue + currentValue.ponderation_theory
        return previousValue
      },
      0
    )

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

    const outcomes_sorted = this.getOutcomesSorted()

    const TimeHeader = (
      <div className="matrix-time-row">
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">
            <h4>{window.gettext('Hours')}</h4>
          </div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">
            {window.gettext('General Education')}
          </div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">
            {window.gettext('Specific Education')}
          </div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{window.gettext('Total Hours')}</div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">
            <h4>{window.gettext('Ponderation')}</h4>
          </div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{window.gettext('Theory')}</div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{window.gettext('Practical')}</div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">
            {window.gettext('Individual Work')}
          </div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{window.gettext('Total')}</div>
        </div>
        <div className="table-cell outcome-wrapper">
          <div className="outcome-head">{window.gettext('Credits')}</div>
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

    if (outcomes_sorted.length == 0 || !has_nodes) {
      const text =
        this.context.view_type == ViewType.OUTCOMETABLE
          ? window.gettext(
              'This view renders a table showing the relationships between nodes and outcomes. Add outcomes and nodes to the workflow to get started.'
            )
          : window.gettext(
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
              objectID={node}
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

      const outcomes = outcomes_sorted.map((category) => (
        <div className="table-body">
          {
            // @todo should this be set?
            // @ts-ignore
            this.props?.object_sets?.length > 0 && (
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
              objectID={outcome}
              nodecategory={nodecategory}
              outcome_type={this.props.outcomes_type}
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
          <MatrixWeek objectID={category.id} />
          {category.nodes.map((node) => (
            <MatrixNode objectID={node} />
          ))}
          <div className="matrix-time-row">{blank_row}</div>
        </div>
      ))

      const totals = this.getTotals()

      return (
        <div className="workflow-details">
          <OutcomeLegend
            // renderer={this.props.renderer}
            outcomes_type={this.props.outcomes_type}
          />
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
    object_sets: state.objectset,
    weekworkflow_order: state.workflow.weekworkflow_set,
    outcomes_sort: state.workflow.outcomes_sort,
    outcomeworkflow_order: state.workflow.outcomeworkflow_set,
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
