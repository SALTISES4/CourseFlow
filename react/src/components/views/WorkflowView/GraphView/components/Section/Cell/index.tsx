import type {
  NodeDropPayload,
  NodeInsertMode
} from '@cf/features/graph/state/resolveNodeDropRow'
import type { RootState } from '@cf/redux/store'
import { memo, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import SectionCellEmpty from './CellEmpty'
import SectionCellNode from './CellNode'
import InsertMenu from './InsertMenu'
import { SectionCellProps, SectionCellType } from './types'
import * as Styled from '../../../styles'

type StateType = {
  anchor: HTMLDivElement | null
  dropData:
    | (NodeDropPayload & {
        type: SectionCellType.NODE | SectionCellType.PHANTOM
      })
    | null
}

const SectionCell = (props: SectionCellProps) => {
  // console.log(`${props.coordsY + 1} x ${props.coordsX + 1}`)
  const { type, onReorder } = props
  const insertMode = useSelector(
    (state: RootState) => state.graph.graphUi.nodeInsertMode
  )
  const [state, setState] = useState<StateType>({
    anchor: null,
    dropData: null
  })
  const ref = useRef<HTMLDivElement>(null)

  const onDrop = useCallback(
    (
      data: NodeDropPayload & {
        type: SectionCellType.NODE | SectionCellType.PHANTOM
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
    [insertMode, onReorder]
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
