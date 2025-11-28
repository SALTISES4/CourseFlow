import { NodeInsertMode } from '@cf/redux/slices/node.slice'
import { RootState } from '@cf/redux/store'
import { memo, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import WeekCellNode from './CellNode'
import WeekCellPhantom from './CellPhantom'
import InsertMenu from './InsertMenu'
import { WeekCellProps, WeekCellType } from './types'
import * as Styled from '../../../styles'

const WeekCell = (props: WeekCellProps) => {
  // console.log(`${props.coordsY + 1} x ${props.coordsX + 1}`)
  const [anchor, setAnchor] = useState<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>(null)
  const insertMode = useSelector(
    (state: RootState) => state.workspace.node.insertMode
  )

  const onDrop = useCallback(() => {
    if (insertMode === 'manual') {
      setAnchor(ref.current)
    }
  }, [insertMode])

  const onCancel = useCallback(() => {
    console.log('cancel yo')
    setAnchor(null)
  }, [])

  const onOption = useCallback((insertModeOption: NodeInsertMode) => {
    console.log(insertModeOption)
    setAnchor(null)
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
      <InsertMenu anchorEl={anchor} onOption={onOption} onClose={onCancel} />
    </Styled.Cell>
  )
}

export default memo(WeekCell)
