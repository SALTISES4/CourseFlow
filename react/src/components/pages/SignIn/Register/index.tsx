import { _t } from '@cf/utility/Utility.class'
import CFLogo from '@cfComponents/UIPrimitives/SVG/CFLogo'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { produce } from 'immer'
import { ChangeEvent, FormEvent, useCallback, useState } from 'react'

import * as Styled from '../styles'

type StateType = {
  pending: boolean
  user: {
    username: string
    password: string
    email: string
  }
}

function RegisterPage() {
  const [state, setState] = useState<StateType>({
    pending: false,
    user: {
      username: '',
      password: '',
      email: ''
    }
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    console.log('submitted register form', e.target)
  }

  const onChange = useCallback((type: keyof StateType['user']) => {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setState(
        produce((draft) => {
          draft.user[type] = e.target.value
        })
      )
    }
  }, [])

  return (
    <Styled.Page>
      <Styled.Paper elevation={1}>
        <Styled.Form component="form" onSubmit={onSubmit}>
          <Styled.LogoWrap>
            <CFLogo />
            <Typography component="h2">CourseFlow</Typography>
          </Styled.LogoWrap>
          <Typography variant="body1">
            {_t('Create your CourseFlow account')}
          </Typography>
          <TextField
            label={_t('Email')}
            type="email"
            name="email"
            value={state.user.email}
            onChange={onChange('email')}
            fullWidth
            required
          />
          <TextField
            label={_t('Username')}
            type="text"
            name="username"
            value={state.user.username}
            onChange={onChange('username')}
            fullWidth
            required
          />
          <TextField
            label={_t('Password')}
            type="password"
            name="password"
            value={state.user.password}
            onChange={onChange('password')}
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={state.pending}
            fullWidth
          >
            {_t(state.pending ? 'Creating an account...' : 'Register')}
          </Button>
          <Typography variant="body1">
            {_t('Back to')} <Link href="/login">{_t('Login')}</Link>
          </Typography>
        </Styled.Form>
      </Styled.Paper>
    </Styled.Page>
  )
}

export default RegisterPage
