import { DragDropContext, DropResult } from '@hello-pangea/dnd'

import Week from './Week'
import type { BoardType } from '../../utility'

export type PropsType = {
  board: BoardType
  parentId: number
  columnIds: number[]
  columnColors: string[]
  onReorder: (result: DropResult) => void
}

const DndBoard = ({
  board,
  parentId,
  columnIds,
  columnColors,
  onReorder
}: PropsType) => {
  return (
    <DragDropContext onDragEnd={onReorder}>
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
    </DragDropContext>
  )
}

export default DndBoard
