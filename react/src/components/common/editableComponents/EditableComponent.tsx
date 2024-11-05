import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import Utility from '@cf/utility/Utility.class'
// import $ from 'jquery'
import { _t } from '@cf/utility/Utility.class'
import { UtilityLoaderClass } from '@cf/utility/UtilityLoader.class'
import WorkflowLinkDialog from '@cfComponents/dialog/Workflow/WorkflowLinkDialog'
import ActionButton from '@cfComponents/UIPrimitives/ActionButton'
import CommentBox from '@cfEditableComponents/components/CommentBox'
import QuillDiv from '@cfEditableComponents/components/QuillDiv'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import ActionCreator from '@cfRedux/ActionCreator'
import { toggleDropReduxAction } from '@cfRedux/utility/helpers'
import AddCommentIcon from '@mui/icons-material/AddComment'
import Button from '@mui/material/Button'
import { Dispatch } from '@reduxjs/toolkit'
import { getCommentsForObjectQuery } from '@XMLHTTP/API/comment'
import { toggleStrategyQuery } from '@XMLHTTP/API/update'
import { updateObjectSet } from '@XMLHTTP/API/update'
import { ReactElement, ReactPortal } from 'react'
import * as React from 'react'
import { Action } from 'redux'

import SidebarEditTabProxy from './components/SidebarEditTabProxy'

const choices = COURSEFLOW_APP.globalContextData.workflowChoices

const LinkedWorkflowButton = (id: any) => {
  const { dispatch } = useDialog()

  return (
    <Button onClick={() => dispatch(DialogMode.LINK_WORKFLOW)}>
      {_t('Change')}
    </Button>
  )
}

//Extends the React component to add a few features that are used in a large number of components

export type EditableComponentProps = {
  objectId?: number
  parentId?: number
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
   * FUNCTIONS
   *******************************************************/

  // this should go somewhere else
  getBorderStyle() {
    const data = this.props.data
    if (!data) {
      return
    }

    const border = data.lock ? '2px solid ' + data.lock.userColour : undefined
    return {
      border
    }
  }

  toggleDrop = (evt: React.MouseEvent) => {
    evt.stopPropagation()

    toggleDropReduxAction(
      this.props.objectId,
      Constants.objectDictionary[this.objectType],
      // isDropped --
      //  local state, but it's also saved in the DB.
      // isDropped more or less seems to be is the drawer expanded on the UI element
      !this.props.data?.isDropped,
      this.props.dispatch,
      this.props.data?.depth
    )
  }


  /*******************************************************
   * EDITABLE 'COMMENT' CLASS
   *
   * this has been extracted from EditableComponentWithComments
   * this is temporary while we fix the class inheritance
   *
   *  see lucid chart if we need to refer to components which extended the EditableComponentWithComments class
   *  https://lucid.app/lucidchart/70835342-0dbd-4d23-86f7-a1e001ce470c/edit?invitationId=inv_b058f1a6-2a8c-428f-84c3-a8b7c6559906&page=AYPlMB8I45gX#
   *
   *******************************************************/
  commentClick(evt) {
    evt.stopPropagation()
    if (!this.state.showComments) {
      this.reloadComments(true)
    } else {
      this.setState({ showComments: false })
    }
  }

  reloadComments(showComments: boolean) {
    const data = this.props.data
    COURSEFLOW_APP.tinyLoader.startLoad()
    getCommentsForObjectQuery(
      data.id,
      Constants.objectDictionary[this.objectType],
      (responseData) => {
        this.props.dispatch(
          ActionCreator.reloadCommentsAction(
            this.props.data.id,
            Constants.objectDictionary[this.objectType],
            responseData.dataPackage
          )
        )
        if (showComments) {
          this.setState({ showComments: true })
        }
        // this.setState({
        //   showComments: true,
        //   commentData: responseData.dataPackage
        // })
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  AddCommenting = () => {
    return (
      <>
        <ActionButton
          buttonIcon={<AddCommentIcon />}
          buttonClass="comment-button"
          titleText={_t('Comments')}
          handleClick={this.commentClick.bind(this)}
        />
        {/*

        */}
        {/*
        comments broken because moved workflow out of context
        */}
        {this.state.showComments && <>comments placeholder </>}
        {/*<CommentBox*/}
        {/*  show={this.state.showComments}*/}
        {/*  comments={this.props.data.comments}*/}
        {/*  parent={this}*/}
        {/*  workflowId={this.context.workflow.workflowId}*/}
        {/*  unreadComments={this.context.workflow.unreadComments}*/}
        {/*  readOnly={this.context.permissions.workflowPermissions.readOnly}*/}
        {/*  addComments={this.context.workflow.addComments}*/}
        {/*/>*/}
      </>
    )
  }

  /*******************************************************
   *
   *******************************************************/

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
