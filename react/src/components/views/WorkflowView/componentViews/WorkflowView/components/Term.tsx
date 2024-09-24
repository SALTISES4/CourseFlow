import { apiPaths } from '@cf/router/apiRoutes'
import { TTermByID, getTermByID } from '@cfFindState'
// import $ from 'jquery'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import NodeWeek from '@cfViews/WorkflowView/componentViews/WorkflowView/components/NodeWeek'
import {
  WeekUnconnected,
  WeekUnconnectedPropsType
} from '@cfViews/WorkflowView/componentViews/WorkflowView/components/Week'
import * as React from 'react'
import { connect } from 'react-redux'
import {TitleText} from "@cfComponents/UIPrimitives/Titles.ts";

type OwnProps = {
  objectId: number
  throughParentID?: any
} & WeekUnconnectedPropsType

type ConnectedProps = {
  term: TTermByID
  workflow: TWorkflow
}

type PropsType = OwnProps & ConnectedProps

/**
 * The term variation of a week, used in the program level or in the
 * condensed view. This displays the nodes side by side.
 */
// @ts-ignore
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
      this.props.objectId,
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
      for (let j = 0; j < data.nodeweekSet.length; j++) {
        const nodeweek = data.nodeweekSet[j]
        if (this.props.nodes_by_column[col].indexOf(nodeweek) >= 0) {
          nodeweeks.push(
            <NodeWeek
              key={nodeweek}
              objectId={nodeweek}
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
          id={this.props.objectId + '-node-block-column-' + col}
          key={col}
        >
          {nodeweeks}
        </div>
      )
    }

    const cssClasses = [
      'week',
      data.isStrategy ? 'strategy' : '',
      data.lock ? 'locked locked-' + data.lock.userId : '',
      data.isDropped ? ' dropped' : ''
    ].join(' ')
    // const cssClass = 'week'
    // if (data.isStrategy) cssClass += ' strategy'
    // if (data.lock) cssClass += ' locked locked-' + data.lock.userId
    //    if (data.isDropped) cssClass += ' dropped'

    const style = {
      border: data.lock ? '2px solid ' + data.lock.userColour : undefined
    }

    const dropIcon = data.isDropped ? 'droptriangleup' : 'droptriangledown'

    const mouseover_actions = []

    if (this.props.workflow.workflowPermissions.write) {
      mouseover_actions.push(<this.AddInsertSibling data={data} />)
      mouseover_actions.push(<this.AddDuplicateSelf data={data} />)
      mouseover_actions.push(<this.AddDeleteSelf data={data} />)
    }

    if (this.props.workflow.workflowPermissions.viewComments) {
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
            defaultText={data.weekTypeDisplay + ' ' + (this.props.rank + 1)}
          />
          <div
            className="node-block"
            id={this.props.objectId + '-node-block'}
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
                src={apiPaths.external.static_assets.icon + dropIcon + '.svg'}
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
  return {
    term: getTermByID(state, ownProps.objectId),
    workflow: state.workflow
  }
}

export default connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(Term)
