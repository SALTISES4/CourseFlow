import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import { NodeTitle } from '@cfComponents/UIPrimitives/Titles'
import * as Constants from '@cfConstants'
import EditableComponentWithComments from '@cfEditableComponents/EditableComponentWithComments'
import { EditableComponentWithCommentsStateType } from '@cfEditableComponents/EditableComponentWithComments'
import { AppState, TColumn } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

type OwnProps = {
  // renderer: any
  data: any
}
type ConnectedProps = {
  column: TColumn
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
    const selection_manager = this.context.selectionManager
    const data = this.props.data

    const data_override = data.represents_workflow
      ? { ...data, ...data.linked_workflow_data, id: data.id }
      : data
    // this was moved from the return function
    // because this is not a returned element

    const ponderation = (
      <div className="grid-ponderation">
        {data_override.ponderation_theory +
          '/' +
          data_override.ponderation_practical +
          '/' +
          data_override.ponderation_individual}
      </div>
    )

    const style: React.CSSProperties = {
      backgroundColor: Constants.getColumnColour(this.props.column),
      outline: data.lock ? '2px solid ' + data.lock.user_colour : undefined
    }

    const cssClass = [
      'node column-' + data.column + ' ' + Constants.node_keys[data.node_type],
      data.is_dropped ? 'dropped' : '',
      data.lock ? 'locked locked-' + data.lock.user_id : ''
    ].join(' ')

    const comments = this.context.workflow.view_comments ? (
      <this.AddCommenting />
    ) : undefined

    const portal = this.addEditable(data_override, true)
    return (
      <>
        {portal}
        <div
          style={style}
          id={data.id}
          ref={this.mainDiv}
          onClick={(evt) => selection_manager.changeSelection(evt, this)}
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
  column: state.column.find((column) => column.id == ownProps.data.column)
})
const GridNode = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(GridNodeUnconnected)

export default GridNode
