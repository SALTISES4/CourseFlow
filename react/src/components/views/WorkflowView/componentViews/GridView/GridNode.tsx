import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import { calcWorkflowPermissions } from '@cf/utility/permissions'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TColumn, TNode, TWorkflow } from '@cfRedux/types/type'
import NodeTitle from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeTitle'
import { Dispatch } from '@reduxjs/toolkit'
import clsx from 'clsx'
import * as React from 'react'
import { connect } from 'react-redux'
import { Action } from 'redux'

type OwnProps = {
  node: TNode
  parentId: number
} & { dispatch?: Dispatch<Action> }

type ConnectedProps = {
  column: TColumn
  workflow: TWorkflow
}
type PropsType = OwnProps & ConnectedProps
type StateProps = {}
/**
 * A node in the grid view
 */
class GridNodeUnconnected extends React.Component<PropsType, StateProps> {
  private manager: BetterSelectionManager
  private objectType: CfObjectType
  private mainDiv: React.RefObject<HTMLDivElement>

  constructor(props: PropsType) {
    super(props)
    this.manager = new BetterSelectionManager(this.props.dispatch)
    this.mainDiv = React.createRef()
    this.objectType = CfObjectType.NODE
  }

  Ponderation = () => {
    const node = this.props.node
    const dataOverride = node.representsWorkflow
      ? { ...node, ...node.linkedWorkflowData, id: node.id }
      : node

    return (
      <div className="grid-ponderation">
        {dataOverride.ponderationTheory +
          '/' +
          dataOverride.ponderationPractical +
          '/' +
          dataOverride.ponderationIndividual}
      </div>
    )
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const node = this.props.node

    const style: React.CSSProperties = {
      backgroundColor: Constants.getColumnColour({
        columnType: this.props.column.columnType,
        colour: this.props.column.colour
      }),
      outline: node.lock ? '2px solid ' + node.lock.userColour : undefined
    }

    const permissions = calcWorkflowPermissions(
      this.props.workflow.userPermissions
    )
    //    const comments = permissions.read ? <AddCommenting /> : ''
    const comments = permissions.read ? <>commentbox placeholder</> : ''

    //     const portal = this.addEditable(dataOverride, true)

    return (
      <>
        {/*{portal}*/}
        <div
          id={String(node.id)}
          className={clsx(
            `node column-${node.column}`,
            Constants.nodeKeys[node.nodeType],
            node.isDropped && 'dropped',
            node.lock && `locked locked-${node.lock.userId}`
          )}
          style={style}
          ref={this.mainDiv}
          onClick={(e) => {
            e.stopPropagation()
            this.manager.updateSidebar(
              node.id,
              this.objectType,
              this.props.node.id
            )
          }}
        >
          <div className="node-top-row">
            <NodeTitle node={node} />
            <this.Ponderation />
          </div>
          <div className="mouseover-actions">{comments}</div>
          <div className="side-actions">
            <div className="comment-indicator-container"></div>
          </div>
        </div>
      </>
    )
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => ({
  column: state.column.find((column) => column.id == ownProps.objectId),
  workflow: state.workflow
})
const GridNode = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(GridNodeUnconnected)

export default GridNode
