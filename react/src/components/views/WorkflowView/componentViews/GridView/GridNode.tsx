import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import { calcWorkflowPermissions } from '@cf/utility/permissions'
import { NodeTitle } from '@cfComponents/UIPrimitives/Titles'
import * as Constants from '@cfConstants'
import EditableComponentWithComments from '@cfEditableComponents/EditableComponentWithComments'
import { EditableComponentWithCommentsStateType } from '@cfEditableComponents/EditableComponentWithComments'
import { AppState, TColumn, TWorkflow } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

type OwnProps = {
  // renderer: any
  data: any
}
type ConnectedProps = {
  column: TColumn
  workflow: TWorkflow
}
type PropsType = OwnProps & ConnectedProps
type StateProps = EditableComponentWithCommentsStateType
/**
 * A node in the grid view
 */
class GridNodeUnconnected extends EditableComponentWithComments<
  PropsType,
  StateProps
> {
  static contextType = WorkFlowConfigContext
  declare context: React.ContextType<typeof WorkFlowConfigContext>

  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.NODE
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const selectionManager = this.context.selectionManager
    const data = this.props.data

    const data_override = data.representsWorkflow
      ? { ...data, ...data.linkedWorkflowData, id: data.id }
      : data
    // this was moved from the return function
    // because this is not a returned element

    const ponderation = (
      <div className="grid-ponderation">
        {data_override.ponderationTheory +
          '/' +
          data_override.ponderationPractical +
          '/' +
          data_override.ponderationIndividual}
      </div>
    )

    const style: React.CSSProperties = {
      backgroundColor: Constants.getColumnColour(this.props.column),
      outline: data.lock ? '2px solid ' + data.lock.userColour : undefined
    }

    const cssClass = [
      'node column-' + data.column + ' ' + Constants.nodeKeys[data.nodeType],
      data.isDropped ? 'dropped' : '',
      data.lock ? 'locked locked-' + data.lock.userId : ''
    ].join(' ')

    const permissions = calcWorkflowPermissions(
      this.props.workflow.userPermission
    )
    const comments = permissions.read ? <this.AddCommenting /> : ''

    const portal = this.addEditable(data_override, true)
    return (
      <>
        {portal}
        <div
          style={style}
          id={data.id}
          ref={this.mainDiv}
          onClick={(evt) => selectionManager.changeSelection(evt, this)}
          className={cssClass}
        >
          <div className="node-top-row">
            <NodeTitle data={data} />
            {ponderation}
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
  column: state.column.find((column) => column.id == ownProps.data.column),
  workflow: state.workflow
})
const GridNode = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(GridNodeUnconnected)

export default GridNode
