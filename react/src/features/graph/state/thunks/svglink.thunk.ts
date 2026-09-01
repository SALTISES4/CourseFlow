import { selectNodeByUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { svglinkDragEnd } from '@cf/features/graph/state/slices/svglink.slice'
import type { AppDispatch, RootState } from '@cfRedux/store'
import { connectionEdgeToCanonicalPort } from '@cfViews/WorkflowView/GraphView/components/LineSVG/utility'

import { createEdge, updateEdge } from './graphMutations.thunks'

export const dragEndThunk =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    const { dragging, snap, editing } = getState().svglink

    const sourceNodeUuid =
      dragging.from?.nodeUuid ?? snap.from?.nodeUuid ?? null
    const targetNodeUuid = snap.to?.nodeUuid ?? null
    const sourcePort = dragging.from?.edge ?? snap.from?.edge ?? null
    const targetPort = snap.to?.edge ?? null
    const editingExistingEdge = Boolean(dragging.uuid)

    dispatch(
      svglinkDragEnd({
        uuid: dragging.uuid,
        from: snap.from,
        to: snap.to
      })
    )

    if (editingExistingEdge) {
      if (
        !dragging.uuid ||
        !sourceNodeUuid ||
        !targetNodeUuid ||
        sourceNodeUuid === targetNodeUuid ||
        !sourcePort ||
        !targetPort
      ) {
        return
      }

      const sourceNode = selectNodeByUuid(sourceNodeUuid)(getState())
      if (!sourceNode) {
        return
      }

      try {
        await dispatch(
          updateEdge({
            graphUuid: sourceNode.graphUuid,
            edgeId: dragging.uuid,
            meta: {},
            ...(editing === 'from'
              ? {
                  sourceNodeUuid,
                  sourcePort: connectionEdgeToCanonicalPort(sourcePort)
                }
              : {
                  targetNodeUuid,
                  targetPort: connectionEdgeToCanonicalPort(targetPort)
                })
          })
        )
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[svglink] updateEdge failed', error)
        }
      }
      return
    }

    if (
      !sourceNodeUuid ||
      !targetNodeUuid ||
      sourceNodeUuid === targetNodeUuid ||
      !sourcePort ||
      !targetPort
    ) {
      return
    }

    const sourceNode = selectNodeByUuid(sourceNodeUuid)(getState())
    if (!sourceNode) {
      return
    }

    try {
      await dispatch(
        createEdge({
          graphUuid: sourceNode.graphUuid,
          sourceNodeUuid,
          targetNodeUuid,
          lineType: '',
          sourcePort: connectionEdgeToCanonicalPort(sourcePort),
          targetPort: connectionEdgeToCanonicalPort(targetPort)
        })
      )
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[svglink] createEdge failed', error)
      }
    }
  }
