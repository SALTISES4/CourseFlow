import { StyledBox, StyledDialog } from '@cf/components/common/dialog/styles'
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
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import {
  WorkspaceUserArgs,
  useGetUsersForObjectAvailableQuery,
  useWorkspaceUserCreateMutation
} from '@XMLHTTP/API/workspaceUser.rtk'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import dummyUserData from './dummyUserData'

interface IFormInputs {
  userId: number[] | null
  group: PermissionGroup | null
}

type UserFormOption = {
  name: string
  id: number
}

const ContributorAddDialog = ({
  id,
  type,
  refetch
}: {
  id: number
  type: WorkspaceType
  refetch: () => void
}) => {
  const { show, onClose } = useDialog(DialogMode.CONTRIBUTOR_ADD)

  const { control, reset, watch } = useForm<IFormInputs>({
    defaultValues: {
      userId: null,
      group: null
    }
  })

  const contributor = watch('userId')
  const role = watch('group')
  const disableSubmit = contributor?.length === 0 || !role

  const onSubmit = useCallback(() => {
    console.log('contributor add dialog submit', { contributor, role })
  }, [contributor, role])

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
                  options={dummyUserData}
                  getOptionLabel={(user) => user.name}
                  onChange={(_, selectedUsers) =>
                    field.onChange(selectedUsers.map((user) => user.id))
                  }
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
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

// // NOTE: original implementation without any debouncing / autocomplete
// /**
//  * @constructor
//  */
// const ContributorAddDialog = ({
//   id,
//   type,
//   refetch
// }: {
//   id: number
//   type: WorkspaceType
//   refetch: () => void
// }) => {
//   /*******************************************************
//    * HOOKS
//    *******************************************************/
//   const { show, onClose } = useDialog(DialogMode.CONTRIBUTOR_ADD)

//   const [userFormOptions, setUserFormOptions] = useState<UserFormOption[]>([])
//   const { onError, onSuccess } = useGenericMsgHandler()

//   /*******************************************************
//    * QUERIES
//    *******************************************************/

//   //@todo update this filter when we connect the search input
//   const { data, isLoading } = useGetUsersForObjectAvailableQuery({
//     id,
//     payload: {
//       filter: '',
//       objectType: type
//     }
//   })

//   const [mutate] = useWorkspaceUserCreateMutation()

//   /*******************************************************
//    * FORMS
//    *******************************************************/
//   const { control, handleSubmit, reset, watch } = useForm<IFormInputs>({
//     defaultValues: {
//       userId: null,
//       group: null
//     }
//   })

//   /*******************************************************
//    * CONSTANTS
//    *******************************************************/
//   const contributor = watch('userId')
//   const role = watch('group')
//   const disableSubmit = !contributor || !role || isLoading

//   /*******************************************************
//    * FUNCTION
//    *******************************************************/
//   function onSuccessHandler(response: EmptyPostResp) {
//     onSuccess(response)
//     onClose()
//     refetch()
//   }

//   async function onSubmit(data: IFormInputs) {
//     const args: WorkspaceUserArgs = {
//       id,
//       payload: {
//         userId: data.userId,
//         type,
//         group: data.group
//       }
//     }

//     try {
//       const response = await mutate(args).unwrap()
//       onSuccessHandler(response)
//     } catch (err) {
//       onError(err)
//     }
//   }

//   // https://github.com/mui/material-ui/issues/38489
//   // TODO: Try to replace Select with an MUI Autocomplete
//   // which currently breaks when Popover goes into too much recursion
//   // (apparently when spreading props on top of the input)
//   // but the real issue is `ref` (InputProps.ref) drilling and
//   // causing a bunch of circular references which eventually kabooms

//   useEffect(() => {
//     const users = data
//       ? data.dataPackage.map((item) => ({
//           id: item.id,
//           name: item.firstName + ' ' + item.lastName
//         }))
//       : []
//     setUserFormOptions(users)
//   }, [data])

//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   return (
//     <StyledDialog
//       open={!!show}
//       onClose={onClose}
//       TransitionProps={{
//         onExited: () => reset()
//       }}
//       fullWidth
//       maxWidth="sm"
//       aria-labelledby="add-contributor-modal"
//     >
//       <DialogTitle id="add-contributor-modal">
//         {_t('Add contributor')}
//       </DialogTitle>
//       <DialogContent dividers>
//         <StyledBox component="form">
//           <FormControl variant="standard" fullWidth>
//             <InputLabel>{_t('Courseflow Users')}</InputLabel>
//             {/*
//                   @todo
//               *  this needs to be a search 'input' field as well like the library search |
//               *  search input --> debounce -->  send query, present select list
//               * */}
//             <Controller
//               name="userId"
//               control={control}
//               render={({ field }) => (
//                 <Select
//                   {...field}
//                   value={field.value || ''}
//                   label="Courseflow Users"
//                 >
//                   {userFormOptions.map((c, idx) => (
//                     <MenuItem key={idx} value={c.id}>
//                       {c.name}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               )}
//             />
//           </FormControl>

//           <FormControl>
//             <FormLabel id="add-contributor-role-label">{_t('Role')}</FormLabel>
//             <Controller
//               name="group"
//               control={control}
//               render={({ field }) => (
//                 <RadioGroup
//                   aria-labelledby="add-contributor-role-label"
//                   {...field}
//                 >
//                   {permissionGroupMenuOptions.map((permissionGroup, index) => (
//                     <FormControlLabel
//                       key={index}
//                       value={permissionGroup.value}
//                       label={permissionGroup.label}
//                       control={<Radio />}
//                     />
//                   ))}
//                 </RadioGroup>
//               )}
//             />
//           </FormControl>
//         </StyledBox>
//       </DialogContent>

//       <DialogActions>
//         <Button variant="contained" color="secondary" onClick={onClose}>
//           Cancel
//         </Button>
//         <Button
//           type="submit"
//           variant="contained"
//           disabled={disableSubmit}
//           onClick={handleSubmit(onSubmit)}
//         >
//           Add contributor
//         </Button>
//       </DialogActions>
//     </StyledDialog>
//   )
// }

export default ContributorAddDialog
