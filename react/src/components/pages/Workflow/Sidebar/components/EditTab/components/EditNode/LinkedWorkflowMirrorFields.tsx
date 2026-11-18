import WysiwygField from '@cf/components/common/UIPrimitives/WysiwygInput'
import { formatDurationHours } from '@cfComponents/duration'
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
  const { t, i18n } = useTranslation('workflow')

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
        <TextField
          label={t('edit.time')}
          variant="outlined"
          size="small"
          value={formatDurationHours(timeMinutes, i18n.language)}
          placeholder="—"
          InputProps={{ readOnly: true }}
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
          <TextField
            label={t('edit.theoryHours')}
            variant="outlined"
            size="small"
            value={formatDurationHours(ponderationTheoryMinutes, i18n.language)}
            placeholder="—"
            InputProps={{ readOnly: true }}
          />
          <TextField
            label={t('edit.practiceHours')}
            variant="outlined"
            size="small"
            value={formatDurationHours(
              ponderationPracticeMinutes,
              i18n.language
            )}
            placeholder="—"
            InputProps={{ readOnly: true }}
          />
          <TextField
            label={t('edit.individualHours')}
            variant="outlined"
            size="small"
            value={formatDurationHours(
              ponderationIndividualMinutes,
              i18n.language
            )}
            placeholder="—"
            InputProps={{ readOnly: true }}
          />
        </>
      )}
    </Stack>
  )
}

export default LinkedWorkflowMirrorFields
