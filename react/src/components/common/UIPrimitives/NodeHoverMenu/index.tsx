import { SxProps } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { MouseEvent, ReactNode } from 'react'

import * as Styled from './styles'

export type MenuItem = {
  label: string
  icon: ReactNode
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
  showCommentsPresenceIndicator?: boolean
  disabled?: boolean
}

type PropsType = {
  show: boolean
  items: (MenuItem | false)[]
  sx?: SxProps
  classNames?: string
  'data-test-id'?: string
}

const HoverMenu = ({
  items,
  show,
  sx,
  classNames,
  'data-test-id': dataTestId
}: PropsType) => {
  if (!items.some(Boolean)) {
    return null
  }

  return (
    <Styled.Wrap
      sx={sx}
      show={show}
      className={classNames}
      data-test-id={dataTestId}
    >
      {items.map((item, index) =>
        item ? (
          <Tooltip
            key={index}
            placement="top"
            arrow
            disableInteractive
            title={item.label}
          >
            <IconButton
              color="secondary"
              size="small"
              disabled={item.disabled}
              onClick={item.onClick}
            >
              <Styled.IconWrap>
                {item.icon}
                {item.showCommentsPresenceIndicator && (
                  <Styled.CommentsPresenceIndicator data-test-id="workflow-comments-presence-indicator" />
                )}
              </Styled.IconWrap>
            </IconButton>
          </Tooltip>
        ) : null
      )}
    </Styled.Wrap>
  )
}

export default HoverMenu
