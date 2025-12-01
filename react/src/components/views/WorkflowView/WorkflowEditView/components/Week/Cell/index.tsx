import {
  NodeInsertMode,
  NodeWorkflowReorderPayload
} from '@cf/redux/slices/node.slice'
import { RootState } from '@cf/redux/store'
import { memo, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import WeekCellNode from './CellNode'
import WeekCellPhantom from './CellPhantom'
import InsertMenu from './InsertMenu'
import { WeekCellProps, WeekCellType } from './types'
import * as Styled from '../../../styles'

type StateType = {
  anchor: HTMLDivElement | null
  dropData: (NodeWorkflowReorderPayload & { type: 'node' | 'phantom' }) | null
}

const WeekCell = (props: WeekCellProps) => {
  // console.log(`${props.coordsY + 1} x ${props.coordsX + 1}`)
  const [state, setState] = useState<StateType>({
    anchor: null,
    dropData: null
  })
  const ref = useRef<HTMLDivElement>(null)
  const insertMode = useSelector(
    (state: RootState) => state.workspace.node.insertMode
  )

  const onDrop = useCallback(
    (data: NodeWorkflowReorderPayload & { type: 'node' | 'phantom' }) => {
      if (insertMode === 'manual') {
        setState({
          anchor: ref.current,
          dropData: data
        })
      } else {
        props.onReorder(data)
      }
    },
    // TODO: is this necessary
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onReorder, insertMode]
  )

  const onOption = useCallback(
    (insertModeOption: Exclude<NodeInsertMode, 'manual'>) => {
      const data = state.dropData
      props.onReorder({
        ...data,
        edge:
          insertModeOption === 'column' && data.type === 'phantom'
            ? undefined
            : data.edge,
        mode: insertModeOption
      })
      setState({
        anchor: null,
        dropData: null
      })
    },
    // TODO: is this necessary
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onReorder, state.dropData]
  )

  const onCancel = useCallback(() => {
    setState({
      anchor: null,
      dropData: null
    })
  }, [])

  return (
    <Styled.Cell ref={ref}>
      {props.type === WeekCellType.PHANTOM ? (
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
