import React, { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import useApi from '../../../hooks/useApi'
import { API_POST } from '../../../PostFunctions'
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
  const [formFields, setFormFields] = useState(null)
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

    API_POST(config.json_api_paths.update_profile, formData).then(
      (response) => {
        console.log(
          'API_POST\n',
          formData,
          '\nto\n',
          config.json_api_paths.update_profile,
          '\ngot\n',
          response
        )

        // and if successful, dispatch the action to update local state
        // TODO: implement some kind of success message notification
        alert('User details updated!')
      }
    )
  }

  if (loading || error || !formFields) {
    return null
  }

  // loop through all the fields and generate appropriate MUI input element
  const inputFields = formFields.map((field, idx) => {
    switch (field.type) {
      case 'text':
        return (
          <Box key={idx} sx={{ mb: 4 }}>
            <FormControl>
              <TextField
                required
                variant="standard"
                name={field.name}
                label={field.label}
                value={field.value}
                onChange={(e) => {
                  const newFieldsState = [...formFields]
                  newFieldsState[idx].value = e.target.value
                  setFormFields(newFieldsState)
                }}
              />
            </FormControl>
          </Box>
        )
      case 'radio':
        return (
          <Box key={idx} sx={{ mb: 8 }}>
            <FormControl>
              <FormLabel id={`radio-label-{idx}`}>{field.label}</FormLabel>
              <RadioGroup
                aria-labelledby={`radio-label-{idx}`}
                value={field.value}
                name={field.name}
                onChange={(e) => {
                  const newFieldsState = [...formFields]
                  newFieldsState[idx].value = e.target.value
                  setFormFields(newFieldsState)
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
          <Button variant="contained" onClick={onFormSubmit}>
            {COURSEFLOW_APP.strings.update_profile}
          </Button>
        </Box>
      </FormWrap>
    </OuterContentWrap>
  )
}

export default ProfileSettingsPage
