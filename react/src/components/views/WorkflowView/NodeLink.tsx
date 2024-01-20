import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect } from 'react-redux'
import { EditableComponentWithActions } from '@cfParentComponents'
import { getNodeLinkByID, TGetNodeLinkByID } from '@cfFindState'
import * as Constants from '@cfConstants'
import NodeLinkSVG from '@cfCommonComponents/workflow/Node/NodeLinkSVG'
import { AppState } from '@cfRedux/types/type'
import {
  EditableComponentWithActionsProps,
  EditableComponentWithActionsState
} from '@cfParentComponents/EditableComponentWithActions'
import { CfObjectType } from '@cfModule/types/enum'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
// import $ from 'jquery'

type ConnectedProps = TGetNodeLinkByID
type OwnProps = {
  objectID: number
  node_div: React.RefObject<HTMLDivElement>
} & EditableComponentWithActionsProps
type StateProps = EditableComponentWithActionsState
type PropsType = ConnectedProps & OwnProps

/**
 * The arrow manually drawn between two nodes (as opposed to the
 * autolink which is automatically drawn). This can have text added.
 */
class NodeLink extends EditableComponentWithActions<PropsType, StateProps> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>
  private source_node: JQuery
  private target_node: JQuery
  private target_port_handle: d3.Selection<
    SVGElement,
    unknown,
    HTMLElement,
    any
  >
  private source_port_handle: d3.Selection<
    SVGElement,
    unknown,
    HTMLElement,
    any
  >
  private rerenderEvents: string
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.NODELINK
    this.objectClass = '.node-link'
    this.rerenderEvents = 'ports-rendered.' + this.props.data.id
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
  rerender() {
    this.setState({})
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const style: React.CSSProperties = {}

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

      // this css selector defines the circle attached to each node
      // from which the line is connected
      const cssSourcePortSelector = [
        `g.port-${data.source_node}`,
        ` circle[data-port-type='source']`,
        `[data-port='${Constants.port_keys[data.source_port]}']`
      ].join('')

      // this css selector defines the circle attached to each node
      // to which the line is connected
      const cssSourceTargetSelector = [
        `g.port-${data.target_node} `,
        ` circle[data-port-type='target']`,
        `[data-port='${Constants.port_keys[data.target_port]}']`
      ].join('')

      // eslint-disable-next-line no-undef
      this.source_port_handle = d3.select(cssSourcePortSelector)
      this.target_port_handle = d3.select(cssSourceTargetSelector)
    }

    console.log('g port')
    console.log()

    const node_selected =
      this.source_node.attr('data-selected') === 'true' ||
      this.target_node.attr('data-selected') === 'true'
    const node_hovered =
      this.source_node.attr('data-hovered') === 'true' ||
      this.target_node.attr('data-hovered') === 'true'

    if (data.dashed) {
      style.strokeDasharray = '5,5'
    }
    if (
      this.source_node.css('display') == 'none' ||
      this.target_node.css('display') == 'none'
    ) {
      style.display = 'none'
    }

    const source_dims = {
      width: this.source_node.outerWidth(),
      height: this.source_node.outerHeight()
    }

    const target_dims = {
      width: this.target_node.outerWidth(),
      height: this.target_node.outerHeight()
    }

    if (!source_dims.width || !target_dims.width) {
      return null
    }

    if (!this.source_node.is(':visible') || !this.target_node.is(':visible')) {
      return null
    }

    // PORTAL
    const portal = reactDom.createPortal(
      <NodeLinkSVG
        style={style}
        hovered={node_hovered}
        node_selected={node_selected}
        // @ts-ignore
        lock={data.lock} // @todo where is lock defined?
        title={data.title}
        text_position={data.text_position}
        source_port_handle={this.source_port_handle}
        source_port={data.source_port}
        target_port_handle={this.target_port_handle}
        target_port={data.target_port}
        clickFunction={(evt) =>
          this.context.selection_manager.changeSelection(evt, this)
        }
        selected={this.state.selected}
        source_dimensions={source_dims}
        target_dimensions={target_dims}
      />,
      $('.workflow-canvas')[0]
    )

    // PORTAL

    return (
      <>
        {portal}
        {this.addEditable(data)}
      </>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetNodeLinkByID => {
  return getNodeLinkByID(state, ownProps.objectID) || { data: undefined }
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(NodeLink)
