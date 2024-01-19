import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import { getDescendantOutcomes } from '@cfFindState'
import AlignmentHorizontalReverseWeek from './AlignmentHorizontalReverseWeek'
import { AppState } from '@cfRedux/type'

type ConnectedProps = ConnectedType
type OwnProps = {
  sort: string
  data: any
  base_outcomes: any
}
type StateProps = {}
type PropsType = ConnectedProps & OwnProps

/**
 * The main block that shows the horizontal outcome links. 'Reverse' because
 * it shows the child outcomes on the left, and their tagged parent outcomes
 * on the right (we originally did this the other way around)
 */
class AlignmentHorizontalReverseBlockUnconnected extends React.Component<
  PropsType,
  StateProps
> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const weekworkflows = this.props.weekworkflows.map((weekworkflow) => {
      const week = weekworkflow.weekworkflow.week
      if (
        this.props.restriction_set &&
        this.props.restriction_set.weeks &&
        this.props.restriction_set.weeks.indexOf(week) == -1
      )
        return null
      const week_rank = weekworkflow.rank

      const week_component = (
        <AlignmentHorizontalReverseWeek
          week_rank={week_rank}
          objectID={week}
          // renderer={this.props.renderer}
          restriction_set={this.props.restriction_set}
        />
      )

      return <div className="week-workflow">{week_component}</div>
    })

    return (
      <div className="alignment-block">
        <h3>Alignment:</h3>
        {weekworkflows}
      </div>
    )
  }
}

type ConnectedType = {
  weekworkflows: any
  restriction_set: {
    weeks: number[]
    nodes: number[]
    parent_outcomes: number[]
    child_outcomes: number[]
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedType => {
  const weekworkflows = Utility.filterThenSortByID(
    state.weekworkflow,
    state.workflow.weekworkflow_set
  ).map((weekworkflow) => ({
    weekworkflow: weekworkflow,
    rank: state.workflow.weekworkflow_set.indexOf(weekworkflow.id)
  }))

  if (ownProps.sort == 'outcome') {
    const base_outcome = ownProps.data
    const allowed_outcome_ids = [base_outcome.id]

    getDescendantOutcomes(state, base_outcome, allowed_outcome_ids)

    // @todo not used
    // const allowed_outcomes = state.outcome.filter((outcome) =>
    //   allowed_outcome_ids.includes(outcome.id)
    // )

    const allowed_child_outcome_ids_from_outcomes = state.outcomehorizontallink
      .filter((hl) => allowed_outcome_ids.indexOf(hl.parent_outcome) >= 0)
      .map((hl) => hl.outcome)

    const allowed_child_outcome_ids = state.outcome
      .filter(
        (outcome) =>
          allowed_child_outcome_ids_from_outcomes.indexOf(outcome.id) >= 0
      )
      .filter((outcome) => !Utility.checkSetHidden(outcome, state.objectset))
      .map((outcome) => outcome.id)

    const allowed_node_ids_from_outcomes = state.outcomenode
      .filter((outcomenode) =>
        allowed_outcome_ids.includes(outcomenode.outcome)
      )
      .map((outcomenode) => outcomenode.node)

    const allowed_node_ids = state.node
      .filter((node) => allowed_node_ids_from_outcomes.indexOf(node.id) >= 0)
      .filter((node) => !Utility.checkSetHidden(node, state.objectset))
      .map((node) => node.id)

    const nodeweeks = state.nodeweek.filter((nodeweek) =>
      allowed_node_ids.includes(nodeweek.node)
    )
    const allowed_week_ids = nodeweeks.map((nodeweek) => nodeweek.week)

    return {
      weekworkflows: weekworkflows,
      restriction_set: {
        weeks: allowed_week_ids,
        nodes: allowed_node_ids,
        parent_outcomes: allowed_outcome_ids,
        child_outcomes: allowed_child_outcome_ids
      }
    }
  } else if (ownProps.sort == 'week') {
    const allowed_outcome_ids = []

    const allowed_node_ids = state.node
      .filter((node) => !Utility.checkSetHidden(node, state.objectset))
      .map((node) => node.id)

    const allowed_child_outcome_ids = state.outcome
      .filter((outcome) => !Utility.checkSetHidden(outcome, state.objectset))
      .map((outcome) => outcome.id)

    for (let i = 0; i < ownProps.base_outcomes.length; i++) {
      for (let j = 0; j < ownProps.base_outcomes[i].outcomes.length; j++) {
        allowed_outcome_ids.push(ownProps.base_outcomes[i].outcomes[j].data.id)
        getDescendantOutcomes(
          state,
          ownProps.base_outcomes[i].outcomes[j].data,
          allowed_outcome_ids
        )
      }
    }

    return {
      weekworkflows: weekworkflows,
      restriction_set: {
        weeks: [ownProps.data.id],
        nodes: allowed_node_ids,
        parent_outcomes: allowed_outcome_ids,
        child_outcomes: allowed_child_outcome_ids
      }
    }
  }
}

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(AlignmentHorizontalReverseBlockUnconnected)
