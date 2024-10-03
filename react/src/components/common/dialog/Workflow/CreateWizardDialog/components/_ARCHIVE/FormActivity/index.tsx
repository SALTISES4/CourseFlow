import { StyledBox } from '@cfComponents/dialog/styles'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import { SelectChangeEvent } from '@mui/material/Select'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { ChangeEvent } from 'react'

import { ActivityFormDataType } from './types'

type FormValues = ActivityFormDataType

type PropsType = {
  values: FormValues
  wrapAs?: 'form' | 'div'
  onInfoChange: (e: ChangeEvent<HTMLInputElement>) => void
  onUnitChange: (e: SelectChangeEvent) => void
}

const timeUnits = [
  '',
  'Second',
  'Minutes',
  'Hours',
  'Days',
  'Weeks',
  'Months',
  'Years',
  'Credits'
]

const FormActivity = ({
  wrapAs = 'form',
  values,
  onInfoChange,
  onUnitChange
}: PropsType) => {
  return (
    <StyledBox component={wrapAs}>
      <TextField
        required
        name="title"
        value={values.title}
        variant="standard"
        label="Activity title"
        onChange={onInfoChange}
      />
      <TextField
        multiline
        maxRows={3}
        name="description"
        value={values.description}
        variant="standard"
        label="Activity description"
        onChange={onInfoChange}
      />
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          name="duration"
          value={values.duration}
          variant="standard"
          label="Duration"
          onChange={onInfoChange}
        />
        <FormControl variant="standard" fullWidth>
          <InputLabel>Unit type</InputLabel>
          <Select
            value={String(values.units)}
            label="Unit type"
            onChange={onUnitChange}
          >
            {timeUnits.map((u, idx) => (
              <MenuItem key={idx} value={idx}>
                {u}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </StyledBox>
  )
}

export default FormActivity
