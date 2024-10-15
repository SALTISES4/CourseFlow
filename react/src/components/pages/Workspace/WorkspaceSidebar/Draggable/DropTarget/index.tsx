import { useDroppable } from '@dnd-kit/core'
import { SxProps } from '@mui/material'
import Box from '@mui/material/Box'
import {
  CSSProperties,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect
} from 'react'

type PropsType = {
  id: string
  children: ReactNode
  dragOverStyles?: CSSProperties
  sx?: SxProps
  setIsDropValid: Dispatch<SetStateAction<boolean>>
}

const DropTarget = ({
  id,
  children,
  sx,
  dragOverStyles,
  setIsDropValid
}: PropsType) => {
  const { isOver, setNodeRef } = useDroppable({
    id
  })

  useEffect(() => {
    setIsDropValid(isOver)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOver])

  return (
    <Box ref={setNodeRef} sx={sx} style={isOver ? dragOverStyles : {}}>
      {children}
    </Box>
  )
}

export default DropTarget
