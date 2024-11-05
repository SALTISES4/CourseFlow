import { _t } from '@cf/utility/utilityFunctions'
import { TGetWeekByIDType, getWeekById } from '@cfFindState'
// @components
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import ComparisonNodeWeek from '@cfViews/ProjectComparisonView/ComparisonNodeWeek'
import {
  WeekUnconnected,
  WeekUnconnectedPropsType
} from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/Week'
import { insertedAtInstant } from '@XMLHTTP/API/update'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = TGetWeekByIDType
type OwnProps = {
  // renderer: any
  objectId: number
  parentId?: number
  throughParentId: number
} & WeekUnconnectedPropsType
type PropsType = ConnectedProps & OwnProps

/**
 * In the comparison view, the week should be only a single column
 * wide. In addition, we have the ability to move nodes out of the
 * week and into the week of another workflow.
 */
// @ts-ignore

export class WeekComparisonUnconnected extends WeekUnconnected<PropsType> {
  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.makeDragAndDrop()
    this.alignAllWeeks()
  }

  componentDidUpdate() {
    this.makeDragAndDrop()
    Utility.triggerHandlerEach(
      $(this.mainDiv.current).find('.node'),
      'component-updated'
    )
    this.alignAllWeeks()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  sortableColumnChangedFunction(id, deltaX, oldColumn) {
    console.log('column change not sent')
  }

  sortableMovedFunction(id, newPosition, type, newParent, childId) {
    this.context.editableMethods.microUpdate(
      ActionCreator.moveNodeWeek(id, newPosition, newParent, childId)
    )

    // @todo same issue with rendere / drag action
    insertedAt(
      // @ts-ignore dragaction
      this.props.renderer,
      childId,
      'node',
      newParent,
      'week',
      newPosition,
      'nodeweek'
    )
  }

  sortableMovedOutFunction(id, newPosition, type, newParent, childId) {
    if (
      confirm(
        _t(
          "You've moved a node to another workflow. Nodes lose all tagged outcomes when transferred between workflows. Do you want to continue?"
        )
      )
    ) {
      insertedAt(
        // @todo same issue with rendere / drag action
        // @ts-ignore dragaction
        this.props.renderer,
        null,
        'node',
        newParent,
        'week',
        newPosition,
        'nodeweek'
      )
      insertedAtInstant(
        childId,
        'node',
        newParent,
        'week',
        newPosition,
        'nodeweek'
      )
    }
  }

  makeDroppable() {}

  alignAllWeeks() {
    const rank = this.props.rank + 1
    $('.week-block .week-workflow:nth-child(' + rank + ') .week').css({
      height: ''
    })
    let maxHeight = 0
    $('.week-block .week-workflow:nth-child(' + rank + ') .week').each(
      function () {
        const thisHeight = $(this).height()
        if (thisHeight > maxHeight) {
          maxHeight = thisHeight
        }
      }
    )
    $('.week-block .week-workflow:nth-child(' + rank + ') .week').css({
      height: maxHeight + 'px'
    })
  }

  makeDragAndDrop() {
    //Makes the nodeweeks in the node block draggable
    this.makeSortableNode(
      $(this.nodeBlock.current).children('.node-week').not('.ui-draggable'),
      this.props.objectId,
      'nodeweek',
      '.node-week',
      false,
      [200, 1], // @todo // grid is not used
      '#workflow-' + this.props.workflowId,
      '.node',
      '.workflow-array'
    )
    this.makeDroppable()
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Nodes = () => {
    const nodes = this.props.data.nodeweekSet.map((nodeweek) => (
      <ComparisonNodeWeek
        key={nodeweek}
        objectId={nodeweek}
        parentId={this.props.data.id}
        // renderer={this.props.renderer}
        columnOrder={this.props.columnOrder}
      />
    ))
    if (nodes.length == 0) {
      nodes.push(
        <div className="node-week placeholder" style={{ height: '100%' }}>
          Drag and drop nodes from the sidebar to add.
        </div>
      )
    }
    return nodes
  }
}

const mapWeekStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetWeekByIDType => {
  return getWeekById(state, ownProps.objectId)
}

const ComparisonWeek = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekStateToProps,
  null
)(WeekComparisonUnconnected)

export default ComparisonWeek
