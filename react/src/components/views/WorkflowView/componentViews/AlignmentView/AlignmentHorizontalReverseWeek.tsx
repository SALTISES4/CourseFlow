import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum.js'
import { calcWorkflowPermissions } from '@cf/utility/permissions'
import { _t } from '@cf/utility/utilityFunctions'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import EditableComponentWithComments from '@cfEditableComponents/EditableComponentWithComments'
import { EditableComponentWithCommentsStateType } from '@cfEditableComponents/EditableComponentWithComments'
import { AppState, TNodeweek, TWorkflow } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import * as React from 'react'
import { connect } from 'react-redux'

import AlignmentHorizontalReverseNode from './AlignmentHorizontalReverseNode'

type ConnectedProps = {
  data: any
  workflow: TWorkflow
  nodeweeks: TNodeweek[]
}
type OwnProps = {
  objectId: number
  week_rank: number
  restriction_set: any
}
type StateProps = EditableComponentWithCommentsStateType
type PropsType = ConnectedProps & OwnProps

/**
 * The representation of a week in the alignment view.
 */
class AlignmentHorizontalReverseWeek extends EditableComponentWithComments<
  PropsType,
  StateProps
> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WEEK
    this.state = {} as StateProps
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const defaultText = data.weekTypeDisplay + ' ' + (this.props.week_rank + 1)

    const nodeweeks = this.props.nodeweeks.map((nodeweek, index) => {
      if (
        this.props.restriction_set &&
        this.props.restriction_set.nodes &&
        this.props.restriction_set.nodes.indexOf(nodeweek.node) == -1
      )
        return null
      return (
        <AlignmentHorizontalReverseNode
          key={index}
          objectId={nodeweek.node}
          restriction_set={this.props.restriction_set}
        />
      )
    })

    const permissions = calcWorkflowPermissions(
      this.props.workflow.userPermissions
    )

    const comments = permissions.read ? <this.AddCommenting /> : null

    return (
      <div
        className="week"
        ref={this.mainDiv}
        style={this.getBorderStyle()}
        onClick={(evt) =>
          this.context.selectionManager.changeSelection(evt, this)
        }
      >
        <TitleText text={data.title} defaultText={defaultText} />
        <div className="node-block">{nodeweeks}</div>
        {this.addEditable(data, true)}
        <div className="side-actions">
          <div className="comment-indicator-container"></div>
        </div>
        <div className="mouseover-actions">{comments}</div>
      </div>
    )
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  for (let i = 0; i < state.week.length; i++) {
    if (state.week[i].id == ownProps.objectId) {
      const week = state.week[i]
      const nodeweeks = Utility.filterThenSortByID(
        state.nodeweek,
        week.nodeweekSet
      )
      return {
        workflow: state.workflow,
        data: week,
        nodeweeks: nodeweeks
      }
    }
  }
}

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(AlignmentHorizontalReverseWeek)
