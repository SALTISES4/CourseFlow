import { produce } from 'immer'
import { MouseEvent as ReactMouseEvent, useCallback, useState } from 'react'

import * as Styled from './styles'

type PropsType = {
  id: number
  hovering: boolean
  diameter?: number
}

type CoordsType = {
  from: { x: number; y: number }
  to: { x: number; y: number }
}

type StateType = {
  dragging: boolean
  coords: CoordsType | null
}

const Handles = ({ id, hovering, diameter = 10 }: PropsType) => {
  const [state, setState] = useState<StateType>({
    dragging: false,
    coords: null
  })

  const onMouseDown = useCallback((e: ReactMouseEvent<SVGCircleElement>) => {
    e.stopPropagation()
    e.preventDefault()

    const target = e.currentTarget
    const bcr = target.getBoundingClientRect()

    setState({
      dragging: true,
      coords: {
        from: { x: bcr.x + bcr.width / 2, y: bcr.y + bcr.height / 2 },
        to: { x: bcr.x + bcr.width / 2, y: bcr.y + bcr.height / 2 }
      }
    })

    const onMouseMove = (e: MouseEvent) => {
      setState(
        produce((draft) => {
          draft.dragging = true
          draft.coords.to = { x: e.clientX, y: e.clientY }
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
  }, [])

  const r = diameter / 2

  const handles = [
    ['50%', '0%', `translate(0, ${r})`], // top
    ['100%', '50%', `translate(-${r}, 0)`], // right
    ['50%', '100%', `translate(0, -${r})`], // bottom
    ['0%', '50%', `translate(${r}, 0)`] // left
  ]

  return (
    hovering && (
      <Styled.Wrap radius={r}>
        {handles.map(([cx, cy, transform], index) => (
          <Styled.Handle
            sx={{ pointerEvents: state.dragging ? 'none' : 'auto' }}
            key={index}
            cx={cx}
            cy={cy}
            r={r}
            transform={transform}
            onMouseDown={onMouseDown}
          />
        ))}
      </Styled.Wrap>
    )
  )
}

export default Handles
