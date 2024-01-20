import * as React from 'react'
import { connect } from 'react-redux'
import Column from './Column'
import { TColumnWorkflowByID, getColumnWorkflowByID } from '@cfFindState'
import { CfObjectType } from '@cfModule/types/enum'
import { AppState } from '@cfRedux/types/type'

type ConnectedProps = TColumnWorkflowByID
type OwnProps = {
  objectID: number
  parentID: number
}
type PropsType = ConnectedProps & OwnProps

/**
 * Represents the column-workflow throughmodel
 */
class ColumnWorkflow extends React.Component<PropsType> {
  private objectType: CfObjectType
  private objectClass: string
  constructor(props) {
    super(props)
    this.objectType = CfObjectType.COLUMNWORKFLOW
    this.objectClass = '.column-workflow'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const cssClasses = [
      'column-workflow column-' + data.id,
      data.no_drag ? 'no-drag' : ''
    ].join(' ')

    return (
      <div
        className={cssClasses}
        // ref={this.mainDiv} // @todo mainDiv not defined
        id={String(data.id)}
        data-child-id={data.column}
      >
        <Column
          objectID={data.column}
          parentID={this.props.parentID}
          throughParentID={data.id}
          // renderer={this.props.renderer}
        />
      </div>
    )
  }
}
const mapColumnWorkflowStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TColumnWorkflowByID => {
  return getColumnWorkflowByID(state, ownProps.objectID)
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapColumnWorkflowStateToProps,
  null
)(ColumnWorkflow)
