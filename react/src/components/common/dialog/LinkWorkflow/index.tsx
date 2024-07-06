import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { getLinkedWorkflowMenuQuery } from '@XMLHTTP/API/workflow'
import { useState } from 'react'
import {
  LinkedWorkflowMenuQueryResp,
} from '@XMLHTTP/types/query'
import { DIALOG_TYPE, useDialog } from '../'
import WorkflowsMenu from '../WorkflowsMenu'

function LinkWorkflowDialog({id}:any) {
  console.log(id)
  const { show, onClose } = useDialog(DIALOG_TYPE.LINK_WORKFLOW)
  const [workflow_data,setWorkflowData] = useState<LinkedWorkflowMenuQueryResp>(null)

  const onDialogClose = ()=>{
    setWorkflowData(null)
    onClose()
  }

  const getContent = ()=>{
    if(show){
      if( workflow_data == null) getLinkedWorkflowMenuQuery(id,setWorkflowData)
      else return <LinkWorkflowDialogContents data={workflow_data} onDialogClose={onDialogClose}/>
    }else return null
  }


  return (
    <Dialog open={show} onClose={onDialogClose}>
      <DialogTitle>{window.gettext("Choose A Workflow")}</DialogTitle>
      <DialogContent>
        {getContent()}
      </DialogContent>
    </Dialog>
  )
}


type LinkWorkflowDialogContentsType = {
  data: LinkedWorkflowMenuQueryResp
  onDialogClose:any
}
function LinkWorkflowDialogContents({data,onDialogClose}:LinkWorkflowDialogContentsType){
  console.log(data)
  return (<WorkflowsMenu 
    type={"linked_workflow_menu"} 
    data={data}
    actionFunction={onDialogClose}
    dispatch={null} //@todo: do we need this?
  />)
}

export default LinkWorkflowDialog