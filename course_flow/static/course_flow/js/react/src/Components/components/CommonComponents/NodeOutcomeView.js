//Basic component to represent a node in the outcomes table
import * as React from 'react'
import { connect } from 'react-redux'
import * as Constants from '@cfConstants'
import { getNodeByID } from '@cfFindState'
import { NodeTitle } from './Titles.js'
import Component from './Component.js'

class NodeOutcomeViewUnconnected extends Component {
  constructor(props) {
    super(props)
    this.objectType = 'node'
    this.state = {
      initial_render: true
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let data_override
    if (data.represents_workflow)
      data_override = { ...data, ...data.linked_workflow_data, id: data.id }
    else data_override = data
    let selection_manager = this.props.renderer.selection_manager

    let style = {
      backgroundColor: Constants.getColumnColour(this.props.column)
    }
    let css_class =
      'node column-' + data.column + ' ' + Constants.node_keys[data.node_type]
    if (data.is_dropped) css_class += ' dropped'
    if (data.lock) css_class += ' locked locked-' + data.lock.user_id

    let comments

    return (
      <div ref={this.maindiv} className="table-cell nodewrapper">
        <div className={css_class} style={style} id={data.id}>
          <div className="node-top-row">
            <NodeTitle data={data} />
          </div>
          <div className="mouseover-actions">{comments}</div>
        </div>
        <div className="side-actions">
          <div className="comment-indicator-container"></div>
        </div>
      </div>
    )
  }
}
const mapNodeStateToProps = (state, own_props) =>
  getNodeByID(state, own_props.objectID)
const NodeOutcomeView = connect(
  mapNodeStateToProps,
  null
)(NodeOutcomeViewUnconnected)

export default NodeOutcomeView
