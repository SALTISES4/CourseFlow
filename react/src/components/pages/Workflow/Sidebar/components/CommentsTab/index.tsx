import {
  createThreadCommentMutation,
  deleteThreadCommentMutation,
  listThreadCommentsOptions,
  listThreadCommentsQueryKey
} from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { UserContext } from '@cf/context/userContext'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { threadCommentCountsActions } from '@cf/features/graph/state/slices/threadCommentCounts.slice'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import type { AppDispatch } from '@cf/redux/store'
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
  useMemo,
  useRef,
  useState
} from 'react'
import { useDispatch } from 'react-redux'

import * as Styled from './styles'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../styles'

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const formatCommentDate = (dateCreated: string): string => {
  const date = new Date(dateCreated)
  const ageMs = Math.max(0, Date.now() - date.getTime())

  if (ageMs < MINUTE_MS) {
    return 'just now'
  }
  if (ageMs < HOUR_MS) {
    const minutes = Math.floor(ageMs / MINUTE_MS)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  }
  if (ageMs < DAY_MS) {
    const hours = Math.floor(ageMs / HOUR_MS)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  }
  if (ageMs <= 7 * DAY_MS) {
    const days = Math.floor(ageMs / DAY_MS)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const CommentsTab = () => {
  const contentRef = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch<AppDispatch>()
  const userContext = useContext(UserContext)
  const queryClient = useQueryClient()
  const { onError: showError, onSuccess: showSuccess } = useGenericMsgHandler()
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

  const invalidateComments = useCallback(
    async (commentThreadUuid: string) => {
      await queryClient.invalidateQueries({
        queryKey: listThreadCommentsQueryKey({
          path: { uuid: commentThreadUuid }
        })
      })
    },
    [queryClient]
  )

  const createMutation = useMutation({
    ...createThreadCommentMutation(),
    onSuccess: async (_data, variables) => {
      const commentThreadUuid = variables.path.uuid
      await invalidateComments(commentThreadUuid)
      dispatch(
        threadCommentCountsActions.adjustCount({
          threadUuid: commentThreadUuid,
          delta: 1
        })
      )
    },
    onError: () => undefined
  })

  const deleteMutation = useMutation({
    ...deleteThreadCommentMutation(),
    onSuccess: async (_data, variables) => {
      const commentThreadUuid = variables.path.uuid
      await invalidateComments(commentThreadUuid)
      dispatch(
        threadCommentCountsActions.adjustCount({
          threadUuid: commentThreadUuid,
          delta: -1
        })
      )
      showSuccess({
        message: _t('Your comment has been successfully deleted')
      })
    },
    onError: () =>
      showError(_t('We encountered an issue and your comment was not deleted'))
  })

  const comments = useMemo(
    () =>
      [...(commentsQuery.data ?? [])].sort(
        (a, b) =>
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
      ),
    [commentsQuery.data]
  )

  useEffect(() => {
    setDraft('')
  }, [entityUuid, threadUuid])

  const scrollToTop = useCallback(() => {
    setTimeout(() => {
      contentRef.current?.scrollTo({
        top: 0,
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
      deleteMutation.mutate({
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

    createMutation.mutate(
      {
        path: { uuid: threadUuid },
        body: { body }
      },
      {
        onSuccess: () => {
          setDraft('')
          scrollToTop()
        }
      }
    )
  }, [createMutation, draft, scrollToTop, threadUuid])

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
            const authorLabel = Utility.getUserDisplay(comment.author).trim()
            return (
              <Styled.Comment
                key={comment.uuid}
                data-test-id="workflow-comments-list-item"
              >
                <Styled.CommentHeader data-test-id="workflow-comments-list-item-header">
                  {authorLabel} &bull; {formatCommentDate(comment.dateCreated)}
                </Styled.CommentHeader>
                <Styled.CommentText data-test-id="workflow-comments-list-item-body">
                  {comment.body}
                </Styled.CommentText>
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
          label={_t('Add a comment')}
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
          {_t('Add comment')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default CommentsTab
