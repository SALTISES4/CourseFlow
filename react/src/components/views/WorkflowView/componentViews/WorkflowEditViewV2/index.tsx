import { OuterContentWrap } from '@cf/mui/helper'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import { selectColumnById } from '@cfRedux/selectors/column.selector'
import { TColumn } from '@cfRedux/types/type'
import { AppState } from '@cfRedux/types/type'
import WorkflowFunctions from '@cfViews/WorkflowView/componentViews/WorkflowEditView/workflow.actions.class'
import { produce } from 'immer'
import { useState } from 'react'
import { useSelector } from 'react-redux'

import PragmaticDnd from './components/PragmaticDnd'
import PragmaticDndColumnsHeader from './components/PragmaticDnd/ColumnsHeader'
import { getWorkflowBoardData } from './utility'

/*
  .workflow-canvas is used for all kinds of targeting
  nodes and nodelinks (drawn line connections between nodes) are added/rendered to the canvas and they seem to float on top of react
  it doesn't look like comments, nodes, weeks etc are part of the 3js stuff
*/
const CanvasPlaceholder = () => (
  <svg className="workflow-canvas" width="100%" height="100%">
    <defs>
      <marker
        id="arrow"
        viewBox="0 0 10 10"
        refX="10"
        refY="5"
        markerWidth="4"
        markerHeight="4"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" />
      </marker>
    </defs>
  </svg>
)

function getColumnColors(
  columns: {
    column: TColumn
    siblingCount: number
    columns: number[]
  }[]
): string[] {
  return columns.map((columnData) =>
    ThemeHelper.getColumnColour({
      columnType: columnData.column.columnType,
      colour: columnData.column.colour
    })
  )
}

const WorkflowEditView = () => {
  const workflow = useSelector((state: AppState) => state.workflow)
  const [state, setState] = useState({
    columns: workflow.columns || [],
    board: getWorkflowBoardData(workflow)
  })

  const onColumnDragEnd = (oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) {
      return
    }

    const reorderedColumns = WorkflowFunctions.swapInPlace(
      state.columns,
      oldIndex,
      newIndex
    )

    setState(
      produce((draft) => {
        draft.columns = reorderedColumns
      })
    )
  }

  const onNodeDragEnd = () => {
    console.log('hello, node drag end')
    // const { source, destination } = result

    // if (!result.destination) {
    //   return
    // }

    // // moved between same board row
    // if (source.droppableId === destination.droppableId) {
    //   // ... but actually returned to the same index, ie, no movement
    //   if (source.index === destination.index) {
    //     return
    //   }

    //   setState(
    //     produce((draft) => {
    //       const parsed = parseWeekDroppableId(source.droppableId)

    //       const boardPartIndex = draft.board.findIndex(
    //         (r) => r.id === parsed.weekId
    //       )

    //       const row = draft.board[boardPartIndex].rows[parsed.rowId]
    //       const reordered = WorkflowFunctions.reorderArray(
    //         // bad
    //         row as any[],
    //         source.index,
    //         destination.index
    //       )

    //       // super baaaaaad
    //       draft.board[boardPartIndex].rows[parsed.rowId] = reordered as any
    //     })
    //   )
    // }
  }

  const columnData = useSelector((s: AppState) =>
    state.columns.map((columnId) => selectColumnById(s, columnId))
  )

  return (
    <OuterContentWrap>
      <PragmaticDndColumnsHeader
        columns={state.columns}
        parentId={workflow.id}
        onReorder={onColumnDragEnd}
      />
      <div data-test-id="weeks-block">
        <PragmaticDnd
          board={state.board}
          parentId={workflow.id}
          columnIds={state.columns}
          columnColors={getColumnColors(columnData)}
        />
      </div>

      <CanvasPlaceholder />
    </OuterContentWrap>
  )
}

export default WorkflowEditView
