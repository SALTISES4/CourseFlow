import ThemeHelper from '@cf/utility/ThemeHelper.class'
import Utility from '@cf/utility/Utility.class'
import { UtilityLoaderClass } from '@cf/utility/UtilityLoader.class'
import SortableDragAndDropManager from '@cfEditableComponents/SortableDragAndDropManager.class'
import ActionCreator from '@cfRedux/ActionCreator'
import { addStrategyQuery } from '@XMLHTTP/API/create'
import { columnChanged, insertedAt } from '@XMLHTTP/postTemp'

class WeekDragAndDropManager extends SortableDragAndDropManager {
  sortableColumnChangedFunction(id, deltaX, oldColumn) {
    const columns = this.props.columnOrder
    const oldColumnIndex = columns.indexOf(oldColumn)
    const newColumnIndex = oldColumnIndex + deltaX
    if (newColumnIndex < 0 || newColumnIndex >= columns.length) {
      return
    }
    const newColumn = columns[newColumnIndex]

    //legacy: hack debouncer
    // @todo ...
    if (this.recentlySentColumnChange) {
      if (
        this.recentlySentColumnChange.column === newColumn &&
        Date.now() - this.recentlySentColumnChange.lastCall <= 500
      ) {
        this.recentlySentColumnChange.lastCall = Date.now()
        return
      }
    }

    this.recentlySentColumnChange = {
      column: newColumn,
      lastCall: Date.now()
    }

    // assign the node to a new column within the week
    this.context.editableMethods.microUpdate(
      ActionCreator.columnChangeNode(id, newColumn)
    )
    columnChanged(this.context, id, newColumn) // @todo drag action needs to be designed and is not on renderer (context) anymore
  }

  sortableMovedFunction(id, newPosition, type, newParent, childId) {
    //Correction for if we are in a term
    // if (this.props.nodesByColumn) {
    //   for (const col in this.props.nodesByColumn) {
    //     if (this.props.nodesByColumn[col].indexOf(id) >= 0) {
    //       const previous = this.props.nodesByColumn[col][newPosition]
    //       newPosition = this.props.week.data.nodeweekSet.indexOf(previous)
    //     }
    //   }
    // }

    this.context.editableMethods.microUpdate(
      ActionCreator.moveNodeWeek(id, newPosition, newParent, childId)
    )
    insertedAt(
      this.context.selectionManager,
      childId,
      'node',
      newParent,
      'week',
      newPosition,
      'nodeweek'
    )
  }

  makeDroppable(sortableBlock: JQuery<HTMLElement>) {
    // this seems to be all about strategies

    if (!sortableBlock || true) {
      Utility.logger('no sortable block found ')
      return
    }

    sortableBlock.droppable({
      tolerance: 'pointer',
      droppable: '.strategy-ghost',
      over: (e, ui) => {
        const dropItem = $(e.target)
        const dragItem = ui.draggable
        const dragHelper = ui.helper

        if (dragItem.hasClass('new-strategy')) {
          dragHelper.addClass('valid-drop')
          dropItem.addClass('new-strategy-drop-over')
        } else {
          return
        }
      },
      out: (e, ui) => {
        const dragItem = ui.draggable
        const dragHelper = ui.helper
        const dropItem = $(e.target)
        if (dragItem.hasClass('new-strategy')) {
          dragHelper.removeClass('valid-drop')
          dropItem.removeClass('new-strategy-drop-over')
        }
      },
      drop: (e, ui) => {
        // yeah don't know about all this yet
        $('.new-strategy-drop-over').removeClass('new-strategy-drop-over')
        const dropItem = $(e.target)
        const dragItem = ui.draggable
        const newIndex = dropItem.parent().prevAll().length + 1
        if (dragItem.hasClass('new-strategy')) {
          const loader = new UtilityLoaderClass('body')
          addStrategyQuery(
            this.props.parentId,
            newIndex,
            // @todo HACK, this is being used to bypass react and pass information around the DOM
            // @ts-ignore
            dragItem[0].dataDraggable.strategy,
            (responseData) => {
              loader.endLoad()
            }
          )
        }
      }
    })
  }

  stopSortFunction() {
    ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
  }
}

export default WeekDragAndDropManager
