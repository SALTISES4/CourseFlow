import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { RootState } from '@cf/redux/store'
import { produce } from 'immer'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { isGridCell } from '../../../../types'
import { SectionCellEmptyTypeInternal, SectionCellType } from '../types'

type PropsType = Pick<
  SectionCellEmptyTypeInternal,
  'wrapRef' | 'columnId' | 'coordsSection' | 'coordsY' | 'emptyRow' | 'onDrop'
>

function useCellEmptyDnd({
  wrapRef,
  columnId,
  coordsSection,
  coordsY,
  emptyRow,
  onDrop
}: PropsType) {
  const isRowInsert = useSelector(
    (state: RootState) => state.graph.graphUi.nodeInsertMode === 'row'
  )
  const [state, setState] = useState<{
    draggedOver: boolean
    closestEdge: Edge | null
  }>({
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
          isRowInsert &&
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
              isRowInsert &&
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
            type: SectionCellType.PHANTOM,
            edge: undefined,
            uuid: dropped.uuid,
            fromSection: String(dropped.coords.section),
            toSection: coordsSection,
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
  }, [wrapRef, columnId, coordsSection, coordsY, emptyRow, isRowInsert, onDrop])

  return state
}

export default useCellEmptyDnd
