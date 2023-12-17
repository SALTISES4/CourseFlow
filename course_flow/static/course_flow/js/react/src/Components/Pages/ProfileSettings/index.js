import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import React, { useEffect, useState } from 'react'
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
import useApi from '../../../hooks/useApi'
import { API_POST } from '@XMLHTTP/PostFunctions'
import { OuterContentWrap } from '../../../mui/helper'
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
const ProfileSettingsPage = () => {
  const [errors, setErrors] = useState({})
  const [formFields, setFormFields] = useState(null)
  const [showSnackbar, setShowSnackbar] = useState(false)
  const [apiData, loading, error] = useApi(config.json_api_paths.update_profile)
  // after the apiData is loaded in, set it as state so it can be used internally
  useEffect(() => {
    if (!loading) {
      setFormFields(apiData.fields)
    }
  }, [loading])
  function onFormSubmit() {
    const formData = {}
    formFields.map((field) => (formData[field.name] = field.value))
    API_POST(config.json_api_paths.update_profile, formData)
      .then(() => setShowSnackbar(true))
      .catch((error) => setErrors(error.data.errors))
  }
  function onSnackbarClose() {
    setShowSnackbar(false)
  }
  if (loading || error || !formFields) {
    return null
  }
  // loop through all the fields and generate appropriate MUI input element
  const inputFields = formFields.map((field, idx) => {
    const hasError = errors[field.name]
    const errorText = hasError && errors[field.name][0]
    switch (field.type) {
      case 'text':
        return _jsx(
          Box,
          {
            sx: { mb: 4 },
            children: _jsx(FormControl, {
              children: _jsx(TextField, {
                variant: 'standard',
                required: field.required,
                name: field.name,
                label: field.label,
                value: field.value,
                error: hasError,
                helperText: errorText,
                onChange: (e) => {
                  const newFieldsState = [...formFields]
                  newFieldsState[idx].value = e.target.value
                  const newErrors = { ...errors }
                  delete newErrors[field.name]
                  setErrors(newErrors)
                  setFormFields(newFieldsState)
                }
              })
            })
          },
          idx
        )
      case 'radio':
        return _jsx(
          Box,
          {
            sx: { mb: 8 },
            children: _jsxs(FormControl, {
              error: hasError,
              children: [
                _jsx(FormLabel, {
                  id: `radio-label-{idx}`,
                  children: field.label
                }),
                _jsx(RadioGroup, {
                  'aria-labelledby': `radio-label-{idx}`,
                  value: field.value,
                  name: field.name,
                  onChange: (e) => {
                    const newFieldsState = [...formFields]
                    newFieldsState[idx].value = e.target.value
                    const newErrors = { ...errors }
                    delete newErrors[field.name]
                    setErrors(newErrors)
                    setFormFields(newFieldsState)
                  },
                  children: field.options.map((option, idy) =>
                    _jsx(
                      FormControlLabel,
                      {
                        value: option.value,
                        label: option.label,
                        control: _jsx(Radio, {})
                      },
                      idy
                    )
                  )
                }),
                errorText && _jsx(FormHelperText, { children: errorText })
              ]
            })
          },
          idx
        )
    }
    // for any unsupported input types, we just return nothing
    return
  })
  return _jsxs(OuterContentWrap, {
    narrow: true,
    children: [
      _jsx(PageTitle, {
        children: _jsx(Typography, {
          variant: 'h1',
          children: COURSEFLOW_APP.strings.profile_settings
        })
      }),
      _jsxs(FormWrap, {
        component: 'form',
        noValidate: true,
        autoComplete: 'off',
        children: [
          inputFields,
          _jsx(Box, {
            children: _jsx(Button, {
              variant: 'contained',
              onClick: onFormSubmit,
              disabled: showSnackbar || Object.keys(errors).length > 0,
              children: COURSEFLOW_APP.strings.update_profile
            })
          })
        ]
      }),
      _jsx(Snackbar, {
        open: showSnackbar,
        autoHideDuration: 5000,
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right'
        },
        onClose: onSnackbarClose,
        children: _jsx(Alert, {
          onClose: onSnackbarClose,
          variant: 'filled',
          severity: 'success',
          children: COURSEFLOW_APP.strings.update_profile_success
        })
      })
    ]
  })
}
export default ProfileSettingsPage
