import { sidebarUpdateDragCoords } from '@cfRedux/slices/sidebar.slice'
import { useDroppable } from '@dnd-kit/core'
import { SxProps } from '@mui/material'
import Box from '@mui/material/Box'
import { ReactNode, useEffect } from 'react'
import { useDispatch } from 'react-redux'

type PropsType = {
  children: ReactNode
  groupId: number
  coords: { row: number; column: number }
  sx?: SxProps
}

const DroppableCell = ({ children, sx, groupId, coords }: PropsType) => {
  const dispatch = useDispatch()

  const { isOver, setNodeRef } = useDroppable({
    id: `${groupId}_${coords.row}_${coords.column}`,
    data: {
      groupId,
      coords
    }
  })

  useEffect(() => {
    if (isOver) {
      // dispatch(
      //   sidebarUpdateDragCoords({
      //     groupId,
      //     x: coords.column,
      //     y: coords.row
      //   })
      // )
      console.log('hovering', groupId, coords)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOver])

  return (
    <Box
      ref={setNodeRef}
      sx={sx}
      style={{ backgroundColor: isOver ? '#0f9' : '' }}
    >
      {children}
    </Box>
  )
}

export default DroppableCell
