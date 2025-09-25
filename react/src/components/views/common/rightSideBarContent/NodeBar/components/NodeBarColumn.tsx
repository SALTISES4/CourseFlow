import * as Constants from '@cf/utility/constants'
import { TGetColumnByID, getColumnById } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import React, { useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

type OwnProps = {
  objectId?: number
  columnChoices?: any
  columnType?: any
}

const NodeBarColumn: React.FC<OwnProps> = ({
  objectId,
  columnChoices,
  columnType
}) => {
  const mainDiv = useRef<HTMLDivElement>(null)

  const column = useSelector<AppState, TGetColumnByID>((state) =>
    getColumnById(state, objectId)
  )

  const makeDraggable = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) {
        return
      }

      const draggableSelector = 'node-week'
      const draggableType = 'nodeweek'

      $(element).draggable({
        helper: (_e, _item) => {
          const helper = $(document.createElement('div'))
          helper.addClass('node-ghost')
          helper.appendTo(document.body)
          return helper
        },
        cursor: 'move',
        cursorAt: { top: 20, left: 100 },
        distance: 10,
        start: (_e, _ui) => {
          $('.workflow-canvas').addClass('dragging-' + draggableType)
          $(draggableSelector).addClass('dragging')
        },
        stop: (_e, _ui) => {
          $('.workflow-canvas').removeClass('dragging-' + draggableType)
          $(draggableSelector).removeClass('dragging')
        }
      })

      // @todo HACK, this is being used to bypass react and pass information around the DOM
      // see personal note about a global weakmap / context
      // depends on how long we're going to leave jquery draggable here for

      // @ts-ignore
      element.dataDraggable = {
        column: column.data.id,
        columnType: null
      }
    },
    [column] // Updates only if `data` changes
  )

  useEffect(() => {
    if (mainDiv.current) {
      makeDraggable(mainDiv.current)
    }
  }, [column])

  const title = column.data
    ? column.data.title || column.data.columnTypeDisplay
    : undefined

  return (
    <div
      dangerouslySetInnerHTML={{ __html: title }}
      className={`new-node node-bar-column node-bar-sortable column-${objectId}`}
      ref={mainDiv}
      style={{ backgroundColor: ThemeHelper.gerColumnColour(column.data) }}
    />
  )
}

export default NodeBarColumn
