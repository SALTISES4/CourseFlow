import { StyledBox, StyledDialog } from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { API_POST } from '@XMLHTTP/CallWrapper'
import { EProject } from '@XMLHTTP/types/entity'
import { produce } from 'immer'
import { MouseEvent, useState } from 'react'
import * as React from 'react'

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

//  reference for connecting

// class ExportMenu extends React.Component<PropsType, StateProps> {
// const ExportDialog = () => {
//   return (
//     <Dialog open={state.openExportDialog}>
//       <DialogTitle>
//         <h2>{_t('Export project')}</h2>
//       </DialogTitle>
//       <ExportMenu
//         data={{
//           // ...data,
//           objectSets: objectSets
//         }}
//         actionFunction={closeModals}
//       />
//     </Dialog>
//   )
// }

function ProjectExportDialog(data: EProject) {
  const [state, setState] = useState({
    type: EXPORT_TYPE.OUTCOME,
    format: EXPORT_FORMAT.EXCEL,
    sets: data.objectSets.map((set) => set.id)
  })
  const { show, onClose } = useDialog(DialogMode.PROJECT_EXPORT)

  function onRadioChange(
    field: 'type' | 'format',
    value: EXPORT_TYPE | EXPORT_FORMAT
  ) {
    setState(
      produce((draft) => {
        draft[field as any] = value
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

  function onSubmit(e: MouseEvent<HTMLButtonElement>) {
    const postData = {
      objectId: data.id,
      objectType: data.type,
      exportType: state.type,
      exportFormat: state.format,
      objectSets: state.sets
    }

    // TODO: handle success/failure appropriately
    API_POST(
      COURSEFLOW_APP.globalContextData.path.post_paths.get_export,
      postData
    )
      .then((resp) => {
        console.log('response', resp)
      })
      .catch((error) => console.log('errors', error))
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
      <DialogTitle>{_t(`Export ${projectType}`)}</DialogTitle>
      <DialogContent dividers>
        <StyledBox

          component="form">
          <Alert severity="warning" title="TODO" />
          <FormControl>
            <FormLabel id="export-type-group-label">
              {_t('Export type')}
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
                    label={_t(type.label)}
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
              {_t('Export format')}
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
                  label={_t(format.label)}
                  onChange={() => onRadioChange('format', format.value)}
                  checked={format.value === state.format}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {data.objectSets.length > 0 && (
            <FormControl>
              <FormLabel id="export-sets-group-label">
                {_t('Object set visibility')}
              </FormLabel>
              <FormGroup>
                {data.objectSets.map((set, index) => (
                  <FormControlLabel
                    key={index}
                    value={set.id}
                    control={<Checkbox />}
                    label={set.title}
                    checked={state.sets.includes(set.id)}
                    onChange={() => onSetChange(set.id)}
                  />
                ))}
              </FormGroup>
            </FormControl>
          )}
        </StyledBox>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onDialogClose}>
          {_t('Cancel')}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {_t('Export')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ProjectExportDialog
