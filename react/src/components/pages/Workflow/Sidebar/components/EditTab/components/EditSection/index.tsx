import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { SectionEntity } from '@cf/features/graph/state/model/types'
import {
  selectSectionByUuid,
  selectSectionCount
} from '@cf/features/graph/state/selectors/canonical.selectors'
import {
  changeSectionMeta,
  insertSectionBelow
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import type { AppDispatch } from '@cf/redux/store'
import * as SC from '@cfSidebar/styles'
import { debounce } from '@mui/material'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation('workflow')
  const { t: tCommon } = useTranslation('common')
  const totalSectionCount = useSelector(selectSectionCount)
  const canEdit = useResourcePermission(WorkflowPermission.PART_MANAGEMENT)
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dialogDispatch } = useDialog()
  const localizedTitle = displaySystemTitle(
    t,
    section,
    t('systemLabels.sectionNumber', { number: section.position + 1 })
  )

  const {
    register,
    getValues,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<SectionFormType>({
    defaultValues: {
      title: localizedTitle
    }
  })
  const watchedFields = watch()

  useEffect(() => {
    if (section && !isDirty) {
      reset({
        title: localizedTitle
      })
    }
  }, [reset, isDirty, localizedTitle])

  const debouncedDispatch = useMemo(
    () =>
      debounce((data: SectionFormType) => {
        void dispatch(
          changeSectionMeta({
            graphUuid: section.graphUuid,
            sectionUuid: section.uuid,
            meta: { title: data.title }
          })
        )

        reset({}, { keepValues: true })
      }, 300),
    [dispatch, reset, section.graphUuid, section.uuid]
  )

  useEffect(() => {
    const formValues = getValues()
    if (canEdit && isDirty) {
      debouncedDispatch(formValues)
    }
  }, [watchedFields, canEdit, isDirty, getValues, debouncedDispatch])

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

  return (
    <SC.SidebarInnerWrap data-test-id="workflow-edit-section-form">
      <SC.SidebarContent>
        <SC.SidebarTitle as="h3" variant="h6">
          {t('edit.section')}
        </SC.SidebarTitle>
        <TextField
          label={t('edit.sectionLabel')}
          variant="outlined"
          size="small"
          {...register('title')}
          disabled={!canEdit}
          error={!!errors.title}
          helperText={errors.title?.message}
        />
      </SC.SidebarContent>
      <SC.SidebarActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={onDuplicate}
          disabled={!canEdit}
        >
          {tCommon('actions.duplicate')}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={onDelete}
          disabled={!canEdit || totalSectionCount <= 1}
        >
          {tCommon('actions.delete')}
        </Button>
      </SC.SidebarActions>
    </SC.SidebarInnerWrap>
  )
}

export default EditSection
