import { GraphBoard } from '@cf/features/graph/state'

import Cell from './Cell'
import * as Styled from '../../styles'
import { ColumnReorderCallbackFn } from '../../types'

type PropsType = {
  board: GraphBoard
  onReorder: ColumnReorderCallbackFn
}

const ColumnsHeader = ({ board, onReorder }: PropsType) => (
  <Styled.CellRow data-test-id="columns-block">
    {board.columns.ids.map((columnId, index) => (
      <Cell
        key={`column-header-${columnId}`}
        index={index}
        columnId={columnId}
        parentId={board.uuid}
        onReorder={onReorder}
      />
    ))}
  </Styled.CellRow>
)

export default ColumnsHeader
