import { CfObjectType } from '@cf/types/enum'
import EditableComponent, {
  EditableComponentProps,
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import {
  DeleteSelfButton,
  DuplicateSelfButton,
  InsertSiblingButton
} from '@cfEditableComponents/hoverEditActions'
import { TGetColumnByID, getColumnById } from '@cfFindState'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = {
  column: TGetColumnByID
  workflow: TWorkflow
}

type OwnProps = {
  throughParentId?: number
} & EditableComponentProps

type StateProps = EditableComponentStateType
type PropsType = ConnectedProps & OwnProps

/**
 * The column in a workflow.
 */
class Column extends EditableComponent<PropsType, StateProps> {
  private manager: BetterSelectionManager
  constructor(props: PropsType) {
    super(props)
    this.manager = new BetterSelectionManager(this.props.dispatch)
    this.objectType = CfObjectType.COLUMN
    this.objectClass = '.column'
  }

  colorChooser = (color: string, type: number): string => {
    if (color) {
      return color
    }

    // we have this.props.data
    // which is TColumn
    const colors = {
      1: 'red',
      2: 'blue',
      3: 'orange'
    }
    return colors[type]
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  HoverMenu = () => {
    const mouseoverActions = []
    if (this.props.workflow.workflowPermissions.write) {
      mouseoverActions.push(
        <InsertSiblingButton
          id={this.props.objectId}
          objectType={this.objectType}
          parentId={this.props.parentId}
        />
      )
      mouseoverActions.push(
        <DuplicateSelfButton
          id={this.props.objectId}
          objectType={this.objectType}
          parentId={this.props.parentId}
        />
      )
      mouseoverActions.push(
        <DeleteSelfButton
          id={this.props.objectId}
          objectType={this.objectType}
        />
      )
    }

    if (this.props.workflow.workflowPermissions.addComments) {
      mouseoverActions.push(<this.AddCommenting />)
    }
    return mouseoverActions
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.column.data
    const title = data.title ?? data.columnTypeDisplay

    const style: React.CSSProperties = {}
    if (data.lock) {
      style.border = '2px solid ' + data.lock.userColour
    }

    const cssClass = [
      'column',
      data.lock ? 'locked locked-' + data.lock.userId : ''
    ].join(' ')

    return (
      <div
        ref={this.mainDiv}
        style={style}
        className={cssClass}
        onClick={() =>
          this.manager.updateSidebar(
            data.id,
            this.objectType,
            this.props.parentId
          )
        }
      >
        <div className="column-line">
          {this.colorChooser(
            this.props.column.data.colour,
            this.props.column.data.columnType
          )}
          <div dangerouslySetInnerHTML={{ __html: title }}></div>
        </div>
        {/*{this.addEditable(data)}*/}
        <div className="mouseover-actions">
          <this.HoverMenu />
        </div>
      </div>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return {
    column: getColumnById(state, ownProps.objectId),
    workflow: state.workflow
  }
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(Column)
