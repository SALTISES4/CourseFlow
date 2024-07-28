import { ChangeEvent } from 'react'
import { SelectChangeEvent } from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import MenuItem from '@mui/material/MenuItem'
import { StyledForm } from '@cfCommonComponents/dialog/styles'
import { ActivityFormDataType } from './types'

type FormValues = Omit<ActivityFormDataType, 'units'> & {
  unit: string
}

type PropsType = {
  values: FormValues
  wrapAs?: 'form' | 'div'
  units: ActivityFormDataType['units']
  onInfoChange: (e: ChangeEvent<HTMLInputElement>) => void
  onUnitChange: (e: SelectChangeEvent) => void
}

const ActivityFormFields = ({
  wrapAs = 'form',
  values,
  units,
  onInfoChange,
  onUnitChange
}: PropsType) => {
  return (
    <StyledForm component={wrapAs}>
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
          <Select value={values.unit} label="Unit type" onChange={onUnitChange}>
            {units.map((u, idx) => (
              <MenuItem key={idx} value={u.value}>
                {u.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </StyledForm>
  )
}

export default ActivityFormFields
