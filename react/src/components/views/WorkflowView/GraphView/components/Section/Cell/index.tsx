import {
  NodeInsertMode,
  NodeWorkflowReorderPayload
} from '@cf/redux/slices/node.slice'
import store from '@cfRedux/store'
import { memo, useCallback, useRef, useState } from 'react'

import SectionCellEmpty from './CellEmpty'
import SectionCellNode from './CellNode'
import InsertMenu from './InsertMenu'
import { SectionCellProps, SectionCellType } from './types'
import * as Styled from '../../../styles'

type StateType = {
  anchor: HTMLDivElement | null
  dropData:
    | (NodeWorkflowReorderPayload & {
        type: SectionCellType.NODE | SectionCellType.PHANTOM
      })
    | null
}

const SectionCell = (props: SectionCellProps) => {
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
        type: SectionCellType.NODE | SectionCellType.PHANTOM
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
          insertModeOption === 'column' && data.type === SectionCellType.PHANTOM
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
      {type === SectionCellType.PHANTOM ? (
        <SectionCellEmpty {...props} wrapRef={ref} onDrop={onDrop} />
      ) : (
        <SectionCellNode {...props} wrapRef={ref} onDrop={onDrop} />
      )}
      <InsertMenu
        anchorEl={state.anchor}
        onOption={onOption}
        onClose={onCancel}
      />
    </Styled.Cell>
  )
}

export default memo(SectionCell)
