import { _t } from '@cf/utility/utilityFunctions'
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { TypeBlock } from './styles'
import { CreateResourceOptions } from '../../types'

type PropsType = {
  resourceLabel: 'course' | 'activity' | 'program'
  type: CreateResourceOptions
  onTypeSelect: (type: CreateResourceOptions) => void
}

const TypeSelect = ({ resourceLabel, type, onTypeSelect }: PropsType) => {
  return (
    <Stack direction="row" spacing={2}>
      <TypeBlock
        tabIndex={0}
        selected={type === CreateResourceOptions.BLANK}
        onClick={() => onTypeSelect(CreateResourceOptions.BLANK)}
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
        selected={type === CreateResourceOptions.TEMPLATE}
        onClick={() => onTypeSelect(CreateResourceOptions.TEMPLATE)}
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
