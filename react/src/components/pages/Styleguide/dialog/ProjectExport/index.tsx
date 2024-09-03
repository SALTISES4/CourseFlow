// @ts-nocheck
import { useState } from 'react'
import Alert from '@cfPages/Styleguide/components/Alert'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { StyledDialog, StyledForm } from '../styles'
import { produce } from 'immer'
import { EProject } from '@XMLHTTP/types/entity'

enum EXPORT_TYPE {
  OUTCOME = 'outcome',
  NODE = 'node',
  COURSE = 'framework',
  COMPETENCY = 'matrix',
  SOBEC = 'sobec'
}

enum EXPORT_FORMAT {
  EXCEL = 'excel',
  CSV = 'csv'
}

const fields = {
  type: [
    { value: EXPORT_TYPE.OUTCOME, label: 'Outcomes' },
    { value: EXPORT_TYPE.NODE, label: 'Nodes' },
    {
      value: EXPORT_TYPE.COURSE,
      label: 'Course framework',
      showForType: ['project', 'course']
    },
    {
      value: EXPORT_TYPE.COMPETENCY,
      label: 'Competency matrix',
      showForType: ['project', 'program']
    },
    {
      value: EXPORT_TYPE.SOBEC,
      label: 'SOBEC validation',
      showForType: ['project', 'program']
    }
  ],
  format: [
    { value: EXPORT_FORMAT.EXCEL, label: 'Excel' },
    { value: EXPORT_FORMAT.CSV, label: 'CSV' }
  ]
}

type StateType = {
  type: EXPORT_TYPE
  format: EXPORT_FORMAT
  sets: number[]
}

const initialState = {
  type: EXPORT_TYPE.OUTCOME,
  format: EXPORT_FORMAT.EXCEL,
  sets: []
}

function ExportProjectDialog({ project }: { project: EProject }) {
  const [state, setState] = useState<StateType>(initialState)
  const { show, onClose } = useDialog(DIALOG_TYPE.PROJECT_EXPORT)

  function onRadioChange(
    field: keyof StateType,
    value: EXPORT_TYPE | EXPORT_FORMAT
  ) {
    setState(
      produce((draft) => {
        draft[field] = value
      })
    )
  }

  function onSetChange(value: number) {
    setState(
      produce((draft) => {
        const found = draft.sets.indexOf(value)
        if (found === -1) {
          draft.sets.push(value)
        } else {
          draft.sets.splice(found, 1)
        }
      })
    )
  }

  function onSubmit() {
    const postData = {
      objectId: project.id,
      objectType: project.type,
      exportType: state.type,
      exportFormat: state.format,
      objectSets: state.sets
    }

    console.log('export submit', postData)

    // TODO: handle success/failure appropriately
    // API_POST(COURSEFLOW_APP.config.post_paths.get_export, postData)
    //   .then((resp) => {
    //     console.log('response', resp)
    //   })
    //   .catch((error) => console.log('errors', error))
  }

  function resetData() {
    setState(produce(() => initialState))
  }

  const projectType = project.type

  return (
    <StyledDialog
      open={show}
      onClose={onClose}
      TransitionProps={{
        onExited: resetData
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{`Export ${projectType}`}</DialogTitle>
      <DialogContent dividers>
        <StyledForm component="form">
          <Alert severity="warning" title="TODO" />
          <FormControl>
            <FormLabel id="export-type-group-label">Export type</FormLabel>
            <RadioGroup
              aria-labelledby="export-type-group-label"
              value={state.type}
            >
              {fields.type.map((type, index) => {
                return !type.showForType ||
                  (type.showForType &&
                    type.showForType.indexOf(projectType) !== -1) ? (
                  <FormControlLabel
                    key={index}
                    value={type.value}
                    control={<Radio />}
                    label={type.label}
                    onChange={() => onRadioChange('type', type.value)}
                    checked={type.value === state.type}
                  />
                ) : (
                  <></>
                )
              })}
            </RadioGroup>
          </FormControl>
          <FormControl>
            <FormLabel id="export-format-group-label">Export format</FormLabel>
            <RadioGroup
              aria-labelledby="export-format-group-label"
              value={state.format}
            >
              {fields.format.map((format, index) => (
                <FormControlLabel
                  key={index}
                  value={format.value}
                  control={<Radio />}
                  label={format.label}
                  onChange={() => onRadioChange('format', format.value)}
                  checked={format.value === state.format}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {project.object_sets.length > 0 && (
            <FormControl>
              <FormLabel id="export-sets-group-label">
                Object set visibility
              </FormLabel>
              <FormGroup>
                {project.object_sets.map((set, index) => (
                  <FormControlLabel
                    key={index}
                    value={set.id}
                    control={<Checkbox />}
                    label={set.title}
                    checked={state.sets.includes(
                      parseInt(set.id as string, 10) as number
                    )}
                    onChange={() => onSetChange(parseInt(set.id as string, 10))}
                  />
                ))}
              </FormGroup>
            </FormControl>
          )}
        </StyledForm>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Export
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ExportProjectDialog
