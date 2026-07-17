import { selectIsDrawingLinkPreview } from '@cf/features/graph/state/selectors/svglink.selectors'
import {
  svglinkDragMove,
  svglinkDragStart
} from '@cf/features/graph/state/slices/svglink.slice'
import { dragEndThunk } from '@cf/features/graph/state/thunks/svglink.thunk'
import useHover from '@cf/hooks/useHover'
import { AppDispatch } from '@cf/redux/store'
import { Position } from '@xyflow/react'
import { MouseEvent as ReactMouseEvent, RefObject, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'

type PropsType = {
  nodeUuid: string
  nodeRef: RefObject<HTMLDivElement>
  diameter?: number
}

const Handles = ({ nodeUuid, nodeRef, diameter = 10 }: PropsType) => {
  const dispatch = useDispatch<AppDispatch>()
  const [, hovering] = useHover(nodeRef)
  const isDraggingPreview = useSelector(selectIsDrawingLinkPreview)
  const r = diameter / 2
  const offset = 2

  const handles: [string, string, string, Position][] = [
    ['50%', '0%', `translate(0, ${r + offset})`, Position.Top],
    ['100%', '50%', `translate(-${r + offset}, 0)`, Position.Right],
    ['50%', '100%', `translate(0, -${r + offset})`, Position.Bottom],
    ['0%', '50%', `translate(${r + offset}, 0)`, Position.Left]
  ]

  const onMouseDown = useCallback(
    (e: ReactMouseEvent<SVGCircleElement>) => {
      e.stopPropagation()
      e.preventDefault()
      const target = e.currentTarget
      const edge = target.dataset.edge as Position
      const bcr = target.getBoundingClientRect()
      const svg = document.querySelector<SVGSVGElement>('#line-svg')
      if (!svg) {
        return
      }
      const svgBCR = svg.getBoundingClientRect()

      dispatch(
        svglinkDragStart({
          nodeUuid,
          x: bcr.x + bcr.width / 2 - svgBCR.left,
          y: bcr.y + bcr.height / 2 - svgBCR.top,
          edge
        })
      )

      const onMouseMove = (e: MouseEvent) => {
        const svgBCR = svg.getBoundingClientRect()

        dispatch(
          svglinkDragMove({
            nodeUuid: null,
            x: e.clientX - svgBCR.left,
            y: e.clientY - svgBCR.top,
            edge: null
          })
        )
      }

      const onMouseUp = () => {
        void dispatch(dragEndThunk())
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [dispatch, nodeUuid]
  )

  return hovering || isDraggingPreview ? (
    <Styled.Wrap radius={r} offset={offset}>
      {handles.map(([cx, cy, transform, edge], index) => (
        <Styled.Handle
          key={index}
          cx={cx}
          cy={cy}
          r={r}
          transform={transform}
          data-edge={edge}
          onMouseDown={onMouseDown}
        />
      ))}
    </Styled.Wrap>
  ) : null
}

export default Handles
