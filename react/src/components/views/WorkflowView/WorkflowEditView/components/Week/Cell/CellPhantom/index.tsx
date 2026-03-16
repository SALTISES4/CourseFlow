import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { isGridCell } from '@cfViews/WorkflowView/WorkflowEditView/types'
import { alpha } from '@mui/material'
import Box from '@mui/material/Box'
import { produce } from 'immer'
import { useEffect, useState } from 'react'

import DropIndicator from '../DropIndicator'
import { WeekCellPhantomTypeInternal, WeekCellType } from '../types'

const WeekCellPhantom = ({
  columnId,
  coordsY,
  coordsWeek,
  highlight,
  borderColor,
  wrapRef,
  insertMode,
  emptyRow,
  onDrop
}: WeekCellPhantomTypeInternal) => {
  const [state, setState] = useState({
    draggedOver: false,
    closestEdge: null
  })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) {
      return null
    }

    return dropTargetForElements({
      element: el,
      getData: ({ input, element }) => {
        return attachClosestEdge(
          {},
          {
            input,
            element,
            allowedEdges: ['top', 'bottom']
          }
        )
      },
      onDrag: ({ source, self }) => {
        if (!isGridCell(source.data)) {
          return
        }
        setState(
          produce((draft) => {
            draft.closestEdge = extractClosestEdge(self.data)
          })
        )
      },
      onDragEnter: () => {
        setState(
          produce((draft) => {
            draft.draggedOver = true
          })
        )
      },
      onDragLeave: () => {
        setState({
          draggedOver: false,
          closestEdge: null
        })
      },
      canDrop: ({ source }) => {
        return isGridCell(source.data)
      },
      onDrop: ({ source, self }) => {
        const dropped = source.data
        if (!isGridCell(dropped)) {
          return null
        }

        if (isGridCell(dropped)) {
          onDrop({
            type: WeekCellType.PHANTOM,
            edge:
              insertMode === 'column' || emptyRow
                ? undefined
                : (extractClosestEdge(self.data) as 'top' | 'bottom'),
            id: dropped.id,
            fromWeek: dropped.coords.week,
            toWeek: coordsWeek,
            toColumn: columnId,
            toRow: coordsY
          })
        }

        setState(
          produce((draft) => {
            draft.draggedOver = false
            draft.closestEdge = null
          })
        )
      }
    })
  }, [wrapRef, columnId, coordsWeek, coordsY, insertMode, emptyRow, onDrop])

  const backgroundIndicator =
    ((insertMode === 'column' || emptyRow) && state.draggedOver) || highlight

  const lineIndicator =
    state.closestEdge && insertMode !== 'column' && !emptyRow

  return (
    <Box sx={{ height: '100%' }}>
      {backgroundIndicator && <DropIndicator color={alpha(borderColor, 0.2)} />}
      {lineIndicator && <DropIndicator edge={state.closestEdge} />}
    </Box>
  )
}

export default WeekCellPhantom
