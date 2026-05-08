import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import Typography, { TypographyProps } from '@mui/material/Typography'

export const CommentsList = styled(Stack)(() => ({}))

export const Comment = styled(Box)(({ theme }) => ({
  '& + &': {
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`
  }
}))

export const CommentHeader = styled(Typography)<TypographyProps>(
  ({ theme }) => ({
    marginBottom: theme.spacing(1),
    fontWeight: '600'
  })
)

CommentHeader.defaultProps = {
  variant: 'subtitle2'
}

export const CommentText = styled(Typography)<TypographyProps>(() => ({}))

CommentText.defaultProps = {
  variant: 'body2'
}
