import { StyledBox, StyledDialog } from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { PermissionGroup } from '@cf/types/common'
import { CfObjectType, WorkSpaceType } from '@cf/types/enum'
import { permissionGroupMenuOptions } from '@cf/utility/permissions'
import { _t } from '@cf/utility/utilityFunctions'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Select from '@mui/material/Select'
import {
  WorkspaceUserArgs,
  useGetUserListQuery,
  useGetUsersForObjectQuery,
  useWorkspaceUserCreateMutation
} from '@XMLHTTP/API/workspaceUser.rtk'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'

/*******************************************************
 * TYPES
 *******************************************************/

interface IFormInputs {
  userId: number | null
  group: PermissionGroup | null
}

type UserFormOption = {
  name: string
  id: number
}

/**
 * @constructor
 */
const AddContributorDialog = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { id } = useParams()
  const { show, onClose } = useDialog(DialogMode.CONTRIBUTOR_ADD)

  const [userFormOptions, setUserFormOptions] = useState<UserFormOption[]>([])
  const { onError, onSuccess } = useGenericMsgHandler()

  /*******************************************************
   * QUERIES
   *******************************************************/
  const {
    data: usersForObjectData,
    error: usersForObjectError,
    isLoading: usersForObjectIsLoading,
    isError: usersForObjectIsError
  } = useGetUsersForObjectQuery({
    id: Number(id),
    payload: {
      objectType: CfObjectType.PROJECT
    }
  })

  const { data, isLoading } = useGetUserListQuery({
    filter: 'dray'
  })

  const [mutate] = useWorkspaceUserCreateMutation()

  /*******************************************************
   * FORMS
   *******************************************************/
  const { control, handleSubmit, reset, watch } = useForm<IFormInputs>({
    defaultValues: {
      userId: null,
      group: null
    }
  })

  /*******************************************************
   * CONSTANTS
   *******************************************************/
  const contributor = watch('userId')
  const role = watch('group')
  const disableSubmit =
    !contributor || !role || usersForObjectIsLoading || isLoading

  /*******************************************************
   * FUNCTION
   *******************************************************/
  async function onSubmit(data: IFormInputs) {
    const args: WorkspaceUserArgs = {
      id: Number(id),
      payload: {
        userId: data.userId,
        type: WorkSpaceType.PROJECT,
        group: data.group
      }
    }

    try {
      const response = await mutate(args).unwrap()
      onSuccess(response)
    } catch (err) {
      onError(err)
    }
  }

  // https://github.com/mui/material-ui/issues/38489
  // TODO: Try to replace Select with an MUI Autocomplete
  // which currently breaks when Popover goes into too much recursion
  // (apparently when spreading props on top of the input)
  // but the real issue is `ref` (InputProps.ref) drilling and
  // causing a bunch of circular references which eventually kabooms

  useEffect(() => {
    const users = data
      ? data.dataPackage.userList.map((item) => ({
          id: item.id,
          name: item.firstName + ' ' + item.lastName
        }))
      : []
    setUserFormOptions(users)
  }, [data])

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      TransitionProps={{
        onExited: () => reset()
      }}
      fullWidth
      maxWidth="sm"
      aria-labelledby="add-contributor-modal"
    >
      <DialogTitle id="add-contributor-modal">Add Contributor</DialogTitle>
      <DialogContent dividers>
        <StyledBox component="form">
          <FormControl variant="standard" fullWidth>
            <InputLabel>Courseflow Users</InputLabel>
            {/*
                  @todo
              *  this needs to be a search 'input' field as well like the library search |
              *  search input --> debounce -->  send query, present select list
              * */}
            <Controller
              name="userId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || ''}
                  label="Courseflow Users"
                >
                  {userFormOptions.map((c, idx) => (
                    <MenuItem key={idx} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>

          <FormControl>
            <FormLabel id="add-contributor-role-label">Roles</FormLabel>
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
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={disableSubmit}
          onClick={handleSubmit(onSubmit)}
        >
          Add contributor
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default AddContributorDialog
