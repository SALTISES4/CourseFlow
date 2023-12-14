import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect } from 'react-redux'

import { insertedAt, insertedAtInstant } from '../../../PostFunctions.js'
import { getSortedOutcomesFromOutcomeWorkflowSet } from '../../../redux/FindState.js'
import { OutcomeEditViewUnconnected } from '../OutcomeEditView'

/**
 * The outcome edit view for the comparison
 */
class OutcomeEditUnconnected extends OutcomeEditViewUnconnected {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getParentOutcomeBar() {
    return null
  }

  makeDragAndDrop() {
    this.makeSortableNode(
      $(this.maindiv.current).find('.outcome-workflow').not('ui-draggable'),
      this.props.objectID,
      'outcomeworkflow',
      '.outcome-workflow',
      false,
      false,
      '#workflow-' + this.props.workflow.id
    )
    if (this.props.data.depth == 0) this.makeDroppable()
  }

  sortableMovedOutFunction(id, new_position, type, new_parent, child_id) {
    if (
      type == 'outcomeworkflow' &&
      confirm(
        gettext(
          "You've moved an outcome to another workflow. Nodes tagged with this outcome will have it removed. Do you want to continue?"
        )
      )
    ) {
      insertedAt(
        this.props.renderer,
        null,
        'outcome',
        this.props.workflow.id,
        'workflow',
        new_position,
        'outcomeworkflow'
      )
      insertedAtInstant(
        this.props.renderer,
        child_id,
        'outcome',
        this.props.workflow.id,
        'workflow',
        new_position,
        'outcomeworkflow'
      )
    }
  }
}

const mapOutcomeComparisonStateToProps = (state) => ({
  data: getSortedOutcomesFromOutcomeWorkflowSet(
    state,
    state.workflow.outcomeworkflow_set
  ),
  workflow: state.workflow
})
const OutcomeEdit = connect(
  mapOutcomeComparisonStateToProps,
  null
)(OutcomeEditUnconnected)

export default OutcomeEdit
