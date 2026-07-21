import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { alpha } from '@mui/material'
import Box from '@mui/material/Box'

import DropIndicator from '../DropIndicator'
import useCellEmptyDnd from './useCellEmptyDnd'
import { SectionCellEmptyTypeInternal } from '../types'

const SectionCellEmpty = ({
  columnId,
  coordsY,
  coordsSection,
  highlight,
  borderColor,
  wrapRef,
  emptyRow,
  onDrop
}: SectionCellEmptyTypeInternal) => {
  const canMoveNodes = useResourcePermission(WorkflowPermission.NODE_MANAGEMENT)
  const dnd = useCellEmptyDnd({
    wrapRef,
    columnId,
    coordsSection,
    coordsY,
    emptyRow,
    onDrop,
    enabled: canMoveNodes
  })

  // only highlighting the border when we're not highligting the full cell
  const edgeIndicator = highlight === 'cell' ? undefined : highlight

  // only showing background if there are no active edges (border)
  // or we're supposed to do a cell highlight (from the row)
  const backgroundIndicator =
    !dnd.closestEdge && (dnd.draggedOver || highlight === 'cell')

  // only showing border when there's the edge or we highlight it (from the row)
  const lineIndicator =
    edgeIndicator ?? (!emptyRow ? (dnd.closestEdge ?? undefined) : undefined)

  return (
    <Box style={{ height: '100%' }}>
      {backgroundIndicator && <DropIndicator color={alpha(borderColor, 0.2)} />}
      {lineIndicator && <DropIndicator edge={lineIndicator} />}
    </Box>
  )
}

export default SectionCellEmpty
