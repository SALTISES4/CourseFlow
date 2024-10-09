import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'
import WorkflowsMenu from '@cfComponents/dialog/_LEGACY/WorkflowsMenu'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { getLinkedWorkflowMenuQuery } from '@XMLHTTP/API/workflow'
import { LinkedWorkflowMenuQueryResp } from '@XMLHTTP/types/query'
import { useState } from 'react'

function WorkflowLinkDialog({ id }: any) {
  const { show, onClose } = useDialog(DialogMode.LINK_WORKFLOW)
  const [workflowData, setWorkflowData] =
    useState<LinkedWorkflowMenuQueryResp>(null)

  const onDialogClose = () => {
    onClose()
    setWorkflowData(null)
  }

  const getContent = () => {
    if (show) {
      if (workflowData == null) getLinkedWorkflowMenuQuery(id, setWorkflowData)
      else
        return (
          <LinkWorkflowDialogContents
            data={workflowData}
            onDialogClose={onDialogClose}
          />
        )
    } else return null
  }

  return (
    <Dialog open={show} onClose={onDialogClose}>
      <DialogTitle>{_t('Choose A Workflow')}</DialogTitle>
      <DialogContent>{getContent()}</DialogContent>
    </Dialog>
  )
}

type LinkWorkflowDialogContentsType = {
  data: LinkedWorkflowMenuQueryResp
  onDialogClose: any
}
function LinkWorkflowDialogContents({
  data,
  onDialogClose
}: LinkWorkflowDialogContentsType) {
  return (
    <WorkflowsMenu
      type={'linkedWorkflow_menu'}
      data={data}
      actionFunction={onDialogClose}
    />
  )
}

export default WorkflowLinkDialog
