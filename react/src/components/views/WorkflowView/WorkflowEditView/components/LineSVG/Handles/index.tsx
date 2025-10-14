import { selectIsDrawingLinkPreview } from '@cf/redux/selectors/nodelink.selector'
import { Position } from '@xyflow/react'
import { MouseEventHandler } from 'react'
import { useSelector } from 'react-redux'

import * as Styled from './styles'

type PropsType = {
  hovering: boolean
  onHandleMouseDown: (edge: Position) => MouseEventHandler<SVGCircleElement>
  diameter?: number
}

const Handles = ({ hovering, onHandleMouseDown, diameter = 10 }: PropsType) => {
  const isDraggingPreview = useSelector(selectIsDrawingLinkPreview)

  const r = diameter / 2

  const handles: [string, string, string, Position][] = [
    ['50%', '0%', `translate(0, ${r})`, Position.Top],
    ['100%', '50%', `translate(-${r}, 0)`, Position.Right],
    ['50%', '100%', `translate(0, -${r})`, Position.Bottom],
    ['0%', '50%', `translate(${r}, 0)`, Position.Left]
  ]

  return hovering || isDraggingPreview ? (
    <Styled.Wrap radius={r}>
      {handles.map(([cx, cy, transform, edge], index) => (
        <Styled.Handle
          key={index}
          cx={cx}
          cy={cy}
          r={r}
          transform={transform}
          onMouseDown={onHandleMouseDown(edge)}
        />
      ))}
    </Styled.Wrap>
  ) : null
}

export default Handles
