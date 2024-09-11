import { CfObjectType } from '@cf/types/enum'
import { TOutcomeOutcomeByID, getOutcomeOutcomeByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

import Outcome from './Outcome'

/**
 * The link between an outcome and its children
 */
type ConnectedProps = TOutcomeOutcomeByID
type OwnProps = {
  parentID: number
  objectId: number
  // renderer: any
  show_horizontal: any
  parent_depth: any
}
type PropsType = OwnProps & ConnectedProps
class OutcomeOutcomeUnconnected extends React.Component<PropsType> {
  private objectType: CfObjectType // @todo is it used?
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.OUTCOMEOUTCOME // @todo check addEditable
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let my_class = 'outcome-outcome outcome-outcome-' + this.props.parent_depth
    // @ts-ignore
    if (data.no_drag) my_class += ' no-drag'

    //Child outcomes. See comment in models/outcome.py for more info.
    return (
      <li
        className={my_class}
        id={String(data.id)}
        // ref={this.mainDiv} // @todo verify but this was not used
        data-child-id={data.child}
      >
        <Outcome
          objectId={data.child}
          parentID={this.props.parentID}
          throughParentID={data.id}
          // renderer={this.props.renderer}
          show_horizontal={this.props.show_horizontal}
        />
      </li>
    )
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TOutcomeOutcomeByID => {
  return getOutcomeOutcomeByID(state, ownProps.objectId)
}

const OutcomeOutcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(OutcomeOutcomeUnconnected)

export default OutcomeOutcome
