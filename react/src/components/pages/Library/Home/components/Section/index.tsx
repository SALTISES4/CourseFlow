import React, { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

const SectionWrap = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6)
}))

const SectionHeader = styled('header')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(3),
  '.MuiTypography-h5': {
    color: 'currentColor'
  },
  '.MuiLink-root': {
    marginLeft: 'auto'
  }
}))

type PropsType = {
  header: {
    title: string
    seeAll?: {
      text: string
      href: string
    }
  }
  children: ReactNode
}

const Section = ({ header, children }: PropsType) => (
  <SectionWrap>
    {header && (
      <SectionHeader>
        <Typography variant="h5">{window.gettext(header.title)}</Typography>
        {header.seeAll && (
          <Link href={header.seeAll.href}>
            {window.gettext(header.seeAll.text || 'See all')}
          </Link>
        )}
      </SectionHeader>
    )}
    {children}
  </SectionWrap>
)

export default Section
