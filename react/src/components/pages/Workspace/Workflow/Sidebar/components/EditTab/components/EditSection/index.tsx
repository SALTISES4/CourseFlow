import { selectWeekById } from '@cf/redux/selectors/week.selector'
import { sidebarChangeTab } from '@cf/redux/slices/sidebar.slice'
import { TWeek } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import Utility, { _t } from '@cf/utility/Utility.class'
import { weekChangeField } from '@cfRedux/slices/week.slice'
import { RootState } from '@cfRedux/store'
import * as SC from '@cfSidebar/styles'
import { debounce } from '@mui/material'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { updateValueQuery } from '@XMLHTTP/API/update'
import { produce } from 'immer'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import SaveAsTemplate from '../SaveAsTemplate'

type SectionFormType = {
  title: string
}

const EditSection = ({ sectionId }: { sectionId: number }) => {
  const dispatch = useDispatch()
  const week = useSelector((state: RootState) =>
    selectWeekById(state, sectionId)
  )

  if (!week) {
    dispatch(sidebarChangeTab({ tab: null, collapsed: true }))
    return null
  }

  return <EditSectionForm week={week} />
}

const EditSectionForm = ({ week }: { week: TWeek }) => {
  const dispatch = useDispatch()
  const [state, setState] = useState({
    template: false
  })

  const {
    register,
    getValues,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<SectionFormType>({
    defaultValues: {
      title: week.title
    }
  })
  const watchedFields = watch()

  useEffect(() => {
    if (week && !isDirty) {
      reset({
        title: week.title
      })
    }
  }, [reset, isDirty, week])

  const debouncedDispatch = useCallback(
    debounce((data) => {
      dispatch(
        weekChangeField({
          id: week.id,
          data: {
            title: data.title
          }
        })
      )

      updateValueQuery(week.id, CfObjectType.WEEK, data, true)

      reset({}, { keepValues: true })
    }, 300),
    [dispatch, week.id]
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
  const onSubmit = (data: SectionFormType) => {
    Utility.logger('Form submitted with data:', data)
  }

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

  return state.template ? (
    <SaveAsTemplate
      title={_t('Save as personal week template')}
      placeholder={_t('Week label')}
      alert={_t(
        'The personal template name will not overwrite the node group title. Once saved, you’ll be able to add your personal template to any course. You can find and adjust your personal template within your Library.'
      )}
      onSave={onSaveTemplateClick}
      onCancel={toggleTemplateForm}
    />
  ) : (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SC.SidebarInnerWrap>
        <SC.SidebarContent>
          <SC.SidebarTitle as="h3" variant="h6">
            {_t('Edit section')}
          </SC.SidebarTitle>
          <TextField
            label={_t('Week label')}
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
          <Button variant="contained" color="secondary">
            {_t('Duplicate')}
          </Button>
          <Button variant="contained" color="secondary">
            {_t('Delete')}
          </Button>
        </SC.SidebarActions>
      </SC.SidebarInnerWrap>
    </form>
  )
}

export default EditSection
