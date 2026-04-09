import { alpha } from '@mui/material'
import Box from '@mui/material/Box'

import DropIndicator from '../DropIndicator'
import useCellEmptyDnd from './useCellEmptyDnd'
import { WeekCellEmptyTypeInternal } from '../types'

const WeekCellEmpty = ({
  columnId,
  coordsY,
  coordsWeek,
  highlight,
  borderColor,
  wrapRef,
  emptyRow,
  onDrop
}: WeekCellEmptyTypeInternal) => {
  const dnd = useCellEmptyDnd({
    wrapRef,
    columnId,
    coordsWeek,
    coordsY,
    emptyRow,
    onDrop
  })

  // only highlighting the border when we're not highligting the full cell
  const edgeIndicator = highlight !== 'cell' && highlight

  // only showing background if there are no active edges (border)
  // or we're supposed to do a cell highlight (from the row)
  const backgroundIndicator =
    !dnd.closestEdge && (dnd.draggedOver || highlight === 'cell')

  // only showing border when there's the edge or we highlight it (from the row)
  const lineIndicator = edgeIndicator || (dnd.closestEdge && !emptyRow)

  return (
    <Box style={{ height: '100%' }}>
      {backgroundIndicator && <DropIndicator color={alpha(borderColor, 0.2)} />}
      {lineIndicator && (
        <DropIndicator edge={edgeIndicator || dnd.closestEdge} />
      )}
    </Box>
  )
}

export default WeekCellEmpty
