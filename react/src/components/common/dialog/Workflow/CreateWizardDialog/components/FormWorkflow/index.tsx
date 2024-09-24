import { StyledForm } from '@cfComponents/dialog/styles'
import {timeUnits, WorkflowFormType} from '@cfComponents/dialog/Workflow/CreateWizardDialog/types'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import { SelectChangeEvent } from '@mui/material/Select'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ChangeEvent } from 'react'

export enum FormField {
  TITLE = 'title',
  DESCRIPTION = 'description',
  COURSENUMBER = 'courseNumber',
  PONDERATION = 'ponderation',
  DURATION = 'duration',
  UNITS = 'units'
}

type PropsType = {
  values: WorkflowFormType
  config: FormField[]
  wrapAs?: 'form' | 'div'
  onInfoChange: (e: ChangeEvent<HTMLInputElement>) => void
  onUnitChange: (e: SelectChangeEvent) => void
  onPonderationChange: (e: ChangeEvent<HTMLInputElement>) => void
}

const WorkflowFormFields = ({
  wrapAs = 'form',
  config,
  values,
  onInfoChange,
  onUnitChange,
  onPonderationChange
}: PropsType) => {
  return (
    <StyledForm component={wrapAs}>
      {config.includes(FormField.TITLE) && (
        <TextField
          required
          name="title"
          value={values.title}
          variant="standard"
          label="Course title"
          onChange={onInfoChange}
        />
      )}

      {config.includes(FormField.DESCRIPTION) && (
        <TextField
          multiline
          maxRows={3}
          name="description"
          value={values.description}
          variant="standard"
          label="Course description"
          onChange={onInfoChange}
        />
      )}

      {config.includes(FormField.COURSENUMBER) && (
        <TextField
          multiline
          maxRows={3}
          name="courseNumber"
          value={values.courseNumber}
          variant="standard"
          label="Course number"
          onChange={onInfoChange}
        />
      )}

      <Stack direction="row" spacing={2}>
        {config.includes(FormField.DURATION) && (
          <TextField
            fullWidth
            name="duration"
            value={values.duration}
            variant="standard"
            label="Duration"
            onChange={onInfoChange}
          />
        )}
        {config.includes(FormField.UNITS) && (
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
        )}
      </Stack>

      {/*
        Ponderation section only relevant to type 'course' but worth having three separate forms for this
        Workflow currently is one datamodel
      */}
      {config.includes(FormField.PONDERATION) && (
        <>
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
        </>
      )}
    </StyledForm>
  )
}

export default WorkflowFormFields
