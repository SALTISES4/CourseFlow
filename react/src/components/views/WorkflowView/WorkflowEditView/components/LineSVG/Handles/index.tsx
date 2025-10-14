import { Position } from '@xyflow/react'
import { produce } from 'immer'
import { MouseEvent as ReactMouseEvent, useCallback, useState } from 'react'

import * as Styled from './styles'

type PropsType = {
  id: number
  hovering: boolean
  diameter?: number
}

type DragCoords = {
  x: number
  y: number
  edge: Position
}

type StateType = {
  dragging: boolean
  coords: {
    from: DragCoords
    to: DragCoords
  } | null
}

const Handles = ({ id, hovering, diameter = 10 }: PropsType) => {
  const [state, setState] = useState<StateType>({
    dragging: false,
    coords: null
  })

  const onMouseDown = useCallback((edge: Position) => {
    return (e: ReactMouseEvent<SVGCircleElement>) => {
      e.stopPropagation()
      e.preventDefault()

      const target = e.currentTarget
      const bcr = target.getBoundingClientRect()
      const cursor = {
        x: bcr.x + bcr.width / 2,
        y: bcr.y + bcr.height / 2,
        edge
      }

      setState({
        dragging: true,
        coords: { from: cursor, to: cursor }
      })

      const onMouseMove = (e: MouseEvent) => {
        console.log('move to', { x: e.clientX, y: e.clientY })
        setState(
          produce((draft) => {
            draft.dragging = true
            draft.coords.to = {
              x: e.clientX,
              y: e.clientY,
              edge: Position.Left
            }
          })
        )
      }

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        setState({ dragging: false, coords: null })
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
  }, [])

  const r = diameter / 2

  const handles: [string, string, string, Position][] = [
    ['50%', '0%', `translate(0, ${r})`, Position.Top],
    ['100%', '50%', `translate(-${r}, 0)`, Position.Right],
    ['50%', '100%', `translate(0, -${r})`, Position.Bottom],
    ['0%', '50%', `translate(${r}, 0)`, Position.Left]
  ]

  return hovering ? (
    <Styled.Wrap radius={r}>
      {handles.map(([cx, cy, transform, edge], index) => (
        <Styled.Handle
          key={index}
          cx={cx}
          cy={cy}
          r={r}
          transform={transform}
          onMouseDown={onMouseDown(edge)}
        />
      ))}
    </Styled.Wrap>
  ) : null
}

export default Handles
