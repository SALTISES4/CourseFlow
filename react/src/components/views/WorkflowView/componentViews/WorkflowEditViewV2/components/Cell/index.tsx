import { sidebarUpdateDragCoords } from '@cfRedux/slices/sidebar.slice'
import { AppState } from '@cfRedux/types/type'
import { useDroppable } from '@dnd-kit/core'
import Box from '@mui/material/Box'
import { ReactNode, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type PropsType = {
  children: ReactNode
  color?: string
  groupId: number
  coords: { row: number; column: number }
}

const Cell = ({ children, groupId, coords, color = '#0f9' }: PropsType) => {
  const sidebarDragTarget = useSelector(
    (state: AppState) => state.sidebar.dragging.target
  )

  return !sidebarDragTarget ? (
    children
  ) : (
    <DroppableCell groupId={groupId} coords={coords} color={color}>
      {children}
    </DroppableCell>
  )
}

const DroppableCell = ({ children, groupId, coords, color }: PropsType) => {
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
      style={{
        transition: 'all 0.2s ease',
        backgroundColor: isOver ? color : ''
      }}
    >
      {children}
    </Box>
  )
}

export default Cell
