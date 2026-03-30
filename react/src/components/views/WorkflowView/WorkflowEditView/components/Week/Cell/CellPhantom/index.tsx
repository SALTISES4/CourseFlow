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

        if (
          insertMode === 'row' &&
          isGridCell(source.data) &&
          source.data.coords.y !== coordsY
        ) {
          setState(
            produce((draft) => {
              draft.closestEdge = extractClosestEdge(self.data)
            })
          )
        }
      },
      onDragEnter: ({ source, self }) => {
        setState(
          produce((draft) => {
            draft.draggedOver = true
            draft.closestEdge = false

            if (
              insertMode === 'row' &&
              isGridCell(source.data) &&
              source.data.coords.y !== coordsY
            ) {
              draft.closestEdge = extractClosestEdge(self.data)
            }
          })
        )
      },
      onDragLeave: () => {
        setState({
          draggedOver: false,
          closestEdge: null
        })
      },
      canDrop: ({ source }) => isGridCell(source.data),
      onDrop: ({ source }) => {
        const dropped = source.data
        if (!isGridCell(dropped)) {
          return null
        }

        if (isGridCell(dropped)) {
          onDrop({
            type: WeekCellType.PHANTOM,
            edge: undefined,
            id: dropped.id,
            fromWeek: dropped.coords.week,
            toWeek: coordsWeek,
            toColumn: columnId,
            toRow: coordsY
          })
        }

        setState({
          draggedOver: false,
          closestEdge: null
        })
      }
    })
  }, [wrapRef, columnId, coordsWeek, coordsY, insertMode, emptyRow, onDrop])

  const backgroundIndicator =
    !state.closestEdge && (state.draggedOver || highlight)
  const lineIndicator = state.closestEdge && !emptyRow

  return (
    <Box sx={{ height: '100%' }}>
      {backgroundIndicator && <DropIndicator color={alpha(borderColor, 0.2)} />}
      {lineIndicator && <DropIndicator edge={state.closestEdge} />}
    </Box>
  )
}

export default WeekCellPhantom
