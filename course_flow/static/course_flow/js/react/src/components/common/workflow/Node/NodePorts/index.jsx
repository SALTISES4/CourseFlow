import * as React from 'react'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'
import { newNodeLink } from '@XMLHTTP/PostFunctions.js'

//The ports used to connect links for the nodes
export class Index extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidUpdate() {
    $(this.props.node_div.current).triggerHandler('ports-rendered')
  }

  componentDidMount() {
    var thisComponent = this
    if (!this.props.renderer.read_only)
      d3.selectAll(
        'g.port-' + this.props.nodeID + " circle[data-port-type='source']"
      ).call(
        d3
          .drag()
          .on('start', function (d) {
            $('.workflow-canvas').addClass('creating-node-link')
            var canvas_offset = $('.workflow-canvas').offset()
            d3.select('.node-link-creator').remove()
            d3.select('.workflow-canvas')
              .append('line')
              .attr('class', 'node-link-creator')
              .attr('x1', event.x - canvas_offset.left)
              .attr('y1', event.y - canvas_offset.top)
              .attr('x2', event.x - canvas_offset.left)
              .attr('y2', event.y - canvas_offset.top)
              .attr('stroke', 'red')
              .attr('stroke-width', '2')
          })
          .on('drag', function (d) {
            var canvas_offset = $('.workflow-canvas').offset()
            d3.select('.node-link-creator')
              .attr('x2', event.x - canvas_offset.left)
              .attr('y2', event.y - canvas_offset.top)
          })
          .on('end', function (d) {
            $('.workflow-canvas').removeClass('creating-node-link')
            var target = d3.select(event.target)
            if (target.attr('data-port-type') == 'target') {
              thisComponent.nodeLinkAdded(
                target.attr('data-node-id'),
                d3.select(this).attr('data-port'),
                target.attr('data-port')
              )
            }
            d3.select('.node-link-creator').remove()
          })
      )
    this.updatePorts()
    $(this.props.node_div.current).on(
      'component-updated',
      this.updatePorts.bind(this)
    )
    //$(this.props.node_div.current).triggerHandler("ports-rendered");
  }

  updatePorts() {
    if (!this.props.node_div.current) return
    var node = $(this.props.node_div.current)
    var node_offset = Utility.getCanvasOffset(node)
    var node_dimensions = {
      width: node.outerWidth(),
      height: node.outerHeight()
    }
    //if(node.closest(".week-workflow").hasClass("dragging")||this.state.node_offset==node_offset&&this.state.node_dimensions==node_dimensions)return;
    this.setState({
      node_offset: node_offset,
      node_dimensions: node_dimensions
    })
  }

  nodeLinkAdded(target, source_port, target_port) {
    let props = this.props
    if (target == this.props.nodeID) return
    newNodeLink(
      props.nodeID,
      target,
      Constants.port_keys.indexOf(source_port),
      Constants.port_keys.indexOf(target_port)
    )
  }

  render() {
    var ports = []
    var node_dimensions
    if (this.state.node_dimensions) {
      node_dimensions = this.state.node_dimensions
      this.positioned = true
    } else node_dimensions = { width: 0, height: 0 }
    for (var port_type in Constants.node_ports)
      for (var port in Constants.node_ports[port_type]) {
        ports.push(
          <circle
            data-port-type={port_type}
            data-port={port}
            data-node-id={this.props.nodeID}
            r="6"
            key={port_type + port}
            cx={
              Constants.node_ports[port_type][port][0] * node_dimensions.width
            }
            cy={
              Constants.node_ports[port_type][port][1] * node_dimensions.height
            }
          />
        )
      }
    var style = {}
    if ($(this.props.node_div.current).css('display') == 'none')
      style['display'] = 'none'
    var transform
    if (this.state.node_offset)
      transform =
        'translate(' +
        this.state.node_offset.left +
        ',' +
        this.state.node_offset.top +
        ')'
    else transform = 'translate(0,0)'
    return (
      <g
        style={style}
        className={'node-ports port-' + this.props.nodeID}
        stroke="black"
        strokeWidth="2"
        fill="white"
        transform={transform}
      >
        {ports}
      </g>
    )
  }
}

export default Index
