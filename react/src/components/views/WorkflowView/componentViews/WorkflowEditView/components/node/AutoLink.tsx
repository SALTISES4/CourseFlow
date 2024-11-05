import NodeLinkSVG from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeLinkSVG'
import * as React from 'react'
import * as reactDom from 'react-dom'
// import $ from 'jquery'

type PropsType = {
  nodeId: number
  nodeDiv: React.RefObject<HTMLElement>
}

/**
 * A NodeLink that is automatically generated based on node setting. Has no direct back-end representation
 */
class AutoLink extends React.Component<PropsType> {
  private eventNameSpace: string
  private rerenderEvents: string
  private target: any
  private sourcePortHandle: d3.Selection<SVGElement, unknown, HTMLElement, any>
  private targetPortHandle: d3.Selection<SVGElement, unknown, HTMLElement, any>
  private targetNode: JQuery<HTMLElement>
  private sourceNode: JQuery<HTMLElement>
  constructor(props) {
    super(props)
    this.eventNameSpace = 'autolink' + this.props.nodeId
    this.rerenderEvents = 'ports-rendered.' + this.eventNameSpace
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentWillUnmount() {
    if (this.targetNode && this.targetNode.length > 0) {
      this.sourceNode.off(this.rerenderEvents)
      this.targetNode.off(this.rerenderEvents)
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  findAutoTarget() {
    let target = null
    const ns = this.sourceNode.closest('.node-week')
    const nextNs = ns
      .nextAll('.node-week:not(.ui-sortable-placeholder)')
      .first()

    if (nextNs.length > 0) {
      target = nextNs.find('.node').attr('id')
    } else {
      let nextSw = ns.closest('.week-workflow').next()

      while (nextSw.length > 0 && !target) {
        target = nextSw
          .find('.node-week:not(.ui-sortable-placeholder) .node')
          .attr('id')
        nextSw = nextSw.next()
      }
    }

    this.setTarget(target)
  }

  rerender(evt) {
    this.setState({}) // @todo verify, there is no state in this component
  }

  setTarget(target) {
    if (target) {
      if (this.targetNode && target == this.targetNode.attr('id')) {
        if (!this.targetPortHandle || this.targetPortHandle.empty()) {
          this.targetPortHandle = d3.select(
            'g.port-' +
              target +
              " circle[data-port-type='target'][data-port='n']"
          )
        }
        return
      }
      if (this.targetNode) {
        this.targetNode.off(this.rerenderEvents)
      }

      this.targetNode = $('.week #' + target + '.node')

      this.targetPortHandle = d3.select(
        'g.port-' + target + " circle[data-port-type='target'][data-port='n']"
      )

      this.targetNode.on(this.rerenderEvents, this.rerender.bind(this))
      this.target = target
    } else {
      if (this.targetNode) {
        this.targetNode.off(this.rerenderEvents)
      }

      this.targetNode = null
      this.targetPortHandle = null
      this.target = null
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    // Utility.logger(this.props.nodeId)
    // Utility.logger(this)
    // Utility.logger(this.sourceNode)
    //
    // Utility.logger(Object.keys(this))
    // Utility.logger(JSON.parse(Utility.stringifyMaxDepth(this, 2)))

    // this is some race condition hack BS
    // node is not drawn? so sourcePort doesn't exist?
    // add to an 'rerender' event to rerender later?
    // wat
    if (
      !this.sourceNode ||
      this.sourceNode?.length == 0 ||
      !this.sourcePortHandle ||
      this.sourcePortHandle.empty()
    ) {
      this.sourceNode = $(this.props.nodeDiv.current)

      this.sourcePortHandle = d3.select(
        'g.port-' +
          this.props.nodeId +
          " circle[data-port-type='source'][data-port='s']"
      )
      // Utility.logger('this.sourcePortHandle')
      // Utility.logger(this.sourcePortHandle)

      this.sourceNode.on(this.rerenderEvents, this.rerender.bind(this))
      //      return
    }

    if (this.targetNode && this.targetNode.parent().parent().length == 0) {
      this.targetNode = null
    }

    this.findAutoTarget()

    if (!this.targetNode) {
      return null
    }

    const sourceDims = {
      width: this.sourceNode.outerWidth(),
      height: this.sourceNode.outerHeight()
    }
    const targetDims = {
      width: this.targetNode.outerWidth(),
      height: this.targetNode.outerHeight()
    }

    const nodeSelected =
      this.sourceNode.attr('data-selected') === 'true' ||
      this.targetNode.attr('data-selected') === 'true'

    const nodeHovered =
      this.sourceNode.attr('data-hovered') === 'true' ||
      this.targetNode.attr('data-hovered') === 'true'

    //  .workflow-canvas is dynamic portal
    const portal = reactDom.createPortal(
      <NodeLinkSVG
        hovered={nodeHovered}
        nodeSelected={nodeSelected}
        sourcePortHandle={this.sourcePortHandle}
        sourcePort={2}
        targetPortHandle={this.targetPortHandle}
        targetPort={0}
        sourceDimensions={sourceDims}
        targetDimensions={targetDims}
      />,
      $('.workflow-canvas')[0]
    )
    return <>{portal}</>
  }
}

export default AutoLink
