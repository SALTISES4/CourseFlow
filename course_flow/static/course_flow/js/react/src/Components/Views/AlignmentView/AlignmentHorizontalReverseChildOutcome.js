import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'
import { Outcome } from '../OutcomeEditView'
import { updateOutcomehorizontallinkDegree } from '@cfPostFunctions'
import * as Utility from '@cfUtility'
import AlignmentHorizontalReverseParentOutcome from './AlignmentHorizontalReverseParentOutcome.js'
import OutcomeAdder from './OutcomeAdder.js'

/**
 * Shows the outcome from the child workflow in the alignment view, and the outcomes
 * from the parent workflow that have been tagged to it
 */

class AlignmentHorizontalReverseChildOutcomeUnconnected extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let parent_outcomes = this.props.horizontal_links.map((horizontal_link) => {
      for (var i = 0; i < this.props.outcomenodes.length; i++) {
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
              renderer={this.props.renderer}
            />
          )
        }
      }
      return null
    })

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
            objectID={data.id}
            comments={true}
            edit={true}
            renderer={this.props.renderer}
          />
        </div>
        <div className="half-width alignment-column">
          {parent_outcomes}
          <div className="alignment-row">
            <OutcomeAdder
              renderer={this.props.renderer}
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

const mapAlignmentHorizontalReverseChildOutcomeStateToProps = (
  state,
  own_props
) => {
  for (var i = 0; i < state.outcome.length; i++) {
    if (state.outcome[i].id == own_props.objectID) {
      let outcome = state.outcome[i]
      let allowed_outcomenodes = Utility.filterThenSortByID(
        state.outcomenode,
        own_props.node_data.outcomenode_set
      )

      let allowed_horizontal_links = Utility.filterThenSortByID(
        state.outcomehorizontallink,
        outcome.outcome_horizontal_links_unique
      )
      let horizontal_link_outcomes = Utility.filterThenSortByID(
        state.outcomehorizontallink,
        outcome.outcome_horizontal_links
      ).map((hl) => hl.parent_outcome)
      return {
        data: outcome,
        outcomenodes: allowed_outcomenodes,
        horizontal_links: allowed_horizontal_links,
        all_horizontal_link_outcomes: horizontal_link_outcomes
      }
    }
  }
}
export default connect(
  mapAlignmentHorizontalReverseChildOutcomeStateToProps,
  null
)(AlignmentHorizontalReverseChildOutcomeUnconnected)
