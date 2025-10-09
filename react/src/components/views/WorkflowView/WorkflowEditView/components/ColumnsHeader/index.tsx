import Cell from './Cell'
import * as Styled from '../../styles'
import { ColumnReorderCallbackFn } from '../../types'

type PropsType = {
  columns: number[]
  parentId: number
  onReorder: ColumnReorderCallbackFn
}

const ColumnsHeader = ({ columns, parentId, onReorder }: PropsType) => (
  <Styled.CellRow data-test-id="columns-block">
    {columns.map((columnId, index) => (
      <Cell
        key={`column-header-${columnId}`}
        index={index}
        columnId={columnId}
        parentId={parentId}
        onReorder={onReorder}
      />
    ))}
  </Styled.CellRow>
)

export default ColumnsHeader
