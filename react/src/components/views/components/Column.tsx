import { CfObjectType } from '@cf/types/enum'
import EditableComponentWithActions from '@cfEditableComponents/EditableComponentWithActions'
import { EditableComponentWithActionsState } from '@cfEditableComponents/EditableComponentWithActions'
import { TGetColumnByID, getColumnByID } from '@cfFindState'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = {
  column: TGetColumnByID
  workflow: TWorkflow
}
type OwnProps = {
  objectId: number
  parentID?: number
  throughParentID?: number
}
type StateProps = EditableComponentWithActionsState
type PropsType = ConnectedProps & OwnProps

/**
 * The column in a workflow.
 */
class Column extends EditableComponentWithActions<PropsType, StateProps> {
  constructor(props: PropsType) {
    super(props)
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

  // /*******************************************************
  //  * COMPONENTS
  //  *******************************************************/
  // Icon = () => {
  //   if (this.props.data.icon && this.props.data.icon != '') {
  //     return (
  //       <span className="material-symbols-rounded">{this.props.data.icon}</span>
  //     )
  //   }
  //   return (
  //     <img
  //       src={
  //         COURSEFLOW_APP.globalContextData.path.static_assets.icon +
  //         Constants.defaultColumnSettings[this.props.data.columnType].icon +
  //         '.svg'
  //       }
  //     />
  //   )
  // }

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

    const mouseoverActions = []

    if (this.props.workflow.workflowPermission.write) {
      mouseoverActions.push(<this.AddInsertSibling data={data} />)
      mouseoverActions.push(<this.AddDuplicateSelf data={data} />)
      mouseoverActions.push(<this.AddDeleteSelf data={data} />)
    }

    if (this.props.workflow.workflowPermission.viewComments) {
      mouseoverActions.push(<this.AddCommenting />)
    }

    return (
      <div
        ref={this.mainDiv}
        style={style}
        className={cssClass}
        onClick={(evt) =>
          // @ts-ignore
          this.context.selectionManager.changeSelection(evt, this)
        }
      >
        <div className="column-line">
          {this.colorChooser(
            this.props.column.data.colour,
            this.props.column.data.columnType
          )}
          <div dangerouslySetInnerHTML={{ __html: title }}></div>
        </div>
        {this.addEditable(data)}
        <div className="mouseover-actions">{mouseoverActions}</div>
      </div>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return {
    column: getColumnByID(state, ownProps.objectId),
    workflow: state.workflow
  }
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(Column)
