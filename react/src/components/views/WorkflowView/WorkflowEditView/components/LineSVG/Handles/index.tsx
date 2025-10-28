import useHover from '@cf/hooks/useHover'
import { selectIsDrawingLinkPreview } from '@cf/redux/selectors/nodelink.selector'
import {
  dragEndThunk,
  svglinkDragMove,
  svglinkDragStart
} from '@cf/redux/slices/svglink.slice'
import { AppDispatch } from '@cf/redux/store'
import { Position } from '@xyflow/react'
import {
  MutableRefObject,
  MouseEvent as ReactMouseEvent,
  useCallback
} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'

type PropsType = {
  nodeId: number
  nodeRef: MutableRefObject<HTMLDivElement>
  diameter?: number
}

const Handles = ({ nodeId, nodeRef, diameter = 10 }: PropsType) => {
  const dispatch = useDispatch<AppDispatch>()
  const [, hovering] = useHover(nodeRef)
  const isDraggingPreview = useSelector(selectIsDrawingLinkPreview)
  const r = diameter / 2

  const handles: [string, string, string, Position][] = [
    ['50%', '0%', `translate(0, ${r})`, Position.Top],
    ['100%', '50%', `translate(-${r}, 0)`, Position.Right],
    ['50%', '100%', `translate(0, -${r})`, Position.Bottom],
    ['0%', '50%', `translate(${r}, 0)`, Position.Left]
  ]

  const onMouseDown = useCallback(
    (e: ReactMouseEvent<SVGCircleElement>) => {
      e.stopPropagation()
      e.preventDefault()
      const target = e.currentTarget
      const edge = target.dataset.edge as Position
      const bcr = target.getBoundingClientRect()
      const svg = document.querySelector('#line-svg')
      const svgBCR = svg.getBoundingClientRect()

      dispatch(
        svglinkDragStart({
          nodeId,
          x: bcr.x + bcr.width / 2 - svgBCR.left,
          y: bcr.y + bcr.height / 2 - svgBCR.top,
          edge
        })
      )

      const onMouseMove = (e: MouseEvent) => {
        const svgBCR = svg.getBoundingClientRect()

        dispatch(
          svglinkDragMove({
            nodeId: null,
            x: e.clientX - svgBCR.left,
            y: e.clientY - svgBCR.top,
            edge: null
          })
        )
      }

      const onMouseUp = () => {
        dispatch(dragEndThunk())
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [dispatch, nodeId]
  )

  return hovering || isDraggingPreview ? (
    <Styled.Wrap radius={r}>
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
