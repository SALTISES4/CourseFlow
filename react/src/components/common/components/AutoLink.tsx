import * as React from 'react'
import * as reactDom from 'react-dom'
import NodeLinkSVG from '@cfViews/components/Node/NodeLinkSVG'
// import $ from 'jquery'

type PropsType = {
  nodeID: number
  node_div: React.RefObject<HTMLElement>
}

// A NodeLink that is automatically generated based on node setting. Has no direct back-end representation
class AutoLink extends React.Component<PropsType> {
  private eventNameSpace: string
  private rerenderEvents: string
  private target: any
  private source_port_handle: d3.Selection<
    SVGElement,
    unknown,
    HTMLElement,
    any
  >
  private target_port_handle: d3.Selection<
    SVGElement,
    unknown,
    HTMLElement,
    any
  >
  private target_node: JQuery<HTMLElement>
  private source_node: JQuery<HTMLElement>
  constructor(props) {
    super(props)
    this.eventNameSpace = 'autolink' + this.props.nodeID
    this.rerenderEvents = 'ports-rendered.' + this.eventNameSpace
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentWillUnmount() {
    if (this.target_node && this.target_node.length > 0) {
      this.source_node.off(this.rerenderEvents)
      this.target_node.off(this.rerenderEvents)
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  findAutoTarget() {
    let target = null
    const ns = this.source_node.closest('.node-week')
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
      if (this.target_node && target == this.target_node.attr('id')) {
        if (!this.target_port_handle || this.target_port_handle.empty()) {
          // @ts-ignore
          this.target_port_handle = d3.select(
            'g.port-' +
              target +
              " circle[data-port-type='target'][data-port='n']"
          )
        }
        return
      }
      if (this.target_node) {
        this.target_node.off(this.rerenderEvents)
      }

      this.target_node = $('.week #' + target + '.node')

      // @ts-ignore
      this.target_port_handle = d3.select(
        'g.port-' + target + " circle[data-port-type='target'][data-port='n']"
      )

      this.target_node.on(this.rerenderEvents, this.rerender.bind(this))
      this.target = target
    } else {
      if (this.target_node) {
        this.target_node.off(this.rerenderEvents)
      }

      this.target_node = null
      this.target_port_handle = null
      this.target = null
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (
      !this.source_node ||
      this.source_node.length == 0 ||
      !this.source_port_handle ||
      this.source_port_handle.empty()
    ) {
      this.source_node = $(this.props.node_div.current)

      // @ts-ignore
      this.source_port_handle = d3.select(
        'g.port-' +
          this.props.nodeID +
          " circle[data-port-type='source'][data-port='s']"
      )
      this.source_node.on(this.rerenderEvents, this.rerender.bind(this))
    }
    if (this.target_node && this.target_node.parent().parent().length == 0) {
      this.target_node = null
    }

    this.findAutoTarget()

    if (!this.target_node) {
      return null
    }

    const source_dims = {
      width: this.source_node.outerWidth(),
      height: this.source_node.outerHeight()
    }
    const target_dims = {
      width: this.target_node.outerWidth(),
      height: this.target_node.outerHeight()
    }

    const node_selected =
      this.source_node.attr('data-selected') === 'true' ||
      this.target_node.attr('data-selected') === 'true'

    const node_hovered =
      this.source_node.attr('data-hovered') === 'true' ||
      this.target_node.attr('data-hovered') === 'true'

    //  .workflow-canvas is dynamic portal
    const portal = reactDom.createPortal(
      <NodeLinkSVG
        hovered={node_hovered}
        node_selected={node_selected}
        source_port_handle={this.source_port_handle}
        source_port={2}
        target_port_handle={this.target_port_handle}
        target_port={0}
        source_dimensions={source_dims}
        target_dimensions={target_dims}
      />,
      $('.workflow-canvas')[0]
    )
    return <>{portal}</>
  }
}

export default AutoLink
