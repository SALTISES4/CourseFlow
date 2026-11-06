import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { SxProps } from '@mui/material'

import * as Styled from '../styles'

export type OutcomeCheckmarkStatus = 'empty' | 'partial' | 'full'

type PropsType = {
  sx?: SxProps
  readOnly?: boolean
  value: OutcomeCheckmarkStatus
  onClick?: () => void
}

const Checkmark = ({ value, readOnly, sx, onClick }: PropsType) => {
  const styles = {
    ...sx,
    ...(readOnly && {
      'pointer-events': 'none'
    })
  }

  if (value === 'empty') {
    return (
      <Styled.CheckmarkCell sx={styles}>
        <label onClick={!readOnly ? onClick : undefined}>
          <span />
        </label>
      </Styled.CheckmarkCell>
    )
  }

  return (
    <Styled.CheckmarkCell sx={styles}>
      <label htmlFor="" onClick={!readOnly ? onClick : undefined}>
        <input type="checkbox" checked={value === 'full'}></input>
        <span>
          <CheckRoundedIcon />
        </span>
      </label>
    </Styled.CheckmarkCell>
  )
}

export default Checkmark
