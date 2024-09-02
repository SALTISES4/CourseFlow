import * as React from 'react'
import { connect } from 'react-redux'
import * as Utility from '@cfUtility'
import { getWeekByID, TGetWeekByIDType } from '@cfFindState'
// @components
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import { insertedAtInstant } from '@XMLHTTP/API/update'
import ComparisonNodeWeek from '@cfViews/ProjectComparisonView/ComparisonNodeWeek'
import {
  WeekUnconnected,
  WeekUnconnectedPropsType
} from '@cfViews/WorkflowView/componentViews/WorkflowView/components/Week'
import { _t } from '@cf/utility/utilityFunctions'

type ConnectedProps = TGetWeekByIDType
type OwnProps = {
  // renderer: any
  objectID: number
  parentID?: number
  throughParentID: number
} & WeekUnconnectedPropsType
type PropsType = ConnectedProps & OwnProps

/**
 * In the comparison view, the week should be only a single column
 * wide. In addition, we have the ability to move nodes out of the
 * week and into the week of another workflow.
 */
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
  sortableColumnChangedFunction(id, delta_x, old_column) {
    console.log('column change not sent')
  }

  sortableMovedFunction(id, new_position, type, new_parent, child_id) {
    this.context.editableMethods.micro_update(
      ActionCreator.moveNodeWeek(id, new_position, new_parent, child_id)
    )

    // @todo same issue with rendere / drag action
    insertedAt(
      // @ts-ignore dragaction
      this.props.renderer,
      child_id,
      'node',
      new_parent,
      'week',
      new_position,
      'nodeweek'
    )
  }

  sortableMovedOutFunction(id, new_position, type, new_parent, child_id) {
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
        new_parent,
        'week',
        new_position,
        'nodeweek'
      )
      insertedAtInstant(
        child_id,
        'node',
        new_parent,
        'week',
        new_position,
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
    let max_height = 0
    $('.week-block .week-workflow:nth-child(' + rank + ') .week').each(
      function () {
        const this_height = $(this).height()
        if (this_height > max_height) max_height = this_height
      }
    )
    $('.week-block .week-workflow:nth-child(' + rank + ') .week').css({
      height: max_height + 'px'
    })
  }

  makeDragAndDrop() {
    //Makes the nodeweeks in the node block draggable
    this.makeSortableNode(
      $(this.node_block.current).children('.node-week').not('.ui-draggable'),
      this.props.objectID,
      'nodeweek',
      '.node-week',
      false,
      [200, 1], // @todo // grid is not used
      '#workflow-' + this.props.workflow_id,
      '.node',
      '.workflow-array'
    )
    this.makeDroppable()
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Nodes = () => {
    const nodes = this.props.data.nodeweek_set.map((nodeweek) => (
      <ComparisonNodeWeek
        key={nodeweek}
        objectID={nodeweek}
        parentID={this.props.data.id}
        // renderer={this.props.renderer}
        column_order={this.props.column_order}
      />
    ))
    if (nodes.length == 0)
      nodes.push(
        <div className="node-week placeholder" style={{ height: '100%' }}>
          Drag and drop nodes from the sidebar to add.
        </div>
      )
    return nodes
  }
}

const mapWeekStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetWeekByIDType => {
  return getWeekByID(state, ownProps.objectID)
}

const ComparisonWeek = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekStateToProps,
  null
)(WeekComparisonUnconnected)

export default ComparisonWeek
