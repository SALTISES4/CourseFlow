import Column from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/column/Column'
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
  DropResult,
  Droppable,
  DroppableProvided
} from '@hello-pangea/dnd'
import DragHandleIcon from '@mui/icons-material/DragHandle'

import * as Styled from '../../styles'

type PropsType = {
  columns: number[]
  parentId: number
  onReorder: (result: DropResult) => void
}

const Component = ({ columns, parentId, onReorder }: PropsType) => {
  return (
    <div data-test-id="columns-block">
      <DragDropContext onDragEnd={onReorder}>
        <Droppable droppableId="column-header" direction="horizontal">
          {(provided: DroppableProvided) => (
            <Styled.CellRow
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {columns.map((columnId, index) => (
                <Draggable
                  key={`column-header-${columnId}`}
                  draggableId={`column-header-${columnId}`}
                  index={index}
                >
                  {(provided: DraggableProvided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}>
                      <Styled.Cell>
                        <div {...provided.dragHandleProps}>
                          <DragHandleIcon />
                        </div>
                        <Column objectId={columnId} parentId={parentId} />
                      </Styled.Cell>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Styled.CellRow>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

export default Component
