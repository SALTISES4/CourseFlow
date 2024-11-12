import { CfObjectType } from '@cf/types/enum'
import { TOutcomeOutcomeByID, getOutcomeOutcomeById } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

import Outcome from './Outcome'

/**
 * The link between an outcome and its children
 */
type ConnectedProps = TOutcomeOutcomeByID
type OwnProps = {
  parentId: number
  objectId: number
  // renderer: any
  showHorizontal: any
  parentDepth: any
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
    let myClass = 'outcome-outcome outcome-outcome-' + this.props.parentDepth
    // @ts-ignore
    if (data.noDrag) {
      myClass += ' no-drag'
    }

    //Child outcomes. See comment in models/outcome.py for more info.
    return (
      <li
        className={myClass}
        id={String(data.id)}
        // ref={this.mainDiv} // @todo verify but this was not used
        data-child-id={data.child}
      >
        <Outcome
          objectId={data.child}
          parentId={this.props.parentId}
          throughParentId={data.id}
          // renderer={this.props.renderer}
          showHorizontal={this.props.showHorizontal}
        />
      </li>
    )
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TOutcomeOutcomeByID => {
  return getOutcomeOutcomeById(state, ownProps.objectId)
}

const OutcomeOutcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(OutcomeOutcomeUnconnected)

export default OutcomeOutcome
