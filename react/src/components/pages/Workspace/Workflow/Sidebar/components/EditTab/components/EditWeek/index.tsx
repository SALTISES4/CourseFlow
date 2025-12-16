import { selectWeekById } from '@cf/redux/selectors/week.selector'
import { CfObjectType } from '@cf/types/enum'
import Utility, { _t } from '@cf/utility/Utility.class'
import { weekChangeField } from '@cfRedux/slices/week.slice'
import { RootState } from '@cfRedux/store'
import { NodeForm } from '@cfSidebar/components/EditTab/components/EditNode/types'
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

const EditWeek = () => {
  const sidebarData = useSelector((state: RootState) => state.sidebar)
  const week = useSelector((state: RootState) =>
    selectWeekById(state, sidebarData.edit.id)
  )
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
  } = useForm<NodeForm>({
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
          id: sidebarData.edit.id,
          data: {
            title: data.title
          }
        })
      )

      updateValueQuery(sidebarData.edit.id, CfObjectType.WEEK, data, true)

      reset({}, { keepValues: true })
    }, 300),
    [dispatch, sidebarData.edit.id]
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
  const onSubmit = (data: NodeForm) => {
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
            {_t('Edit week')}
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

export default EditWeek
