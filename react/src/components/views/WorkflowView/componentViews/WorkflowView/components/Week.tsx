import * as Constants from '@cf/constants'
import { apiPaths } from '@cf/router/apiRoutes'
import { CfObjectType } from '@cf/types/enum'
import * as Utility from '@cf/utility/utilityFunctions'
import { UtilityLoader } from '@cf/utility/UtilityLoader'
import { TitleText } from '@cfComponents/UIPrimitives/Titles.ts'
import EditableComponentWithSorting from '@cfEditableComponents/EditableComponentWithSorting'
import {
  EditableComponentWithSortingProps,
  EditableComponentWithSortingState
} from '@cfEditableComponents/EditableComponentWithSorting'
import { TGetWeekByIDType, getWeekByID } from '@cfFindState'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import { addStrategyQuery } from '@XMLHTTP/API/create'
import { columnChanged, insertedAt } from '@XMLHTTP/postTemp.js'
import * as React from 'react'
import { connect } from 'react-redux'

import NodeWeek from './NodeWeek'

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

// import $ from 'jquery'

type ConnectedProps = {
  week: TGetWeekByIDType
  workflow: TWorkflow
}
type OwnProps = {
  throughParentID?: number
  rank?: number
  column_order?: any // @todo i think this is delivered by redux
  nodes_by_column?: any
} & EditableComponentWithSortingProps
export type WeekUnconnectedPropsType = OwnProps

type PropsType = OwnProps & ConnectedProps

/**
 * Renders a standard 'week-style' block of nodes, wherein the
 * nodes appear one above the other, never side by side
 */
class WeekUnconnected<P extends PropsType> extends EditableComponentWithSorting<
  P,
  EditableComponentWithSortingState
> {
  protected node_block: React.RefObject<HTMLDivElement>
  constructor(props: P) {
    super(props)
    this.objectType = CfObjectType.WEEK
    this.objectClass = '.week'
    this.node_block = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDragAndDrop()
  }

  componentDidUpdate() {
    this.makeDragAndDrop()
    Utility.triggerHandlerEach(
      $(this.mainDiv.current).find('.node'),
      'component-updated'
    )
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/

  makeDragAndDrop() {
    //Makes the nodeweeks in the node block draggable
    this.makeSortableNode(
      $(this.node_block.current).children('.node-week').not('.ui-draggable'),
      this.props.objectId,
      'nodeweek',
      '.node-week',
      false,
      // @ts-ignore
      [200, 1],
      null,
      '.node',
      '.week-block'
    )
    this.makeDroppable()
  }

  sortableColumnChangedFunction(id, delta_x, old_column) {
    const columns = this.props.column_order
    const old_column_index = columns.indexOf(old_column)
    const new_column_index = old_column_index + delta_x
    if (new_column_index < 0 || new_column_index >= columns.length) return
    const new_column = columns[new_column_index]

    //A little hack to stop ourselves from sending this update a hundred times per second
    // @todo ...
    // @ts-ignore
    if (this.recently_sent_column_change) {
      if (
        // @ts-ignore
        this.recently_sent_column_change.column === new_column &&
        // @ts-ignore
        Date.now() - this.recently_sent_column_change.lastCall <= 500
      ) {
        // @ts-ignore
        this.recently_sent_column_change.lastCall = Date.now()
        return
      }
    }

    // @ts-ignore
    this.recently_sent_column_change = {
      column: new_column,
      lastCall: Date.now()
    }

    this.lockChild(id, true, 'nodeweek')
    this.context.editableMethods.microUpdate(
      ActionCreator.columnChangeNode(id, new_column)
    )
    columnChanged(this.context, id, new_column) // @todo drag action needs to be designed and is not on renderer (context) anymore
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    //Correction for if we are in a term
    if (this.props.nodes_by_column) {
      for (const col in this.props.nodes_by_column) {
        if (this.props.nodes_by_column[col].indexOf(id) >= 0) {
          const previous = this.props.nodes_by_column[col][new_position]
          new_position = this.props.data.nodeweekSet.indexOf(previous)
        }
      }
    }

    this.context.editableMethods.microUpdate(
      ActionCreator.moveNodeWeek(id, new_position, new_parent, child_id)
    )
    insertedAt(
      this.context.selectionManager,
      child_id,
      'node',
      new_parent,
      'week',
      new_position,
      'nodeweek'
    )
  }

  makeDroppable() {
    const props = this.props
    $(this.mainDiv?.current).droppable({
      tolerance: 'pointer',
      // @ts-ignore
      droppable: '.strategy-ghost',
      over: (e, ui) => {
        const drop_item = $(e.target)
        const drag_item = ui.draggable
        const drag_helper = ui.helper

        if (drag_item.hasClass('new-strategy')) {
          drag_helper.addClass('valid-drop')
          drop_item.addClass('new-strategy-drop-over')
        } else {
          return
        }
      },
      out: (e, ui) => {
        const drag_item = ui.draggable
        const drag_helper = ui.helper
        const drop_item = $(e.target)
        if (drag_item.hasClass('new-strategy')) {
          drag_helper.removeClass('valid-drop')
          drop_item.removeClass('new-strategy-drop-over')
        }
      },
      drop: (e, ui) => {
        $('.new-strategy-drop-over').removeClass('new-strategy-drop-over')
        const drop_item = $(e.target)
        const drag_item = ui.draggable
        const new_index = drop_item.parent().prevAll().length + 1
        if (drag_item.hasClass('new-strategy')) {
          const loader = new UtilityLoader('body')
          addStrategyQuery(
            this.props.parentID,
            new_index,
            // @ts-ignore
            drag_item[0].dataDraggable.strategy,
            (responseData) => {
              loader.endLoad()
            }
          )
        }
      }
    })
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Nodes = () => {
    if (!this.props.week.data.nodeweekSet.length) {
      return (
        <div className="node-week placeholder" style={{ height: '100%' }}>
          Drag and drop nodes from the sidebar to add.
        </div>
      )
    }
    return this.props.week.data.nodeweekSet.map((nodeweek) => (
      <NodeWeek
        key={nodeweek}
        objectId={nodeweek}
        parentID={this.props.week.data.id}
        // renderer={this.props.renderer}
        column_order={this.props.week.column_order}
      />
    ))
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.week.data
    const selectionManager = this.context.selectionManager
    // const cssClass = 'week'

    const cssClasses = [
      'week',
      data.isStrategy ? 'strategy' : '',
      data.lock ? 'locked locked-' + data.lock.userId : '',
      data.isDropped ? ' dropped' : ''
    ].join(' ')

    const defaultText = !this.props.workflow.isStrategy
      ? data.weekTypeDisplay + ' ' + (this.props.rank + 1)
      : undefined
    const dropIcon = data.isDropped ? 'droptriangleup' : 'droptriangledown'

    const style: React.CSSProperties = {
      border: data.lock ? '2px solid ' + data.lock.userColour : undefined
    }

    const mouseoverActions = []
    if (
      this.props.workflow.workflowPermissions.write &&
      !this.props.workflow.isStrategy
    ) {
      mouseoverActions.push(<this.AddInsertSibling data={data} />)
      mouseoverActions.push(<this.AddDuplicateSelf data={data} />)
      mouseoverActions.push(<this.AddDeleteSelf data={data} />)
    }
    if (this.props.workflow.workflowPermissions.viewComments) {
      mouseoverActions.push(<this.AddCommenting />)
    }

    const portal = this.addEditable(data)

    return (
      <>
        {portal}
        <div
          style={style}
          className={cssClasses}
          ref={this.mainDiv}
          onClick={(evt) => selectionManager.changeSelection(evt, this)}
        >
          <div className="mouseover-container-bypass">
            <div className="mouseover-actions">{mouseoverActions}</div>
          </div>
          <TitleText text={data.title} defaultText={defaultText} />
          <div
            className="node-block"
            id={this.props.objectId + '-node-block'}
            ref={this.node_block}
          >
            <this.Nodes />
          </div>
          <div
            className="week-drop-row hover-shade"
            onClick={this.toggleDrop.bind(this)}
          >
            <div className="node-drop-side node-drop-left" />
            <div className="node-drop-middle">
              <img
                src={apiPaths.external.static_assets.icon + dropIcon + '.svg'}
              />
            </div>
            <div className="node-drop-side node-drop-right" />
          </div>
          {/* // @ts-ignore */}
          {
            // @ts-ignore
            // this.addEditable(data)
          }
          {/*// @todo verify this*/}
          {data.strategyClassification > 0 && (
            <div className="strategy-tab">
              <div className="strategy-tab-triangle" />
              <div className="strategy-tab-square">
                <div className="strategy-tab-circle">
                  <img
                    title={
                      choices.strategyClassification_choices?.find(
                        (obj) => obj.type === data.strategyClassification
                      ).name
                    }
                    src={
                      apiPaths.external.static_assets.icon +
                      Constants.strategyKeys[data.strategyClassification] +
                      '.svg'
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    )
  }
}
const mapWeekStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  return {
    week: getWeekByID(state, ownProps.objectId),
    workflow: state.workflow
  }
}

const Week = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekStateToProps,
  null
)(WeekUnconnected)

export default Week
export { WeekUnconnected }
