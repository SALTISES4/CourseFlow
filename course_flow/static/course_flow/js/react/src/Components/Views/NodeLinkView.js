import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect } from 'react-redux'
import {
  EditableComponentWithActions,
  NodeLinkSVG
} from '../components/CommonComponents'
import { getNodeLinkByID } from '../../redux/FindState.js'
import * as Constants from '../../Constants.js'

//Basic component to represent a NodeLink
class NodeLinkView extends EditableComponentWithActions {
  constructor(props) {
    super(props)
    this.objectType = 'nodelink'
    this.objectClass = '.node-link'
    this.rerenderEvents = 'ports-rendered.' + this.props.data.id
  }

  render() {
    let data = this.props.data
    if (
      !this.source_node ||
      !this.source_node.outerWidth() ||
      !this.target_node ||
      !this.target_node.outerWidth() ||
      !this.target_port_handle ||
      this.target_port_handle.empty()
    ) {
      this.source_node = $(this.props.node_div.current)
      this.target_node = $('#' + data.target_node + '.node')
      this.source_node.on(this.rerenderEvents, this.rerender.bind(this))
      this.target_node.on(this.rerenderEvents, this.rerender.bind(this))
      this.source_port_handle = d3.select(
        'g.port-' +
          data.source_node +
          " circle[data-port-type='source'][data-port='" +
          Constants.port_keys[data.source_port] +
          "']"
      )
      this.target_port_handle = d3.select(
        'g.port-' +
          data.target_node +
          " circle[data-port-type='target'][data-port='" +
          Constants.port_keys[data.target_port] +
          "']"
      )
    }

    let node_selected =
      this.source_node.attr('data-selected') === 'true' ||
      this.target_node.attr('data-selected') === 'true'
    let node_hovered =
      this.source_node.attr('data-hovered') === 'true' ||
      this.target_node.attr('data-hovered') === 'true'

    let style = {}
    if (data.dashed) style.strokeDasharray = '5,5'
    if (
      this.source_node.css('display') == 'none' ||
      this.target_node.css('display') == 'none'
    )
      style['display'] = 'none'

    var source_dims = {
      width: this.source_node.outerWidth(),
      height: this.source_node.outerHeight()
    }
    var target_dims = {
      width: this.target_node.outerWidth(),
      height: this.target_node.outerHeight()
    }
    if (!source_dims.width || !target_dims.width) return null
    var selector = this

    if (!this.source_node.is(':visible') || !this.target_node.is(':visible'))
      return null

    return (
      <div>
        {reactDom.createPortal(
          <NodeLinkSVG
            style={style}
            hovered={node_hovered}
            node_selected={node_selected}
            lock={data.lock}
            title={data.title}
            text_position={data.text_position}
            source_port_handle={this.source_port_handle}
            source_port={data.source_port}
            target_port_handle={this.target_port_handle}
            target_port={data.target_port}
            clickFunction={(evt) =>
              this.props.renderer.selection_manager.changeSelection(
                evt,
                selector
              )
            }
            selected={this.state.selected}
            source_dimensions={source_dims}
            target_dimensions={target_dims}
          />,
          $('.workflow-canvas')[0]
        )}
        {this.addEditable(data)}
      </div>
    )
  }

  rerender() {
    this.setState({})
  }

  componentWillUnmount() {
    if (this.target_node && this.target_node.length > 0) {
      this.source_node.off(this.rerenderEvents)
      this.target_node.off(this.rerenderEvents)
    }
  }
}
const mapNodeLinkStateToProps = (state, own_props) =>
  getNodeLinkByID(state, own_props.objectID)
const mapNodeLinkDispatchToProps = {}
export default connect(mapNodeLinkStateToProps, null)(NodeLinkView)
