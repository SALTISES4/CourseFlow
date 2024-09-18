import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/utilityFunctions'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'
import { newNodeLink } from '@XMLHTTP/API/create'
import * as React from 'react'
// import $ from 'jquery'

//The ports used to connect links for the nodes
type PropsType = {
  dispatch: any
  node_div: any
  nodeID: any
}
type StateType = {
  node_offset: any
  node_dimensions: any
}
export class NodePorts extends React.Component<PropsType, StateType> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>
  private positioned: boolean
  constructor(props: PropsType) {
    super(props)
    this.state = {} as StateType
  }

  componentDidUpdate() {
    $(this.props.node_div.current).triggerHandler('ports-rendered')
  }

  componentDidMount() {
    const thisComponent = this
    if (!this.context.permissions.workflowPermission)
      d3.selectAll<SVGCircleElement, any>(
        'g.port-' + this.props.nodeID + " circle[data-port-type='source']"
      ).call(
        d3
          .drag<SVGCircleElement, any>()
          .on('start', function (d) {
            $('.workflow-canvas').addClass('creating-node-link')

            const canvas_offset = $('.workflow-canvas').offset()

            d3.select('.node-link-creator').remove()

            d3.select('.workflow-canvas')
              .append('line')
              .attr('class', 'node-link-creator')
              .attr('x1', d3.event.sourceEvent.x - canvas_offset.left)
              .attr('y1', d3.event.sourceEvent.y - canvas_offset.top)
              .attr('x2', d3.event.sourceEvent.x - canvas_offset.left)
              .attr('y2', d3.event.sourceEvent.y - canvas_offset.top)
              .attr('stroke', 'red')
              .attr('stroke-width', '2')
          })

          .on('drag', function (d) {
            const canvas_offset = $('.workflow-canvas').offset()
            d3.select('.node-link-creator')
              .attr('x2', d3.event.sourceEvent.x - canvas_offset.left)
              .attr('y2', d3.event.sourceEvent.y - canvas_offset.top)
          })
          .on('end', function (d) {
            $('.workflow-canvas').removeClass('creating-node-link')

            const target = d3.select(d3.event.sourceEvent.target)

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
    if (!this.props.node_div.current) {
      return
    }
    const node = $(this.props.node_div.current)
    const node_offset = Utility.getCanvasOffset(node)
    const node_dimensions = {
      width: node.outerWidth(),
      height: node.outerHeight()
    }
    //if(node.closest(".week-workflow").hasClass("dragging")||this.state.node_offset==node_offset&&this.state.node_dimensions==node_dimensions)return;
    this.setState({
      node_offset: node_offset,
      node_dimensions: node_dimensions
    })
  }

  nodeLinkAdded(target, sourcePort, targetPort) {
    const props = this.props
    if (target == this.props.nodeID) {
      return
    }

    newNodeLink(
      props.nodeID,
      target,
      Constants.portKeys.indexOf(sourcePort),
      Constants.portKeys.indexOf(targetPort)
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/ q
  render() {
    const ports = []
    let node_dimensions

    if (this.state.node_dimensions) {
      node_dimensions = this.state.node_dimensions
      this.positioned = true
    } else {
      node_dimensions = { width: 0, height: 0 }
    }

    for (const port_type in Constants.nodePorts) {
      for (const port in Constants.nodePorts[port_type]) {
        ports.push(
          <circle
            data-port-type={port_type}
            data-port={port}
            data-node-id={this.props.nodeID}
            r="6"
            key={port_type + port}
            cx={
              Constants.nodePorts[port_type][port][0] * node_dimensions.width
            }
            cy={
              Constants.nodePorts[port_type][port][1] * node_dimensions.height
            }
          />
        )
      }
    }

    const style = {}
    if ($(this.props.node_div.current).css('display') == 'none') {
      style['display'] = 'none'
    }

    let transform
    if (this.state.node_offset) {
      transform =
        'translate(' +
        this.state.node_offset.left +
        ',' +
        this.state.node_offset.top +
        ')'
    } else {
      transform = 'translate(0,0)'
    }

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

export default NodePorts
