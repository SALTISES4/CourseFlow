import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import Utility, { _t } from '@cf/utility/Utility.class'
import ActionButton from '@cfComponents/UIPrimitives/ActionButton'
import CommentBox from '@cfEditableComponents/components/CommentBox'
import AddCommentIcon from '@mui/icons-material/AddComment'
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
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'

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
        Utility.logger('end loaded')
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
//   Utility.logger('inserting child')
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
      onClickHandler={() => duplicateSelf(data)}
    />
  )
}

/*******************************************************
 * Adds a button that inserts a child to them item
 *
 * .. insert  child is only outcomes (?)
 *******************************************************/
export const InsertChildButton = (data: ActionItemArgs) => {
  const [mutate, { isSuccess, isError, data: updateData }] =
    useInsertChildMutation()
  const { onError, onSuccess } = useGenericMsgHandler()

  const onClickHandler = async () => {
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
      onClickHandler={onClickHandler}
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

  const onClickHandler = async () => {
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
      onClickHandler={onClickHandler}
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

  const onClickHandler = async () => {
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
      onClickHandler={onClickHandler}
    />
  )
}

export const AddCommentingButton = ({
  setShow,
  show
}: {
  show: boolean
  setShow: (show: boolean) => void
}) => {
  return (
    <>
      <ActionButton
        buttonIcon={<AddCommentIcon />}
        buttonClass="comment-button"
        titleText={_t('Comments')}
        onClickHandler={() => {
          setShow(!show)
        }}
      />
    </>
  )
}

const HoverMenu = ({
  canComment,
  canWrite,
  objectId,
  parentId,
  objectType
}: {
  objectType: CfObjectType
  canComment: boolean
  canWrite: boolean
  objectId: number
  parentId: number
}) => {
  const [show, setShow] = useState<boolean>(false)

  const memoizedCommentBox = useMemo(
    () => (
      <CommentBox id={objectId} setShow={setShow} objectType={objectType} />
    ),
    [objectId, objectType]
  )

  return (
    <>
      <div className="mouseover-actions">
        {canWrite && (
          <>
            <InsertSiblingButton
              id={objectId}
              objectType={objectType}
              parentId={parentId}
            />
            <DuplicateSelfButton
              id={objectId}
              objectType={objectType}
              parentId={parentId}
            />
            <DeleteSelfButton id={objectId} objectType={objectType} />
          </>
        )}
        {canComment && <AddCommentingButton show={show} setShow={setShow} />}
      </div>

      {/*{show && (*/}
      {/*  <CommentBox id={objectId} setShow={setShow} objectType={objectType} />*/}
      {/*)}*/}
      {show && memoizedCommentBox}
    </>
  )
}
