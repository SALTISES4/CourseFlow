import { ChangeEvent } from 'react'
import { SelectChangeEvent } from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import MenuItem from '@mui/material/MenuItem'
import { StyledForm } from '@cfComponents/dialog/styles'
import { ProgramFormDataType } from './types'

type FormValues = Omit<ProgramFormDataType, 'units'> & {
  unit: string
}

type PropsType = {
  values: FormValues
  wrapAs?: 'form' | 'div'
  units: ProgramFormDataType['units']
  onInfoChange: (e: ChangeEvent<HTMLInputElement>) => void
  onUnitChange: (e: SelectChangeEvent) => void
}

const ProgramFormFields = ({
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
        label="Program title"
        onChange={onInfoChange}
      />
      <TextField
        multiline
        maxRows={3}
        name="description"
        value={values.description}
        variant="standard"
        label="Program description"
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

export default ProgramFormFields
