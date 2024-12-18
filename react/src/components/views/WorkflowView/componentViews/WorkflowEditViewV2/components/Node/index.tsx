import { useState } from 'react'

type PropsType = {
  property?: any
}

const Node = ({ property }: PropsType) => {
  const [state, setState] = useState(false)

  return (
    <div>
      <span>Node here</span>
    </div>
  )
}

export default Node
