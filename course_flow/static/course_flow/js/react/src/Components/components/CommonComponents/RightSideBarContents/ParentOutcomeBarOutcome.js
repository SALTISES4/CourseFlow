import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'

import { getOutcomeByID, getOutcomeOutcomeByID } from '@cfFindState'
import { OutcomeBarOutcomeUnconnected } from './OutcomeBarOutcome.js'
import { Component, OutcomeTitle } from '@cfCommonComponents'

/**
 * Used for the parent outcome bar.
 */
class ParentOutcomeUnconnected extends OutcomeBarOutcomeUnconnected {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let children = data.child_outcome_links.map((outcomeoutcome) => (
      <ParentOutcomeOutcome
        key={outcomeoutcome}
        objectID={outcomeoutcome}
        parentID={data.id}
        renderer={this.props.renderer}
      />
    ))

    let dropIcon
    if (this.state.is_dropped) dropIcon = 'droptriangleup'
    else dropIcon = 'droptriangledown'

    let droptext
    if (this.state.is_dropped) droptext = gettext('hide')
    else
      droptext =
        gettext('show ') +
        children.length +
        ' ' +
        ngettext('descendant', 'descendants', children.length)

    return (
      <div
        className={
          'outcome' +
          ((this.state.is_dropped && ' dropped') || '') +
          ' outcome-' +
          data.id
        }
        ref={this.maindiv}
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
              <img src={config.icon_path + dropIcon + '.svg'} />
            </div>
            <div className="outcome-drop-text">{droptext}</div>
          </div>
        )}
        <div
          className="children-block"
          id={this.props.objectID + '-children-block'}
          ref={this.children_block}
        >
          {children}
        </div>
      </div>
    )
  }
}
const mapOutcomeBarOutcomeStateToProps = (state, own_props) => ({
  ...getOutcomeByID(state, own_props.objectID),
  nodes: state.outcomenode
    .filter((outcomenode) => outcomenode.outcome == own_props.objectID)
    .map((outcomenode) => outcomenode.node),
  horizontaloutcomes: state.outcomehorizontallink
    .filter((ochl) => ochl.parent_outcome == own_props.objectID)
    .map((ochl) => ochl.outcome)
})
const ParentOutcome = connect(
  mapOutcomeBarOutcomeStateToProps,
  null
)(ParentOutcomeUnconnected)

export default ParentOutcome

/**
 * Used for the parent outcome bar.
 */
class ParentOutcomeOutcomeUnconnected extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data

    return (
      <div className="outcome-outcome" id={data.id} ref={this.maindiv}>
        <ParentOutcome
          objectID={data.child}
          parentID={this.props.parentID}
          throughParentID={data.id}
          renderer={this.props.renderer}
        />
      </div>
    )
  }
}
const mapParentOutcomeOutcomeStateToProps = (state, own_props) =>
  getOutcomeOutcomeByID(state, own_props.objectID, 'parent')
const ParentOutcomeOutcome = connect(
  mapParentOutcomeOutcomeStateToProps,
  null
)(ParentOutcomeOutcomeUnconnected)
