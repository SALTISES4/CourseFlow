import * as React from 'react'
import { connect } from 'react-redux'
import { NodeTitle } from '@cfUIComponents'
import { EditableComponentWithComments } from '@cfParentComponents'
import * as Constants from '@cfConstants'
import { AppState, TColumn } from '@cfRedux/types/type'
import { EditableComponentWithCommentsStateType } from '@cfParentComponents/EditableComponentWithComments'
import { CfObjectType } from '@cfModule/types/enum'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'

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
  declare context: React.ContextType<typeof WorkFlowConfigContext>
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.NODE
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const selection_manager = this.context.selection_manager
    const data = this.props.data

    const data_override = data.represents_workflow
      ? { ...data, ...data.linked_workflow_data, id: data.id }
      : data
    // this was moved from the return function
    // because this is not a returned element
    this.addEditable(data_override, true)

    const ponderation = (
      <div className="grid-ponderation">
        {data_override.ponderation_theory +
          '/' +
          data_override.ponderation_practical +
          '/' +
          data_override.ponderation_individual}
      </div>
    )

    const style = {
      backgroundColor: Constants.getColumnColour(this.props.column),
      outline: data.lock ? '2px solid ' + data.lock.user_colour : undefined
    }

    let css_class =
      'node column-' + data.column + ' ' + Constants.node_keys[data.node_type]
    if (data.is_dropped) {
      css_class += ' dropped'
    }
    if (data.lock) {
      css_class += ' locked locked-' + data.lock.user_id
    }

    const comments = this.context.view_comments
      ? this.addCommenting()
      : undefined

    return (
      <div
        style={style}
        id={data.id}
        ref={this.mainDiv}
        onClick={(evt) => selection_manager.changeSelection(evt, this)}
        className={css_class}
      >
        <div className="node-top-row">
          <NodeTitle data={data} />
          {ponderation}
        </div>
        <div className="mouseover-actions">{comments}</div>
        <div className="side-actions">
          <div className="comment-indicator-container"></div>
        </div>
        {/*{this.addEditable(data_override, true)}*/}
      </div>
    )
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => ({
  column: state.column.find((column) => column.id == ownProps.data.column)
})
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(GridNodeUnconnected)
