import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'
import { workflowTypeLabel } from '@cf/i18n/workflowLabels'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import { TypeBlock } from './styles'
import { CreateResourceOptions } from '../../types'

type PropsType = {
  resourceLabel: 'course' | 'activity' | 'program'
  type: CreateResourceOptions
  onTypeSelect: (type: CreateResourceOptions) => void
}

const TypeSelect = ({ resourceLabel, type, onTypeSelect }: PropsType) => {
  const { t } = useTranslation('workflow')
  const localizedResourceLabel = workflowTypeLabel(t, resourceLabel, true)
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
            <Typography variant="body1">
              {t('wizard.blank', { workflowType: localizedResourceLabel })}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('wizard.recommendedAdvanced')}
            </Typography>
          </div>
        </Stack>
        <Typography variant="body1">
          {t('wizard.blankDescription', {
            workflowType: localizedResourceLabel
          })}
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
            <Typography variant="body1">{t('wizard.fromTemplate')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('wizard.recommendedBeginners')}
            </Typography>
          </div>
        </Stack>
        <Typography variant="body1">
          {t('wizard.templateDescription')}
        </Typography>
      </TypeBlock>
    </Stack>
  )
}

export default TypeSelect
