import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { ReactNode } from 'react'

import * as Styled from './styles'

type MenuItem = {
  label: string
  icon: ReactNode
  onClick: () => void
}

type PropsType = {
  show: boolean
  items: MenuItem[]
}

const HoverMenu = ({ items, show }: PropsType) => (
  <Styled.Wrap show={show}>
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
