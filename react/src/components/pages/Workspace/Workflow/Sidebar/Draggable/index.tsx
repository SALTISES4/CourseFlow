import type { DraggableType } from '@cfViews/WorkflowView/componentViews/WorkflowEditViewV2/types'
import { SxProps } from '@mui/material'
import Typography from '@mui/material/Typography'
import { ElementType, ReactNode } from 'react'

import * as Styled from './styles'

type PropsType = {
  id: number | string
  type: DraggableType
  label: string
  typeColor?: string
  sx?: SxProps
  component?: ElementType
  highlight?: boolean
  dashed?: boolean
  toggle?: ReactNode
}

const DraggableBlock = ({
  sx,
  type,
  typeColor,
  highlight,
  component,
  label,
  toggle,
  dashed
}: PropsType) => {
  return (
    <Styled.DraggableWrap
      typeColor={typeColor}
      component={component}
      highlight={highlight}
      dashed={dashed}
      sx={sx}
    >
      <Styled.DraggableDragWrap>
        <Styled.DraggableDragHandle />
        <Typography variant="body2">{label}</Typography>
      </Styled.DraggableDragWrap>
      {toggle}
    </Styled.DraggableWrap>
  )
}

export default DraggableBlock
