// @ts-nocheck
import * as React from 'react'
import { connect } from 'react-redux'
import * as Constants from '@cfConstants'
import { getNodeByID } from '@cfFindState'
import { Component } from '@cfParentComponents'
import { NodeTitle } from '@cfUIComponents'

/**
 *  Basic component to represent a node in the outcomes table
 *
 */

/**
 *
 */
class NodeOutcomeViewUnconnected extends Component {
  constructor(props) {
    super(props)
     this.objectType = ObjectType.NODE
    this.state = {
      initial_render: true
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let data_override
    if (data.represents_workflow)
      data_override = { ...data, ...data.linked_workflow_data, id: data.id }
    else data_override = data
    const selection_manager = this.props.renderer.selection_manager

    const style = {
      backgroundColor: Constants.getColumnColour(this.props.column)
    }
    let css_class =
      'node column-' + data.column + ' ' + Constants.node_keys[data.node_type]
    if (data.is_dropped) css_class += ' dropped'
    if (data.lock) css_class += ' locked locked-' + data.lock.user_id

    let comments

    return (
      <div ref={this.mainDiv} className="table-cell nodewrapper">
        <div className={css_class} style={style} id={data.id}>
          <div className="node-top-row">
            <NodeTitle data={data} />
          </div>
          <div className="mouseover-actions">{comments}</div>
        </div>
        <div className="side-actions">
          <div className="comment-indicator-container" />
        </div>
      </div>
    )
  }
}
const mapNodeStateToProps = (state, own_props) =>
  getNodeByID(state, own_props.objectID)
const Index = connect(mapNodeStateToProps, null)(NodeOutcomeViewUnconnected)

export default Index
