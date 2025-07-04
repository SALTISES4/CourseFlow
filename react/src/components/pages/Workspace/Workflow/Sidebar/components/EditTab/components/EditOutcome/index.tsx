import { AppState } from '@cf/redux/types/type'
import Utility, { _t } from '@cf/utility/Utility.class'
import { selectOutcomeById } from '@cfRedux/selectors/outcome.selector'
import { debounce } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

import type { OutcomeForm } from './types'
import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../../../styles'
import data from '../EditNode/optionsData'
const objectSetOptions = data.objectSets

const EditOutcome = () => {
  const sidebarData = useSelector((state: AppState) => state.sidebar)
  const outcomeData = useSelector((state: AppState) =>
    selectOutcomeById(state, state.sidebar.edit.id)
  )
  const [state, setState] = useState(outcomeData)
  const dispatch = useDispatch()

  const onFieldChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setState(
      produce((draft) => {
        const key = e.target.name as 'title' | 'description' | 'code'
        draft[key] = e.target.value
      })
    )
  }, [])

  const {
    register,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<OutcomeForm>({
    defaultValues: {
      title: outcomeData.outcome.title,
      description: outcomeData.outcome.description
    }
  })

  const watchedFields = watch()

  const debouncedDispatch = useMemo(
    () =>
      debounce((data: OutcomeForm) => {
        console.log('EditOutcome debounced dispatch', data)
        // dispatch(
        //   outcomeChangeField({
        //     id: sidebarData.edit.id,
        //     data: {
        //       title: data.title,
        //       description: data.description
        //     }
        //   })
        // )
        // update the server
        // updateValueQuery(sidebarData.edit.id, CfObjectType.OUTCOME, data, true)
        // reset({}, { keepValues: true })
      }, 300),
    []
  )

  useEffect(() => {
    if (isDirty) {
      debouncedDispatch(watchedFields)
    }
  }, [watchedFields, isDirty, debouncedDispatch])

  if (!outcomeData) {
    return null
  }

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          {_t('Edit outcome')}
        </SidebarTitle>
        <Stack direction="column" gap={3}>
          <TextField
            required
            variant="outlined"
            label={_t('Title')}
            size="small"
            {...register('title', { required: 'Title is required' })}
            error={!!errors.title}
            helperText={errors.title?.message}
          />
          <TextField
            variant="outlined"
            label={_t('Description')}
            size="small"
            multiline
            maxRows={5}
            {...register('description')}
            error={!!errors.description}
            helperText={errors.description?.message}
          />
          {/* {data.code && (
            <TextField
              variant="outlined"
              label="Code"
              size="small"
              name="code"
              value={state.code}
              onChange={onFieldChange}
            />
          )} */}
          {/* {data.objectSets && (
            <Autocomplete
              multiple
              size="small"
              options={objectSetOptions}
              onChange={(_, v) => Utility.logger('changed to', v)}
              isOptionEqualToValue={(option, value) =>
                option.value === value.value
              }
              defaultValue={objectSetOptions.filter((o) =>
                data.objectSets!.includes(o.value)
              )}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" label="Object sets" />
              )}
            />
          )} */}
        </Stack>
      </SidebarContent>
      <SidebarActions>
        <Button variant="contained" color="secondary">
          {_t('Duplicate')}
        </Button>
        <Button variant="contained" color="secondary">
          {_t('Delete')}
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default EditOutcome
