import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
// import $ from 'jquery'
import { _t } from '@cf/utility/Utility.class'
import ActionButton from '@cfComponents/UIPrimitives/ActionButton'
import CommentBox from '@cfEditableComponents/components/CommentBox'
import ActionCreator from '@cfRedux/ActionCreator'
import AddCommentIcon from '@mui/icons-material/AddComment'
import { Dispatch } from '@reduxjs/toolkit'
import { getCommentsForObjectQuery } from '@XMLHTTP/API/comment'
import { ReactElement, ReactPortal } from 'react'
import * as React from 'react'
import { Action } from 'redux'

import SidebarEditTabProxy from './components/SidebarEditTabProxy'

// const LinkedWorkflowButton = (id: any) => {
//   const { dispatch } = useDialog()
//
//   return (
//     <Button onClick={() => dispatch(DialogMode.LINK_WORKFLOW)}>
//       {_t('Change')}
//     </Button>
//   )
// }

//Extends the React component to add a few features that are used in a large number of components

export type EditableComponentProps = {
  throughParentId?: number
  dispatch?: Dispatch<Action> // @todo where is dispatch coming from?
  data?: any
  placeholder?: any
  text?: any
  textChangeFunction?: any
  disabled?: any
  objectSets?: any
}

type StateType = {
  selected: boolean
  showComments: boolean // was in EditableComponentWithComments
}
export type EditableComponentStateType = StateType

class EditableComponent<
  P extends EditableComponentProps,
  S extends StateType
> extends React.Component<P, S> {
  contextType = WorkflowConfigContext
  declare context: React.ContextType<typeof WorkflowConfigContext>
  mainDiv: React.RefObject<HTMLDivElement>

  objectType: CfObjectType
  objectClass: string

  constructor(props: P) {
    super(props)

    this.mainDiv = React.createRef()
    this.state = {} as S
  }

  /*******************************************************
   * PORTAL (RENDER)
   * i think we are ready to delete all this
   *******************************************************/
  addEditable(data, noDelete = false): ReactPortal | ReactElement {
    if (!this.state.selected) {
      return <></>
    }

    // TODO: remove
    // // #edit-menu dynamic, in RightSideBar component
    // return ReactDOM.createPortal(
    //   <this.EditForm data={data} noDelete={noDelete} />,
    //   document.getElementById('edit-menu')
    // ) as unknown as ReactPortal

    // TODO: figure out where the id/hash is coming from
    // to uniquely identify a clicked element
    return <SidebarEditTabProxy id={3} />
  }
}

export default EditableComponent
