import { ChangeEvent } from 'react'
import { SelectChangeEvent } from '@mui/material/Select'
import Divider from '@mui/material/Divider'
import InputLabel from '@mui/material/InputLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import MenuItem from '@mui/material/MenuItem'
import { StyledForm } from '@cfCommonComponents/dialog/styles'
import { CourseFormDataType } from './types'

type FormValues = Omit<CourseFormDataType, 'units'> & {
  unit: string
}

type PropsType = {
  values: FormValues
  wrapAs?: 'form' | 'div'
  units: CourseFormDataType['units']
  onInfoChange: (e: ChangeEvent<HTMLInputElement>) => void
  onUnitChange: (e: SelectChangeEvent) => void
  onPonderationChange: (e: ChangeEvent<HTMLInputElement>) => void
}

const CourseFormFields = ({
  wrapAs = 'form',
  values,
  units,
  onInfoChange,
  onUnitChange,
  onPonderationChange
}: PropsType) => {
  return (
    <StyledForm component={wrapAs}>
      <TextField
        required
        name="title"
        value={values.title}
        variant="standard"
        label="Course title"
        onChange={onInfoChange}
      />
      <TextField
        multiline
        maxRows={3}
        name="description"
        value={values.description}
        variant="standard"
        label="Course description"
        onChange={onInfoChange}
      />
      <TextField
        multiline
        maxRows={3}
        name="courseNumber"
        value={values.courseNumber}
        variant="standard"
        label="Course number"
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
      <div>
        <Typography sx={{ mt: 1, mb: 1 }}>Ponderation</Typography>
        <Divider />
      </div>
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          name="theory"
          value={values.ponderation.theory}
          variant="standard"
          label="Theory (hrs)"
          onChange={onPonderationChange}
        />
        <TextField
          fullWidth
          name="practice"
          value={values.ponderation.practice}
          variant="standard"
          label="Practice (hrs)"
          onChange={onPonderationChange}
        />
        <TextField
          fullWidth
          name="individual"
          value={values.ponderation.individual}
          variant="standard"
          label="Individual work (hrs)"
          onChange={onPonderationChange}
        />
        <TextField
          fullWidth
          name="generalEdu"
          value={values.ponderation.generalEdu}
          variant="standard"
          label="General education (hrs)"
          onChange={onPonderationChange}
        />
        <TextField
          fullWidth
          name="specificEdu"
          value={values.ponderation.specificEdu}
          variant="standard"
          label="Specific education (hrs)"
          onChange={onPonderationChange}
        />
      </Stack>
    </StyledForm>
  )
}

export default CourseFormFields
