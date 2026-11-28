import WysiwygField from '@cf/components/common/UIPrimitives/WysiwygInput'
import DurationHoursMinutesFields from '@cfComponents/DurationHoursMinutesFields'
import WholeHoursField from '@cfComponents/WholeHoursField'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useTranslation } from 'react-i18next'

type Props = {
  title: string
  description: string
  /** Parent workflow type of the graph being edited (`course` | `program`). */
  parentWorkflowType: string
  showTime?: boolean
  showProgramFields?: boolean
  timeMinutes?: number | null
  credits?: number | null
  ponderationTheoryMinutes?: number | null
  ponderationPracticeMinutes?: number | null
  ponderationIndividualMinutes?: number | null
}

/**
 * Read-only mirror of linked workflow metadata (FR-WF-EN-004 / FR-WF-EN-006).
 * Time/credits/ponderation appear when the API exposes them; until then fields may be empty.
 */
const LinkedWorkflowMirrorFields = ({
  title,
  description,
  parentWorkflowType,
  showTime = false,
  showProgramFields = false,
  timeMinutes,
  credits,
  ponderationTheoryMinutes,
  ponderationPracticeMinutes,
  ponderationIndividualMinutes
}: Props) => {
  const { t } = useTranslation('workflow')

  return (
    <Stack spacing={2}>
      <TextField
        label={t('edit.title')}
        variant="outlined"
        size="small"
        value={title}
        InputProps={{ readOnly: true }}
      />
      <WysiwygField
        readOnly
        label={t('edit.description')}
        value={description}
      />
      {showTime && (
        <DurationHoursMinutesFields
          groupLabel={t('edit.time')}
          value={timeMinutes}
          readOnly
          testId="workflow-edit-node-time"
        />
      )}
      {showProgramFields && (
        <>
          <TextField
            label={t('edit.credits')}
            variant="outlined"
            size="small"
            value={credits ?? ''}
            placeholder="—"
            InputProps={{ readOnly: true }}
          />
          <WholeHoursField
            label={t('edit.theoryHours')}
            value={ponderationTheoryMinutes}
            readOnly
            alwaysShrinkLabel
          />
          <WholeHoursField
            label={t('edit.practiceHours')}
            value={ponderationPracticeMinutes}
            readOnly
            alwaysShrinkLabel
          />
          <WholeHoursField
            label={t('edit.individualHours')}
            value={ponderationIndividualMinutes}
            readOnly
            alwaysShrinkLabel
          />
        </>
      )}
    </Stack>
  )
}

export default LinkedWorkflowMirrorFields
