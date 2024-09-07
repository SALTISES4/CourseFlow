import { _t } from '@cf/utility/utilityFunctions'
import { OutcomeTitle } from '@cfComponents/UIPrimitives/Titles'
import {
  TGetOutcomeByID,
  TOutcomeOutcomeByID,
  getOutcomeByID,
  getOutcomeOutcomeByID
} from '@cfFindState'
import { AppState, TOutcomeOutcome } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

import {
  OutcomeBarOutcomePropsType,
  OutcomeBarOutcomeUnconnected
} from './OutcomeBarOutcome'

/**
 * Used for the parent outcome bar.
 */

type ParentOutcomeOutcomeConnectedProps = TOutcomeOutcomeByID

type ParentOutcomeOutcomeOwnProps = OutcomeBarOutcomePropsType
type ParentOutcomeOutcomePropsType = ParentOutcomeOutcomeOwnProps &
  ParentOutcomeOutcomeConnectedProps
class ParentOutcomeOutcomeUnconnected extends React.Component<ParentOutcomeOutcomePropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    //Child outcomes. See comment in models/outcome.py for more info.
    return (
      // <div className="outcome-outcome" id={data.id} ref={this.mainDiv}> // @todo this.mainDiv is not defined or used
      <div className="outcome-outcome" id={String(this.props.data.id)}>
        <ParentOutcome
          objectId={this.props.data.child} // @todo was data.child
          parentID={this.props.parentID}
          throughParentID={this.props.data.id}
          readOnly={this.props.readOnly}
          // renderer={this.props.renderer}
        />
      </div>
    )
  }
}
const mapParentOutcomeOutcomeStateToProps = (
  state: AppState,
  own_props: ParentOutcomeOutcomeOwnProps
): ParentOutcomeOutcomeConnectedProps => {
  return getOutcomeOutcomeByID(state, own_props.objectId)
}

const ParentOutcomeOutcome = connect<
  ParentOutcomeOutcomeConnectedProps,
  object,
  ParentOutcomeOutcomeOwnProps,
  AppState
>(
  mapParentOutcomeOutcomeStateToProps,
  null
)(ParentOutcomeOutcomeUnconnected)

/**
 * Used for the parent outcome bar.
 */

type ConnectedProps = TGetOutcomeByID & {
  nodes: any
  horizontaloutcomes: any
}

type OwnProps = OutcomeBarOutcomePropsType

type PropsType = ConnectedProps & OwnProps
class ParentOutcomeUnconnected extends OutcomeBarOutcomeUnconnected<PropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    //Child outcomes. See comment in models/outcome.py for more info.
    const children = data.child_outcome_links.map((item) => (
      <ParentOutcomeOutcome
        key={item}
        objectId={item}
        parentID={Number(data.id)}
        readOnly={this.props.readOnly}
        // renderer={this.props.renderer}
      />
    ))

    const dropIcon = this.state.is_dropped
      ? 'droptriangleup'
      : 'droptriangledown'

    let droptext

    if (this.state.is_dropped) {
      droptext = _t('hide')
    } else {
      droptext =
        _t('show ') +
        children.length +
        ' ' +
        window.ngettext('descendant', 'descendants', children.length)
    }

    return (
      <div
        className={
          'outcome' +
          ((this.state.is_dropped && ' dropped') || '') +
          ' outcome-' +
          data.id
        }
        ref={this.mainDiv}
      >
        <div className="outcome-title">
          <OutcomeTitle
            data={this.props.data}
            prefix={this.props.prefix}
            hovertext={this.props.hovertext}
          />
        </div>
        <input
          className="outcome-toggle-checkbox"
          type="checkbox"
          title="Toggle highlighting"
          onChange={this.clickFunction.bind(this)}
        />
        {data.depth < 2 && data.child_outcome_links.length > 0 && (
          <div className="outcome-drop" onClick={this.toggleDrop.bind(this)}>
            <div className="outcome-drop-img">
              <img
                src={
                  COURSEFLOW_APP.globalContextData.path.static_assets.icon +
                  dropIcon +
                  '.svg'
                }
              />
            </div>
            <div className="outcome-drop-text">{droptext}</div>
          </div>
        )}
        <div
          className="children-block"
          id={this.props.objectId + '-children-block'}
          ref={this.children_block}
        >
          {children}
        </div>
      </div>
    )
  }
}

const MapStateToProps = (
  state: AppState,
  own_props: OwnProps
): ConnectedProps => ({
  ...getOutcomeByID(state, own_props.objectId),
  nodes: state.outcomenode
    .filter((outcomeNode) => outcomeNode.outcome == own_props.objectId)
    .map((outcomeNode) => outcomeNode.node),
  horizontaloutcomes: state.outcomehorizontallink
    .filter((ochl) => ochl.parent_outcome == own_props.objectId)
    .map((ochl) => ochl.outcome)
})

const ParentOutcome = connect<ConnectedProps, object, OwnProps, AppState>(
  MapStateToProps,
  null
)(ParentOutcomeUnconnected)

export default ParentOutcome
