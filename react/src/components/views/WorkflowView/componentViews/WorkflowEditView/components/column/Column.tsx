import { CfObjectType } from '@cf/types/enum'
import { HoverMenu } from '@cfEditableComponents/hoverEditActions'
import { TGetColumnByID, getColumnById } from '@cfFindState'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import { Dispatch } from '@reduxjs/toolkit'
import * as React from 'react'
import { connect } from 'react-redux'
import { Action } from 'redux'

type ConnectedProps = {
  column: TGetColumnByID
  workflow: TWorkflow
}

type OwnProps = {
  objectId: number
  parentId: number
  throughParentId?: number
} & { dispatch?: Dispatch<Action> }

type StateProps = {}
type PropsType = ConnectedProps & OwnProps

/**
 * The column in a workflow.
 */
class Column extends React.Component<PropsType, StateProps> {
  private manager: BetterSelectionManager
  private objectType: CfObjectType
  private mainDiv: React.RefObject<HTMLDivElement>

  constructor(props: PropsType) {
    super(props)
    this.manager = new BetterSelectionManager(this.props.dispatch)
    this.mainDiv = React.createRef()

    this.objectType = CfObjectType.COLUMN
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
        onClick={(e) => {
          e.stopPropagation()
          this.manager.updateSidebar(
            data.id,
            this.objectType,
            this.props.parentId
          )
        }}
      >
        <div className="column-line">
          {this.colorChooser(
            this.props.column.data.colour,
            this.props.column.data.columnType
          )}
          <div dangerouslySetInnerHTML={{ __html: title }}></div>
        </div>
        {/*{this.addEditable(data)}*/}
        <HoverMenu
          canWrite={this.props.workflow.workflowPermissions.write}
          canComment={this.props.workflow.workflowPermissions.viewComments}
          objectId={this.props.objectId}
          parentId={this.props.parentId}
          objectType={this.objectType}
        />
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
