import TextField from '@mui/material/TextField'
import { FocusEvent, useEffect, useRef, useState } from 'react'
import { NumberFormatValues, PatternFormat } from 'react-number-format'

import {
  DurationMinutes,
  formatDurationInput,
  parseDurationInput
} from './duration'

type Props = {
  label: string
  value: DurationMinutes
  disabled?: boolean
  readOnly?: boolean
  fullWidth?: boolean
  onValueChange?: (value: number | null) => void
  onValueCommit?: (value: number | null) => void
}

/**
 * Fixed-width duration editor. It deliberately does not use a clock/time value:
 * `123:45` means a duration of 123 hours and 45 minutes.
 */
const DurationTextField = ({
  label,
  value,
  disabled = false,
  readOnly = false,
  fullWidth = false,
  onValueChange,
  onValueCommit
}: Props) => {
  const [draft, setDraft] = useState(() => formatDurationInput(value))
  const draftRef = useRef(draft)
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) {
      const nextDraft = formatDurationInput(value)
      draftRef.current = nextDraft
      setDraft(nextDraft)
    }
  }, [value])

  const handleValueChange = ({ value: nextDraft }: NumberFormatValues) => {
    draftRef.current = nextDraft
    setDraft(nextDraft)
    const parsed = parseDurationInput(nextDraft)
    if (parsed.valid) {
      onValueChange?.(parsed.value)
    }
  }

  const handleBlur = (_event: FocusEvent<HTMLInputElement>) => {
    focused.current = false
    const parsed = parseDurationInput(draftRef.current)
    if (!parsed.valid) {
      const restored = formatDurationInput(value)
      draftRef.current = restored
      setDraft(restored)
      return
    }
    onValueChange?.(parsed.value)
    onValueCommit?.(parsed.value)
  }

  return (
    <PatternFormat
      customInput={TextField}
      label={label}
      variant="outlined"
      size="small"
      fullWidth={fullWidth}
      format="###:##"
      mask="_"
      allowEmptyFormatting
      placeholder="hhh:mm"
      value={draft}
      valueIsNumericString
      disabled={disabled}
      inputProps={{ inputMode: 'numeric' }}
      InputProps={{ readOnly }}
      isAllowed={({ value: digits }) =>
        digits.length < 4 || Number(digits.charAt(3)) <= 5
      }
      onFocus={() => {
        focused.current = true
      }}
      onValueChange={handleValueChange}
      onBlur={handleBlur}
    />
  )
}

export default DurationTextField
