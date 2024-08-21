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
import { object_sets_types } from '@cfConstants'

import { StyledAccordion, AdvancedLabel } from './styles'
import { StyledForm } from '../../../styles'
import { OnUpdateType } from '../..'
import { OBJECT_SET_TYPE, ObjectSetType } from '../../type'

type PropsType = {
  expanded: boolean
  toggleExpanded: () => void
  sets: ObjectSetType[]
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
  const objectSets: ObjectSetType[] = sets.length
    ? sets
    : [{ type: '' as OBJECT_SET_TYPE, label: '' }]

  const object_set_types = object_sets_types()
  const object_set_options = Object.keys(object_set_types).map((key) => ({
    value: key,
    label: object_set_types[key]
  }))

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
                  value={set.type}
                  onChange={(event: SelectChangeEvent) =>
                    onUpdate({
                      index,
                      newVal: {
                        type: event.target.value as OBJECT_SET_TYPE,
                        label: set.label
                      }
                    })
                  }
                  label="Type"
                >
                  {object_set_options.map((option, idx) => (
                    <MenuItem key={idx} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={window.gettext('Label')}
                value={set.label}
                variant="standard"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  onUpdate({
                    index,
                    newVal: {
                      type: set.type,
                      label: event.target.value
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
