import { DragDropContext, DropResult } from '@hello-pangea/dnd'

import Week from './Week'

export type PropsType = {
  weekIds: number[]
  columnIds: number[]
  columnColors: string[]
}

const DndBoard = ({ weekIds, columnIds, columnColors }: PropsType) => {
  function onDragEnd(result: DropResult) {
    console.log('drag ended yo', result)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {weekIds.map((weekId, index) => (
        <Week
          key={`week_${weekId}`}
          objectId={weekId}
          index={index}
          parentId={1}
          columnIds={columnIds}
          columnColors={columnColors}
        />
      ))}
    </DragDropContext>
  )
}

export default DndBoard
