import { UserContext } from '@cf/context/userContext'
import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import Utility from '@cf/utility/Utility.class'
import { newNodeQuery } from '@XMLHTTP/API/create'
import * as React from 'react'

// import $ from 'jquery'

type OwnProps = {
  objectId: number
  parentId: number
}
export type EditableComponentWithSortingProps = OwnProps

type StateType = {}
export type EditableComponentWithSortingState = StateType

/**
 * Extends the React component to add a few features that are used in a large number of components
 */
class EditableComponentWithSorting<
  P extends OwnProps,
  S extends StateType
> extends React.Component<P, S> {
  static contextType = WorkflowConfigContext
  static userContextType = UserContext

  declare context: React.ContextType<typeof WorkflowConfigContext>
  declare userContext: React.ContextType<typeof UserContext>

  constructor(props: P) {
    super(props)
    this.state = {} as S
  }

  /*******************************************************
   * PLACHOLDERS
   *******************************************************/

  sortableColumnChangedFunction(_id, _deltaX, _oldColumn) {
    Utility.logger('column change not sent')
  }

  sortableMovedFunction(
    _dragItemId: number,
    _newIndex: number,
    _draggableType: any,
    _newParentId: number,
    _childId: number
  ) {
    Utility.logger(
      'A sortable was moved out, but no specific function was given to the component.'
    )
  }

  sortableMovedOutFunction(
    _dragItemId: number,
    _newIndex: number,
    _draggableType: any,
    _newParentId: number,
    _childId: number
  ) {
    Utility.logger(
      'A sortable was moved out, but no specific function was given to the component.'
    )
  }

  makeSortableNode(
    sortableBlock: JQuery<HTMLElement>,
    parentId:
      | string
      | number
      | ((this: any, index: number, attr: string) => string | number | void),
    draggableType: string,
    draggableSelector: string,
    axis = false,
    grid: boolean | number[] = false, // @todo grid is not used
    restrictTo = null,
    handle: string | boolean = false, // @todo review this union
    containment = '.workflow-container'
  ) {
    // This is because we moved workflow out of context
    // but we aren't  going to wrap this one yet
    // if (this.context.permissions.workflowPermissions.readOnly) {

    if (false) {
      return
    }

    let cursorAt = {}
    if (draggableType == 'weekworkflow') {
      cursorAt = { top: 20 }
    }
    if (draggableType == 'nodeweek') {
      cursorAt = { top: 20, left: 50 }
    }



    sortableBlock.draggable({
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
        helper.addClass(draggableType + '-ghost')
        helper.appendTo('.workflow-wrapper > .workflow-container')
        helper.width($(e.target).width())
        return helper
      },
      start: (e, ui) => {
        const dragItem = $(e.target)

        if (dragItem.hasClass('placeholder') || dragItem.hasClass('no-drag')) {
          e.preventDefault()
          return false
        }

        // if (
        //   dragItem.children('.locked:not(.locked-' + this.userContext.id + ')')
        //     .length > 0
        // ) {
        //   e.preventDefault()
        //   return false
        // }

        $('.workflow-canvas').addClass('dragging-' + draggableType)
        $(draggableSelector).addClass('dragging')
        dragItem.attr('data-old-parent-id', parentId)
        dragItem.attr('data-restrict-to', restrictTo)
        const oldIndex = dragItem.prevAll().length
        dragItem.attr('data-old-index', oldIndex)

        this.context.selectionManager.changeSelection({
          evt: null,
          newSelection: null
        })

        this.startSortFunction(
          parseInt(dragItem.attr('data-child-id')),
          draggableType
        )
      },
      drag: (e, ui) => {
        if (draggableType == 'nodeweek') {
          const newTarget = $('#' + $(e.target).attr('id') + draggableSelector)
          const deltaX = Math.round(
            (ui.helper.offset().left -
              $('#' + $(e.target).attr('id') + draggableSelector)
                // @ts-ignore
                .children(handle)
                .first()
                .offset().left) /
              Constants.columnwidth
          )
          if (deltaX != 0) {
            const childId = parseInt($(e.target).attr('data-child-id'))

            // @todo sortableColumnChangedFunction is only defined in week.tsx?

            this.sortableColumnChangedFunction(
              childId,
              deltaX,
              parseInt(newTarget.attr('data-column-id'))
            )
          }
        }
        //$("#"+$(e.target).attr("id")+draggableSelector).addClass("selected");
      },
      stop: (e, ui) => {
        $('.workflow-canvas').removeClass('dragging-' + draggableType)
        $(draggableSelector).removeClass('dragging')
        $(document).triggerHandler(draggableType + '-dropped')
        //$("#"+$(e.target).attr("id")+draggableSelector).removeClass("selected");
      }
    })

    sortableBlock.droppable({
      tolerance: 'pointer',
      // @ts-ignore
      droppable: '.node-ghost',
      over: (e, ui) => {
        const dropItem = $(e.target)
        const dragItem = ui.draggable
        const dragHelper = ui.helper
        const newIndex = dropItem.prevAll().length
        const newParentId = parseInt(dropItem.parent().attr('id'))

        if (draggableType == 'nodeweek' && dragItem.hasClass('new-node')) {
          dragHelper.addClass('valid-drop')
          dropItem.addClass('new-node-drop-over')
        } else if (dragItem.is(draggableSelector)) {
          const oldParentId = parseInt(dragItem.attr('data-old-parent-id'))
          const oldIndex = parseInt(dragItem.attr('data-old-index'))

          if (oldParentId != newParentId || oldIndex != newIndex) {
            const childId = parseInt(dragItem.attr('data-child-id'))

            if (restrictTo && dragItem.attr('data-restrict-to') != restrictTo) {
              this.sortableMovedOutFunction(
                parseInt(dragItem.attr('id')),
                newIndex,
                draggableType,
                newParentId,
                childId
              )
            } else {
              dragItem.attr('data-old-parent-id', newParentId)
              dragItem.attr('data-old-index', newIndex)
              Utility.logger(
                "About to call sortablemovedfunction, here's the drag item",
                dragItem
              )
              this.sortableMovedFunction(
                parseInt(dragItem.attr('id')),
                newIndex,
                draggableType,
                newParentId,
                childId
              )
            }
            this.lockChild(childId, true, draggableType as CfObjectType)
          }
        } else {
          //                    Utility.logger(dragItem);
        }
      },
      out: (e, ui) => {
        const dragItem = ui.draggable
        const dragHelper = ui.helper
        const dropItem = $(e.target)
        if (draggableType == 'nodeweek' && dragItem.hasClass('new-node')) {
          dragHelper.removeClass('valid-drop')
          dropItem.removeClass('new-node-drop-over')
        }
      },
      drop: (e, ui) => {
        $('.new-node-drop-over').removeClass('new-node-drop-over')
        const dropItem = $(e.target)
        const dragItem = ui.draggable
        const newIndex = dropItem.prevAll().length + 1

        // @todo HACK, this is being used to bypass react and pass information around the DOM
        if (draggableType == 'nodeweek' && dragItem.hasClass('new-node')) {
          newNodeQuery(
            this.props.objectId,
            newIndex,
            // @ts-ignore
            dragItem[0].dataDraggable.column,
            // @ts-ignore
            dragItem[0].dataDraggable.columnType,
            (responseData) => {}
          )
        }
      }
    })
  }

  stopSortFunction() {}

  startSortFunction(id, throughType) {
    this.lockChild(id, true, throughType)
  }

  lockChild(id: number, lock: boolean, throughType: CfObjectType) {
    let objectType: CfObjectType

    if (throughType == 'nodeweek') {
      objectType = CfObjectType.NODE
    }
    if (throughType == 'weekworkflow') {
      objectType = CfObjectType.WEEK
    }
    if (throughType == 'columnworkflow') {
      objectType = CfObjectType.COLUMN
    }
    if (throughType == 'outcomeoutcome') {
      objectType = CfObjectType.OUTCOME
    }
    if (throughType == 'outcomeworkflow') {
      objectType = CfObjectType.OUTCOME
    }

    this.context.editableMethods.lockUpdate(
      {
        objectId: id,
        objectType: objectType
      },
      Constants.lockTimes.move,
      lock
    )
  }
}

export default EditableComponentWithSorting
