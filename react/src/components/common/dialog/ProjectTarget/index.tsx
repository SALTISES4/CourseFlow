import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import { getTargetProjectMenuQuery } from '@XMLHTTP/API/workflow'
import { useState } from 'react'
import { TargetProjectQueryResp } from '@XMLHTTP/types/query'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import WorkflowsMenu from '../WorkflowsMenu'
import { _t } from '@cf/utility/utilityFunctions'

function ProjectTargetDialog({ id, actionFunction }: any) {
  const { show, onClose } = useDialog(DIALOG_TYPE.TARGET_PROJECT)
  const [project_data, setProjectData] = useState<TargetProjectQueryResp>(null)

  const onDialogClose = (response: any) => {
    onClose()
    setProjectData(null)
    actionFunction(response)
  }

  const getContent = () => {
    if (!show) {
      return null
    }

    if (project_data == null) {
      getTargetProjectMenuQuery(id, setProjectData)
    } else {
      return (
        <TargetProjectDialogContents
          data={project_data}
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
