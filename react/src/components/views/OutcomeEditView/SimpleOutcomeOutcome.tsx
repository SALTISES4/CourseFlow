// @ts-nocheck
import * as React from 'react'
import { connect } from 'react-redux'
import SimpleOutcome from './SimpleOutcome'
import { getOutcomeOutcomeByID } from '@cfFindState'
import { CfObjectType } from '@cfModule/types/enum'

/**
 * Basic component representing an outcome to outcome
 * link for a simple non-editable block
 */
export class SimpleOutcomeOutcomeUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = CfObjectType.OUTCOMEOUTCOME
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getChildType() {
    const data = this.props.data
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
    const data = this.props.data

    return (
      <div className="outcome-outcome" id={data.id} ref={this.mainDiv}>
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
