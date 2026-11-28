import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { ChangeEvent, FocusEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DurationMinutes,
  formatWholeHoursInput,
  parseWholeHoursInput
} from './duration'

type Props = {
  label: string
  value: DurationMinutes
  disabled?: boolean
  readOnly?: boolean
  fullWidth?: boolean
  alwaysShrinkLabel?: boolean
  onValueChange?: (value: number | null) => void
  onValueCommit?: (value: number | null) => void
}

/**
 * Whole-hour editor backed by canonical integer minutes.
 * Read-only calculated minute values are rounded to the nearest hour for display.
 */
const WholeHoursField = ({
  label,
  value,
  disabled = false,
  readOnly = false,
  fullWidth = false,
  alwaysShrinkLabel = false,
  onValueChange,
  onValueCommit
}: Props) => {
  const { t } = useTranslation('common')
  const [draft, setDraft] = useState(() => formatWholeHoursInput(value))
  const draftRef = useRef(draft)
  const focused = useRef(false)
  const changed = useRef(false)
  const parsed = parseWholeHoursInput(draft)

  useEffect(() => {
    if (!focused.current) {
      const nextDraft = formatWholeHoursInput(value)
      draftRef.current = nextDraft
      setDraft(nextDraft)
    }
  }, [value])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextDraft = event.target.value
    draftRef.current = nextDraft
    changed.current = true
    setDraft(nextDraft)
    const result = parseWholeHoursInput(nextDraft)
    if (result.valid) {
      onValueChange?.(result.value)
    }
  }

  const handleBlur = (_event: FocusEvent<HTMLInputElement>) => {
    focused.current = false
    const result = parseWholeHoursInput(draftRef.current)
    if (!result.valid) {
      const restored = formatWholeHoursInput(value)
      draftRef.current = restored
      changed.current = false
      setDraft(restored)
      return
    }
    if (changed.current) {
      onValueChange?.(result.value)
      onValueCommit?.(result.value)
    }
    changed.current = false
  }

  return (
    <TextField
      label={label}
      value={draft}
      type="number"
      variant="outlined"
      size="small"
      fullWidth={fullWidth}
      disabled={disabled}
      InputLabelProps={alwaysShrinkLabel ? { shrink: true } : undefined}
      error={!parsed.valid}
      helperText={!parsed.valid ? t('duration.hoursInvalid') : undefined}
      inputProps={{ min: 0, step: 1, inputMode: 'numeric' }}
      InputProps={{
        readOnly,
        endAdornment: (
          <InputAdornment position="end">
            {t('duration.hourUnit')}
          </InputAdornment>
        )
      }}
      onFocus={() => {
        focused.current = true
      }}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

export default WholeHoursField
