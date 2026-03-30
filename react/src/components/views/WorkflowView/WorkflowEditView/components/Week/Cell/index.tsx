import {
  NodeInsertMode,
  NodeWorkflowReorderPayload
} from '@cf/redux/slices/node.slice'
import { RootState } from '@cf/redux/store'
import * as Styled from '@cfViews/WorkflowView/WorkflowEditView/styles'
import { memo, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import WeekCellNode from './CellNode'
import WeekCellPhantom from './CellPhantom'
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
  const insertMode = useSelector(
    (state: RootState) => state.workspace.node.insertMode
  )

  const onDrop = useCallback(
    (
      data: NodeWorkflowReorderPayload & {
        type: WeekCellType.NODE | WeekCellType.PHANTOM
      }
    ) => {
      if (insertMode === 'manual') {
        setState({
          anchor: ref.current,
          dropData: data
        })
      } else {
        onReorder(data)
      }
    },
    [onReorder, insertMode]
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
        <WeekCellPhantom
          {...props}
          wrapRef={ref}
          onDrop={onDrop}
          insertMode={insertMode}
        />
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
