import { useState } from 'react'
import Alert from '@cfCommonComponents/components/Alert'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { DIALOG_TYPE, useDialog } from '../'
import { StyledDialog, StyledForm } from '../styles'
import ObjectSets from './components/ObjectSets'

type PropsType = {
  showNoProjectsAlert: boolean
}

export enum OBJECT_SET_TYPE {
  OUTCOME = 'outcome',
  SOMETHING = 'something',
  ELSE = 'else'
}

export type OnUpdateType = {
  index: number
  newVal?: {
    type: OBJECT_SET_TYPE
    label: string
  }
}

export type StateType = {
  objectSets: {
    type: OBJECT_SET_TYPE
    label: string
  }[]
  objectSetsExpanded: boolean
}

function CreateProjectDialog({ showNoProjectsAlert }: PropsType) {
  const [state, setState] = useState<StateType>({
    objectSets: [],
    objectSetsExpanded: false
  })
  const { show, onClose } = useDialog(DIALOG_TYPE.CREATE_PROJECT)

  // TODO: post / redirect
  function onSubmit() {
    console.log('project created?')
  }

  function onObjectSetUpdate({ index, newVal }: OnUpdateType) {
    const sets = [...state.objectSets]
    // either updating existing one
    // or deleting when no newVal is supplied
    if (newVal) {
      sets.splice(index, 1, newVal)
    } else {
      sets.splice(index, 1)
    }
    setState({
      ...state,
      objectSets: sets
    })
  }

  function onObjectSetAddNew() {
    setState({
      ...state,
      objectSets: [
        ...state.objectSets,
        { type: '' as OBJECT_SET_TYPE, label: '' }
      ]
    })
  }

  function onObjectSetsClick() {
    setState({
      ...state,
      objectSetsExpanded: !state.objectSetsExpanded
    })
  }

  return (
    <StyledDialog open={show} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{window.gettext('Create project')}</DialogTitle>
      <DialogContent dividers>
        <Alert sx={{ mb: 3 }} severity="warning" title="TODO - Backend" />
        {showNoProjectsAlert && (
          <Alert
            sx={{ mb: 3 }}
            title={window.gettext('Start by creating a project')}
            subtitle={window.gettext(
              'All workflows, whether they are programs, courses, or activities, exist within projects. You must start by creating a project before proceeding to create any type of workflow.'
            )}
          />
        )}
        <StyledForm component="form">
          <TextField
            label={window.gettext('Title')}
            variant="standard"
            required
          />
          <TextField
            label={window.gettext('Description')}
            variant="standard"
            multiline
            maxRows={4}
          />
          <ObjectSets
            expanded={state.objectSetsExpanded}
            toggleExpanded={onObjectSetsClick}
            sets={state.objectSets}
            onUpdate={onObjectSetUpdate}
            onAddNew={onObjectSetAddNew}
          />
        </StyledForm>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {COURSEFLOW_APP.strings.cancel}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {window.gettext('Create project')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default CreateProjectDialog
