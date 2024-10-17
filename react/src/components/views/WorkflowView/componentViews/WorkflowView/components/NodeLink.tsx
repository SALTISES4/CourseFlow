import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cfConstants'
import EditableComponentWithActions from '@cfEditableComponents/EditableComponentWithActions'
import {
  EditableComponentWithActionsProps,
  EditableComponentWithActionsState
} from '@cfEditableComponents/EditableComponentWithActions'
import { TGetNodeLinkByID, getNodeLinkByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import NodeLinkSVG from '@cfViews/components/Node/NodeLinkSVG'
import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect } from 'react-redux'
// import $ from 'jquery'

type ConnectedProps = TGetNodeLinkByID
type OwnProps = {
  objectId: number
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
  private sourceNode: JQuery
  private targetNode: JQuery
  private targetPort_handle: d3.Selection<
    SVGElement,
    unknown,
    HTMLElement,
    any
  >
  private sourcePort_handle: d3.Selection<
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
    if (this.targetNode && this.targetNode.length > 0) {
      this.sourceNode.off(this.rerenderEvents)
      this.targetNode.off(this.rerenderEvents)
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
      !this.sourceNode ||
      !this.sourceNode.outerWidth() ||
      !this.targetNode ||
      !this.targetNode.outerWidth() ||
      !this.targetPort_handle ||
      this.targetPort_handle.empty()
    ) {
      this.sourceNode = $(this.props.node_div.current)
      this.targetNode = $('#' + data.targetNode + '.node')

      this.sourceNode.on(this.rerenderEvents, this.rerender.bind(this))
      this.targetNode.on(this.rerenderEvents, this.rerender.bind(this))

      // this css selector defines the circle attached to each node
      // from which the line is connected
      const cssSourcePortSelector = [
        `g.port-${data.sourceNode}`,
        ` circle[data-port-type='source']`,
        `[data-port='${Constants.portKeys[data.sourcePort]}']`
      ].join('')

      // this css selector defines the circle attached to each node
      // to which the line is connected
      const cssSourceTargetSelector = [
        `g.port-${data.targetNode} `,
        ` circle[data-port-type='target']`,
        `[data-port='${Constants.portKeys[data.targetPort]}']`
      ].join('')

      // eslint-disable-next-line no-undef
      this.sourcePort_handle = d3.select(cssSourcePortSelector)
      this.targetPort_handle = d3.select(cssSourceTargetSelector)
    }

    const node_selected =
      this.sourceNode.attr('data-selected') === 'true' ||
      this.targetNode.attr('data-selected') === 'true'
    const node_hovered =
      this.sourceNode.attr('data-hovered') === 'true' ||
      this.targetNode.attr('data-hovered') === 'true'

    if (data.dashed) {
      style.strokeDasharray = '5,5'
    }
    if (
      this.sourceNode.css('display') == 'none' ||
      this.targetNode.css('display') == 'none'
    ) {
      style.display = 'none'
    }

    const source_dims = {
      width: this.sourceNode.outerWidth(),
      height: this.sourceNode.outerHeight()
    }

    const target_dims = {
      width: this.targetNode.outerWidth(),
      height: this.targetNode.outerHeight()
    }

    if (!source_dims.width || !target_dims.width) {
      return null
    }

    if (!this.sourceNode.is(':visible') || !this.targetNode.is(':visible')) {
      return null
    }

    // PORTAL
    const portal = reactDom.createPortal(
      // this is dynamic see: react/src/components/views/WorkflowView/WorkflowView.tsx
      <NodeLinkSVG
        style={style}
        hovered={node_hovered}
        node_selected={node_selected}
        // @ts-ignore
        lock={data.lock} // @todo where is lock defined?
        title={data.title}
        textPosition={data.textPosition}
        sourcePort_handle={this.sourcePort_handle}
        sourcePort={data.sourcePort}
        targetPort_handle={this.targetPort_handle}
        targetPort={data.targetPort}
        clickFunction={(evt) =>
          this.context.selectionManager.changeSelection({ evt, newSelection: this })
        }
        selected={this.state.selected}
        source_dimensions={source_dims}
        target_dimensions={target_dims}
      />,
      $('.workflow-canvas')[0]
    )

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
  return getNodeLinkByID(state, ownProps.objectId) || { data: undefined }
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(NodeLink)
