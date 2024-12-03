import { AppState } from '@cf/redux/types/type'
import { sidebarUpdateDragCoords } from '@cfRedux/slices/sidebar.slice'
import { SxProps } from '@mui/material'
import Box from '@mui/material/Box'
import { ReactNode, useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type PropsType = {
  children: ReactNode
  groupId: number
  coords: { row: number; column: number }
  sx?: SxProps
}

const DroppableCell = ({ children, sx, groupId, coords }: PropsType) => {
  const ref = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const dragTarget = useSelector(
    (state: AppState) => state.sidebar.dragging.target
  )

  const onMouseOver = useCallback(() => {
    console.log('onMouseOver', coords)

    if (dragTarget) {
      console.log('currently dragging', dragTarget, 'over', coords)
      dispatch(
        sidebarUpdateDragCoords({
          groupId,
          x: coords.column,
          y: coords.row
        })
      )
    }
  }, [dragTarget, dispatch, groupId, coords])

  useEffect(() => {
    const target = ref.current

    if (target) {
      target.addEventListener('mouseenter', onMouseOver)

      return () => {
        target.removeEventListener('mouseenter', onMouseOver)
      }
    }
  }, [onMouseOver])

  return (
    <Box ref={ref} sx={sx}>
      {children}
    </Box>
  )
}

export default DroppableCell
