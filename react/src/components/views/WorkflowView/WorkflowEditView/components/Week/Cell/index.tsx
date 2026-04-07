import {
  NodeInsertMode,
  NodeWorkflowReorderPayload
} from '@cf/redux/slices/node.slice'
import store from '@cfRedux/store'
import * as Styled from '@cfViews/WorkflowView/WorkflowEditView/styles'
import { memo, useCallback, useRef, useState } from 'react'

import WeekCellEmpty from './CellEmpty'
import WeekCellNode from './CellNode'
import InsertMenu from './InsertMenu'
import { WeekCellProps, WeekCellType } from './types'

type StateType = {
  anchor: HTMLDivElement | null
  dropData:
    | (NodeWorkflowReorderPayload & {
        type: WeekCellType.NODE | WeekCellType.PHANTOM
      })
    | null
}

const WeekCell = (props: WeekCellProps) => {
  // console.log(`${props.coordsY + 1} x ${props.coordsX + 1}`)
  const { type, onReorder } = props
  const [state, setState] = useState<StateType>({
    anchor: null,
    dropData: null
  })
  const ref = useRef<HTMLDivElement>(null)

  const onDrop = useCallback(
    (
      data: NodeWorkflowReorderPayload & {
        type: WeekCellType.NODE | WeekCellType.PHANTOM
      }
    ) => {
      // read from the store API to avoid expensive useSelector subscription
      const insertMode = store.getState().workspace.node.insertMode
      if (insertMode === 'manual') {
        setState({
          anchor: ref.current,
          dropData: data
        })
      } else {
        onReorder(data)
      }
    },
    [onReorder]
  )

  const onOption = useCallback(
    (insertModeOption: Exclude<NodeInsertMode, 'manual'>) => {
      const data = state.dropData
      onReorder({
        ...data,
        edge:
          insertModeOption === 'column' && data.type === WeekCellType.PHANTOM
            ? undefined
            : data.edge,
        mode: insertModeOption
      })
      setState({
        anchor: null,
        dropData: null
      })
    },
    [onReorder, state.dropData]
  )

  const onCancel = useCallback(() => {
    setState({
      anchor: null,
      dropData: null
    })
  }, [])

  return (
    <Styled.Cell ref={ref}>
      {type === WeekCellType.PHANTOM ? (
        <WeekCellEmpty {...props} wrapRef={ref} onDrop={onDrop} />
      ) : (
        <WeekCellNode {...props} wrapRef={ref} onDrop={onDrop} />
      )}
      <InsertMenu
        anchorEl={state.anchor}
        onOption={onOption}
        onClose={onCancel}
      />
    </Styled.Cell>
  )
}

export default memo(WeekCell)
