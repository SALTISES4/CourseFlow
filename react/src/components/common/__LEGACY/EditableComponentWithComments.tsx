import * as Constants from '@cf/constants'
// @components
import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/utilityFunctions'
import ActionButton from '@cfComponents/UIPrimitives/ActionButton'
import CommentBox from '@cfEditableComponents/components/CommentBox'
import EditableComponent, {
  EditableComponentProps,
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import ActionCreator from '@cfRedux/ActionCreator'
import { Dispatch } from '@reduxjs/toolkit'
import { getCommentsForObjectQuery } from '@XMLHTTP/API/comment'
import * as React from 'react'
import { Action } from 'redux'

type StateType = {
  show_comments: boolean
} & EditableComponentStateType

type OwnProps = {
  dispatch?: Dispatch<Action>
} & EditableComponentProps

export type EditableComponentWithCommentsType = OwnProps
export type EditableComponentWithCommentsStateType = StateType

class EditableComponentWithComments<
  P extends OwnProps,
  S extends StateType
> extends EditableComponent<P, S> {}

export default EditableComponentWithComments
