import { CfObjectType } from '@cf/types/enum'
import { TColumnWorkflowById, getColumnWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

import Column from './Column'

type ConnectedProps = TColumnWorkflowById
type OwnProps = {
  objectId: number
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
      data.noDrag ? 'no-drag' : ''
    ].join(' ')

    return (
      <div
        className={cssClasses}
        // ref={this.mainDiv} // @todo mainDiv not defined
        id={String(data.id)}
        data-child-id={data.column}
      >
        <Column
          objectId={data.column}
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
): TColumnWorkflowById => {
  return getColumnWorkflowByID(state, ownProps.objectId)
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapColumnWorkflowStateToProps,
  null
)(ColumnWorkflow)
