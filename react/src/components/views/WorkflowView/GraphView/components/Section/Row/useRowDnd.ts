import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type { GridInsertMode } from '@cf/features/graph/state/model/types'
import {
  insertChannelBelow,
  placeNode
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { SectionRowPropsType } from '@cfViews/WorkflowView/GraphView/components/Section/Row/type'
import { produce } from 'immer'
import { MutableRefObject, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { isSidebarCustomNode, isSidebarNode } from '../../../types'

type StateType = {
  highlightEdge: Edge | null
  highlightRow: boolean
  dragId: string | null
  closestEdge: Edge | null
}

type PropsType = SectionRowPropsType & {
  rowRef: MutableRefObject<HTMLDivElement>
}

function useRowDnd(props: PropsType) {
  const dispatch = useDispatch<AppDispatch>()
  const insertMode = useSelector(
    (state: RootState) => state.graph.graphUi.nodeInsertMode
  )
  const { graphUuid, sectionId, rowIndex, rowRef, columnIds } = props
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
            const columnMode = insertMode === 'column'
            const isCustom = isSidebarCustomNode(dragging)

            draft.dragId = dragging.uuid
            draft.highlightRow = columnMode && isCustom

            if (!columnMode && isCustom) {
              draft.highlightEdge = extractClosestEdge(self.data)
            }
          })
        )
      },
      onDragLeave: resetState,
      onDrag: ({ source, self }) => {
        const columnMode = insertMode === 'column'
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
      onDrop: async ({ source, self }) => {
        const isCustom = isSidebarCustomNode(source.data)
        const row = self.data.row as number
        let channelId = source.data.uuid as string
        let closestEdge = extractClosestEdge(self.data)

        if (isCustom) {
          closestEdge = insertMode === 'column' ? 'top' : state.highlightEdge
          const createdChannelUuid = await dispatch(
            insertChannelBelow({ graphUuid, channelUuid: null })
          ).unwrap()
          if (createdChannelUuid) {
            channelId = createdChannelUuid
          }
        }

        // TODO: handle manual insert mode
        if (insertMode === 'manual') {
          console.log('TODO: Implement manual insert mode')
          return resetState()
        }

        const rowHint =
          rowIndex === 'empty' ? 0 : closestEdge === 'top' ? row : row + 1
        dispatch(
          placeNode({
            graphUuid,
            sectionUuid: sectionId,
            channelUuid: channelId,
            rowHint,
            mode: insertMode as GridInsertMode,
            edge:
              closestEdge === 'top' || closestEdge === 'bottom'
                ? closestEdge
                : undefined
          })
        )

        resetState()
      }
    })
  }, [
    dispatch,
    graphUuid,
    insertMode,
    resetState,
    rowIndex,
    rowRef,
    sectionId,
    state.highlightEdge,
    columnIds
  ])

  return state
}

export default useRowDnd
