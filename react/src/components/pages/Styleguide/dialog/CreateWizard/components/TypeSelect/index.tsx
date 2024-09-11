import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { TypeBlock } from './styles'
import { CREATE_RESOURCE_TYPE } from '../../types'

type PropsType = {
  resourceLabel: 'course' | 'activity' | 'program'
  type: CREATE_RESOURCE_TYPE
  onTypeSelect: (type: CREATE_RESOURCE_TYPE) => void
}

const TypeSelect = ({ resourceLabel, type, onTypeSelect }: PropsType) => {
  return (
    <Stack direction="row" spacing={2}>
      <TypeBlock
        tabIndex={0}
        selected={type === CREATE_RESOURCE_TYPE.BLANK}
        onClick={() => onTypeSelect(CREATE_RESOURCE_TYPE.BLANK)}
      >
        <Stack direction="row" spacing={2}>
          <DashboardCustomizeIcon />
          <div>
            <Typography variant="body1">Blank {resourceLabel}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Recommented for advanced users
            </Typography>
          </div>
        </Stack>
        <Typography variant="body1">
          Create your own tailored {resourceLabel} structure
        </Typography>
      </TypeBlock>
      <TypeBlock
        tabIndex={0}
        selected={type === CREATE_RESOURCE_TYPE.TEMPLATE}
        onClick={() => onTypeSelect(CREATE_RESOURCE_TYPE.TEMPLATE)}
      >
        <Stack direction="row" spacing={2}>
          <RocketLaunchIcon />
          <div>
            <Typography variant="body1">From a template</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Recommented for beginners
            </Typography>
          </div>
        </Stack>
        <Typography variant="body1">
          Get a head start with a template anchored in best practices
        </Typography>
      </TypeBlock>
    </Stack>
  )
}

export default TypeSelect
