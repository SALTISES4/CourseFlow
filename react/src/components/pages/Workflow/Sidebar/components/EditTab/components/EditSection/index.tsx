import * as SC from '@cf/components/pages/Workflow/Sidebar/styles'
import type { SectionEntity } from '@cf/features/graph/state/model/types'
import { selectSectionByUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { insertSectionBelow } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { sectionChangeField } from '@cf/redux/slices/section.slice'
import type { AppDispatch } from '@cf/redux/store'
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
  const sectionSelector = useMemo(
    () => selectSectionByUuid(sectionId),
    [sectionId]
  )
  const section = useSelector(sectionSelector)

  useEffect(() => {
    if (!section && sectionId) {
      dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    }
  }, [section, sectionId, dispatch])

  if (!section) {
    return null
  }

  return <EditSectionForm section={section} />
}

const EditSectionForm = ({ section }: { section: SectionEntity }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dialogDispatch } = useDialog()
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
      debounce((data: SectionFormType) => {
        // TODO(graph-state): persist section title via graph API when available.
        dispatch(
          sectionChangeField({
            uuid: section.uuid,
            data: {
              title: data.title
            }
          })
        )

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
      insertSectionBelow({
        graphUuid: section.graphUuid,
        sectionUuid: section.uuid,
        duplicate: true
      })
    )
  }, [dispatch, section.graphUuid, section.uuid])

  const onDelete = useCallback(() => {
    dialogDispatch(DialogMode.GRAPH_DELETE_SECTION, {
      sectionId: section.uuid,
      graphUuid: section.graphUuid
    })
  }, [dialogDispatch, section.graphUuid, section.uuid])

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
