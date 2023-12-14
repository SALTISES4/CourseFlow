import React from 'react'
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

const ProfileSettingsPage = () => {
  const [apiData, loading, error] = useApi(config.json_api_paths.update_profile)

  if (loading || error) {
    return null
  }

  console.log('apiData', apiData)

  return (
    <OuterContentWrap narrow>
      <PageTitle>
        <Typography variant="h1">
          {COURSEFLOW_APP.strings.profile_settings}
        </Typography>
      </PageTitle>

      <Box component="form" noValidate autoComplete="off">
        <div>
          <FormControl>
            <TextField
              required
              label="First name"
              variant="standard"
              value="John"
            />
          </FormControl>
        </div>

        <div>
          <FormControl>
            <TextField
              required
              label="Last name"
              variant="standard"
              value="Doe"
            />
          </FormControl>
        </div>

        <div>
          <FormControl>
            <FormLabel id="language-label">Language preferences</FormLabel>
            <RadioGroup
              aria-labelledby="language-label"
              defaultValue="en"
              name="language"
            >
              <FormControlLabel
                value="en"
                control={<Radio />}
                label="English"
              />
              <FormControlLabel value="fr" control={<Radio />} label="French" />
            </RadioGroup>
          </FormControl>
        </div>

        <div>
          <Button variant="contained">Update profile</Button>
        </div>
      </Box>
    </OuterContentWrap>
  )
}

export default ProfileSettingsPage
