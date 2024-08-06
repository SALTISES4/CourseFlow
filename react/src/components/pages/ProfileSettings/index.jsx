import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import TextField from '@mui/material/TextField'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import { OuterContentWrap } from '@cfModule/mui/helper'
import { API_POST } from '@XMLHTTP/PostFunctions'

const PageTitle = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  '& .MuiTypography-h1': {
    color: 'currentColor',
    fontWeight: 400,
    fontSize: '34px'
  }
}))

const FormWrap = styled(Box)({
  '& .MuiFormControl-root': {
    width: '100%'
  }
})

const ProfileSettingsPage = ({ formData }) => {
  const [state, setState] = useState(formData)
  const [errors, setErrors] = useState({})
  const [showSnackbar, setShowSnackbar] = useState(false)

  function onFormSubmit() {
    const formData = {}
    state.map((field) => (formData[field.name] = field.value))

    API_POST(COURSEFLOW_APP.config.json_api_paths.update_profile, formData)
      .then(() => setShowSnackbar(true))
      .catch((error) => setErrors(error.data.errors))
  }

  function onSnackbarClose() {
    setShowSnackbar(false)
  }

  // loop through all the fields and generate appropriate MUI input element
  const inputFields = state.map((field, idx) => {
    const hasError = errors[field.name]
    const errorText = hasError && errors[field.name][0]

    switch (field.type) {
      case 'text':
        return (
          <Box key={idx} sx={{ mb: 4 }}>
            <FormControl>
              <TextField
                variant="standard"
                required={field.required}
                name={field.name}
                label={field.label}
                value={field.value}
                error={hasError}
                helperText={errorText}
                onChange={(e) => {
                  const newFieldsState = [...state]
                  newFieldsState[idx].value = e.target.value
                  const newErrors = { ...errors }
                  delete newErrors[field.name]
                  setErrors(newErrors)
                  setState(newFieldsState)
                }}
              />
            </FormControl>
          </Box>
        )
      case 'radio':
        return (
          <Box key={idx} sx={{ mb: 8 }}>
            <FormControl error={hasError}>
              <FormLabel id={`radio-label-{idx}`}>{field.label}</FormLabel>
              <RadioGroup
                aria-labelledby={`radio-label-{idx}`}
                value={field.value}
                name={field.name}
                onChange={(e) => {
                  const newFieldsState = [...state]
                  newFieldsState[idx].value = e.target.value
                  const newErrors = { ...errors }
                  delete newErrors[field.name]
                  setErrors(newErrors)
                  setState(newFieldsState)
                }}
              >
                {field.options.map((option, idy) => (
                  <FormControlLabel
                    key={idy}
                    value={option.value}
                    label={option.label}
                    control={<Radio />}
                  />
                ))}
              </RadioGroup>
              {errorText && <FormHelperText>{errorText}</FormHelperText>}
            </FormControl>
          </Box>
        )
    }

    // for any unsupported input types, we just return nothing
    return
  })

  return (
    <OuterContentWrap narrow>
      <PageTitle>
        <Typography variant="h1">
          {COURSEFLOW_APP.strings.profile_settings}
        </Typography>
      </PageTitle>

      <FormWrap component="form" noValidate autoComplete="off">
        {inputFields}
        <Box>
          <Button
            variant="contained"
            onClick={onFormSubmit}
            disabled={showSnackbar || Object.keys(errors).length > 0}
          >
            {COURSEFLOW_APP.strings.update_profile}
          </Button>
        </Box>
      </FormWrap>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={5000}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        onClose={onSnackbarClose}
      >
        <Alert onClose={onSnackbarClose} variant="filled" severity="success">
          {COURSEFLOW_APP.strings.update_profile_success}
        </Alert>
      </Snackbar>
    </OuterContentWrap>
  )
}

export default ProfileSettingsPage
