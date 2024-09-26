import { StyledDialog, StyledBox } from '@cf/components/common/dialog/styles'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
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
import { Controller, SubmitHandler, useForm } from 'react-hook-form'

interface IFormInputs {
  contributor: Contributor | null
  role: Role | null
}

type Contributor = {
  label: string
  value: number
}

type Role = {
  label: string
  value: string
}

export type PropsType = {
  contributors: Contributor[]
  roles: Role[]
}

const ContributorAddDialog = ({ contributors, roles }: PropsType) => {
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

  // https://github.com/mui/material-ui/issues/38489
  // TODO: Try to replace Select with an MUI Autocomplete
  // which currently breaks when Popover goes into too much recursion
  // (apparently when spreading props on top of the input)
  // but the real issue is `ref` (InputProps.ref) drilling and
  // causing a bunch of circular references which eventually kabooms

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
            <Controller
              name="contributor"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || ''}
                  label="Courseflow Users"
                >
                  {contributors.map((c, idx) => (
                    <MenuItem key={idx} value={c.value}>
                      {c.label}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>

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

export default ContributorAddDialog
