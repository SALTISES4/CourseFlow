import Utility from '@cf/utility/Utility.class'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

// import { getDescendantOutcomes } from '@cfFindState'
import AlignmentHorizontalReverseWeek from './AlignmentHorizontalReverseWeek'

type ConnectedProps = ConnectedType
type OwnProps = {
  sort: string
  data: any
  baseOutcomes?: any
}
type PropsType = ConnectedProps & OwnProps

/**
 * The main block that shows the horizontal outcome links. 'Reverse' because
 * it shows the child outcomes on the left, and their tagged parent outcomes
 * on the right (we originally did this the other way around)
 */
class AlignmentHorizontalReverseBlockUnconnected extends React.Component<PropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const weekworkflows = this.props.weekworkflows.map(
      (weekworkflow, index) => {
        const week = weekworkflow.weekworkflow.week
        if (
          this.props.restrictionSet &&
          this.props.restrictionSet.weeks &&
          this.props.restrictionSet.weeks.indexOf(week) == -1
        ) {
          return null
        }
        const weekRank = weekworkflow.rank

        const weekComponent = (
          <AlignmentHorizontalReverseWeek
            weekRank={weekRank}
            objectId={week}
            // renderer={this.props.renderer}
            restrictionSet={this.props.restrictionSet}
          />
        )

        return (
          <div key={index} className="week-workflow">
            {weekComponent}
          </div>
        )
      }
    )

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
  restrictionSet: {
    weeks: number[]
    nodes: number[]
    parentOutcomes: number[]
    childOutcomes: number[]
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedType => {
  const weekworkflows = Utility.filterThenSortById(
    state.weekworkflow,
    state.workflow.weekworkflowSet
  ).map((weekworkflow) => ({
    weekworkflow: weekworkflow,
    rank: state.workflow.weekworkflowSet.indexOf(weekworkflow.id)
  }))

  if (ownProps.sort == 'outcome') {
    const baseOutcome = ownProps.data
    const allowedOutcomeIds = [baseOutcome.id]

    // getDescendantOutcomes(state, baseOutcome, allowedOutcomeIds)

    // @todo not used
    // const allowed_outcomes = state.outcome.filter((outcome) =>
    //   allowedOutcomeIds.includes(outcome.id)
    // )

    const allowedChildOutcomeIdsFromOutcomes = state.outcomehorizontallink
      .filter((hl) => allowedOutcomeIds.indexOf(hl.parentOutcome) >= 0)
      .map((hl) => hl.outcome)

    const allowedChildOutcomeIds = state.outcome
      .filter(
        (outcome) =>
          allowedChildOutcomeIdsFromOutcomes.indexOf(outcome.id) >= 0
      )
      .filter((outcome) => !Utility.checkSetHidden(outcome, state.objectset))
      .map((outcome) => outcome.id)

    const allowedNodeIdsFromOutcomes = state.outcomenode
      .filter((outcomenode) =>
        allowedOutcomeIds.includes(outcomenode.outcome)
      )
      .map((outcomenode) => outcomenode.node)

    const allowedNodeIds = state.node
      .filter((node) => allowedNodeIdsFromOutcomes.indexOf(node.id) >= 0)
      .filter((node) => !Utility.checkSetHidden(node, state.objectset))
      .map((node) => node.id)

    const nodeweeks = state.nodeweek.filter((nodeweek) =>
      allowedNodeIds.includes(nodeweek.node)
    )
    const allowedWeekIds = nodeweeks.map((nodeweek) => nodeweek.week)

    return {
      weekworkflows: weekworkflows,
      restrictionSet: {
        weeks: allowedWeekIds,
        nodes: allowedNodeIds,
        parentOutcomes: allowedOutcomeIds,
        childOutcomes: allowedChildOutcomeIds
      }
    }
  } else if (ownProps.sort == 'week') {
    const allowedOutcomeIds = []

    const allowedNodeIds = state.node
      .filter((node) => !Utility.checkSetHidden(node, state.objectset))
      .map((node) => node.id)

    const allowedChildOutcomeIds = state.outcome
      .filter((outcome) => !Utility.checkSetHidden(outcome, state.objectset))
      .map((outcome) => outcome.id)

    for (let i = 0; i < ownProps.baseOutcomes.length; i++) {
      for (let j = 0; j < ownProps.baseOutcomes[i].outcomes.length; j++) {
        allowedOutcomeIds.push(ownProps.baseOutcomes[i].outcomes[j].data.id)
        // getDescendantOutcomes(
        //   state,
        //   ownProps.baseOutcomes[i].outcomes[j].data,
        //   allowedOutcomeIds
        // )
      }
    }

    return {
      weekworkflows: weekworkflows,
      restrictionSet: {
        weeks: [ownProps.data.id],
        nodes: allowedNodeIds,
        parentOutcomes: allowedOutcomeIds,
        childOutcomes: allowedChildOutcomeIds
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
