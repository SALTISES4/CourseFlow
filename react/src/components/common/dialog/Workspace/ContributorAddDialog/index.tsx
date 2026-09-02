import {
  addProjectTeamMembersMutation,
  listProjectTeamQueryKey,
  listUsersOptions
} from '@cf/api/gen/@tanstack/react-query.gen'
import { ProjectTeamRoleSchema } from '@cf/api/gen/types.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { WorkspaceType } from '@cf/types/enum'
import { SnackbarOptions } from '@cf/utility/constants'
import { projectTeamRoleMenuOptions } from '@cf/utility/permissions'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

interface IFormInputs {
  userId: string[] | null
  role: ProjectTeamRoleSchema | null
}

type UserFormOption = {
  name: string
  uuid: string
}

const ContributorAddDialog = ({
  uuid,
  type: _type,
  refetch
}: {
  uuid: string
  type: WorkspaceType
  refetch: () => void
}) => {
  const { t } = useTranslation('workspace')
  const { t: tCommon } = useTranslation('common')
  const { show, onClose } = useDialog(DialogMode.CONTRIBUTOR_ADD)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedFilter, setDebouncedFilter] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedFilter(search), 500)
    return () => window.clearTimeout(t)
  }, [search])

  const { control, reset, watch } = useForm<IFormInputs>({
    defaultValues: {
      userId: null,
      role: null
    }
  })

  const userUuids = watch('userId')
  const role = watch('role')
  const disableSubmit = !userUuids || userUuids?.length === 0 || !role || !uuid

  const { data: listUsersData } = useQuery({
    ...listUsersOptions({
      query: debouncedFilter.trim()
        ? { filter: debouncedFilter.trim() }
        : undefined
    }),
    enabled: Boolean(show && uuid && debouncedFilter.trim())
  })

  const userOptions: UserFormOption[] = useMemo(
    () =>
      (listUsersData?.items ?? []).map((u) => ({
        uuid: u.uuid,
        name:
          [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email
      })),
    [listUsersData]
  )

  const addMembers = useMutation({
    ...addProjectTeamMembersMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: listProjectTeamQueryKey({ path: { uuid } })
      })
    }
  })

  const onSubmit = useCallback(async () => {
    if (!userUuids?.length || role == null || !uuid) {
      return
    }
    try {
      await addMembers.mutateAsync({
        path: { uuid },
        body: {
          userUuids,
          role
        }
      })
      enqueueSnackbar(
        t('contributor.added'),
        { variant: SnackbarOptions.SUCCESS }
      )
      refetch()
      onClose()
    } catch (err) {
      enqueueSnackbar(
        t('contributor.addFailed'),
        { variant: SnackbarOptions.ERROR }
      )
      console.error('Failed to add contributor:', err)
    }
  }, [addMembers, uuid, onClose, refetch, role, userUuids])

  const onAutocompleteChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  return (
    <StyledDialog
      aria-labelledby="add-contributor-modal"
      open={!!show}
      maxWidth="sm"
      fullWidth
      onClose={onClose}
      TransitionProps={{ onExited: () => reset() }}
    >
      <DialogTitle id="add-contributor-modal">
        {t('contributor.addTitle')}
      </DialogTitle>
      <DialogContent dividers>
        <StyledBox component="form">
          <FormControl variant="standard" fullWidth>
            <Controller
              name="userId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  inputValue={search}
                  options={userOptions}
                  getOptionLabel={(user) => user.name}
                  onChange={(_, selectedUsers) =>
                    field.onChange(selectedUsers.map((user) => user.uuid))
                  }
                  isOptionEqualToValue={(opt, val) => opt.uuid === val.uuid}
                  filterOptions={(x) => x}
                  onInputChange={(_, value) => onAutocompleteChange(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label={t('contributor.users')}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {search && (
                              <IconButton
                                size="small"
                                aria-label={tCommon('actions.clear')}
                                onClick={() => setSearch('')}
                              >
                                <ClearIcon fontSize="small" />
                              </IconButton>
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              )}
            />
          </FormControl>

          <FormControl>
            <FormLabel id="add-contributor-role-label">
              {t('contributor.role')}
            </FormLabel>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  aria-labelledby="add-contributor-role-label"
                  {...field}
                >
                  {projectTeamRoleMenuOptions(t).map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      control={<Radio />}
                    />
                  ))}
                </RadioGroup>
              )}
            />
          </FormControl>
        </StyledBox>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {tCommon('actions.cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={disableSubmit}
          onClick={onSubmit}
        >
          {t('contributor.addTitle')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ContributorAddDialog
