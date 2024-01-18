import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponentWithActions } from '@cfParentComponents'
import { getColumnByID, GetColumnByIDType } from '@cfFindState'
import * as Constants from '@cfConstants'
import { CfObjectType } from '@cfModule/types/enum'
import { AppState } from '@cfRedux/type'
import { EditableComponentWithActionsState } from '@cfParentComponents/EditableComponentWithActions'

type ConnectedProps = GetColumnByIDType
type OwnProps = {
  objectID: number
  data: any
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

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getIcon() {
    if (this.props.data.icon && this.props.data.icon != '') {
      return (
        <span className="material-symbols-rounded">{this.props.data.icon}</span>
      )
    }
    return (
      <img
        src={
          COURSEFLOW_APP.config.icon_path +
          Constants.default_column_settings[this.props.data.column_type].icon +
          '.svg'
        }
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let title = data.title
    if (!title) title = data.column_type_display

    const style: React.CSSProperties = {}
    if (data.lock) {
      style.border = '2px solid ' + data.lock.user_colour
    }
    const cssClass = [
      'column',
      data.lock ? 'locked locked-' + data.lock.user_id : ''
    ].join(' ')
    // if (data.lock) css_class += ' locked locked-' + data.lock.user_id

    const mouseover_actions = []
    if (!this.context.read_only) {
      mouseover_actions.push(this.addInsertSibling(data))
      mouseover_actions.push(this.addDuplicateSelf(data))
      mouseover_actions.push(this.addDeleteSelf(data))
    }
    if (this.context.view_comments) {
      // mouseover_actions.push(this.addCommenting(data))
      mouseover_actions.push(this.addCommenting())
    }

    return (
      <div
        ref={this.mainDiv}
        style={style}
        className={cssClass}
        onClick={(evt) =>
          this.context.selection_manager.changeSelection(evt, this)
        }
      >
        <div className="column-line">
          {this.getIcon()}
          <div dangerouslySetInnerHTML={{ __html: title }}></div>
        </div>
        {this.addEditable(data)}
        <div className="mouseover-actions">{mouseover_actions}</div>
      </div>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): GetColumnByIDType => {
  return getColumnByID(state, ownProps.objectID)
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(Column)
