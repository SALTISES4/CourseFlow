import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { SxProps } from '@mui/material'

import * as Styled from '../styles'

export type OutcomeCheckmarkStatus = 'empty' | 'partial' | 'full'

type PropsType = {
  label: string
  sx?: SxProps
  readOnly?: boolean
  value: OutcomeCheckmarkStatus
  onClick?: () => void
}

const Checkmark = ({
  value,
  label,
  readOnly = false,
  sx,
  onClick
}: PropsType) => (
  <Styled.CheckmarkCell sx={sx}>
    <button
      type="button"
      role="checkbox"
      aria-label={label}
      aria-checked={value === 'partial' ? 'mixed' : value === 'full'}
      aria-disabled={readOnly}
      disabled={readOnly}
      onClick={readOnly ? undefined : onClick}
    >
      <span data-status={value}>
        {value !== 'empty' && <CheckRoundedIcon />}
      </span>
    </button>
  </Styled.CheckmarkCell>
)

export default Checkmark
