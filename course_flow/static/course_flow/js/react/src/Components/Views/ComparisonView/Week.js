import * as React from 'react'
import { Provider, connect } from 'react-redux'
import {
  EditableComponentWithSorting,
  TitleText
} from '../../components/CommonComponents'
import NodeWeek from './NodeWeek.js'
import { getWeekByID, getNodeWeekByID } from '../../../redux/FindState.js'
import * as Constants from '../../../Constants.js'
import { columnChangeNode, moveNodeWeek } from '../../../redux/Reducers.js'
import {
  toggleDrop,
  insertedAt,
  insertedAtInstant,
  columnChanged,
  addStrategy,
  updateValueInstant
} from '../../../PostFunctions.js'
import * as Utility from '../../../UtilityFunctions.js'
import { WeekUnconnected } from '../WorkflowView'

/**
 * In the comparison view, the week should be only a single column
 * wide. In addition, we have the ability to move nodes out of the
 * week and into the week of another workflow.
 */
export class WeekComparisonUnconnected extends WeekUnconnected {
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
      $(this.maindiv.current).find('.node'),
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
    this.props.renderer.micro_update(
      moveNodeWeek(id, new_position, new_parent, child_id)
    )
    insertedAt(
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
        gettext(
          "You've moved a node to another workflow. Nodes lose all tagged outcomes when transferred between workflows. Do you want to continue?"
        )
      )
    ) {
      insertedAt(
        this.props.renderer,
        null,
        'node',
        new_parent,
        'week',
        new_position,
        'nodeweek'
      )
      insertedAtInstant(
        this.props.renderer,
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

  getNodes() {
    let nodes = this.props.data.nodeweek_set.map((nodeweek) => (
      <NodeWeek
        key={nodeweek}
        objectID={nodeweek}
        parentID={this.props.data.id}
        renderer={this.props.renderer}
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

  alignAllWeeks() {
    let rank = this.props.rank + 1
    $('.week-block .week-workflow:nth-child(' + rank + ') .week').css({
      height: ''
    })
    let max_height = 0
    $('.week-block .week-workflow:nth-child(' + rank + ') .week').each(
      function () {
        let this_height = $(this).height()
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
      [200, 1],
      '#workflow-' + this.props.workflow_id,
      '.node',
      '.workflow-array'
    )
    this.makeDroppable()
  }
}
const mapWeekStateToProps = (state, own_props) =>
  getWeekByID(state, own_props.objectID)

const WeekComparison = connect(
  mapWeekStateToProps,
  null
)(WeekComparisonUnconnected)

export default WeekComparison
