import { ChangeEvent } from 'react'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Box from '@mui/material/Box'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import DeleteIcon from '@mui/icons-material/Delete'
import AddCircleIcon from '@mui/icons-material/AddCircle'

import { StyledAccordion, AdvancedLabel } from './styles'
import { StyledForm } from '../../../styles'
import { OnUpdateType } from '../../'
import { ObjectSet } from '@cfModule/types/common'

type PropsType = {
  expanded: boolean
  toggleExpanded: () => void
  sets: ObjectSet[]
  onUpdate: (props: OnUpdateType) => void
  onAddNew: () => void
}

function ObjectSets({
  expanded,
  toggleExpanded,
  sets,
  onAddNew,
  onUpdate
}: PropsType) {
  // make sure there's at least one empty object set
  const objectSets: ObjectSet[] = sets.length ? sets : [{ id: '', title: '' }]

  return (
    <StyledAccordion expanded={expanded}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        onClick={toggleExpanded}
      >
        <Stack direction="row" spacing={2}>
          <Typography>{window.gettext('Object sets')}</Typography>
          <AdvancedLabel
            label={window.gettext('Advanced feature')}
            variant="filled"
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {window.gettext(
            'Define categories for types outcomes or streams of nodes for your project.'
          )}
        </Typography>
        <StyledForm>
          {objectSets.map((set, index) => (
            <Stack key={index} direction="row" spacing={2}>
              <FormControl variant="standard" fullWidth>
                <InputLabel>{window.gettext('Type')}</InputLabel>
                <Select
                  value={set.id.toString()}
                  onChange={(event: SelectChangeEvent) =>
                    onUpdate({
                      index,
                      newVal: {
                        id: event.target.value,
                        title: set.title
                      }
                    })
                  }
                  label="Type"
                >
                  <MenuItem value="1">Project outcome</MenuItem>
                  <MenuItem value="2">Something</MenuItem>
                  <MenuItem value="3">Entirely else</MenuItem>
                  <MenuItem value="4">Option 4</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={window.gettext('Label')}
                value={set.title}
                variant="standard"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  onUpdate({
                    index,
                    newVal: {
                      id: set.id,
                      title: event.target.value
                    }
                  })
                }}
                fullWidth
              />
              <Box sx={{ alignSelf: 'flex-end', flexShrink: 0 }}>
                {index === sets.length - 1 ? (
                  <IconButton color="primary" onClick={onAddNew}>
                    <AddCircleIcon />
                  </IconButton>
                ) : (
                  <IconButton
                    onClick={() =>
                      onUpdate({
                        index
                      })
                    }
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Stack>
          ))}
        </StyledForm>
      </AccordionDetails>
    </StyledAccordion>
  )
}

export default ObjectSets
