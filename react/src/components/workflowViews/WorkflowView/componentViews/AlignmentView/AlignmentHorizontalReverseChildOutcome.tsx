import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import AlignmentHorizontalReverseParentOutcome from './AlignmentHorizontalReverseParentOutcome'
import OutcomeAdder from './OutcomeAdder'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/update'
import { AppState } from '@cfRedux/types/type'
import Outcome from '@cfViews/WorkflowView/componentViews/OutcomeEditView/Outcome'

type ConnectedProps = {
  data: any
  outcomenodes: any[]
  horizontal_links: any[]
  all_horizontal_link_outcomes: any[]
}

type OwnProps = {
  node_data: any
  objectID: any
  restriction_set: any
}
// type StateProps = {}
type PropsType = ConnectedProps & OwnProps

/**
 * Shows the outcome from the child workflow in the alignment view, and the outcomes
 * from the parent workflow that have been tagged to it
 */

class AlignmentHorizontalReverseChildOutcomeUnconnected extends React.Component<PropsType> {
  // StateProps
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const parent_outcomes = this.props.horizontal_links.map(
      (horizontal_link) => {
        for (let i = 0; i < this.props.outcomenodes.length; i++) {
          if (
            this.props.outcomenodes[i].outcome == horizontal_link.parent_outcome
          ) {
            if (
              this.props.restriction_set &&
              this.props.restriction_set.parent_outcomes &&
              this.props.restriction_set.parent_outcomes.indexOf(
                this.props.outcomenodes[i].outcome
              ) == -1
            )
              return null
            return (
              <AlignmentHorizontalReverseParentOutcome
                child_outcome={this.props.objectID}
                outcomenode={this.props.outcomenodes[i]}
                // renderer={this.props.renderer}
              />
            )
          }
        }
        return null
      }
    )

    let outcome_restriction = this.props.outcomenodes
      .filter(
        (ocn) =>
          this.props.all_horizontal_link_outcomes.indexOf(ocn.outcome) == -1
      )
      .map((ocn) => ocn.outcome)
    if (
      this.props.restriction_set &&
      this.props.restriction_set.parent_outcomes
    ) {
      outcome_restriction = outcome_restriction
        .filter(
          (oc) => this.props.restriction_set.parent_outcomes.indexOf(oc) >= 0
        )
        .sort(
          (a, b) =>
            this.props.restriction_set.parent_outcomes.indexOf(a) -
            this.props.restriction_set.parent_outcomes.indexOf(b)
        )
    }

    return (
      <div className="child-outcome">
        <div className="half-width alignment-column">
          <Outcome
            objectID={data?.id}
            // comments={true} // @todo not inside component
            // edit={true} // @todo not inside component
            // renderer={this.props.renderer}
          />
        </div>
        <div className="half-width alignment-column">
          {parent_outcomes}
          <div className="alignment-row">
            <OutcomeAdder
              // renderer={this.props.renderer}
              outcome_set={outcome_restriction}
              addFunction={updateOutcomehorizontallinkDegree.bind(
                this,
                this.props.objectID
              )}
            />
          </div>
        </div>
      </div>
    )
  }
}

const findOutcomeById = (outcomes, id) => {
  return outcomes.find((outcome) => outcome.id === id)
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  const outcome = findOutcomeById(state.outcome, ownProps.objectID)

  if (outcome) {
    const allowedOutcomenodes = Utility.filterThenSortByID(
      state.outcomenode,
      ownProps.node_data.outcomenode_set
    )

    const allowedHorizontalLinks = Utility.filterThenSortByID(
      state.outcomehorizontallink,
      outcome.outcome_horizontal_links_unique
    )

    const horizontalLinkOutcomes = Utility.filterThenSortByID(
      state.outcomehorizontallink,
      outcome.outcome_horizontal_links
    ).map((hl) => hl.parent_outcome)

    return {
      data: outcome,
      outcomenodes: allowedOutcomenodes,
      horizontal_links: allowedHorizontalLinks,
      all_horizontal_link_outcomes: horizontalLinkOutcomes
    }
  }

  // Handle the case where no outcome is found
  return {
    data: null,
    outcomenodes: [],
    horizontal_links: [],
    all_horizontal_link_outcomes: []
  }
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(AlignmentHorizontalReverseChildOutcomeUnconnected)
