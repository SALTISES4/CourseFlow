import * as React from 'react'
import { Provider, connect } from 'react-redux'
import Node from './Node.js'
import { getNodeWeekByID } from '../../../redux/FindState.js'
import {} from '../../../redux/Reducers.js'

/**
 * Represents the node-week throughmodel
 */
class NodeWeekUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'nodeweek'
    this.objectClass = '.node-week'
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getNode() {
    let data = this.props.data
    return (
      <Node
        objectID={data.node}
        parentID={this.props.parentID}
        throughParentID={data.id}
        renderer={this.props.renderer}
        column_order={this.props.column_order}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let my_class = 'node-week'
    if (data.no_drag) my_class += ' no-drag'
    return (
      <div
        className={my_class}
        id={data.id}
        data-child-id={data.node}
        data-column-id={this.props.column}
        ref={this.maindiv}
      >
        {this.getNode()}
      </div>
    )
  }
}
const mapNodeWeekStateToProps = (state, own_props) =>
  getNodeWeekByID(state, own_props.objectID)

export default connect(mapNodeWeekStateToProps, null)(NodeWeekUnconnected)
export { NodeWeekUnconnected }
