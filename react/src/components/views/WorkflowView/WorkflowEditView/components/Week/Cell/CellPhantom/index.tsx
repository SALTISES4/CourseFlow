import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box'
import { alpha } from '@mui/material'
import Box from '@mui/material/Box'
import { produce } from 'immer'
import { useEffect, useState } from 'react'

import { isGridCell } from '../../../../types'
import { WeekCellPhantomTypeInternal, WeekCellType } from '../types'

const WeekCellPhantom = ({
  columnId,
  coordsY,
  coordsWeek,
  highlight,
  borderColor,
  wrapRef,
  insertMode,
  empty,
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
              insertMode === 'column' || empty
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
  }, [wrapRef, columnId, coordsWeek, coordsY, insertMode, empty, onDrop])

  return (
    <Box
      sx={{
        height: '100%',
        backgroundColor:
          (((insertMode === 'column' || empty) && state.draggedOver) ||
            highlight) &&
          alpha(borderColor, 0.2)
      }}
    >
      {state.closestEdge && insertMode !== 'column' && !empty && (
        <DropIndicator edge={state.closestEdge} type="no-terminal" gap="32px" />
      )}
    </Box>
  )
}

export default WeekCellPhantom
