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
import { useTranslation } from 'react-i18next'
import { normalizeLocale } from '@cf/i18n/config'

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

const formatCommentDate = (dateCreated: string, locale: string): string => {
  const date = new Date(dateCreated)
  const ageMs = Math.max(0, Date.now() - date.getTime())
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (ageMs < MINUTE_MS) {
    return relative.format(0, 'second')
  }
  if (ageMs < HOUR_MS) {
    const minutes = Math.floor(ageMs / MINUTE_MS)
    return relative.format(-minutes, 'minute')
  }
  if (ageMs < DAY_MS) {
    const hours = Math.floor(ageMs / HOUR_MS)
    return relative.format(-hours, 'hour')
  }
  if (ageMs <= 7 * DAY_MS) {
    const days = Math.floor(ageMs / DAY_MS)
    return relative.format(-days, 'day')
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const CommentsTab = () => {
  const { t, i18n } = useTranslation('workflow')
  const { t: tCommon } = useTranslation('common')
  const locale = normalizeLocale(i18n.resolvedLanguage)
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
        localizedMessage: t('messages.commentDeleted')
      })
    },
    onError: () =>
      showError({
        localizedMessage: t('messages.commentDeleteFailed')
      })
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
            {t('comments.title')}
          </SidebarTitle>
          <Typography variant="body2" color="text.secondary">
            {t('comments.selectItem')}
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
            {t('comments.title')}
          </SidebarTitle>
          <Typography variant="body2" color="text.secondary">
            {t('comments.unavailable')}
          </Typography>
        </SidebarContent>
      </SidebarInnerWrap>
    )
  }

  return (
    <SidebarInnerWrap>
      <SidebarContent ref={contentRef}>
        <SidebarTitle as="h3" variant="h6">
          {t('comments.title')}
        </SidebarTitle>

        {commentsQuery.isPending && (
          <CircularProgress size={24} aria-label={t('comments.loading')} />
        )}

        {commentsQuery.isError && (
          <Typography variant="body2" color="error">
            {t('comments.loadFailed')}
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
                  {authorLabel} &bull;{' '}
                  {formatCommentDate(comment.dateCreated, locale)}
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
                    {tCommon('actions.delete')}
                  </Link>
                )}
              </Styled.Comment>
            )
          })}
        </Styled.CommentsList>
      </SidebarContent>

      <SidebarActions>
        <TextField
          label={t('comments.addPlaceholder')}
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
          {t('comments.add')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default CommentsTab
