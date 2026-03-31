import { UserContext } from '@cf/context/userContext'
import { _t } from '@cf/utility/Utility.class'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useContext, useRef, useState } from 'react'

import data from './data'
import * as Styled from './styles'
import { Comments } from './types'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../styles'

type StateType = {
  text: string
  comments: Comments
}

const CommentsTab = () => {
  const contentRef = useRef<HTMLDivElement>(null)
  const userContext = useContext(UserContext)
  const [state, setState] = useState<StateType>({
    text: '',
    comments: data
  })

  const onTextChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setState(
      produce((draft) => {
        draft.text = e.target.value
      })
    )
  }, [])

  const onCommentDelete = useCallback((id: string) => {
    return () => {
      setState(
        produce((draft) => {
          const index = draft.comments.findIndex((c) => c.id === id)
          if (index !== -1) {
            draft.comments.splice(index, 1)
          }
        })
      )
    }
  }, [])

  const onCommentSubmit = useCallback(() => {
    if (state.text) {
      setState(
        produce((draft) => {
          const lastId = draft.comments.slice(-1)[0].id

          draft.comments.push({
            id: lastId + 1,
            author: {
              id: userContext.id,
              name: 'This will be substituted'
            },
            date: 'just now',
            text: draft.text
          })

          draft.text = ''

          // scroll the content ref container
          setTimeout(() => {
            contentRef?.current.scrollTo({
              top: 99999,
              left: 0,
              behavior: 'smooth'
            })
          }, 0)
        })
      )
    }
  }, [state.text, userContext.id])

  return (
    <SidebarInnerWrap>
      <SidebarContent ref={contentRef}>
        <SidebarTitle as="h3" variant="h6">
          {_t('Comments')}
        </SidebarTitle>

        <Styled.CommentsList direction="column" spacing={2}>
          {state.comments.map((comment) => {
            const isMe = comment.author.id === userContext.id
            return (
              <Styled.Comment key={comment.id}>
                <Styled.CommentHeader>
                  {isMe ? 'Me' : comment.author.name} &bull; {comment.date}
                </Styled.CommentHeader>
                <Styled.CommentText>{comment.text}</Styled.CommentText>
                {isMe && (
                  <Link
                    component="button"
                    variant="body2"
                    sx={{ mt: 1 }}
                    onClick={onCommentDelete(comment.id)}
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
          value={state.text}
          onChange={onTextChange}
        />
        <Button variant="contained" onClick={onCommentSubmit}>
          {_t('Comment')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default CommentsTab
