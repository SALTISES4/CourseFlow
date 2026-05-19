import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { svglinkAllowDND } from '@cf/features/graph/state/slices/svglink.slice'
import { linkNodeOutcome } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import type { AppDispatch } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import { isOutcomeLink } from '@cfRedux/slices/outcomes.slice'
import { produce } from 'immer'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { CellDataType, DraggableType, isGridCell } from '../../../../types'
import { SectionCellNodeTypeTypeInternal, SectionCellType } from '../types'

type SateType = {
  dragging: boolean
  dropHighlight: boolean
  closestEdge: Edge | null
  previewTarget?: HTMLElement | null
}

type PropsType = Pick<
  SectionCellNodeTypeTypeInternal,
  | 'wrapRef'
  | 'nodeId'
  | 'columnId'
  | 'coordsSection'
  | 'coordsX'
  | 'coordsY'
  | 'onDrop'
  | 'graphUuid'
>

function useCellNodeDnd({
  wrapRef,
  nodeId,
  graphUuid,
  columnId,
  coordsSection,
  coordsX,
  coordsY,
  onDrop
}: PropsType) {
  const dispatch = useDispatch<AppDispatch>()
  const [state, setState] = useState<SateType>({
    dragging: false,
    dropHighlight: false,
    closestEdge: null
  })

  const toggleState = useCallback(
    (newState: Partial<SateType>) => {
      if ('dragging' in newState) {
        dispatch(svglinkAllowDND(newState.dragging ?? false))
      }

      setState(
        produce((draft) => {
          for (const [key, value] of Object.entries(newState)) {
            draft[key] = value ?? !draft[key]
          }
        })
      )
    },
    [dispatch]
  )

  useEffect(() => {
    const el = wrapRef.current
    if (!el) {
      return
    }

    return combine(
      dropTargetForElements({
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
        onDragEnter: ({ source }) => {
          if (isOutcomeLink(source.data)) {
            toggleState({ dropHighlight: true })
          }
        },
        onDragLeave: ({ source }) => {
          if (isOutcomeLink(source.data)) {
            toggleState({ dropHighlight: false })
          }
          toggleState({ closestEdge: null })
        },
        onDrag: ({ source, self }) => {
          const dragging = source.data
          if (isGridCell(dragging) && dragging.uuid !== nodeId) {
            setState(
              produce((draft) => {
                draft.closestEdge = extractClosestEdge(self.data)
              })
            )
          }
        },
        canDrop: ({ source }) =>
          isOutcomeLink(source.data) || isGridCell(source.data),
        onDrop: ({ source, self }) => {
          const dropped = source.data
          if (isOutcomeLink(dropped)) {
            void dispatch(
              linkNodeOutcome({
                graphUuid,
                nodeUuid: nodeId,
                outcomeUuid: dropped.uuid
              })
            )
          }

          if (isGridCell(dropped) && dropped.uuid !== nodeId) {
            // TODO(graph-state): `NodeWorkflowReorderPayload` still types section/column as numbers.
            // This view now carries UUID section/column identities; keep runtime UUIDs and narrow-cast
            // until reorder payload typing is fully migrated off legacy numeric IDs.
            onDrop({
              type: SectionCellType.NODE,
              edge: extractClosestEdge(self.data) as 'top' | 'bottom',
              uuid: dropped.uuid,
              fromSection: String(dropped.coords.section),
              toSection: coordsSection,
              toColumn: columnId,
              toRow: coordsY
            })
          }

          toggleState({ dropHighlight: false, closestEdge: null })
        }
      }),
      draggable({
        element: el,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({
              x: '16px',
              y: '10px'
            }),
            render({ container }) {
              toggleState({ dragging: true, previewTarget: container })
              // cleanup, docs?
              // return () => {
              //   return toggleState({ dragging: false, preview: null })
              // }
            },
            nativeSetDragImage
          })
        },
        getInitialData: (): CellDataType => ({
          uuid: nodeId,
          coords: {
            section: coordsSection,
            x: coordsX,
            y: coordsY
          },
          type: DraggableType.CELL
        }),
        onDragStart: () => toggleState({ dragging: true }),
        onDrop: () => toggleState({ dragging: false, previewTarget: null })
      })
    )
  }, [
    columnId,
    coordsSection,
    coordsX,
    coordsY,
    dispatch,
    graphUuid,
    nodeId,
    onDrop,
    toggleState,
    wrapRef
  ])

  return state
}

export default useCellNodeDnd
