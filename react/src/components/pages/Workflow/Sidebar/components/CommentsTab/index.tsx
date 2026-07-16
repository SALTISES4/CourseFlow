import {
  createThreadCommentMutation,
  deleteThreadCommentMutation,
  listThreadCommentsOptions,
  listThreadCommentsQueryKey
} from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { UserContext } from '@cf/context/userContext'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { _t } from '@cf/utility/Utility.class'
import Utility from '@cf/utility/Utility.class'
import { useCommentThreadContext } from '@cfSidebar/hooks/useCommentThreadContext'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'

import * as Styled from './styles'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../styles'

const CommentsTab = () => {
  const contentRef = useRef<HTMLDivElement>(null)
  const userContext = useContext(UserContext)
  const queryClient = useQueryClient()
  const { onError, onSuccess } = useGenericMsgHandler()
  const { entityUuid, threadUuid, isCommentHost } = useCommentThreadContext()
  const [draft, setDraft] = useState('')
  const canComment = useResourcePermission(WorkflowPermission.COMMENT)
  const canDeleteOwn = useResourcePermission(
    WorkflowPermission.DELETE_OWN_COMMENT
  )

  const commentsQuery = useQuery({
    ...listThreadCommentsOptions({
      path: { uuid: threadUuid ?? '' }
    }),
    enabled: Boolean(threadUuid)
  })

  const invalidateComments = useCallback(async () => {
    if (!threadUuid) {
      return
    }
    await queryClient.invalidateQueries({
      queryKey: listThreadCommentsQueryKey({ path: { uuid: threadUuid } })
    })
  }, [queryClient, threadUuid])

  const createMutation = useMutation({
    ...createThreadCommentMutation(),
    onSuccess: async (data) => {
      await invalidateComments()
      onSuccess(data)
    },
    onError
  })

  const deleteMutation = useMutation({
    ...deleteThreadCommentMutation(),
    onSuccess: async (data) => {
      await invalidateComments()
      onSuccess(data)
    },
    onError
  })

  const comments = commentsQuery.data ?? []

  useEffect(() => {
    setDraft('')
  }, [entityUuid, threadUuid])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      contentRef.current?.scrollTo({
        top: 99999,
        left: 0,
        behavior: 'smooth'
      })
    }, 0)
  }, [])

  const onTextChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value)
  }, [])

  const onCommentDelete = useCallback(
    (commentUuid: string) => () => {
      if (!threadUuid) {
        return
      }
      void deleteMutation.mutateAsync({
        path: { uuid: threadUuid, comment_uuid: commentUuid }
      })
    },
    [deleteMutation, threadUuid]
  )

  const onCommentSubmit = useCallback(() => {
    const body = draft.trim()
    if (!body || !threadUuid) {
      return
    }

    void createMutation
      .mutateAsync({
        path: { uuid: threadUuid },
        body: { body }
      })
      .then(() => {
        setDraft('')
        scrollToBottom()
      })
  }, [createMutation, draft, scrollToBottom, threadUuid])

  if (!isCommentHost || !entityUuid) {
    return (
      <SidebarInnerWrap>
        <SidebarContent>
          <SidebarTitle as="h3" variant="h6">
            {_t('Comments')}
          </SidebarTitle>
          <Typography variant="body2" color="text.secondary">
            {_t('Select an item to view or add comments.')}
          </Typography>
        </SidebarContent>
      </SidebarInnerWrap>
    )
  }

  if (!threadUuid) {
    return (
      <SidebarInnerWrap>
        <SidebarContent>
          <SidebarTitle as="h3" variant="h6">
            {_t('Comments')}
          </SidebarTitle>
          <Typography variant="body2" color="text.secondary">
            {_t('Comments are not available for this item yet.')}
          </Typography>
        </SidebarContent>
      </SidebarInnerWrap>
    )
  }

  return (
    <SidebarInnerWrap>
      <SidebarContent ref={contentRef}>
        <SidebarTitle as="h3" variant="h6">
          {_t('Comments')}
        </SidebarTitle>

        {commentsQuery.isPending && (
          <CircularProgress size={24} aria-label={_t('Loading comments')} />
        )}

        {commentsQuery.isError && (
          <Typography variant="body2" color="error">
            {_t('Could not load comments.')}
          </Typography>
        )}

        <Styled.CommentsList direction="column" spacing={2}>
          {comments.map((comment) => {
            const isMe = comment.author.uuid === userContext.uuid
            const authorLabel = isMe
              ? _t('Me')
              : Utility.getUserDisplay(comment.author)
            return (
              <Styled.Comment key={comment.uuid}>
                <Styled.CommentHeader>
                  {authorLabel} &bull; {Utility.formatDate(comment.dateCreated)}
                </Styled.CommentHeader>
                <Styled.CommentText>{comment.body}</Styled.CommentText>
                {isMe && canDeleteOwn && (
                  <Link
                    component="button"
                    variant="body2"
                    sx={{ mt: 1 }}
                    onClick={onCommentDelete(comment.uuid)}
                    disabled={deleteMutation.isPending}
                  >
                    {_t('Delete')}
                  </Link>
                )}
              </Styled.Comment>
            )
          })}
        </Styled.CommentsList>
      </SidebarContent>

      <SidebarActions>
        <TextField
          label={_t('Comment')}
          multiline
          maxRows={5}
          value={draft}
          onChange={onTextChange}
          disabled={!canComment || createMutation.isPending}
        />
        <Button
          variant="contained"
          onClick={onCommentSubmit}
          disabled={!canComment || !draft.trim() || createMutation.isPending}
        >
          {_t('Comment')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default CommentsTab
