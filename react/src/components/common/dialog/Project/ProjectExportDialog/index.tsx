import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CfObjectType } from '@cf/types/enum'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
import Alert from '@cfComponents/UIPrimitives/Alert'
import { TTag } from '@cfRedux/types/type'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { CourseFlowEntity, EUser } from '@XMLHTTP/types/entity'
import { produce } from 'immer'
import { MouseEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface EProject extends CourseFlowEntity {
  author: EUser
  userPermissions: number
  favourite: boolean
  disciplines: number[]
  tags: TTag[]
  published: boolean
  type: CfObjectType.PROJECT
  workflowprojectSet: number[]
}

enum EXPORT_TYPE {
  OUTCOME = 'outcome',
  NODE = 'node',
  COURSE = 'framework',
  COMPETENCY = 'matrix',
  SOBEC = 'sobec'
}

enum EXPORT_FORMAT {
  EXCEL = 'excel',
  CSV = 'csv'
}

const fields = {
  type: [
    { value: EXPORT_TYPE.OUTCOME },
    { value: EXPORT_TYPE.NODE },
    {
      value: EXPORT_TYPE.COURSE,
      showForType: ['project', 'course']
    },
    {
      value: EXPORT_TYPE.COMPETENCY,
      showForType: ['project', 'program']
    },
    {
      value: EXPORT_TYPE.SOBEC,
      showForType: ['project', 'program']
    }
  ],
  format: [{ value: EXPORT_FORMAT.EXCEL }, { value: EXPORT_FORMAT.CSV }]
}

function ProjectExportDialog(data: EProject) {
  const { t } = useTranslation('project')
  const { t: tCommon } = useTranslation('common')
  const [state, setState] = useState({
    type: EXPORT_TYPE.OUTCOME,
    format: EXPORT_FORMAT.EXCEL
  })
  const { show, onClose } = useDialog(DialogMode.PROJECT_EXPORT)

  function onRadioChange(
    field: 'type' | 'format',
    value: EXPORT_TYPE | EXPORT_FORMAT
  ) {
    setState(
      produce((draft) => {
        draft[field as any] = value
      })
    )
  }

  function onSubmit(e: MouseEvent<HTMLButtonElement>) {
    const postData = {
      objectId: data.uuid,
      objectType: data.type,
      exportType: state.type,
      exportFormat: state.format
    }

    // @todo function that triggers a project export goes here
  }

  function onDialogClose() {
    setState(
      produce((draft) => {
        draft.type = EXPORT_TYPE.OUTCOME
        draft.format = EXPORT_FORMAT.EXCEL
      })
    )
    onClose()
  }

  const projectType = data.type
  const localizedProjectType = t(`exportDialog.objectType.${projectType}`)

  return (
    <StyledDialog open={show} onClose={onDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {t('exportDialog.title', { projectType: localizedProjectType })}
      </DialogTitle>
      <DialogContent dividers>
        <StyledBox component="form">
          <Alert severity="warning" title={t('exportDialog.unavailable')} />
          <FormControl>
            <FormLabel id="export-type-group-label">
              {t('exportDialog.type')}
            </FormLabel>
            <RadioGroup
              aria-labelledby="export-type-group-label"
              value={state.type}
            >
              {fields.type.map((type, index) => {
                return !type.showForType ||
                  (type.showForType &&
                    type.showForType.indexOf(projectType) !== -1) ? (
                  <FormControlLabel
                    key={index}
                    value={type.value}
                    control={<Radio />}
                    label={t(`exportDialog.options.${type.value}`)}
                    onChange={() => onRadioChange('type', type.value)}
                    checked={type.value === state.type}
                  />
                ) : (
                  <></>
                )
              })}
            </RadioGroup>
          </FormControl>
          <FormControl>
            <FormLabel id="export-format-group-label">
              {t('exportDialog.format')}
            </FormLabel>
            <RadioGroup
              aria-labelledby="export-format-group-label"
              value={state.format}
            >
              {fields.format.map((format, index) => (
                <FormControlLabel
                  key={index}
                  value={format.value}
                  control={<Radio />}
                  label={t(`exportDialog.options.${format.value}`)}
                  onChange={() => onRadioChange('format', format.value)}
                  checked={format.value === state.format}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </StyledBox>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onDialogClose}>
          {tCommon('actions.cancel')}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {t('actions.export')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ProjectExportDialog
