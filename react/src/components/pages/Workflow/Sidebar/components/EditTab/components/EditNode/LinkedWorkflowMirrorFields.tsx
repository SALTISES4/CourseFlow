import { _t } from '@cf/utility/Utility.class'
import RichTextDescription from '@cfComponents/dialog/Workflow/components/RichTextDescription'
import { formatHoursDuration } from '@cfComponents/DurationTextField'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type Props = {
  title: string
  description: string
  /** Parent workflow type of the graph being edited (`course` | `program`). */
  parentWorkflowType: string
  showTime?: boolean
  showProgramFields?: boolean
  time?: number | null
  credits?: number | null
  ponderationTheory?: number | null
  ponderationPractice?: number | null
  ponderationIndividual?: number | null
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
  time,
  credits,
  ponderationTheory,
  ponderationPractice,
  ponderationIndividual
}: Props) => (
  <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">
      {parentWorkflowType === 'program'
        ? _t(
            'Title, description, and course metadata are read-only. Edit the linked course workflow to change them.'
          )
        : _t(
            'Title, description, and time are read-only. Edit the linked activity workflow to change them.'
          )}
    </Typography>
    <TextField
      label={_t('Title')}
      variant="outlined"
      size="small"
      value={title}
      InputProps={{ readOnly: true }}
    />
    <RichTextDescription value={description} readOnly />
    {showTime && (
      <TextField
        label={_t('Time')}
        variant="outlined"
        size="small"
        value={formatHoursDuration(time)}
        placeholder="—"
        InputProps={{ readOnly: true }}
      />
    )}
    {showProgramFields && (
      <>
        <TextField
          label={_t('Credits')}
          variant="outlined"
          size="small"
          value={credits ?? ''}
          placeholder="—"
          InputProps={{ readOnly: true }}
        />
        <TextField
          label={_t('Hrs. theory')}
          variant="outlined"
          size="small"
          value={formatHoursDuration(ponderationTheory)}
          placeholder="—"
          InputProps={{ readOnly: true }}
        />
        <TextField
          label={_t('Hrs. practice')}
          variant="outlined"
          size="small"
          value={formatHoursDuration(ponderationPractice)}
          placeholder="—"
          InputProps={{ readOnly: true }}
        />
        <TextField
          label={_t('Hrs. individual')}
          variant="outlined"
          size="small"
          value={formatHoursDuration(ponderationIndividual)}
          placeholder="—"
          InputProps={{ readOnly: true }}
        />
      </>
    )}
  </Stack>
)

export default LinkedWorkflowMirrorFields
