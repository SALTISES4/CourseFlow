import * as React from 'react'
import { connect } from 'react-redux'
import SimpleOutcome from './SimpleOutcome'
import { getOutcomeOutcomeByID, TOutcomeOutcomeByID } from '@cfFindState'
import { CfObjectType } from '@cfModule/types/enum'
import { AppState } from '@cfRedux/types/type'

type OwnProps = {
  objectID: number
  edit: any
  comments: any
  parentID: any
}

type ConnectedProps = TOutcomeOutcomeByID
type PropsType = OwnProps & ConnectedProps

/**
 * Basic component representing an outcome to outcome
 * link for a simple non-editable block
 */
export class SimpleOutcomeOutcomeUnconnected extends React.Component<PropsType> {
  private objectType: CfObjectType
  constructor(props: PropsType) {
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
        // renderer={this.props.renderer}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    return (
      /*<div className="outcome-outcome" id={data.id} ref={this.mainDiv}> this.mainDiv is not defined */
      <div className="outcome-outcome" id={String(data.id)}>
        {this.getChildType()}
      </div>
    )
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TOutcomeOutcomeByID => {
  return getOutcomeOutcomeByID(state, ownProps.objectID)
}
const SimpleOutcomeOutcome = connect(
  mapStateToProps,
  null
)(SimpleOutcomeOutcomeUnconnected)

export default SimpleOutcomeOutcome
