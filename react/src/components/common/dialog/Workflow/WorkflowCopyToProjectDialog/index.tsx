import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/Utility.class'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useState } from 'react'

const getTargetProjectMenuQuery = () => {
  console.log('getTargetProjectMenuQuery fired')
}

export type TargetProjectQueryResp = {
  message: string
  dataPackage: {
    ownedProjects: any
    editProjects: any
    deletedProjects?: any
  }
  workflowUuid: string
}

function WorkflowCopyToProjectDialog({ id, actionFunction }: any) {
  const { show, onClose } = useDialog(DialogMode.WORKFLOW_COPY_TO_PROJECT)
  const [projectData, setProjectData] = useState<TargetProjectQueryResp>(null)

  const onDialogClose = (response: any) => {
    onClose()
    setProjectData(null)
    actionFunction(response)
  }

  const getContent = () => {
    if (!show) {
      return null
    }

    if (projectData == null) {
      // not sure what this does
      getTargetProjectMenuQuery()
    } else {
      return (
        <TargetProjectDialogContents
          data={projectData}
          onDialogClose={onDialogClose}
        />
      )
    }
  }

  return (
    <Dialog open={show} onClose={onDialogClose}>
      <DialogTitle>{_t('Choose A Project')}</DialogTitle>
      <DialogContent>{getContent()}</DialogContent>
    </Dialog>
  )
}

type TargetProjectDialogContentsType = {
  data: TargetProjectQueryResp
  onDialogClose: any
}

function TargetProjectDialogContents({
  data,
  onDialogClose
}: TargetProjectDialogContentsType) {
  return <>copy to project content goes here </>
}

export default WorkflowCopyToProjectDialog
