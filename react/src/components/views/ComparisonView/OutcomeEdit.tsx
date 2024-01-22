import * as React from 'react'
import { connect } from 'react-redux'

import { getSortedOutcomesFromOutcomeWorkflowSet } from '@cfFindState'
import { OutcomeEditViewUnconnected } from '../OutcomeEditView'
import { insertedAt } from '@XMLHTTP/postTemp.jsx'
import { insertedAtInstant } from '@XMLHTTP/API/global'
import { AppState } from '@cfRedux/types/type'
import {
  OutcomeEditViewProps,
  OutcomeEditViewState
} from '@cfViews/OutcomeEditView/OutcomeEditView'
import { CfObjectType } from '@cfModule/types/enum'
// import $ from 'jquery'

type ConnectedProps = {
  data: any
  workflow: any
}

type OwnProps = {
  objectID: number
} & OutcomeEditViewProps
type StateProps = OutcomeEditViewState
type PropsType = ConnectedProps & OwnProps

/**
 * The outcome edit view for the comparison
 */
class OutcomeEditUnconnected extends OutcomeEditViewUnconnected<
  PropsType,
  StateProps
> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getParentOutcomeBar() {
    return null
  }

  makeDragAndDrop() {
    this.makeSortableNode(
      $(this.mainDiv.current).find('.outcome-workflow').not('ui-draggable'),
      this.props.objectID,
      'outcomeworkflow',
      '.outcome-workflow',
      false,
      false,
      '#workflow-' + this.props.workflow.id
    )
    if (this.props.data.depth === 0) {
      // @ts-ignore // @todo where does this come from
      this.makeDroppable()
    }
  }

  sortableMovedOutFunction(id, new_position, type, new_parent, child_id) {
    if (
      type === CfObjectType.OUTCOMEWORKFLOW &&
      confirm(
        window.gettext(
          "You've moved an outcome to another workflow. Nodes tagged with this outcome will have it removed. Do you want to continue?"
        )
      )
    ) {
      insertedAt(
        // @ts-ignore
        this.props.renderer, // @todo context has replaced renderer and so 'drag action' is not available
        null,
        'outcome',
        this.props.workflow.id,
        'workflow',
        new_position,
        'outcomeworkflow'
      )
      insertedAtInstant(
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

const mapOutcomeComparisonStateToProps = (state: AppState): ConnectedProps => ({
  data: getSortedOutcomesFromOutcomeWorkflowSet(
    state,
    state.workflow.outcomeworkflow_set
  ),
  workflow: state.workflow
})

const OutcomeEdit = connect<ConnectedProps, object, OwnProps, AppState>(
  mapOutcomeComparisonStateToProps,
  null
)(OutcomeEditUnconnected)

export default OutcomeEdit
