import Week from './Week'
import type { BoardType } from '../../utility'

export type PropsType = {
  board: BoardType
  parentId: number
  columnIds: number[]
  columnColors: string[]
}

const DndBoard = ({ board, parentId, columnIds, columnColors }: PropsType) => (
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
      />
    ))}
  </>
)

export default DndBoard
