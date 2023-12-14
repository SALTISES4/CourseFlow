import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'
import SimpleOutcome from './SimpleOutcome.js'
import { getOutcomeOutcomeByID } from '@cfFindState'

/**
 * Basic component representing an outcome to outcome
 * link for a simple non-editable block
 */
export class SimpleOutcomeOutcomeUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcomeoutcome'
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getChildType() {
    let data = this.props.data
    return (
      <SimpleOutcome
        objectID={data.child}
        parentID={this.props.parentID}
        throughParentID={data.id}
        comments={this.props.comments}
        edit={this.props.edit}
        renderer={this.props.renderer}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data

    return (
      <div className="outcome-outcome" id={data.id} ref={this.maindiv}>
        {this.getChildType()}
      </div>
    )
  }
}

const mapOutcomeOutcomeStateToProps = (state, own_props) =>
  getOutcomeOutcomeByID(state, own_props.objectID)
const SimpleOutcomeOutcome = connect(
  mapOutcomeOutcomeStateToProps,
  null
)(SimpleOutcomeOutcomeUnconnected)

export default SimpleOutcomeOutcome
