import * as React from 'react'
import { connect } from 'react-redux'
import Outcome from './Outcome'
import { getOutcomeOutcomeByID, OutcomeOutcomeByIDType } from '@cfFindState'
import { AppState } from '@cfRedux/type'

/**
 * The link between an outcome and its children
 */
type ConnectedProps = OutcomeOutcomeByIDType
type OwnProps = {
  parentID: number
  objectID: number
  renderer: any
  show_horizontal: any
  parent_depth: any
}
type PropsType = OwnProps & ConnectedProps
class OutcomeOutcomeUnconnected extends React.Component<PropsType> {
  constructor(props) {
    super(props)
    // this.objectType = 'outcomeoutcome' // @todo verify this is not used
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let my_class = 'outcome-outcome outcome-outcome-' + this.props.parent_depth
    // @ts-ignore
    if (data.no_drag) my_class += ' no-drag'

    return (
      <li
        className={my_class}
        id={String(data.id)}
        // ref={this.mainDiv} // @todo verify but this was not used
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

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): OutcomeOutcomeByIDType => {
  return getOutcomeOutcomeByID(state, ownProps.objectID)
}

const OutcomeOutcome = connect<
  ConnectedProps,
  NonNullable<unknown>,
  OwnProps,
  AppState
>(
  mapStateToProps,
  null
)(OutcomeOutcomeUnconnected)

export default OutcomeOutcome
