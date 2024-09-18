import * as Constants from '@cf/constants'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/utilityFunctions'
import { newNodeQuery } from '@XMLHTTP/API/create'
import * as React from 'react'

import EditableComponentWithActions, {
  EditableComponentWithActionsProps,
  EditableComponentWithActionsState
} from './EditableComponentWithActions'
// import $ from 'jquery'

type OwnProps = {
  objectId?: number
} & EditableComponentWithActionsProps
export type EditableComponentWithSortingProps = OwnProps

type StateType = EditableComponentWithActionsState
export type EditableComponentWithSortingState = StateType

/**
 * Extends the React component to add a few features that are used in a large number of components
 */
class EditableComponentWithSorting<
  P extends OwnProps,
  S extends StateType
> extends EditableComponentWithActions<P, S> {
  static contextType = WorkFlowConfigContext

  declare context: React.ContextType<typeof WorkFlowConfigContext>

  /*******************************************************
   * PLACHOLDERS
   *******************************************************/

  // @todo this is an 'abstract like' placholder
  // this needs to be untangled
  sortableColumnChangedFunction(_id, _delta_x, _old_column) {
    console.log('column change not sent')
  }

  sortableMovedFunction(
    _drag_item_id: number,
    _new_index: number,
    _draggable_type: any,
    _new_parent_id: number,
    _child_id: number
  ) {
    console.log(
      'A sortable was moved out, but no specific function was given to the component.'
    )
  }

  sortableMovedOutFunction(
    _drag_item_id: number,
    _new_index: number,
    _draggable_type: any,
    _new_parent_id: number,
    _child_id: number
  ) {
    console.log(
      'A sortable was moved out, but no specific function was given to the component.'
    )
  }

  makeSortableNode(
    sortable_block: JQuery<HTMLElement>,
    parent_id:
      | string
      | number
      | ((this: any, index: number, attr: string) => string | number | void),
    draggable_type: string,
    draggable_selector: string,
    axis = false,
    grid: boolean | number[] = false, // @todo grid is not used
    restrictTo = null,
    handle: string | boolean = false, // @todo review this union
    containment = '.workflow-container'
  ) {
    if (this.context.permissions.workflowPermission.readOnly) {
      return
    }

    let cursorAt = {}
    if (draggable_type == 'weekworkflow') cursorAt = { top: 20 }
    if (draggable_type == 'nodeweek') cursorAt = { top: 20, left: 50 }
    const props = this.props
    sortable_block.draggable({
      containment: containment,
      // @ts-ignore
      axis: axis,
      cursor: 'move',
      cursorAt: cursorAt,
      handle: handle,
      distance: 10,
      refreshPositions: true,
      helper: (e, item) => {
        const helper = $(document.createElement('div'))
        helper.addClass(draggable_type + '-ghost')
        helper.appendTo('.workflow-wrapper > .workflow-container')
        helper.width($(e.target).width())
        return helper
      },
      start: (e, ui) => {
        const drag_item = $(e.target)
        if (
          drag_item.hasClass('placeholder') ||
          drag_item.hasClass('no-drag')
        ) {
          e.preventDefault()
          return false
        }
        if (
          drag_item.children(
            // @ts-ignore
            '.locked:not(.locked-' + COURSEFLOW_APP.contextData.userId + ')'
          ).length > 0
        ) {
          e.preventDefault()
          return false
        }
        $('.workflow-canvas').addClass('dragging-' + draggable_type)
        $(draggable_selector).addClass('dragging')
        drag_item.attr('data-old-parent-id', parent_id)
        drag_item.attr('data-restrict-to', restrictTo)
        const old_index = drag_item.prevAll().length
        drag_item.attr('data-old-index', old_index)
        this.context.selectionManager.changeSelection(null, null)
        this.startSortFunction(
          parseInt(drag_item.attr('data-child-id')),
          draggable_type
        )
      },
      drag: (e, ui) => {
        // console.log("in drag")
        // console.log(ui.helper)
        // console.log(ui.helper.offset())
        if (draggable_type == 'nodeweek') {
          const new_target = $(
            '#' + $(e.target).attr('id') + draggable_selector
          )
          // console.log("is nodeweek",
          //   handle,
          //   e.target,
          //   draggable_selector,
          //   $('#' + $(e.target).attr('id') + draggable_selector),
          //   $('#' + $(e.target).attr('id') + draggable_selector)
          //       // @ts-ignore
          //       .children(handle),
          //   $('#' + $(e.target).attr('id') + draggable_selector)
          //       // @ts-ignore
          //       .children(handle).first()
          // )
          // console.log("here is the handle:",handle,"that was the handle")
          // console.log("here is the selector:",draggable_selector,"that was the selector")
          // console.log(
          //   $('#' + $(e.target).attr('id') + draggable_selector)
          //       // @ts-ignore
          //       .children(handle)
          //       .first()
          //       .offset()
          // )
          const delta_x = Math.round(
            (ui.helper.offset().left -
              $('#' + $(e.target).attr('id') + draggable_selector)
                // @ts-ignore
                .children(handle)
                .first()
                .offset().left) /
              Constants.columnwidth
          )
          if (delta_x != 0) {
            const child_id = parseInt($(e.target).attr('data-child-id'))

            // @todo sortableColumnChangedFunction is only defined in week.tsx?

            this.sortableColumnChangedFunction(
              child_id,
              delta_x,
              parseInt(new_target.attr('data-column-id'))
            )
          }
        }
        //$("#"+$(e.target).attr("id")+draggable_selector).addClass("selected");
      },
      stop: (e, ui) => {
        $('.workflow-canvas').removeClass('dragging-' + draggable_type)
        $(draggable_selector).removeClass('dragging')
        $(document).triggerHandler(draggable_type + '-dropped')
        //$("#"+$(e.target).attr("id")+draggable_selector).removeClass("selected");
      }
    })

    sortable_block.droppable({
      tolerance: 'pointer',
      // @ts-ignore
      droppable: '.node-ghost',
      over: (e, ui) => {
        const drop_item = $(e.target)
        const drag_item = ui.draggable
        const drag_helper = ui.helper
        const new_index = drop_item.prevAll().length
        const new_parent_id = parseInt(drop_item.parent().attr('id'))
        if (draggable_type == 'nodeweek' && drag_item.hasClass('new-node')) {
          drag_helper.addClass('valid-drop')
          drop_item.addClass('new-node-drop-over')
        } else if (drag_item.is(draggable_selector)) {
          const old_parent_id = parseInt(drag_item.attr('data-old-parent-id'))
          const old_index = parseInt(drag_item.attr('data-old-index'))
          if (old_parent_id != new_parent_id || old_index != new_index) {
            const child_id = parseInt(drag_item.attr('data-child-id'))

            if (
              restrictTo &&
              drag_item.attr('data-restrict-to') != restrictTo
            ) {
              this.sortableMovedOutFunction(
                parseInt(drag_item.attr('id')),
                new_index,
                draggable_type,
                new_parent_id,
                child_id
              )
            } else {
              drag_item.attr('data-old-parent-id', new_parent_id)
              drag_item.attr('data-old-index', new_index)
              console.log(
                "About to call sortablemovedfunction, here's the drag item",
                drag_item
              )
              this.sortableMovedFunction(
                parseInt(drag_item.attr('id')),
                new_index,
                draggable_type,
                new_parent_id,
                child_id
              )
            }
            this.lockChild(child_id, true, draggable_type)
          }
        } else {
          //                    console.log(drag_item);
        }
      },
      out: (e, ui) => {
        const drag_item = ui.draggable
        const drag_helper = ui.helper
        const drop_item = $(e.target)
        if (draggable_type == 'nodeweek' && drag_item.hasClass('new-node')) {
          drag_helper.removeClass('valid-drop')
          drop_item.removeClass('new-node-drop-over')
        }
      },
      drop: (e, ui) => {
        $('.new-node-drop-over').removeClass('new-node-drop-over')
        const drop_item = $(e.target)
        const drag_item = ui.draggable
        const new_index = drop_item.prevAll().length + 1
        if (draggable_type == 'nodeweek' && drag_item.hasClass('new-node')) {
          newNodeQuery(
            this.props.objectId,
            new_index,
            // @ts-ignore
            drag_item[0].dataDraggable.column,
            // @ts-ignore
            drag_item[0].dataDraggable.columnType,
            (responseData) => {}
          )
        }
      }
    })
  }

  stopSortFunction() {}

  startSortFunction(id, through_type) {
    this.lockChild(id, true, through_type)
  }

  lockChild(id, lock, through_type) {
    let objectType

    if (through_type == 'nodeweek') objectType = 'node'
    if (through_type == 'weekworkflow') objectType = 'week'
    if (through_type == 'columnworkflow') objectType = 'column'
    if (through_type == 'outcomeoutcome') objectType = 'outcome'
    if (through_type == 'outcomeworkflow') objectType = 'outcome'

    this.context.editableMethods.lockUpdate(
      { objectId: id, objectType: objectType },
      Constants.lockTimes.move,
      lock
    )
  }
}

export default EditableComponentWithSorting
