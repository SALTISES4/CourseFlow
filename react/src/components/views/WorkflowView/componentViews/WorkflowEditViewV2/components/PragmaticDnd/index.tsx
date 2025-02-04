import { CellReorderCallbackFn } from './types'
import Week from './Week'
import type { BoardType } from '../../utility'

export type PropsType = {
  board: BoardType
  parentId: number
  columnIds: number[]
  columnColors: string[]
  onReorder: CellReorderCallbackFn
}

const DndBoard = ({
  board,
  parentId,
  columnIds,
  columnColors,
  onReorder
}: PropsType) => (
  <>
    {board.map((boardWeek, index) => (
      <Week
        key={`week_${boardWeek.id}`}
        weekId={boardWeek.id}
        weekRows={boardWeek.rows}
        index={index}
        parentId={parentId}
        columnIds={columnIds}
        columnColors={columnColors}
        onReorder={onReorder}
      />
    ))}
  </>
)

export default DndBoard
