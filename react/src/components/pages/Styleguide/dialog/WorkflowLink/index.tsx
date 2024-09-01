import { useState } from 'react'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import ProjectSearch from '@cfPages/Styleguide/dialog/CreateWizard/components/ProjectSearch'
import { DIALOG_TYPE, useDialog } from  '@cf/hooks/useDialog'

import { StyledDialog } from '../styles'
import { ProjectType } from '@cfPages/Styleguide/dialog/CreateWizard/components/ProjectSearch/types'

type PropsType = {
  onSubmit: (id: number | string) => void
  projects: ProjectType[]
}

const WorkflowLinkDialog = ({ projects, onSubmit }: PropsType) => {
  const [project, setProject] = useState<number>()
  const { show, onClose } = useDialog(DIALOG_TYPE.WORKFLOW_LINK)

  function handleSubmit() {
    if (project) {
      onSubmit(project)
      onClose()
    }
  }

  function resetData() {
    setProject(undefined)
  }

  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      aria-labelledby="workflow-link-modal"
      TransitionProps={{
        onExited: resetData
      }}
    >
      <DialogTitle id="workflow-link-modal">Select a workflow</DialogTitle>
      <DialogContent dividers>
        <ProjectSearch
          selected={project}
          projects={projects}
          onProjectSelect={setProject}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!project}>
          Link workflow to node
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default WorkflowLinkDialog
