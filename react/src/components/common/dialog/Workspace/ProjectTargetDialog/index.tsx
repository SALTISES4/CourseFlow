import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'
import WorkflowsMenu from '@cfComponents/dialog/_LEGACY/WorkflowsMenu'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { getTargetProjectMenuQuery } from '@XMLHTTP/API/workflow'
import { TargetProjectQueryResp } from '@XMLHTTP/types/query'
import { useState } from 'react'

function ProjectTargetDialog({ id, actionFunction }: any) {
  const { show, onClose } = useDialog(DIALOG_TYPE.TARGET_PROJECT)
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
      getTargetProjectMenuQuery(id, setProjectData)
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
  return (
    <WorkflowsMenu
      type="target_project_menu"
      data={data}
      actionFunction={onDialogClose}
    />
  )
}

export default ProjectTargetDialog
