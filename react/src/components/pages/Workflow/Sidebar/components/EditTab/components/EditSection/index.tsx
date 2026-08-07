import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { SectionEntity } from '@cf/features/graph/state/model/types'
import { selectSectionByUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import {
  changeSectionMeta,
  insertSectionBelow
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarChangeTab } from '@cf/features/sidebar/state/sidebar.slice'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import type { AppDispatch } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import * as SC from '@cfSidebar/styles'
import { debounce } from '@mui/material'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

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
  const canEdit = useResourcePermission(WorkflowPermission.PART_MANAGEMENT)

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
        if (!canEdit) {
          return
        }
        void dispatch(
          changeSectionMeta({
            graphUuid: section.graphUuid,
            sectionUuid: section.uuid,
            meta: { title: data.title }
          })
        )

        reset({}, { keepValues: true })
      }, 300),
    [canEdit, dispatch, reset, section.graphUuid, section.uuid]
  )

  useEffect(() => {
    const formValues = getValues()
    if (isDirty && canEdit) {
      debouncedDispatch(formValues)
    }
  }, [watchedFields, isDirty, canEdit, getValues, debouncedDispatch])

  const onDuplicate = useCallback(() => {
    if (!canEdit) {
      return
    }
    dispatch(
      insertSectionBelow({
        graphUuid: section.graphUuid,
        sectionUuid: section.uuid,
        duplicate: true
      })
    )
  }, [canEdit, dispatch, section.graphUuid, section.uuid])

  const onDelete = useCallback(() => {
    if (!canEdit) {
      return
    }
    dialogDispatch(DialogMode.GRAPH_DELETE_SECTION, {
      sectionId: section.uuid,
      graphUuid: section.graphUuid
    })
  }, [canEdit, dialogDispatch, section.graphUuid, section.uuid])

  return (
    <SC.SidebarInnerWrap data-test-id="workflow-edit-section-form">
      <SC.SidebarContent>
        <SC.SidebarTitle as="h3" variant="h6">
          {_t('Edit section')}
        </SC.SidebarTitle>
        <TextField
          label={_t('Section')}
          variant="outlined"
          size="small"
          {...register('title')}
          InputProps={{ readOnly: !canEdit }}
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
          {_t('Duplicate')}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={onDelete}
          disabled={!canEdit}
        >
          {_t('Delete')}
        </Button>
      </SC.SidebarActions>
    </SC.SidebarInnerWrap>
  )
}

export default EditSection
