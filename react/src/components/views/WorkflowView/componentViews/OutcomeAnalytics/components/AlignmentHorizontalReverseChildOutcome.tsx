import * as Utility from '@cf/utility/utilityFunctions'
import { AppState } from '@cfRedux/types/type'
import Outcome from '@cfViews/WorkflowView/componentViews/OutcomeEditView/Outcome'
import { updateOutcomehorizontallinkDegree } from '@XMLHTTP/API/update'
import * as React from 'react'
import { connect } from 'react-redux'

import AlignmentHorizontalReverseParentOutcome from './AlignmentHorizontalReverseParentOutcome'
import OutcomeAdder from './OutcomeAdder'

type ConnectedProps = {
  data: any
  outcomenodes: any[]
  horizontalLinks: any[]
  allHorizontalLinkOutcomes: any[]
}

type OwnProps = {
  nodeData: any
  objectId: any
  restrictionSet: any
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
    const parentOutcomes = this.props.horizontalLinks.map((horizontalLink) => {
      for (let i = 0; i < this.props.outcomenodes.length; i++) {
        if (
          this.props.outcomenodes[i].outcome == horizontalLink.parentOutcome
        ) {
          if (
            this.props.restrictionSet &&
            this.props.restrictionSet.parentOutcomes &&
            this.props.restrictionSet.parentOutcomes.indexOf(
              this.props.outcomenodes[i].outcome
            ) == -1
          ) {
            return null
          }
          return (
            <AlignmentHorizontalReverseParentOutcome
              childOutcome={this.props.objectId}
              outcomenode={this.props.outcomenodes[i]}
              // renderer={this.props.renderer}
            />
          )
        }
      }
      return null
    })

    let outcomeRestriction = this.props.outcomenodes
      .filter(
        (ocn) => this.props.allHorizontalLinkOutcomes.indexOf(ocn.outcome) == -1
      )
      .map((ocn) => ocn.outcome)
    if (this.props.restrictionSet && this.props.restrictionSet.parentOutcomes) {
      outcomeRestriction = outcomeRestriction
        .filter(
          (oc) => this.props.restrictionSet.parentOutcomes.indexOf(oc) >= 0
        )
        .sort(
          (a, b) =>
            this.props.restrictionSet.parentOutcomes.indexOf(a) -
            this.props.restrictionSet.parentOutcomes.indexOf(b)
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
              outcomeSet={outcomeRestriction}
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
      ownProps.nodeData.outcomenodeSet
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
      horizontalLinks: allowedHorizontalLinks,
      allHorizontalLinkOutcomes: horizontalLinkOutcomes
    }
  }

  // Handle the case where no outcome is found
  return {
    data: null,
    outcomenodes: [],
    horizontalLinks: [],
    allHorizontalLinkOutcomes: []
  }
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(AlignmentHorizontalReverseChildOutcomeUnconnected)
