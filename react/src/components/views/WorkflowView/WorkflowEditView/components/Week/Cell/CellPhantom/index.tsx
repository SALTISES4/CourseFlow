import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import store from '@cfRedux/store'
import { isGridCell } from '@cfViews/WorkflowView/WorkflowEditView/types'
import { alpha } from '@mui/material'
import Box from '@mui/material/Box'
import { produce } from 'immer'
import { useEffect, useState } from 'react'

import DropIndicator from '../DropIndicator'
import { WeekCellPhantomTypeInternal, WeekCellType } from '../types'

// read from the store API to avoid expensive useSelector subscription
function getIsRowInsert() {
  return store.getState().workspace.node.insertMode === 'row'
}

const WeekCellPhantom = ({
  columnId,
  coordsY,
  coordsWeek,
  highlight,
  borderColor,
  wrapRef,
  emptyRow,
  onDrop
}: WeekCellPhantomTypeInternal) => {
  const [state, setState] = useState<{
    draggedOver: boolean
    closestEdge: Edge | null
  }>({
    draggedOver: false,
    closestEdge: null
  })

  // only highlighting the border when we're not highligting the full cell
  const edgeIndicator = highlight !== 'cell' && highlight

  // only showing background if there are no active edges (border)
  // or we're supposed to do a cell highlight (from the row)
  const backgroundIndicator =
    !state.closestEdge && (state.draggedOver || highlight === 'cell')

  // only showing border when there's the edge or we highlight it (from the row)
  const lineIndicator = edgeIndicator || (state.closestEdge && !emptyRow)

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
          getIsRowInsert() &&
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
            draft.closestEdge = null

            if (
              getIsRowInsert() &&
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
  }, [wrapRef, columnId, coordsWeek, coordsY, emptyRow, onDrop])

  return (
    <Box sx={{ height: '100%' }}>
      {backgroundIndicator && <DropIndicator color={alpha(borderColor, 0.2)} />}
      {lineIndicator && (
        <DropIndicator edge={edgeIndicator || state.closestEdge} />
      )}
    </Box>
  )
}

export default WeekCellPhantom
