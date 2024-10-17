import Alert from '@cfComponents/UIPrimitives/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { ChangeEvent, useCallback, useState } from 'react'

import {
  SidebarActions,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../../../styles'

type PropsType = {
  title: string
  placeholder: string
  alert: string
  onSave: (label: string) => void
  onCancel: () => void
}

const SaveAsTemplate = ({
  title,
  placeholder,
  alert,
  onSave,
  onCancel
}: PropsType) => {
  const [label, setLabel] = useState('')

  const onTemplateChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value)
  }, [])

  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          {title}
        </SidebarTitle>
        <Stack direction="column" gap={3}>
          <TextField
            required
            variant="outlined"
            label={placeholder}
            size="small"
            value={label}
            onChange={onTemplateChange}
          />

          <Alert sx={{ mb: 2 }} persistent subtitle={alert} />
        </Stack>
      </SidebarContent>
      <SidebarActions>
        <Button
          disabled={!label}
          variant="contained"
          onClick={() => onSave(label)}
        >
          Save as personal template
        </Button>
        <Button variant="contained" color="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </SidebarActions>
    </SidebarInnerWrap>
  )
}

export default SaveAsTemplate
