import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import { calcWorkflowPermissions } from '@cf/utility/permissions'
import { NodeTitle } from '@cfComponents/UIPrimitives/Titles'
import * as Constants from '@cfConstants'
import EditableComponent, {
  EditableComponentProps,
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TColumn, TWorkflow } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

type OwnProps = {
  // renderer: any
  data: any
} & EditableComponentProps
type ConnectedProps = {
  column: TColumn
  workflow: TWorkflow
}
type PropsType = OwnProps & ConnectedProps
type StateProps = EditableComponentStateType
/**
 * A node in the grid view
 */
class GridNodeUnconnected extends EditableComponent<PropsType, StateProps> {
  static contextType = WorkflowConfigContext
  declare context: React.ContextType<typeof WorkflowConfigContext>
  private manager: BetterSelectionManager

  constructor(props: PropsType) {
    super(props)
    this.manager = new BetterSelectionManager(this.props.dispatch)

    this.objectType = CfObjectType.NODE
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const selectionManager = this.context.selectionManager
    const data = this.props.data

    const dataOverride = data.representsWorkflow
      ? { ...data, ...data.linkedWorkflowData, id: data.id }
      : data
    // this was moved from the return function
    // because this is not a returned element

    const ponderation = (
      <div className="grid-ponderation">
        {dataOverride.ponderationTheory +
          '/' +
          dataOverride.ponderationPractical +
          '/' +
          dataOverride.ponderationIndividual}
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
      this.props.workflow.userPermissions
    )
    const comments = permissions.read ? <this.AddCommenting /> : ''

    //     const portal = this.addEditable(dataOverride, true)
    return (
      <>
        {/*{portal}*/}
        <div
          style={style}
          id={data.id}
          ref={this.mainDiv}
          onClick={(e) => {
            e.stopPropagation()
            this.manager.updateSidebar(
              data.id,
              this.objectType,
              this.props.parentId
            )
          }}
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
