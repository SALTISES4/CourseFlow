import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import ActionCreator from '@cfRedux/ActionCreator'
import { TComment, TUser } from '@cfRedux/types/type'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import React, { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

// Props definition
type PropsType = {
  id: string
  setShow: (show: boolean) => void
  objectType: CfObjectType
}

type StateType = {
  tagging: boolean
  userList: TUser[]
}

const CommentBox = ({ id, setShow, objectType }: PropsType) => {
  const dispatch = useDispatch()

  /*******************************************************
   * HOOKS: REDUX
   *******************************************************/

  const comments = []
  const unreadComments: TComment[] = []

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

  const readOnly = false
  const addComments = true

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { onError, onSuccess } = useGenericMsgHandler()
  /**
   * get comments
   **/
  // @todo replace
  const { data, refetch, isError, error } = useFetchByObjectQuery({
    objectId: id,
    objectType
  })

  // @todo replace
  const [deleteOneMutation] = useDeleteCommentMutation()

  // @todo replace
  const [deleteAllMutation] = useDeleteAllByObjectMutation()

  // @todo replace
  const [createMutation] = useCreateCommentMutation()

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
  const reloadComments = async () => {
    await refetch()
    dispatch(
      ActionCreator.reloadCommentsAction(id, objectType, data.dataPackage)
    )
  }

  const removeComment = async (commentid: string) => {
    try {
      const resp = await deleteOneMutation({
        payload: {
          objectId: id,
          commentId,
          objectType
        }
      }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
    reloadComments()
  }

  const removeAllCommentsHandler = async () => {
    try {
      const resp = await deleteAllMutation({
        payload: {
          objectId: id,
          objectType
        }
      }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
    reloadComments()
  }

  const createComment = async () => {
    const text = inputRef.current?.value || ''
    if (!text) {
      return
    }

    inputRef.current.value = ''
    submitRef.current?.classList.add('hidden') // why

    try {
      const resp = await createMutation({
        payload: {
          objectId: id,
          objectType,
          text
        }
      }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
    reloadComments()
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
        const isUnread = unreadComments.includes(comment)
        const commentClass = isUnread ? 'comment unread' : 'comment'
        const text = comment.text.replace(
          /@\w[@a-zA-Z0-9_.]{1,}/g,
          (val) => `<b>${val}</b>`
        )

        return (
          <div className={commentClass} key={index}>
            <div className="comment-by">
              <div className="comment-user">
                {Utility.getUserDisplay(comment.user)}
              </div>
              <div className="comment-on">{comment.createdOn}</div>
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
                  onClick={() => removeComment(comment.id)}
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
      asdfasdf
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
