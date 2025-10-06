import { useState } from 'react'

import * as Styled from './styles'

type PropsType = {
  hovering: boolean
  diameter?: number
}

const Handles = ({ hovering, diameter = 10 }: PropsType) => {
  const [state, setState] = useState({
    dragging: false
  })

  const show = hovering || state.dragging

  const d = diameter
  const r = d / 2

  return (
    <Styled.Wrap radius={r}>
      <Styled.Handle // top
        cx="50%"
        cy="0%"
        r={r}
        transform={`translate(0, ${r})`}
      />
      <Styled.Handle // right
        cx="100%"
        cy="50%"
        r={r}
        transform={`translate(-${r}, 0)`}
      />
      <Styled.Handle // bottom
        cx="50%"
        cy="100%"
        r={r}
        transform={`translate(0, -${r})`}
      />
      <Styled.Handle // left
        cx="0%"
        cy="50%"
        r={r}
        transform={`translate(${r}, 0)`}
      />
    </Styled.Wrap>
  )
}

export default Handles
