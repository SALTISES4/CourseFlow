import NodeSimple from './NodeSimple'

export type PropsType = {
  id: number
  parentId: number
  row: number
  columnColors: string[]
}

const Node = ({ id, parentId, row, columnColors }: PropsType) => {
  return (
    <NodeSimple
      id={id}
      parentId={parentId}
      row={row}
      columnColors={columnColors}
    />
  )
}

export default Node
