import * as React from 'react'
import { connect } from 'react-redux'
import { EditableComponentWithComments } from '@cfParentComponents'
import { TitleText } from '@cfUIComponents'
import * as Utility from '@cfUtility'
import AlignmentHorizontalReverseNode from './AlignmentHorizontalReverseNode'
import { CfObjectType } from '@cfModule/types/enum.js'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
import { AppState } from '@cfRedux/types/type'
import { EditableComponentWithCommentsStateType } from '@cfParentComponents/EditableComponentWithComments'

type ConnectedProps = {
  data: any
  nodeweeks: any
}
type OwnProps = {
  objectID: number
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

    const default_text =
      data.week_type_display + ' ' + (this.props.week_rank + 1)

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
          objectID={nodeweek.node}
          restriction_set={this.props.restriction_set}
        />
      )
    })

    const comments = this.context.view_comments ? this.addCommenting() : null

    return (
      <div
        className="week"
        ref={this.mainDiv}
        style={this.get_border_style()}
        onClick={(evt) =>
          this.context.selection_manager.changeSelection(evt, this)
        }
      >
        <TitleText text={data.title} defaultText={default_text} />
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
    if (state.week[i].id == ownProps.objectID) {
      const week = state.week[i]
      const nodeweeks = Utility.filterThenSortByID(
        state.nodeweek,
        week.nodeweek_set
      )
      return {
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
