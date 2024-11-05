import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum.js'
import { _t } from '@cf/utility/utilityFunctions'
import * as Utility from '@cf/utility/utilityFunctions'
import { getSortedOutcomeIDFromOutcomeWorkflowSet } from '@cfFindState'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import { AppState } from '@cfRedux/types/type'
import NodeOutcomeView from '@cfViews/WorkflowView/componentViews/OutcomeOverviewView/common/NodeOutcomeView'
import OutcomeBase from '@cfViews/WorkflowView/componentViews/OutcomeOverviewView/OutcomeTableView/components/OutcomeBase'
import OutcomeLegend from '@cfViews/WorkflowView/componentViews/OutcomeOverviewView/OutcomeTableView/components/OutcomeLegend'
import * as React from 'react'
import { connect } from 'react-redux'

import MatrixNode from './MatrixNode'
import MatrixWeek from './MatrixWeek'

const GrandTotals = ({ totals }) => {
  return (
    <div className="matrix-time-row">
      <div className="total-cell grand-total-cell table-cell blank"></div>
      <div className="total-cell grand-total-cell table-cell">
        {totals.generalEducation}
      </div>
      <div className="total-cell grand-total-cell table-cell">
        {totals.specificEducation}
      </div>
      <div className="total-cell grand-total-cell table-cell">
        {totals.generalEducation + totals.specificEducation}
      </div>
      <div className="total-cell grand-total-cell table-cell blank"></div>
      <div className="total-cell grand-total-cell table-cell">
        {totals.totalTheory}
      </div>
      <div className="total-cell grand-total-cell table-cell">
        {totals.totalPractical}
      </div>
      <div className="total-cell grand-total-cell table-cell">
        {totals.totalIndividual}
      </div>
      <div className="total-cell grand-total-cell table-cell">
        {totals.totalTime}
      </div>
      <div className="total-cell grand-total-cell table-cell">
        {totals.totalRequired}
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
  weekworkflowOrder: any // @todo why isn't this set, does it exist?
  // weekworkflowOrder: AppState['weekworkflowSet'] // @todo why isn't this set, does it exist?
  outcomesSort: any // @todo why isn't this set, does it exist?
  // outcomesSort: AppState['outcomesSort'] // @todo why isn't this set, does it exist?
  // outcomeworkflowOrder: AppState['outcomeworkflowOrder'] // @todo why isn't this set, does it exist?
  outcomeworkflowOrder: any
  outcomeworkflows: AppState['outcomeworkflow']
  outcomes: AppState['outcome']
}
type OwnProps = {
  objectId?: number
  objectset?: any // is this not from store ?
  viewType?: WorkflowViewType // @todo can this just come from context?
}
type PropsType = ConnectedProps & OwnProps

/**
 * The component for the competency matrix view of the
 * workflow.
 */
class CompetencyMatrixViewUnconnected extends React.Component<PropsType> {
  static contextType = WorkflowConfigContext

  declare context: React.ContextType<typeof WorkflowConfigContext>
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
      this.props.outcomeworkflowOrder,
      this.props.objectSets
    )
  }

  getNodecategory() {
    const weekOrder = Utility.filterThenSortByID(
      this.props.weekworkflows,
      this.props.weekworkflowOrder
    ).map((weekworkflow) => weekworkflow.week)

    const weeksOrdered = Utility.filterThenSortByID(
      this.props.weeks,
      weekOrder
    )

    const nodeweekOrder = [].concat(
      ...weeksOrdered.map((week) => week.nodeweekSet)
    )

    let nodeweeksOrdered = Utility.filterThenSortByID(
      this.props.nodeweeks,
      nodeweekOrder
    )

    const nodeOrder = nodeweeksOrdered.map((nodeweek) => nodeweek.node)
    const nodesOrdered = Utility.filterThenSortByID(
      this.props.nodes,
      nodeOrder
    ).filter((node) => !Utility.checkSetHidden(node, this.props.objectSets))

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
        id: week.id,
        nodes: nodesByWeek[week.id] || []
      }
    })
  }

  getTotals(): {
    totalTheory: number
    totalPractical: number
    totalIndividual: number
    totalRequired: number
    totalTime: number
    generalEducation: number
    specificEducation: number
  } {
    const nodesData = this.props.nodes.filter(
      // @todo is this objectset different approach than in state
      (node) => !Utility.checkSetHidden(node, this.props.objectset)
    )

    const linkedWfData = nodesData.map((node) => {
      if (node.representsWorkflow) {
        return {
          ...node,
          // @ts-ignore
          ...node.linkedWorkflowData
        }
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

    const totalTheory = linkedWfData.reduce(
      (previousValue, currentValue) => {
        if (currentValue && currentValue.ponderationTheory) {
          return previousValue + currentValue.ponderationTheory
        }
        return previousValue
      },
      0
    )

    const totalPractical = linkedWfData.reduce(
      (previousValue, currentValue) => {
        if (currentValue && currentValue.ponderationPractical) {
          return previousValue + currentValue.ponderationPractical
        }
        return previousValue
      },
      0
    )

    const totalIndividual = linkedWfData.reduce(
      (previousValue, currentValue) => {
        if (currentValue && currentValue.ponderationIndividual) {
          return previousValue + currentValue.ponderationIndividual
        }
        return previousValue
      },
      0
    )

    const totalTime = totalTheory + totalPractical + totalIndividual
    const totalRequired = linkedWfData.reduce(
      (previousValue, currentValue) => {
        if (currentValue && currentValue.timeRequired) {
          return previousValue + parseFloat(currentValue.timeRequired)
        }
        return previousValue
      },
      0
    )

    return {
      totalTheory: totalTheory,
      totalPractical: totalPractical,
      totalIndividual: totalIndividual,
      totalRequired: totalRequired,
      totalTime: totalTime,
      generalEducation: generalEducation,
      specificEducation: specificEducation
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

    let hasNodes = false
    for (let i = 0; i < nodecategory.length; i++) {
      if (nodecategory[i].nodes.length > 0) {
        hasNodes = true
        break
      }
    }

    if (outcomesSorted.length == 0 || !hasNodes) {
      const text =
        this.context.workflowView == WorkflowViewType.OUTCOME_TABLE
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

      const blankLine = nodecategory.map((nodecategory) => (
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
                <div className="outcome-cells">{blankLine}</div>
                <div className="table-cell blank-cell"></div>
                <div className="table-cell blank-cell total-cell grand-total-cell"></div>
              </div>
            )
          }
          {category.outcomes.map((outcome) => (
            <OutcomeBase
              key={outcome}
              objectId={outcome}
              nodecategory={nodecategory}
              type="competency_matrix"
            />
          ))}
        </div>
      ))
      const blankRow = Array(10).fill(
        <div className="table-cell empty-cell"></div>
      )

      const weeks = nodecategory.map((category) => (
        <div className="matrix-time-week">
          <MatrixWeek objectId={category.id} />
          {category.nodes.map((node) => (
            <MatrixNode objectId={node} />
          ))}
          <div className="matrix-time-row">{blankRow}</div>
        </div>
      ))

      const totals = this.getTotals()

      return (
        <div className="workflow-details">
          <OutcomeLegend />
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

const mapStateToProps = (state: AppState): ConnectedProps => {
  return {
    weekworkflows: state.weekworkflow,
    weeks: state.week,
    nodeweeks: state.nodeweek,
    nodes: state.node,
    objectSets: state.objectset,
    weekworkflowOrder: state.workflow.weekworkflowSet,
    outcomesSort: state.workflow.outcomesSort,
    outcomeworkflowOrder: state.workflow.outcomeworkflowSet,
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
