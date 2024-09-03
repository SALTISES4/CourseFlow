import {
  Dispatch,
  SetStateAction,
  useEffect,
  ReactNode,
  CSSProperties
} from 'react'
import Box from '@mui/material/Box'
import { useDroppable } from '@dnd-kit/core'
import { SxProps } from '@mui/material'

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
  }, [isOver])

  return (
    <Box ref={setNodeRef} sx={sx} style={isOver ? dragOverStyles : {}}>
      {children}
    </Box>
  )
}

export default DropTarget
