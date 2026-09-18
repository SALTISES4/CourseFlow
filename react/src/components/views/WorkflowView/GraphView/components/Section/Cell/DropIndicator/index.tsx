import { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

import * as Styled from './styles'

type EdgeIndicator = {
  edge: Edge
  offset?: number
}

type BackgroundIndicator = {
  color: string
}

type PropsType = EdgeIndicator | BackgroundIndicator

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
