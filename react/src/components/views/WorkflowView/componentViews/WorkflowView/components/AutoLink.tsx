import NodeLinkSVG from '@cfViews/components/Node/NodeLinkSVG'
import * as React from 'react'
import * as reactDom from 'react-dom'
// import $ from 'jquery'

type PropsType = {
  nodeID: number
  node_div: React.RefObject<HTMLElement>
}

/**
 * A NodeLink that is automatically generated based on node setting. Has no direct back-end representation
 */
class AutoLink extends React.Component<PropsType> {
  private eventNameSpace: string
  private rerenderEvents: string
  private target: any
  private sourcePort_handle: d3.Selection<
    SVGElement,
    unknown,
    HTMLElement,
    any
  >
  private targetPort_handle: d3.Selection<
    SVGElement,
    unknown,
    HTMLElement,
    any
  >
  private targetNode: JQuery<HTMLElement>
  private sourceNode: JQuery<HTMLElement>
  constructor(props) {
    super(props)
    this.eventNameSpace = 'autolink' + this.props.nodeID
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
    const next_ns = ns
      .nextAll('.node-week:not(.ui-sortable-placeholder)')
      .first()

    if (next_ns.length > 0) {
      target = next_ns.find('.node').attr('id')
    } else {
      let next_sw = ns.closest('.week-workflow').next()

      while (next_sw.length > 0 && !target) {
        target = next_sw
          .find('.node-week:not(.ui-sortable-placeholder) .node')
          .attr('id')
        next_sw = next_sw.next()
      }
    }

    this.setTarget(target)
  }

  rerender(evt) {
    // this.setState({}) @todo verify, there is no state in this component
  }

  setTarget(target) {
    if (target) {
      if (this.targetNode && target == this.targetNode.attr('id')) {
        if (!this.targetPort_handle || this.targetPort_handle.empty()) {
          // @ts-ignore
          this.targetPort_handle = d3.select(
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

      // @ts-ignore
      this.targetPort_handle = d3.select(
        'g.port-' + target + " circle[data-port-type='target'][data-port='n']"
      )

      this.targetNode.on(this.rerenderEvents, this.rerender.bind(this))
      this.target = target
    } else {
      if (this.targetNode) {
        this.targetNode.off(this.rerenderEvents)
      }

      this.targetNode = null
      this.targetPort_handle = null
      this.target = null
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (
      !this.sourceNode ||
      this.sourceNode.length == 0 ||
      !this.sourcePort_handle ||
      this.sourcePort_handle.empty()
    ) {
      this.sourceNode = $(this.props.node_div.current)

      // @ts-ignore
      this.sourcePort_handle = d3.select(
        'g.port-' +
          this.props.nodeID +
          " circle[data-port-type='source'][data-port='s']"
      )
      this.sourceNode.on(this.rerenderEvents, this.rerender.bind(this))
    }
    if (this.targetNode && this.targetNode.parent().parent().length == 0) {
      this.targetNode = null
    }

    this.findAutoTarget()

    if (!this.targetNode) {
      return null
    }

    const source_dims = {
      width: this.sourceNode.outerWidth(),
      height: this.sourceNode.outerHeight()
    }
    const target_dims = {
      width: this.targetNode.outerWidth(),
      height: this.targetNode.outerHeight()
    }

    const node_selected =
      this.sourceNode.attr('data-selected') === 'true' ||
      this.targetNode.attr('data-selected') === 'true'

    const node_hovered =
      this.sourceNode.attr('data-hovered') === 'true' ||
      this.targetNode.attr('data-hovered') === 'true'

    //  .workflow-canvas is dynamic portal
    const portal = reactDom.createPortal(
      <NodeLinkSVG
        hovered={node_hovered}
        node_selected={node_selected}
        sourcePort_handle={this.sourcePort_handle}
        sourcePort={2}
        targetPort_handle={this.targetPort_handle}
        targetPort={0}
        source_dimensions={source_dims}
        target_dimensions={target_dims}
      />,
      $('.workflow-canvas')[0]
    )
    return <>{portal}</>
  }
}

export default AutoLink
