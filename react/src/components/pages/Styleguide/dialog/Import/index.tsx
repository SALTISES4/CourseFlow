import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import FileUploader from '@cfPages/Styleguide/components/FileUploader'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { produce } from 'immer'
import { useCallback, useState } from 'react'
import { FileRejection } from 'react-dropzone'

import { StyledDialog } from '../styles'

type StateType = {
  whitelisted: string[]
  queued: (File | FileRejection)[]
}

const initialState: StateType = {
  whitelisted: [],
  queued: []
}

function ImportDialog() {
  const { type, show, onClose } = useDialog([
    DialogMode.IMPORT_OUTCOMES,
    DialogMode.IMPORT_NODES
  ])
  const [state, setState] = useState<StateType>(initialState)
  const { whitelisted, queued } = state

  const resourceType =
    type === DialogMode.IMPORT_OUTCOMES ? 'outcomes' : 'nodes'

  // The submit button is disabled unless all whitelisted File
  // are "ready" to be uploaded
  const uploadableFiles = queued.filter((file) => 'name' in file)
  const disableSubmit =
    whitelisted.length === 0 || whitelisted.length !== uploadableFiles.length

  const onUploadableFileComplete = useCallback((name: string) => {
    setState(
      produce((draft) => {
        if (!draft.whitelisted.includes(name)) {
          draft.whitelisted.push(name)
        }
      })
    )
  }, [])

  const onFilesDrop = (files: StateType['queued']) => {
    setState(
      produce((draft) => {
        draft.queued = files
      })
    )
  }

  const onFileRemove = useCallback((index: number) => {
    setState(
      produce((draft) => {
        // If this is a real File and not FileRejection,
        // also remove it from the list of uploadable files
        const removedFile = draft.queued[index]
        if ('name' in removedFile) {
          draft.whitelisted.splice(
            draft.whitelisted.indexOf(removedFile.name),
            1
          )
        }

        draft.queued.splice(index, 1)
      })
    )
  }, [])

  function resetData() {
    setState(initialState)
  }

  function onSubmit() {
    console.log('submitting Import Dialog with files', uploadableFiles)
  }

  return (
    <StyledDialog
      open={show}
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      TransitionProps={{
        onExited: resetData
      }}
    >
      <DialogTitle>Import {resourceType}</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Drag and drop your .xls or .csv file below to import. The importing
          process may take few minutes. Please do not edit the workflow while
          the import process is ongoing.
        </Typography>
        <FileUploader
          fileTypeMessage="XLS or CSV (max 3MB)"
          accept={{
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
              ['.xlsx'],
            'text/csv': ['.csv']
          }}
          files={state.queued}
          onFilesDrop={onFilesDrop}
          addFile={onUploadableFileComplete}
          removeFile={onFileRemove}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={disableSubmit}>
          Import {resourceType}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ImportDialog
