import { CfObjectType } from '@cf/types/enum'
import { TGetNodeWeekByID, getNodeWeekByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import Node from '@cfViews/WorkflowView/componentViews/WorkflowView/components/Node'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = TGetNodeWeekByID
type OwnProps = {
  objectId: number
  parentID: number
  column_order: any
  // renderer: any
}
type PropsType = ConnectedProps & OwnProps

/**
 * Represents the node-week throughmodel
 */
class NodeWeekUnconnected<P extends PropsType> extends React.Component<P> {
  private objectType: string
  private objectClass: string
  // private mainDiv: React.LegacyRef<HTMLDivElement> | undefined;

  constructor(props) {
    super(props)
    this.objectType = CfObjectType.NODEWEEK
    this.objectClass = '.node-week'
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  NodeWrapper = () => {
    const data = this.props.data
    return (
      <Node
        objectId={data.node}
        parentID={this.props.parentID}
        // @ts-ignore
        throughParentID={data.id}
        // renderer={this.props.renderer}
        column_order={this.props.column_order}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let my_class = 'node-week'
    if (data.noDrag) my_class += ' no-drag'

    return (
      <div
        className={my_class}
        id={data.id}
        data-child-id={data.node}
        data-column-id={this.props.column}

        // ref={this.mainDiv} // @todo this is not defined
      >
        <this.NodeWrapper />
      </div>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetNodeWeekByID => {
  return getNodeWeekByID(state, ownProps.objectId)
}
const NodeWeek = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(NodeWeekUnconnected)
export default NodeWeek

export { NodeWeekUnconnected }
