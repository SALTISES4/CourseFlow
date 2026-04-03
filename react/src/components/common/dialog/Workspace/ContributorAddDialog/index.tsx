import { StyledBox, StyledDialog } from '@cf/components/common/dialog/styles'
import {
  addProjectTeamMembersMutation,
  listProjectTeamQueryKey,
  listUsersOptions
} from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { PermissionGroup } from '@cf/types/common'
import { WorkspaceType } from '@cf/types/enum'
import { permissionGroupMenuOptions } from '@cf/utility/permissions'
import { _t } from '@cf/utility/Utility.class'
import SearchIcon from '@mui/icons-material/Search'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import InputAdornment from '@mui/material/InputAdornment'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface IFormInputs {
  userId: string[] | null
  group: PermissionGroup | null
}

type UserFormOption = {
  name: string
  id: string
}

function permissionGroupToRole(
  group: PermissionGroup
): 'editor' | 'commenter' | 'viewer' {
  switch (group) {
    case PermissionGroup.EDIT:
      return 'editor'
    case PermissionGroup.COMMENT:
      return 'commenter'
    case PermissionGroup.VIEW:
      return 'viewer'
    default:
      return 'viewer'
  }
}

const ContributorAddDialog = ({
  id,
  type: _type,
  refetch
}: {
  id: string
  type: WorkspaceType
  refetch: () => void
}) => {
  const { show, onClose } = useDialog(DialogMode.CONTRIBUTOR_ADD)
  const { onError, onSuccess } = useGenericMsgHandler()
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
      group: null
    }
  })

  const userIds = watch('userId')
  const role = watch('group')
  const disableSubmit = !userIds || userIds?.length === 0 || !role || !id

  const { data: listUsersData } = useQuery({
    ...listUsersOptions({
      query: debouncedFilter.trim()
        ? { filter: debouncedFilter.trim() }
        : undefined
    }),
    enabled: Boolean(show && id && debouncedFilter.trim())
  })

  const userOptions: UserFormOption[] = useMemo(
    () =>
      (listUsersData?.items ?? []).map((u) => ({
        id: u.uuid,
        name:
          [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email
      })),
    [listUsersData]
  )

  const addMembers = useMutation({
    ...addProjectTeamMembersMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: listProjectTeamQueryKey({ path: { uuid: id } })
      })
    }
  })

  const onSubmit = useCallback(async () => {
    if (!userIds?.length || role == null || !id) {
      return
    }
    try {
      await addMembers.mutateAsync({
        path: { uuid: id },
        body: {
          userUuids: userIds,
          role: permissionGroupToRole(role)
        }
      })
      onSuccess({ message: _t('Success!') })
      refetch()
      onClose()
    } catch (err) {
      onError(err)
    }
  }, [addMembers, id, onClose, onError, onSuccess, refetch, role, userIds])

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
        {_t('Add contributor')}
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
                  options={userOptions}
                  getOptionLabel={(user) => user.name}
                  onChange={(_, selectedUsers) =>
                    field.onChange(selectedUsers.map((user) => user.id))
                  }
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  filterOptions={(x) => x}
                  onInputChange={(_, value) => onAutocompleteChange(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label={_t('Courseflow Users')}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
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
            <FormLabel id="add-contributor-role-label">{_t('Role')}</FormLabel>
            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  aria-labelledby="add-contributor-role-label"
                  {...field}
                >
                  {permissionGroupMenuOptions.map((permissionGroup, index) => (
                    <FormControlLabel
                      key={index}
                      value={permissionGroup.value}
                      label={permissionGroup.label}
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
          {_t('Cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={disableSubmit}
          onClick={onSubmit}
        >
          {_t('Add contributor')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ContributorAddDialog
