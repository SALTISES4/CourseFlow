import { CfObjectType } from '@cf/types/enum.js'
import { calcWorkflowPermissions } from '@cf/utility/permissions'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TNodeweek, TWeek, TWorkflow } from '@cfRedux/types/type'
import { Dispatch } from '@reduxjs/toolkit'
import * as React from 'react'
import { connect } from 'react-redux'
import { Action } from 'redux'

import AlignmentHorizontalReverseNode from './AlignmentHorizontalReverseNode'

type ConnectedProps = {
  week: TWeek
  workflow: TWorkflow
  nodeweeks: TNodeweek[]
}
type OwnProps = {
  parentId: number
  objectId: number
  weekRank: number
  restrictionSet: any
} & { dispatch?: Dispatch<Action> }

type StateProps = {}
type PropsType = ConnectedProps & OwnProps

/**
 * The representation of a week in the alignment view.
 */
class AlignmentHorizontalReverseWeek extends React.Component<
  PropsType,
  StateProps
> {
  private manager: BetterSelectionManager
  private objectType: CfObjectType
  private mainDiv: React.RefObject<HTMLDivElement>

  constructor(props: PropsType) {
    super(props)
    this.manager = new BetterSelectionManager(this.props.dispatch)

    this.mainDiv = React.createRef()

    this.objectType = CfObjectType.WEEK
    this.state = {} as StateProps
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const week = this.props.week

    const defaultText = week.weekTypeDisplay + ' ' + (this.props.weekRank + 1)

    const nodeweeks = this.props.nodeweeks.map((nodeweek, index) => {
      if (this.props.restrictionSet.nodes.indexOf(nodeweek.node) == -1) {
        return null
      }
      return (
        <AlignmentHorizontalReverseNode
          key={index}
          parentId={week.id}
          objectId={nodeweek.node}
          restrictionSet={this.props.restrictionSet}
        />
      )
    })

    const permissions = calcWorkflowPermissions(
      this.props.workflow.userPermissions
    )

    //    const comments = permissions.read ? <this.AddCommenting /> : null
    const comments = permissions.read ? <> add commentbox placeholder</> : null

    //      {this.addEditable(data, true)}
    return (
      <div
        className="week"
        ref={this.mainDiv}
        style={ThemeHelper.getBorderStyle({
          isLocked: week.lock.lock,
          colour: week.lock.userColour
        })}
        onClick={(e) => {
          e.stopPropagation()
          this.manager.updateSidebar(
            week.id,
            this.objectType,
            this.props.parentId
          )
        }}
      >
        <TitleText text={week.title} defaultText={defaultText} />
        <div className="node-block">{nodeweeks}</div>

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
      const nodeweeks = Utility.filterThenSortById(
        state.nodeweek,
        week.nodeweekSet
      )
      return {
        workflow: state.workflow,
        week: week,
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
