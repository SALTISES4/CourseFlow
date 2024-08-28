import * as React from 'react'
import { connect } from 'react-redux'
import { TitleText } from '@cfCommonComponents/UIComponents/Titles'
import { getTermByID, TTermByID } from '@cfFindState'
// import $ from 'jquery'
import { AppState } from '@cfRedux/types/type'
import {
  WeekUnconnected,
  WeekUnconnectedPropsType
} from '@cfViews/WorkflowView/componentViews/WorkflowView/components/Week'
import NodeWeek from '@cfViews/WorkflowView/componentViews/WorkflowView/components/NodeWeek'

type OwnProps = {
  objectID: number
  throughParentID?: any
} & WeekUnconnectedPropsType
type ConnectedProps = TTermByID
type PropsType = OwnProps & ConnectedProps

/**
 * The term variation of a week, used in the program level or in the
 * condensed view. This displays the nodes side by side.
 */
class Term extends WeekUnconnected<PropsType> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  makeDragAndDrop() {
    //Makes the nodeweeks in the node block draggable
    this.makeSortableNode(
      $(this.node_block.current)
        .children()
        .children('.node-week')
        .not('.ui-draggable'),
      this.props.objectID,
      'nodeweek',
      '.node-week',
      false,
      // @ts-ignore
      [200, 1],
      null,
      '.node'
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    const node_blocks = []
    for (let i = 0; i < this.props.column_order.length; i++) {
      const col = this.props.column_order[i]
      const nodeweeks = []
      for (let j = 0; j < data.nodeweek_set.length; j++) {
        const nodeweek = data.nodeweek_set[j]
        if (this.props.nodes_by_column[col].indexOf(nodeweek) >= 0) {
          nodeweeks.push(
            <NodeWeek
              key={nodeweek}
              objectID={nodeweek}
              parentID={data.id}
              // renderer={this.props.renderer}
              column_order={this.props.column_order}
            />
          )
        }
      }
      if (nodeweeks.length == 0)
        nodeweeks.push(
          <div
            className="node-week placeholder"
            style={{ height: '100%' }}
          ></div>
        )
      node_blocks.push(
        <div
          className={'node-block term column-' + col}
          id={this.props.objectID + '-node-block-column-' + col}
          key={col}
        >
          {nodeweeks}
        </div>
      )
    }

    const cssClasses = [
      'week',
      data.is_strategy ? 'strategy' : '',
      data.lock ? 'locked locked-' + data.lock.user_id : '',
      data.is_dropped ? ' dropped' : ''
    ].join(' ')
    // const css_class = 'week'
    // if (data.is_strategy) css_class += ' strategy'
    // if (data.lock) css_class += ' locked locked-' + data.lock.user_id
    //    if (data.is_dropped) css_class += ' dropped'

    const style = {
      border: data.lock ? '2px solid ' + data.lock.user_colour : undefined
    }

    const dropIcon = data.is_dropped ? 'droptriangleup' : 'droptriangledown'

    const mouseover_actions = []
    if (!this.context.permissions.workflowPermission.readOnly) {
      mouseover_actions.push(<this.AddInsertSibling data={data} />)
      mouseover_actions.push(<this.AddDuplicateSelf data={data} />)
      mouseover_actions.push(<this.AddDeleteSelf data={data} />)
    }
    if (this.context.workflow.view_comments) {
      mouseover_actions.push(<this.AddCommenting />)
    }

    return (
      <>
        {this.addEditable(data)}

        <div
          style={style}
          className={cssClasses}
          ref={this.mainDiv}
          onClick={(evt) =>
            this.context.selectionManager.changeSelection(evt, this)
          }
        >
          <div className="mouseover-container-bypass">
            <div className="mouseover-actions">{mouseover_actions}</div>
          </div>
          <TitleText
            text={data.title}
            defaultText={data.week_type_display + ' ' + (this.props.rank + 1)}
          />
          <div
            className="node-block"
            id={this.props.objectID + '-node-block'}
            ref={this.node_block}
          >
            {node_blocks}
          </div>
          <div
            className="week-drop-row hover-shade"
            onClick={this.toggleDrop.bind(this)}
          >
            <div className="node-drop-side node-drop-left"></div>
            <div className="node-drop-middle">
              <img
                src={
                  COURSEFLOW_APP.globalContextData.path.static_assets.icon +
                  dropIcon +
                  '.svg'
                }
              />
            </div>
            <div className="node-drop-side node-drop-right"></div>
          </div>
        </div>
      </>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return getTermByID(state, ownProps.objectID)
}
export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(Term)
