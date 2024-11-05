import * as Constants from '@cf/constants'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import ActionButton from '@cfComponents/UIPrimitives/ActionButton'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import QueueIcon from '@mui/icons-material/Queue'
import {
  deleteSelfQueryLegacy,
  duplicateSelfQuery,
  restoreSelfQueryLegacy,
  useArchiveMutation,
  useInsertChildMutation,
  useInsertSiblingMutation
} from '@XMLHTTP/API/workspace.rtk'
import * as React from 'react'
import { ReactElement } from 'react'

type ActionItemArgs = {
  id: number
  objectType: CfObjectType
}

type ActionItemWithParentArgs = {
  id: number
  objectType: CfObjectType
  parentId: number
}

export function deleteObject({ id, objectType }: ActionItemArgs): void {
  //@todo
  // previously here was logic of calling the selection manager to
  // - clear the selection context
  // ?
  // not sure if that's needed TBD

  /*******************************************************
   * MOVE
   *
   * this check should not live in this function, move this to the actual component button
   *******************************************************/
  // const count   =   this.props.siblingCount
  const count = 4
  if (
    (objectType === 'week' || objectType === 'column') &&
    count < 2
    // this.props.siblingCount < 2
  ) {
    alert(_t('You cannot delete the last ') + objectType)
    return
  }
  /*******************************************************
   * // MOVE
   *******************************************************/

  if (
    // @todo move this to a dialog
    window.confirm(
      _t('Are you sure you want to delete this ') +
        Constants.getLabelForCfObject({
          objectType: objectType
        }).toLowerCase() +
        '?'
    )
  ) {
    COURSEFLOW_APP.tinyLoader.startLoad()
    deleteSelfQueryLegacy(
      id,
      Constants.objectDictionary[objectType],
      true, //why
      (responseData) => {
        console.log('end loaded')
        COURSEFLOW_APP.tinyLoader.endLoad()
      }
    )
  }
}

export function restoreSelf({ id, objectType }: ActionItemArgs): void {
  COURSEFLOW_APP.tinyLoader.startLoad()
  restoreSelfQueryLegacy(
    id,
    Constants.objectDictionary[objectType],
    (responseData) => {
      COURSEFLOW_APP.tinyLoader.endLoad
    }
  )
}

export function duplicateSelf({
  id,
  objectType,
  parentId
}: ActionItemWithParentArgs): void {
  //  const type = this.object_type
  COURSEFLOW_APP.tinyLoader.startLoad()
  duplicateSelfQuery(
    id,
    objectType,
    parentId,
    Constants.parentDictionary[objectType], // if we can look it up here, it doesn't make sense that it's dome in frontend
    Constants.throughParentDictionary[objectType], // if we can look it up here, it doesn't make sense that it's dome in frontend
    (responseData) => {
      COURSEFLOW_APP.tinyLoader.endLoad()
    }
  )
}

// export function insertChild({ id, objectType }: ActionItemArgs): void {
//   console.log('inserting child')
//
//   //   const type = this.object_type
//   COURSEFLOW_APP.tinyLoader.startLoad()
//   insertChildQuery(id, objectType, (responseData) => {
//     COURSEFLOW_APP.tinyLoader.endLoad()
//   })
// }

// export function insertSibling({
//   id,
//   objectType,
//   parentId
// }: ActionItemWithParentArgs): void {
//   //  const type = this.object_type
//   COURSEFLOW_APP.tinyLoader.startLoad()
//
//   insertSiblingQuery(
//     id,
//     objectType,
//     parentId,
//     Constants.parentDictionary[objectType],
//     Constants.throughParentDictionary[objectType]
//   )
// }

/*******************************************************
 * Adds a button that duplicates the item (with a confirmation).
 *******************************************************/
export const DuplicateSelfButton = (data: ActionItemWithParentArgs) => {
  return (
    <ActionButton
      buttonIcon={<ContentCopyIcon />}
      buttonClass="duplicate-self-button"
      titleText={_t('Duplicate')}
      handleClick={() => duplicateSelf(data)}
    />
  )
}

/*******************************************************
 * Adds a button that inserts a child to them item
 *******************************************************/
export const InsertChildButton = (data: ActionItemArgs) => {
  const [mutate, { isSuccess, isError, data: updateData }] =
    useInsertChildMutation()
  const { onError, onSuccess } = useGenericMsgHandler()

  const clickHandler = async () => {
    try {
      const resp = await mutate({
        payload: {
          ...data
        }
      }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
  }
  return (
    <ActionButton
      buttonIcon={<QueueIcon />}
      buttonClass="insert-child-button"
      titleText={_t('Insert Child')}
      handleClick={clickHandler}
    />
  )
}

/*******************************************************
 * Adds a button that inserts a sibling below the item.
 *******************************************************/
export const InsertSiblingButton = (data: ActionItemWithParentArgs) => {
  const [mutate, { isSuccess, isError, data: updateData }] =
    useInsertSiblingMutation()
  const { onError, onSuccess } = useGenericMsgHandler()

  const clickHandler = async () => {
    try {
      const resp = await mutate({
        payload: {
          ...data,
          parentType: Constants.parentDictionary[data.objectType],
          throughType: Constants.throughParentDictionary[data.objectType]
        }
      }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
  }

  return (
    <ActionButton
      buttonIcon={<QueueIcon />}
      buttonClass="insert-sibling-button"
      titleText={_t('Insert Below')}
      handleClick={clickHandler}
    />
  )
}

/*******************************************************
 * Adds a button that deletes the item
 *
 * note: restore button is disabled for all workflow objects
 * it doesn't make sense that this is set to 'soft' (archive)
 *******************************************************/
export const DeleteSelfButton = ({
  id,
  objectType,
  altIcon
}: ActionItemArgs & {
  altIcon?: ReactElement
}) => {
  const [mutate, { isSuccess, isError, data: updateData }] =
    useArchiveMutation()
  const { onError, onSuccess } = useGenericMsgHandler()

  const clickHandler = async () => {
    try {
      const resp = await mutate({ id, payload: { objectType } }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
  }

  return (
    <ActionButton
      buttonIcon={altIcon || <DeleteIcon />}
      buttonClass="delete-self-button"
      titleText={_t('Delete')}
      handleClick={clickHandler}
    />
  )
}
