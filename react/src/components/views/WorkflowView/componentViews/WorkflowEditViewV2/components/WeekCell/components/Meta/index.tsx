import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import Link from '@mui/material/Link'

import * as Styled from './styles'

type PropsType = {
  workflow?: string
  duration?: string
}

const Meta = ({ workflow, duration }: PropsType) => {
  return (
    <Styled.Wrap>
      {workflow && (
        <Styled.WorkflowLink>
          <Link href={workflow}>
            <LaunchOutlinedIcon />
            Linked workflow
          </Link>
        </Styled.WorkflowLink>
      )}
      {duration && (
        <Styled.Footer>
          <Styled.IconWrap>
            <Styled.Tag>
              <TimerOutlinedIcon />
            </Styled.Tag>
            <Styled.Tag>
              <TimerOutlinedIcon />
            </Styled.Tag>
          </Styled.IconWrap>
          {duration && (
            <Styled.Tag>
              <TimerOutlinedIcon />
              <span>{duration}</span>
            </Styled.Tag>
          )}
        </Styled.Footer>
      )}
    </Styled.Wrap>
  )
}

export default Meta
