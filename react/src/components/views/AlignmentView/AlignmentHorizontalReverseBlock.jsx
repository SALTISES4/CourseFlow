import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import { getDescendantOutcomes } from '@cfFindState'
import AlignmentHorizontalReverseWeek from './AlignmentHorizontalReverseWeek'

/**
 * The main block that shows the horizontal outcome links. 'Reverse' because
 * it shows the child outcomes on the left, and their tagged parent outcomes
 * on the right (we originally did this the other way around)
 */
class AlignmentHorizontalReverseBlockUnconnected extends React.Component {
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

const mapAlignmentHorizontalReverseStateToProps = (state, own_props) => {
  const weekworkflows = Utility.filterThenSortByID(
    state.weekworkflow,
    state.workflow.weekworkflow_set
  ).map((weekworkflow) => ({
    weekworkflow: weekworkflow,
    rank: state.workflow.weekworkflow_set.indexOf(weekworkflow.id)
  }))

  if (own_props.sort == 'outcome') {
    const base_outcome = own_props.data
    const allowed_outcome_ids = [base_outcome.id]
    getDescendantOutcomes(state, base_outcome, allowed_outcome_ids)
    const allowed_outcomes = state.outcome.filter((outcome) =>
      allowed_outcome_ids.includes(outcome.id)
    )

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
  } else if (own_props.sort == 'week') {
    const allowed_outcome_ids = []

    const allowed_node_ids = state.node
      .filter((node) => !Utility.checkSetHidden(node, state.objectset))
      .map((node) => node.id)

    const allowed_child_outcome_ids = state.outcome
      .filter((outcome) => !Utility.checkSetHidden(outcome, state.objectset))
      .map((outcome) => outcome.id)

    for (let i = 0; i < own_props.base_outcomes.length; i++) {
      for (let j = 0; j < own_props.base_outcomes[i].outcomes.length; j++) {
        allowed_outcome_ids.push(own_props.base_outcomes[i].outcomes[j].data.id)
        getDescendantOutcomes(
          state,
          own_props.base_outcomes[i].outcomes[j].data,
          allowed_outcome_ids
        )
      }
    }

    return {
      weekworkflows: weekworkflows,
      restriction_set: {
        weeks: [own_props.data.id],
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
export default connect(
  mapAlignmentHorizontalReverseStateToProps,
  null
)(AlignmentHorizontalReverseBlockUnconnected)
