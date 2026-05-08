import * as SC from '@cf/components/pages/Workflow/Sidebar/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { getNextLargestNumber } from '@cf/redux/selectors/helpers'
import { selectSectionById } from '@cf/redux/selectors/section.selector'
import { sectionInsertBelow } from '@cf/redux/slices/section.slice'
import { sectionChangeField } from '@cf/redux/slices/section.slice'
import { sidebarChangeTab } from '@cf/redux/slices/sidebar.slice'
import { RootState } from '@cf/redux/store'
import { TSection } from '@cf/redux/types/type'
import { _t } from '@cf/utility/Utility.class'
import { debounce } from '@mui/material'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { produce } from 'immer'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import SaveAsTemplate from '../SaveAsTemplate'

type SectionFormType = {
  title: string
}

const EditSection = ({ sectionId }: { sectionId: string }) => {
  const dispatch = useDispatch()
  const section = useSelector((state: RootState) =>
    selectSectionById(state, sectionId)
  )

  if (!section) {
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    return null
  }

  return <EditSectionForm section={section} />
}

const EditSectionForm = ({ section }: { section: TSection }) => {
  const dispatch = useDispatch()
  const { dispatch: dialogDispatch } = useDialog()
  const ids = useSelector((state: RootState) => state.workspace.section.uuids)
  // const newSectionId = getNextLargestNumber(ids)
  const newSectionId = 'new-section-id'
  const workflowId = useSelector(
    (state: RootState) => state.workspace.workflow.uuid
  )
  const [state, setState] = useState({
    template: false
  })

  const {
    register,
    getValues,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<SectionFormType>({
    defaultValues: {
      title: section.title
    }
  })
  const watchedFields = watch()

  useEffect(() => {
    if (section && !isDirty) {
      reset({
        title: section.title
      })
    }
  }, [reset, isDirty, section])

  const debouncedDispatch = useMemo(
    () =>
      debounce((data) => {
        dispatch(
          sectionChangeField({
            uuid: section.uuid,
            data: {
              title: data.title
            }
          })
        )

        // updateValueQuery(section.uuid, CfObjectType.WEEK, data, true)

        reset({}, { keepValues: true })
      }, 300),
    [dispatch, reset, section.uuid]
  )

  useEffect(() => {
    const formValues = getValues()
    if (isDirty) {
      debouncedDispatch(formValues)
    }
  }, [watchedFields, isDirty, getValues, debouncedDispatch])

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const toggleTemplateForm = useCallback(() => {
    setState(
      produce((draft) => {
        draft.template = !draft.template
      })
    )
  }, [])

  // @todo not connected to backend
  const onSaveTemplateClick = useCallback(
    (label: string) => {
      console.log('saving template with label:', label)
      toggleTemplateForm()
    },
    [toggleTemplateForm]
  )

  const onDuplicate = useCallback(() => {
    dispatch(
      sectionInsertBelow({
        uuid: section.uuid,
        newId: newSectionId,
        duplicate: true
      })
    )
  }, [dispatch, newSectionId, section.uuid])

  const onDelete = useCallback(() => {
    dialogDispatch(DialogMode.WORKFLOW_DELETE_SECTION, {
      sectionId: section.uuid,
      workflowId
    })
  }, [dialogDispatch, workflowId, section.uuid])

  return state.template ? (
    <SaveAsTemplate
      title={_t('Save as personal section template')}
      placeholder={_t('Section label')}
      alert={_t(
        'The personal template name will not overwrite the node group title. Once saved, you’ll be able to add your personal template to any course. You can find and adjust your personal template within your Library.'
      )}
      onSave={onSaveTemplateClick}
      onCancel={toggleTemplateForm}
    />
  ) : (
    <SC.SidebarInnerWrap>
      <SC.SidebarContent>
        <SC.SidebarTitle as="h3" variant="h6">
          {_t('Edit section')}
        </SC.SidebarTitle>
        <TextField
          label={_t('Section')}
          variant="outlined"
          size="small"
          {...register('title')}
          error={!!errors.title}
          helperText={errors.title?.message}
        />
      </SC.SidebarContent>
      <SC.SidebarActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={toggleTemplateForm}
        >
          {_t('Save as personal template')}
        </Button>
        <Button variant="contained" color="secondary" onClick={onDuplicate}>
          {_t('Duplicate')}
        </Button>
        <Button variant="contained" color="secondary" onClick={onDelete}>
          {_t('Delete')}
        </Button>
      </SC.SidebarActions>
    </SC.SidebarInnerWrap>
  )
}

export default EditSection
