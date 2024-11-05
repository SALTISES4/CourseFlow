import { _t } from '@cf/utility/utilityFunctions'
import * as React from 'react'

import EditableComponentWithComments, {
  EditableComponentWithCommentsStateType,
  EditableComponentWithCommentsType
} from './EditableComponentWithComments'

type OwnProps = {
  siblingCount?: any
  parentId?: any
} & EditableComponentWithCommentsType
export type EditableComponentWithActionsProps = OwnProps

type StateType = EditableComponentWithCommentsStateType
export type EditableComponentWithActionsState = StateType

/**
 * Extends the React component to add a few features that are used in a large number of components
 */
class EditableComponentWithActions<
  P extends OwnProps,
  S extends StateType
> extends EditableComponentWithComments<P, S> {}

export default EditableComponentWithActions
