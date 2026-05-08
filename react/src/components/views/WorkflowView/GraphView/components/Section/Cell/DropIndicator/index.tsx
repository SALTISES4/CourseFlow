import { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

import * as Styled from './styles'

type PropsType =
  | {
      edge: Edge
      offset?: number
    }
  | {
      color: string
    }

const DropIndicator = (props: PropsType) => {
  if ('edge' in props && (props.edge === 'top' || props.edge === 'bottom')) {
    return <Styled.CellLine offset={props.offset} edge={props.edge} />
  }

  if ('color' in props) {
    return <Styled.CellHighlight color={props.color} />
  }

  return null
}

export default DropIndicator
