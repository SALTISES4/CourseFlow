import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { SxProps } from '@mui/material'
import { useCallback, useState } from 'react'

import * as Styled from '../styles'

type PropsType = {
  sx?: SxProps
  readOnly?: boolean
  value: 'empty' | 'partial' | 'full'
  onChange?: () => void
}

const states = ['empty', 'partial', 'full'] as const

const Checkmark = ({ value, readOnly, sx, onChange }: PropsType) => {
  const [state, setState] = useState(value)

  const onLabelClick = useCallback(() => {
    const newState = states[states.indexOf(state) + 1] || states[0]
    setState(newState)
  }, [state])

  const styles = {
    ...sx,
    ...(readOnly && {
      'pointer-events': 'none'
    })
  }

  if (state === 'empty') {
    return (
      <Styled.CheckmarkCell sx={styles}>
        <label onClick={onLabelClick}>
          <span />
        </label>
      </Styled.CheckmarkCell>
    )
  }

  return (
    <Styled.CheckmarkCell sx={styles}>
      <label htmlFor="" onClick={onLabelClick}>
        <input type="checkbox" checked={state === 'full'}></input>
        <span>
          <CheckRoundedIcon />
        </span>
      </label>
    </Styled.CheckmarkCell>
  )
}

export default Checkmark
