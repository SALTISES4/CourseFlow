import TextField from '@mui/material/TextField'
import { ChangeEvent, FocusEvent, useEffect, useRef, useState } from 'react'

type DurationValue = number | null | undefined

type ParsedHours = {
  valid: boolean
  value: number | null
}

type Props = {
  label: string
  value: DurationValue
  disabled?: boolean
  readOnly?: boolean
  fullWidth?: boolean
  onValueChange?: (value: number | null) => void
  onValueCommit?: (value: number | null) => void
}

export const formatHoursDuration = (value: DurationValue): string => {
  const hours = value ?? 0
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
}

export const parseHoursDuration = (value: string): ParsedHours => {
  const normalized = value.trim()
  if (normalized === '') {
    return { valid: true, value: null }
  }

  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(?:hours?)?$/i)
  if (!match) {
    return { valid: false, value: null }
  }

  return { valid: true, value: Number(match[1]) }
}

/**
 * A single hours-duration field. The API stores a number of hours, while the
 * user-facing value includes its unit (for example, "2 hours").
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
  const [draft, setDraft] = useState(() => formatHoursDuration(value))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) {
      setDraft(formatHoursDuration(value))
    }
  }, [value])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextDraft = event.target.value
    setDraft(nextDraft)

    const parsed = parseHoursDuration(nextDraft)
    if (parsed.valid) {
      onValueChange?.(parsed.value)
    }
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    focused.current = false
    const parsed = parseHoursDuration(event.target.value)
    if (!parsed.valid) {
      setDraft(formatHoursDuration(value))
      return
    }

    setDraft(formatHoursDuration(parsed.value))
    onValueChange?.(parsed.value)
    onValueCommit?.(parsed.value)
  }

  return (
    <TextField
      label={label}
      variant="outlined"
      size="small"
      fullWidth={fullWidth}
      value={draft}
      disabled={disabled}
      inputProps={{ inputMode: 'decimal' }}
      InputProps={{ readOnly }}
      onFocus={() => {
        focused.current = true
      }}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

export default DurationTextField
