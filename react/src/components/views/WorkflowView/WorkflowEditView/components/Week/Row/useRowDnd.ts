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
import { MutableRefObject, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import type { WeekRowPropsType } from './index'

type StateType = {
  highlightRow: boolean
  dragid: string | null
  closestEdge: Edge | null
}

type PropsType = WeekRowPropsType & { rowRef: MutableRefObject<HTMLDivElement> }

function useRowDnd(props: PropsType) {
  const dispatch = useDispatch()
  const wsColIds = useSelector((state: RootState) => state.workspace.column.ids)
  const [state, setState] = useState<StateType>({
    highlightRow: false,
    dragId: null,
    closestEdge: null
  })

  const { weekId, rowIndex, rowRef } = props

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
      onDragEnter: ({ source }) => {
        const dragging = source.data
        if (!isSidebarNode(dragging)) {
          return
        }
        setState(
          produce((draft) => {
            const columnMode =
              store.getState().workspace.node.insertMode === 'column'
            draft.highlightRow = columnMode && isSidebarCustomNode(dragging)
            draft.dragId = dragging.id
          })
        )
      },
      onDragLeave: () => {
        setState({ highlightRow: false, dragId: null, closestEdge: null })
      },
      onDrag: ({ source, self }) => {
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

        const columnMode =
          store.getState().workspace.node.insertMode === 'column'

        if (isSidebarCustomNode(source.data) && columnMode) {
          columnId = getNextLargestNumber(wsColIds)
          closestEdge = 'top'
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

        setState({ highlightRow: false, dragId: null, closestEdge: null })
      }
    })
  }, [dispatch, wsColIds, weekId, rowIndex, rowRef])

  return state
}

export default useRowDnd
