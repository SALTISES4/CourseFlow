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
const getInsertMode = () => store.getState().workspace.node.insertMode

type StateType = {
  highlightEdge: Edge | null
  highlightRow: boolean
  dragid: string | null
  closestEdge: Edge | null
}

type PropsType = WeekRowPropsType & { rowRef: MutableRefObject<HTMLDivElement> }

function useRowDnd(props: PropsType) {
  const dispatch = useDispatch()
  const wsColIds = useSelector((state: RootState) => state.workspace.column.ids)
  const { weekId, rowIndex, rowRef, onNodeDrop } = props
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
      onDragEnter: ({ source, self }) => {
        const dragging = source.data
        if (!isSidebarNode(dragging)) {
          return
        }

        setState(
          produce((draft) => {
            const columnMode = getInsertMode() === 'column'
            const isCustom = isSidebarCustomNode(dragging)

            draft.dragId = dragging.id
            draft.highlightRow = columnMode && isCustom

            if (!columnMode && isCustom) {
              draft.highlightEdge = extractClosestEdge(self.data)
            }
          })
        )
      },
      onDragLeave: resetState,
      onDrag: ({ source, self }) => {
        const columnMode = getInsertMode() === 'column'
        const isSidebar = isSidebarNode(source.data)
        const isCustom = isSidebarCustomNode(source.data)

        if (!columnMode && isCustom) {
          return setState(
            produce((draft) => {
              draft.highlightEdge = extractClosestEdge(self.data)
            })
          )
        }

        if (!isSidebar || isCustom) {
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
      canDrop: ({ source }) => isSidebarNode(source.data),
      onDrop: ({ source, self }) => {
        const insertMode = getInsertMode()
        const isCustom = isSidebarCustomNode(source.data)
        const row = self.data.row as number
        let channelId = source.data.id as number
        let closestEdge = extractClosestEdge(self.data)

        if (isCustom) {
          channelId = getNextLargestNumber(wsColIds)
          closestEdge = insertMode === 'column' ? 'top' : state.highlightEdge
          dispatch(columnInsertBelow({ id: null, newId: channelId }))
        }

        // TODO: handle manual insert mode
        if (insertMode === 'manual') {
          console.log('TODO: Implement manual insert mode')
          return resetState()
        }

        dispatch(
          nodeWorkflowInsert({
            mode: insertMode,
            newColumn: isCustom,
            columnId: channelId,
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
    onNodeDrop,
    rowIndex,
    rowRef,
    state.highlightEdge,
    weekId,
    wsColIds
  ])

  return state
}

export default useRowDnd
