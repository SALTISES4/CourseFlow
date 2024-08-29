import { useForm, Controller, SubmitHandler } from 'react-hook-form'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import FormControlLabel from '@mui/material/FormControlLabel'
import { DIALOG_TYPE, useDialog } from '..'
import { StyledDialog, StyledForm } from '../styles'

interface IFormInputs {
  contributor: Contributor | null
  role: Role | null
}

type Contributor = {
  value: number
  label: string
}

type Role = {
  label: string
  value: string
}

export type PropsType = {
  contributors: Contributor[]
  roles: Role[]
}

const AddContributorDialog = ({ contributors, roles }: PropsType) => {
  const { show, onClose } = useDialog(DIALOG_TYPE.ADD_CONTRIBUTOR)

  const { control, handleSubmit, reset, watch } = useForm<IFormInputs>({
    defaultValues: {
      contributor: null,
      role: null
    }
  })

  const contributor = watch('contributor')
  const role = watch('role')
  const disableSubmit = !contributor || !role

  const onSubmit: SubmitHandler<IFormInputs> = (data) => {
    console.log('submitting ADD CONTRIBUTOR with', data)
  }

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
        <StyledForm component="form">
          <Controller
            name="contributor"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                id="add-contributor-autocomplete"
                fullWidth
                options={contributors}
                onChange={(_, v) => field.onChange(v)}
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="CourseFlow Users"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            )}
          />

          <FormControl>
            <FormLabel id="add-contributor-role-label">Roles</FormLabel>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  aria-labelledby="add-contributor-role-label"
                  {...field}
                >
                  {roles.map((role, index) => (
                    <FormControlLabel
                      key={index}
                      value={role.value}
                      label={role.label}
                      control={<Radio />}
                    />
                  ))}
                </RadioGroup>
              )}
            />
          </FormControl>
        </StyledForm>
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
