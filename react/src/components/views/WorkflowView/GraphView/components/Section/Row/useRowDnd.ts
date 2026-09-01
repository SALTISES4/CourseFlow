import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type {
  GridDropEdge,
  GridInsertMode
} from '@cf/features/graph/state/model/types'
import {
  insertChannelBelow,
  placeNode
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarEdit } from '@cf/features/sidebar/state/sidebar.slice'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import { SectionRowPropsType } from '@cfViews/WorkflowView/GraphView/components/Section/Row/type'
import { produce } from 'immer'
import { RefObject, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { isSidebarCustomNode, isSidebarNode } from '../../../types'

type StateType = {
  highlightEdge: Edge | null
  highlightRow: boolean
  dragId: string | null
  closestEdge: Edge | null
  pendingDrop: PendingSidebarDrop | null
}

type PendingSidebarDrop = {
  channelId: string
  custom: boolean
  row: number | 'empty'
  edge?: GridDropEdge
}

type PropsType = SectionRowPropsType & {
  rowRef: RefObject<HTMLDivElement>
  enabled: boolean
}

function useRowDnd(props: PropsType) {
  const dispatch = useDispatch<AppDispatch>()
  const insertMode = useSelector(
    (state: RootState) => state.graph.graphUi.nodeInsertMode
  )
  const { graphUuid, sectionId, rowIndex, rowRef, columnIds, enabled } = props
  const [state, setState] = useState<StateType>({
    highlightRow: false,
    highlightEdge: null,
    dragId: null,
    closestEdge: null,
    pendingDrop: null
  })

  const resetState = useCallback(() => {
    setState({
      highlightRow: false,
      highlightEdge: null,
      dragId: null,
      closestEdge: null,
      pendingDrop: null
    })
  }, [])

  const finalizeSidebarDrop = useCallback(
    async (drop: PendingSidebarDrop, mode: GridInsertMode) => {
      let channelId = drop.channelId

      try {
        if (drop.custom) {
          const createdChannelUuid = await dispatch(
            insertChannelBelow({ graphUuid, channelUuid: null })
          )
          if (!createdChannelUuid) {
            return
          }
          channelId = createdChannelUuid
        }

        // The backend owns edge-to-row resolution. Pass the reference row as
        // the hint so a bottom-edge drop is advanced exactly once.
        const rowHint = drop.row === 'empty' ? 0 : drop.row
        const createdNodeUuid = await dispatch(
          placeNode({
            graphUuid,
            sectionUuid: sectionId,
            channelUuid: channelId,
            rowHint,
            mode,
            edge: drop.edge
          })
        )

        if (createdNodeUuid) {
          dispatch(
            sidebarEdit({
              uuid: createdNodeUuid,
              parentId: graphUuid,
              objectType: CfObjectType.NODE
            })
          )
        }
      } finally {
        resetState()
      }
    },
    [dispatch, graphUuid, resetState, sectionId]
  )

  const chooseManualPlacement = useCallback(
    (mode: GridInsertMode) => {
      if (state.pendingDrop) {
        void finalizeSidebarDrop(state.pendingDrop, mode)
      }
    },
    [finalizeSidebarDrop, state.pendingDrop]
  )

  useEffect(() => {
    if (!rowRef.current || !enabled) {
      return
    }
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
        const row = self.data.row as number | 'empty'
        let closestEdge = extractClosestEdge(self.data)

        if (isCustom) {
          closestEdge = insertMode === 'column' ? 'top' : state.highlightEdge
        }

        const edge =
          closestEdge === 'top' || closestEdge === 'bottom'
            ? closestEdge
            : undefined
        const drop: PendingSidebarDrop = {
          channelId: source.data.uuid as string,
          custom: isCustom,
          row,
          edge
        }

        if (insertMode === 'manual') {
          setState({
            highlightRow: false,
            highlightEdge: null,
            dragId: null,
            closestEdge: null,
            pendingDrop: drop
          })
          return
        }

        await finalizeSidebarDrop(drop, insertMode as GridInsertMode)
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
    finalizeSidebarDrop,
    columnIds,
    enabled
  ])

  return {
    ...state,
    chooseManualPlacement,
    cancelManualPlacement: resetState
  }
}

export default useRowDnd
