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

const SectionGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: theme.spacing(3)
}))

type PropsType = {
  header: {
    title: string
    seeAll?: {
      text: string
      href: string
    }
  }
  content: ReactNode
}

const Section = ({ header, content }: PropsType) => (
  <SectionWrap>
    {header && (
      <SectionHeader>
        <Typography variant="h5">{window.gettext(header.title)}</Typography>
        <Link href={header.seeAll.href}>
          {window.gettext(header.seeAll.text || 'See all')}
        </Link>
      </SectionHeader>
    )}
    <SectionGrid>{content}</SectionGrid>
  </SectionWrap>
)

export default Section
