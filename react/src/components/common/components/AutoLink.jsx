import * as React from 'react'
import * as reactDom from 'react-dom'
import NodeLinkSVG from '@cfCommonComponents/workflow/Node/NodeLinkSVG'

// A NodeLink that is automatically generated based on node setting. Has no direct back-end representation
class AutoLink extends React.Component {
  constructor(props) {
    super(props)
    this.eventNameSpace = 'autolink' + props.nodeID
    this.rerenderEvents = 'ports-rendered.' + this.eventNameSpace
  }

  componentWillUnmount() {
    if (this.target_node && this.target_node.length > 0) {
      this.source_node.off(this.rerenderEvents)
      this.target_node.off(this.rerenderEvents)
    }
  }

  findAutoTarget() {
    var ns = this.source_node.closest('.node-week')
    var next_ns = ns.nextAll('.node-week:not(.ui-sortable-placeholder)').first()
    var target
    if (next_ns.length > 0) {
      target = next_ns.find('.node').attr('id')
    } else {
      var sw = ns.closest('.week-workflow')
      var next_sw = sw.next()
      while (next_sw.length > 0) {
        target = next_sw
          .find('.node-week:not(ui-sortable-placeholder) .node')
          .attr('id')
        if (target) break
        next_sw = next_sw.next()
      }
    }
    this.setTarget(target)
  }

  rerender(evt) {
    this.setState({})
  }

  setTarget(target) {
    if (target) {
      if (this.target_node && target == this.target_node.attr('id')) {
        if (!this.target_port_handle || this.target_port_handle.empty()) {
          this.target_port_handle = d3.select(
            'g.port-' +
              target +
              " circle[data-port-type='target'][data-port='n']"
          )
        }
        return
      }
      if (this.target_node) this.target_node.off(this.rerenderEvents)
      this.target_node = $('.week #' + target + '.node')
      this.target_port_handle = d3.select(
        'g.port-' + target + " circle[data-port-type='target'][data-port='n']"
      )
      this.target_node.on(this.rerenderEvents, this.rerender.bind(this))
      this.target = target
    } else {
      if (this.target_node) this.target_node.off(this.rerenderEvents)
      this.target_node = null
      this.target_port_handle = null
      this.target = null
    }
  }

  render() {
    if (
      !this.source_node ||
      this.source_node.length == 0 ||
      !this.source_port_handle ||
      this.source_port_handle.empty()
    ) {
      this.source_node = $(this.props.node_div.current)
      this.source_port_handle = d3.select(
        'g.port-' +
          this.props.nodeID +
          " circle[data-port-type='source'][data-port='s']"
      )
      this.source_node.on(this.rerenderEvents, this.rerender.bind(this))
    }
    if (this.target_node && this.target_node.parent().parent().length == 0)
      this.target_node = null
    this.findAutoTarget()
    if (!this.target_node) return null
    var source_dims = {
      width: this.source_node.outerWidth(),
      height: this.source_node.outerHeight()
    }
    var target_dims = {
      width: this.target_node.outerWidth(),
      height: this.target_node.outerHeight()
    }

    const node_selected =
      this.source_node.attr('data-selected') === 'true' ||
      this.target_node.attr('data-selected') === 'true'
    const node_hovered =
      this.source_node.attr('data-hovered') === 'true' ||
      this.target_node.attr('data-hovered') === 'true'

    return (
      <div>
        {reactDom.createPortal(
          <NodeLinkSVG
            hovered={node_hovered}
            node_selected={node_selected}
            source_port_handle={this.source_port_handle}
            source_port="2"
            target_port_handle={this.target_port_handle}
            target_port="0"
            source_dimensions={source_dims}
            target_dimensions={target_dims}
          />,
          $('.workflow-canvas')[0]
        )}
      </div>
    )
  }
}

export default AutoLink
