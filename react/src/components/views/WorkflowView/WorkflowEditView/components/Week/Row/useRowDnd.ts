import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { getNextLargestNumber } from '@cf/redux/selectors/helpers'
import { columnInsertBelow } from '@cf/redux/slices/column.slice'
import { nodeWorkflowInsert } from '@cf/redux/slices/node.slice'
import store from '@cf/redux/store'
import { RootState } from '@cf/redux/store'
import {
  isSidebarCustomNode,
  isSidebarNode
} from '@cfViews/WorkflowView/WorkflowEditView/types'
import { produce } from 'immer'
import { MutableRefObject, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { WeekRowPropsType } from './index'

// read from the store API to avoid expensive useSelector subscription
function getIsColumnInsert() {
  return store.getState().workspace.node.insertMode === 'column'
}

type StateType = {
  highlightEdge: Edge | null
  highlightRow: boolean
  dragId: number | null
  closestEdge: Edge | null
}

type PropsType = WeekRowPropsType & { rowRef: MutableRefObject<HTMLDivElement> }

function useRowDnd(props: PropsType) {
  const dispatch = useDispatch()
  const wsColIds = useSelector((state: RootState) => state.workspace.column.ids)
  const { weekId, rowIndex, rowRef } = props
  const [state, setState] = useState<StateType>({
    highlightRow: false,
    highlightEdge: null,
    dragId: null,
    closestEdge: null
  })

  const resetState = useCallback(() => {
    setState({
      highlightRow: false,
      highlightEdge: null,
      dragId: null,
      closestEdge: null
    })
  }, [])

  useEffect(() => {
    return dropTargetForElements({
      element: rowRef.current,
      getData: ({ element, input }) => {
        return attachClosestEdge(
          { row: rowIndex },
          {
            element,
            input,
            allowedEdges: ['top', 'bottom']
          }
        )
      },
      canDrop: ({ source }) => isSidebarNode(source.data),
      onDragEnter: ({ source, self }) => {
        const dragging = source.data
        if (!isSidebarNode(dragging)) {
          return
        }

        setState(
          produce((draft) => {
            const columnMode = getIsColumnInsert()
            draft.highlightRow = columnMode && isSidebarCustomNode(dragging)
            draft.dragId = dragging.id
            if (!columnMode && isSidebarCustomNode(dragging)) {
              draft.highlightEdge = extractClosestEdge(self.data)
            }
          })
        )
      },
      onDragLeave: resetState,
      onDrag: ({ source, self }) => {
        if (!getIsColumnInsert() && isSidebarCustomNode(source.data)) {
          return setState(
            produce((draft) => {
              draft.highlightEdge = extractClosestEdge(self.data)
            })
          )
        }

        if (!isSidebarNode(source.data) || isSidebarCustomNode(source.data)) {
          return
        }

        const closestEdge = extractClosestEdge(self.data)
        if (!closestEdge) {
          return
        }

        setState(
          produce((draft) => {
            draft.closestEdge = closestEdge
          })
        )
      },
      onDrop: ({ source, self }) => {
        const row = self.data.row as number
        let columnId = source.data.id as number
        let closestEdge = extractClosestEdge(self.data)

        if (isSidebarCustomNode(source.data)) {
          columnId = getNextLargestNumber(wsColIds)
          closestEdge = getIsColumnInsert() ? 'top' : state.highlightEdge

          dispatch(columnInsertBelow({ id: null, newId: columnId }))
        }

        dispatch(
          nodeWorkflowInsert({
            newColumn: isSidebarCustomNode(source.data),
            columnId,
            weekId,
            row:
              rowIndex === 'empty' ? 0 : closestEdge === 'top' ? row : row + 1
          })
        )

        resetState()
      }
    })
  }, [
    dispatch,
    resetState,
    rowIndex,
    rowRef,
    state.highlightEdge,
    weekId,
    wsColIds
  ])

  return state
}

export default useRowDnd
