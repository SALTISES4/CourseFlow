import { NodeDom } from '@cf/types/global'
import * as Constants from '@cf/utility/constants'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { newNodelinkQuery } from '@XMLHTTP/API/create'
import * as d3 from 'd3'
import * as React from 'react'

//The ports used to connect links for the nodes
type PropsType = {
  nodeId: number
  nodeDiv: React.MutableRefObject<HTMLElement>
  show: boolean
}
type StateType = NodeDom

export class NodePorts extends React.Component<PropsType, StateType> {
  constructor(props: PropsType) {
    super(props)
    this.state = {
      nodeOffset: {
        top: 0,
        left: 0
      },
      nodeDimensions: {
        height: 0,
        width: 0
      }
    }
  }

  componentDidUpdate() {
    $(this.props.nodeDiv.current).triggerHandler('ports-rendered')
  }

  componentDidMount() {
    const thisComponent = this
    const canvasDraggingClass = 'creating-node-link'

    // @todo this needs to get workflow permissions out of store
    // if (!this.props.workflow.workflowPermission)
    if (true) {
      d3.selectAll<SVGCircleElement, any>(
        'g.port-' + this.props.nodeId + " circle[data-port-type='source']"
      ).call(
        d3
          .drag<SVGCircleElement, any>()
          .on('start', function (event) {
            $('.workflow-canvas').addClass(canvasDraggingClass)

            const canvasOffset = $('.workflow-canvas').offset()

            d3.select('.node-link-creator').remove()

            d3.select('.workflow-canvas')
              .append('line')
              .attr('class', 'node-link-creator')
              .attr('x1', event.sourceEvent.x - canvasOffset.left)
              .attr('y1', event.sourceEvent.y - canvasOffset.top)
              .attr('x2', event.sourceEvent.x - canvasOffset.left)
              .attr('y2', event.sourceEvent.y - canvasOffset.top)
              .attr('stroke', 'red')
              .attr('stroke-width', '2')
          })

          .on('drag', function (event) {
            const canvasOffset = $('.workflow-canvas').offset()
            d3.select('.node-link-creator')
              .attr('x2', event.sourceEvent.x - canvasOffset.left)
              .attr('y2', event.sourceEvent.y - canvasOffset.top)
          })
          .on('end', function (event) {
            $('.workflow-canvas').removeClass(canvasDraggingClass)

            const target = d3.select(event.sourceEvent.target)

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

    // this is basically waiting for an even sent through from other components
    // to redraw the node ports
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
    const nodeOffset = ThemeHelper.getCanvasOffset(node)
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

    newNodelinkQuery(
      props.nodeId,
      target,
      Constants.portKeys.indexOf(sourcePort),
      Constants.portKeys.indexOf(targetPort)
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const ports = []
    const nodeDimensions = this.state.nodeDimensions ?? {
      width: 0,
      height: 0
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
            cy={Constants.nodePorts[portType][port][1] * nodeDimensions.height}
          />
        )
      }
    }

    const transform = `translate(${this.state.nodeOffset.left}, ${this.state.nodeOffset.top})`
    const portGroupClasses = [
      'node-ports',
      `port-${this.props.nodeId}`,
      this.props.show ? 'port-visible' : ''
    ].join(' ')

    return (
      <g
        className={portGroupClasses}
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
