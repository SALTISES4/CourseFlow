import { MouseEvent, useRef, useState } from 'react'
import Alert from '@cfCommonComponents/components/Alert'
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
import { DIALOG_TYPE, useDialog } from '..'
import { StyledDialog, StyledForm } from '../styles'
import { produce } from 'immer'

type PropsType = {
  data: any
  onSubmit: () => any
}

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

function ExportProjectDialog({ data, onSubmit }: PropsType) {
  const [state, setState] = useState({
    type: EXPORT_TYPE.OUTCOME,
    format: EXPORT_FORMAT.EXCEL,
    sets: []
  })
  const { show, onClose } = useDialog(DIALOG_TYPE.EXPORT_PROJECT)

  function onRadioChange(
    field: 'type' | 'format',
    value: EXPORT_TYPE | EXPORT_FORMAT
  ) {
    setState(
      produce((draft) => {
        let obj = draft[field]
        if (obj) {
          obj = value
        }
      })
    )
  }

  function onExportBtnClick(e: MouseEvent<HTMLButtonElement>) {
    console.log(
      'export submit with state',
      state,
      'posting to',
      e.ctrlKey
        ? COURSEFLOW_APP.config.post_paths.get_export_download
        : COURSEFLOW_APP.config.post_paths.get_export
    )

    onSubmit()
  }

  function onDialogClose() {
    setState(
      produce((draft) => {
        draft.type = EXPORT_TYPE.OUTCOME
        draft.format = EXPORT_FORMAT.EXCEL
      })
    )
    onClose()
  }

  const projectType = data.type

  return (
    <StyledDialog open={show} onClose={onDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>{window.gettext(`Export ${projectType}`)}</DialogTitle>
      <DialogContent dividers>
        <StyledForm component="form">
          <FormControl>
            <FormLabel id="export-type-group-label">
              {window.gettext('Export type')}
            </FormLabel>
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
                    label={window.gettext(type.label)}
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
            <FormLabel id="export-format-group-label">
              {window.gettext('Export format')}
            </FormLabel>
            <RadioGroup
              aria-labelledby="export-format-group-label"
              value={state.format}
            >
              {fields.format.map((format, index) => (
                <FormControlLabel
                  key={index}
                  value={format.value}
                  control={<Radio />}
                  label={window.gettext(format.label)}
                  onChange={() => onRadioChange('format', format.value)}
                  checked={format.value === state.format}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Alert severity="warning" title="TODO" />
          {/* TODO: generate object sets from data prop */}
          <FormControl>
            <FormLabel id="export-sets-group-label">
              {window.gettext('Object set visibility')}
            </FormLabel>
            <FormGroup>
              <FormControlLabel control={<Checkbox />} label="Object set 1" />
              <FormControlLabel control={<Checkbox />} label="Object set 2" />
              <FormControlLabel control={<Checkbox />} label="Object set 3" />
            </FormGroup>
          </FormControl>
        </StyledForm>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onDialogClose}>
          {window.gettext('Cancel')}
        </Button>
        <Button variant="contained" onClick={onExportBtnClick}>
          {window.gettext('Export')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ExportProjectDialog
