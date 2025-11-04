import { SxProps } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { MouseEvent, ReactNode } from 'react'

import * as Styled from './styles'

type MenuItem = {
  label: string
  icon: ReactNode
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}

type PropsType = {
  show: boolean
  items: MenuItem[]
  sx?: SxProps
  classNames?: string
}

const HoverMenu = ({ items, show, sx, classNames }: PropsType) => (
  <Styled.Wrap sx={sx} show={show} className={classNames}>
    {items.map((item, index) => (
      <Tooltip key={index} placement="top" arrow title={item.label}>
        <IconButton color="secondary" size="small" onClick={item.onClick}>
          {item.icon}
        </IconButton>
      </Tooltip>
    ))}
  </Styled.Wrap>
)

export default HoverMenu
