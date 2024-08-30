import * as React from 'react'
import { connect } from 'react-redux'
import EditableComponentWithActions from '@cfEditableComponents/EditableComponentWithActions'
import { getColumnByID, TGetColumnByID } from '@cfFindState'
import * as Constants from '@cfConstants'
import { CfObjectType } from '@cfModule/types/enum'
import { AppState } from '@cfRedux/types/type'
import { EditableComponentWithActionsState } from '@cfEditableComponents/EditableComponentWithActions'

type ConnectedProps = TGetColumnByID
type OwnProps = {
  objectID: number
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
  //         Constants.default_column_settings[this.props.data.column_type].icon +
  //         '.svg'
  //       }
  //     />
  //   )
  // }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const title = data.title ?? data.column_type_display

    const style: React.CSSProperties = {}
    if (data.lock) {
      style.border = '2px solid ' + data.lock.user_colour
    }

    const cssClass = [
      'column',
      data.lock ? 'locked locked-' + data.lock.user_id : ''
    ].join(' ')

    const mouseoverActions = []

    if (!this.context.permissions.workflowPermission.readOnly) {
      mouseoverActions.push(<this.AddInsertSibling data={data} />)
      mouseoverActions.push(<this.AddDuplicateSelf data={data} />)
      mouseoverActions.push(<this.AddDeleteSelf data={data} />)
    }

    if (this.context.workflow.view_comments) {
      mouseoverActions.push(<this.AddCommenting />)
    }
    console.log()

    return (
      <div
        ref={this.mainDiv}
        style={style}
        className={cssClass}
        onClick={(evt) =>
          this.context.selectionManager.changeSelection(evt, this)
        }
      >
        <div className="column-line">
          {this.colorChooser(
            this.props.data.colour,
            this.props.data.column_type
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
): TGetColumnByID => {
  return getColumnByID(state, ownProps.objectID)
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(Column)
