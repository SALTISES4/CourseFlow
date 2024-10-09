import { AppState } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import Outcome from '@cfViews/WorkflowView/componentViews/OutcomeEditView/Outcome'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/update'
import * as React from 'react'
import { connect } from 'react-redux'

import AlignmentHorizontalReverseParentOutcome from './AlignmentHorizontalReverseParentOutcome'
import OutcomeAdder from './OutcomeAdder'

type ConnectedProps = {
  data: any
  outcomenodes: any[]
  horizontal_links: any[]
  all_horizontal_link_outcomes: any[]
}

type OwnProps = {
  node_data: any
  objectId: any
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
    const parentOutcomes = this.props.horizontal_links.map(
      (horizontal_link) => {
        for (let i = 0; i < this.props.outcomenodes.length; i++) {
          if (
            this.props.outcomenodes[i].outcome == horizontal_link.parentOutcome
          ) {
            if (
              this.props.restriction_set &&
              this.props.restriction_set.parentOutcomes &&
              this.props.restriction_set.parentOutcomes.indexOf(
                this.props.outcomenodes[i].outcome
              ) == -1
            )
              return null
            return (
              <AlignmentHorizontalReverseParentOutcome
                child_outcome={this.props.objectId}
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
      this.props.restriction_set.parentOutcomes
    ) {
      outcome_restriction = outcome_restriction
        .filter(
          (oc) => this.props.restriction_set.parentOutcomes.indexOf(oc) >= 0
        )
        .sort(
          (a, b) =>
            this.props.restriction_set.parentOutcomes.indexOf(a) -
            this.props.restriction_set.parentOutcomes.indexOf(b)
        )
    }

    return (
      <div className="child-outcome">
        <div className="half-width alignment-column">
          <Outcome
            objectId={data?.id}
            // comments={true} // @todo not inside component
            // edit={true} // @todo not inside component
            // renderer={this.props.renderer}
          />
        </div>
        <div className="half-width alignment-column">
          {parentOutcomes}
          <div className="alignment-row">
            <OutcomeAdder
              // renderer={this.props.renderer}
              outcome_set={outcome_restriction}
              addFunction={updateOutcomehorizontallinkDegree.bind(
                this,
                this.props.objectId
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
  const outcome = findOutcomeById(state.outcome, ownProps.objectId)

  if (outcome) {
    const allowedOutcomenodes = Utility.filterThenSortByID(
      state.outcomenode,
      ownProps.node_data.outcomenodeSet
    )

    const allowedHorizontalLinks = Utility.filterThenSortByID(
      state.outcomehorizontallink,
      outcome.outcomeHorizontalLinksUnique
    )

    const horizontalLinkOutcomes = Utility.filterThenSortByID(
      state.outcomehorizontallink,
      outcome.outcomeHorizontalLinks
    ).map((hl) => hl.parentOutcome)

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
