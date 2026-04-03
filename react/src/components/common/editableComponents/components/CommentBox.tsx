import {
  createThreadCommentMutation,
  deleteAllThreadCommentsMutation,
  deleteThreadCommentMutation,
  listThreadCommentsOptions,
  listThreadCommentsQueryKey
} from '@cf/api/gen/@tanstack/react-query.gen'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import { TUser } from '@cfRedux/types/type'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useRef, useState } from 'react'

// Props definition — `id` is the thread UUID for v2 thread comment endpoints
type PropsType = {
  id: string
  setShow: (show: boolean) => void
  objectType: CfObjectType
}

const CommentBox = ({
  id,
  setShow: _setShow,
  objectType: _objectType
}: PropsType) => {
  const queryClient = useQueryClient()

  const readOnly = false
  const addComments = true

  /*******************************************************
   * HOOKS: REFS
   *******************************************************/
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const submitRef = useRef<HTMLDivElement>(null)

  /*******************************************************
   * HOOKS: STATE
   *******************************************************/
  const [tagging, setTagging] = useState(false)
  const [userList, setUserList] = useState<TUser[]>([])
  const [tagPosition, setTagPosition] = useState(0)

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { onError, onSuccess } = useGenericMsgHandler()

  const { data: comments = [], refetch } = useQuery({
    ...listThreadCommentsOptions({ path: { uuid: id } }),
    enabled: Boolean(id)
  })

  const invalidateThreadComments = async () => {
    await queryClient.invalidateQueries({
      queryKey: listThreadCommentsQueryKey({ path: { uuid: id } })
    })
  }

  const deleteOneMutation = useMutation({
    ...deleteThreadCommentMutation(),
    onSuccess: async () => {
      await invalidateThreadComments()
    }
  })

  const deleteAllMutation = useMutation({
    ...deleteAllThreadCommentsMutation(),
    onSuccess: async () => {
      await invalidateThreadComments()
    }
  })

  const createMutation = useMutation({
    ...createThreadCommentMutation(),
    onSuccess: async () => {
      await invalidateThreadComments()
    }
  })

  /*******************************************************
   * LIFE CYCLE HOOKS
   *******************************************************/
  // useEffect(() => {
  //   if (!show) {
  //     commentsSeen()
  //     if (tagging) {
  //       setTagging(false)
  //     }
  //   }
  // }, [show])

  /*******************************************************
   * COMMENT CRUD HANDLERS
   *******************************************************/

  const removeComment = async (commentUuid: string) => {
    try {
      const resp = await deleteOneMutation.mutateAsync({
        path: { uuid: id, comment_uuid: commentUuid }
      })
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
  }

  const removeAllCommentsHandler = async () => {
    try {
      const resp = await deleteAllMutation.mutateAsync({
        path: { uuid: id }
      })
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
  }

  const createComment = async () => {
    const text = inputRef.current?.value || ''
    if (!text) {
      return
    }

    try {
      const resp = await createMutation.mutateAsync({
        path: { uuid: id },
        body: { body: text }
      })
      onSuccess(resp)
      inputRef.current.value = ''
      submitRef.current?.classList.add('hidden')
    } catch (e) {
      onError(e)
    }
  }

  /*******************************************************
   *
   *******************************************************/

  // Event Handlers
  const commentClick = (evt: React.MouseEvent) => {
    // evt.stopPropagation()
    // if (!show) {
    //   reloadComments(true)
    // } else {
    //   setShow(false)
    // }
  }

  const addUserTag = (user: TUser) => {
    const currentValue = inputRef.current?.value || ''
    const toAdd =
      (currentValue[tagPosition - 1] !== ' ' ? ' ' : '') + `@${user.username} `
    const newValue =
      currentValue.slice(0, tagPosition) +
      toAdd +
      currentValue.slice(tagPosition)

    if (inputRef.current) {
      inputRef.current.value = newValue
      inputRef.current.selectionStart = newValue.length
    }

    setTagging(false)
  }

  const textChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    return
    /* eslint-disable no-undef -- legacy @todo (dead after early return) */
    const value = inputRef.current?.value || ''

    if (value) {
      submitRef.current?.classList.remove('hidden')
    } else {
      submitRef.current?.classList.add('hidden')
    }

    if (evt.nativeEvent?.data === '@') {
      setTagPosition(inputRef.current?.selectionStart || 0)

      // @todo replace
      getUsersForObjectQueryLegacy(workflow.id, 'workflow', (response) => {
        setUserList(response.dataPackage)
        setTagging(true)
      })
    } else if (tagging) {
      setTagging(false)
    }
    /* eslint-enable no-undef */
  }

  const commentsSeen = () => {
    // Logic for marking comments as seen (not implemented here)
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  const TagBox = () =>
    tagging && (
      <div className="comment-tag-box">
        {userList.map((user, index) => (
          <div
            key={index}
            className="user-name hover-shade"
            onClick={() => addUserTag(user)}
          >
            {Utility.getUserDisplay(user)}
          </div>
        ))}
      </div>
    )

  const Comments = () => (
    <>
      {comments.map((comment, index) => {
        const isUnread = false
        const commentClass = isUnread ? 'comment unread' : 'comment'
        const text = comment.body.replace(
          /@\w[@a-zA-Z0-9_.]{1,}/g,
          (val) => `<b>${val}</b>`
        )

        return (
          <div className={commentClass} key={comment.uuid ?? index}>
            <div className="comment-by">
              <div className="comment-user">
                {Utility.getUserDisplay(comment.author)}
              </div>
              <div className="comment-on">{comment.dateCreated}</div>
            </div>
            <div
              className="comment-text"
              dangerouslySetInnerHTML={{ __html: text }}
            />
            {!readOnly && (
              <div className="mouseover-actions">
                <div
                  className="action-button"
                  title={_t('Delete Comment')}
                  onClick={() => removeComment(comment.uuid)}
                >
                  <DeleteIcon />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </>
  )

  const CommentDialog = () => (
    <div className="comment-box">
      <div className="comment-top-row">
        <CloseIcon onClick={commentClick} />
        {!readOnly && comments.length > 1 && (
          <DeleteIcon onClick={removeAllCommentsHandler} />
        )}
      </div>
      <hr />
      <Comments />
      {addComments && (
        <div className="comment-input-line">
          <textarea
            ref={inputRef}
            className="comment-input"
            placeholder={_t('Add a comment')}
            onInput={textChange}
          />
          <div ref={submitRef} className="add-comment-button hidden">
            <AddIcon onClick={createComment} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {<CommentDialog />}
      <TagBox />
    </>
  )
}

export default CommentBox
