import * as Constants from '@cf/constants'
import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/utilityFunctions'
import * as Utility from '@cf/utility/utilityFunctions'
import { newNodeLink } from '@XMLHTTP/API/create'
import * as React from 'react'
// import $ from 'jquery'

//The ports used to connect links for the nodes
type PropsType = {
  dispatch: any
  nodeDiv: any
  nodeId: any
}
type StateType = {
  nodeOffset: any
  nodeDimensions: any
}

export class NodePorts extends React.Component<PropsType, StateType> {
  private positioned: boolean
  constructor(props: PropsType) {
    super(props)
    this.state = {} as StateType
  }

  componentDidUpdate() {
    $(this.props.nodeDiv.current).triggerHandler('ports-rendered')
  }

  componentDidMount() {
    const thisComponent = this

    // @todo this needs to get workflow permissions out of store
    // if (!this.props.workflow.workflowPermission)
    if (true) {
      d3.selectAll<SVGCircleElement, any>(
        'g.port-' + this.props.nodeId + " circle[data-port-type='source']"
      ).call(
        d3
          .drag<SVGCircleElement, any>()
          .on('start', function (d) {
            $('.workflow-canvas').addClass('creating-node-link')

            const canvasOffset = $('.workflow-canvas').offset()

            d3.select('.node-link-creator').remove()

            d3.select('.workflow-canvas')
              .append('line')
              .attr('class', 'node-link-creator')
              .attr('x1', d3.event.sourceEvent.x - canvasOffset.left)
              .attr('y1', d3.event.sourceEvent.y - canvasOffset.top)
              .attr('x2', d3.event.sourceEvent.x - canvasOffset.left)
              .attr('y2', d3.event.sourceEvent.y - canvasOffset.top)
              .attr('stroke', 'red')
              .attr('stroke-width', '2')
          })

          .on('drag', function (d) {
            const canvasOffset = $('.workflow-canvas').offset()
            d3.select('.node-link-creator')
              .attr('x2', d3.event.sourceEvent.x - canvasOffset.left)
              .attr('y2', d3.event.sourceEvent.y - canvasOffset.top)
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
    }

    this.updatePorts()

    $(this.props.nodeDiv.current).on(
      'component-updated',
      this.updatePorts.bind(this)
    )
    //$(this.props.nodeDiv.current).triggerHandler("ports-rendered");
  }

  updatePorts() {
    if (!this.props.nodeDiv.current) {
      return
    }
    const node = $(this.props.nodeDiv.current)
    const nodeOffset = Utility.getCanvasOffset(node)
    const nodeDimensions = {
      width: node.outerWidth(),
      height: node.outerHeight()
    }
    //if(node.closest(".week-workflow").hasClass("dragging")||this.state.nodeOffset==nodeOffset&&this.state.nodeDimensions==nodeDimensions)return;
    this.setState({
      nodeOffset: nodeOffset,
      nodeDimensions: nodeDimensions
    })
  }

  nodeLinkAdded(target, sourcePort, targetPort) {
    const props = this.props
    if (target == this.props.nodeId) {
      return
    }

    newNodeLink(
      props.nodeId,
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
    let nodeDimensions

    if (this.state.nodeDimensions) {
      nodeDimensions = this.state.nodeDimensions
      this.positioned = true
    } else {
      nodeDimensions = { width: 0, height: 0 }
    }

    for (const portType in Constants.nodePorts) {
      for (const port in Constants.nodePorts[portType]) {
        ports.push(
          <circle
            data-port-type={portType}
            data-port={port}
            data-node-id={this.props.nodeId}
            r="6"
            key={portType + port}
            cx={Constants.nodePorts[portType][port][0] * nodeDimensions.width}
            cy={
              Constants.nodePorts[portType][port][1] * nodeDimensions.height
            }
          />
        )
      }
    }

    const style = {}
    if ($(this.props.nodeDiv.current).css('display') == 'none') {
      style['display'] = 'none'
    }

    let transform
    if (this.state.nodeOffset) {
      transform =
        'translate(' +
        this.state.nodeOffset.left +
        ',' +
        this.state.nodeOffset.top +
        ')'
    } else {
      transform = 'translate(0,0)'
    }

    return (
      <g
        style={style}
        className={'node-ports port-' + this.props.nodeId}
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
