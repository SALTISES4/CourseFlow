import * as React from 'react'
import { connect } from 'react-redux'
import Outcome from './Outcome'
import { getOutcomeOutcomeByID } from '@cfFindState'

/**
 * The link between an outcome and its children
 */
class OutcomeOutcomeUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcomeoutcome'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let my_class = 'outcome-outcome outcome-outcome-' + this.props.parent_depth
    if (data.no_drag) my_class += ' no-drag'

    return (
      <li
        className={my_class}
        id={data.id}
        ref={this.maindiv}
        data-child-id={data.child}
      >
        <Outcome
          objectID={data.child}
          parentID={this.props.parentID}
          throughParentID={data.id}
          renderer={this.props.renderer}
          show_horizontal={this.props.show_horizontal}
        />
      </li>
    )
  }
}
const mapOutcomeOutcomeStateToProps = (state, own_props) =>
  getOutcomeOutcomeByID(state, own_props.objectID)
const OutcomeOutcome = connect(
  mapOutcomeOutcomeStateToProps,
  null
)(OutcomeOutcomeUnconnected)

export default OutcomeOutcome
