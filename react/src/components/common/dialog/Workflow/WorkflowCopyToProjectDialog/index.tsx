import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'
import WorkflowsMenu from '@cfComponents/__LEGACY/dialog/WorkflowsMenu'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { getTargetProjectMenuQuery } from '@XMLHTTP/API/workflow'
import { TargetProjectQueryResp } from '@XMLHTTP/types/query'
import { useState } from 'react'


 // function copyToProject(
 //    workflowId: number,
 //    projectId: number,
 //    workflowType: WorkflowType
 //  ) {
 //    const loader = COURSEFLOW_APP.tinyLoader
 //    loader.startLoad()
 //    duplicateBaseItemQuery(
 //      workflowId,
 //      workflowType,
 //      projectId,
 //      (responseData) => {
 //        loader.endLoad()
 //        window.location.href = 'path top newly created item'
 //      }
 //    )
 //  }

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

export default WorkflowCopyToProjectDialog
