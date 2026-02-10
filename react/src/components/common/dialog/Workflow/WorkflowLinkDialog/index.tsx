import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/Utility.class'
import { StyledDialog } from '@cfComponents/dialog/styles'
import Alert from '@cfComponents/UIPrimitives/Alert'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { getLinkedWorkflowMenuQuery } from '@XMLHTTP/API/workflowObjects/workflow'
import { LinkedWorkflowMenuQueryResp } from '@XMLHTTP/types/query'
import { useCallback, useEffect, useState } from 'react'

function NodeLinkWorkflowDialog() {
  const { payload, show, onClose } = useDialog(DialogMode.NODE_LINK_WORKFLOW)
  const [workflowData, setWorkflowData] =
    useState<LinkedWorkflowMenuQueryResp>(null)

  const onDialogClose = useCallback(() => {
    onClose()
    setWorkflowData(null)
  }, [onClose])

  useEffect(() => {
    if (workflowData === null && payload?.id) {
      getLinkedWorkflowMenuQuery(payload.id, setWorkflowData)
    }
  }, [workflowData, payload])

  return (
    <StyledDialog open={show} fullWidth maxWidth="sm" onClose={onDialogClose}>
      <DialogTitle>{_t('Choose A Workflow')}</DialogTitle>
      <DialogContent dividers>
        <DialogContents data={workflowData} />
      </DialogContent>
    </StyledDialog>
  )
}

function DialogContents({ data }: { data: LinkedWorkflowMenuQueryResp }) {
  if (!data) {
    return <Alert persistent severity="error" title="TODO: API integration" />
  }

  console.log('++++ WORKFLOW LINK', data)

  return (
    <Alert
      severity="success"
      title="TODO: render results to the UI"
      subtitle="Check the console yo"
    />
  )
}

export default NodeLinkWorkflowDialog
