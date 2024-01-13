//Extends the react component to add a few features that are used in a large number of components
import * as Constants from '@cfConstants'
import EditableComponentWithActions, {
  EditableComponentWithActionsProps,
  EditableComponentWithCommentsState
} from './EditableComponentWithActions'
// import $ from 'jquery'
import { newNodeQuery } from '@XMLHTTP/APIFunctions'

type OwnProps = {
  objectID: number
} & EditableComponentWithActionsProps
export type EditableComponentWithSortingProps = OwnProps

type StateType = EditableComponentWithCommentsState
export type EditableComponentWithSortingState = StateType

class EditableComponentWithSorting<
  P extends OwnProps,
  S extends StateType
> extends EditableComponentWithActions<P, S> {
  /*******************************************************
   * PLACHOLDERS
   *******************************************************/

  // @todo this is an 'abstract like' placholder
  // this needs to be untangled
  sortableColumnChangedFunction(id, delta_x, old_column) {
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
    grid = false,
    restrictTo = null,
    handle = false,
    containment = '.workflow-container'
  ) {
    if (this.props.renderer.read_only) return
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
            '.locked:not(.locked-' + COURSEFLOW_APP.contextData.user_id + ')'
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
        props.renderer.selection_manager.changeSelection(null, null)
        this.startSortFunction(
          parseInt(drag_item.attr('data-child-id')),
          draggable_type
        )
      },
      drag: (e, ui) => {
        if (draggable_type == 'nodeweek') {
          const new_target = $(
            '#' + $(e.target).attr('id') + draggable_selector
          )
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
            this.props.objectID,
            new_index,
            // @ts-ignore
            drag_item[0].dataDraggable.column,
            // @ts-ignore
            drag_item[0].dataDraggable.column_type,
            (response_data) => {}
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
    let object_type

    if (through_type == 'nodeweek') object_type = 'node'
    if (through_type == 'weekworkflow') object_type = 'week'
    if (through_type == 'columnworkflow') object_type = 'column'
    if (through_type == 'outcomeoutcome') object_type = 'outcome'
    if (through_type == 'outcomeworkflow') object_type = 'outcome'

    this.props.renderer.lock_update(
      { object_id: id, object_type: object_type },
      Constants.lock_times.move,
      lock
    )
  }
}

export default EditableComponentWithSorting
