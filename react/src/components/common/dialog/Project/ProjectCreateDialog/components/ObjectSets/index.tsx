import { StyledForm } from '@cf/components/common/dialog/styles'
import { _t } from '@cf/utility/utilityFunctions'
import { objectSetsTypes } from '@cfConstants'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ChangeEvent } from 'react'

import { AdvancedLabel, StyledAccordion } from './styles'
import { OnUpdateType } from '../..'
import { OBJECT_SET_TYPE, ObjectSetType } from '../../type'

type PropsType = {
  expanded: boolean
  toggleExpanded: () => void
  objectSets: ObjectSetType[]
  onUpdate: (props: OnUpdateType) => void
  onAddNew: () => void
}

function ObjectSets({
  expanded,
  toggleExpanded,
  objectSets,
  onAddNew,
  onUpdate
}: PropsType) {
  // make sure there's at least one empty object set
  const objectSetsFormatted: ObjectSetType[] = objectSets.length
    ? objectSets
    : [{ term: '' as OBJECT_SET_TYPE, title: '' }]

  const objectSetOptions = Object.keys(objectSetsTypes).map((key) => ({
    value: key,
    label: objectSetsTypes[key]
  }))

  return (
    <StyledAccordion expanded={expanded}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        onClick={toggleExpanded}
      >
        <Stack direction="row" spacing={2}>
          <Typography>{_t('Object sets')}</Typography>
          <AdvancedLabel label={_t('Advanced feature')} variant="filled" />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {_t(
            'Define categories for types outcomes or streams of nodes for your project.'
          )}
        </Typography>
        <StyledForm>
          {objectSetsFormatted.map((objectSet, index) => (
            <Stack key={index} direction="row" spacing={2}>
              <FormControl variant="standard" fullWidth>
                <InputLabel>{_t('Type')}</InputLabel>
                <Select
                  value={objectSet.term}
                  onChange={(event: SelectChangeEvent) =>
                    onUpdate({
                      index,
                      newVal: {
                        term: event.target.value as OBJECT_SET_TYPE,
                        title: objectSet.title
                      }
                    })
                  }
                  label="Type"
                >
                  {objectSetOptions.map((option, idx) => (
                    <MenuItem key={idx} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={_t('Label')}
                value={objectSet.title}
                variant="standard"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  onUpdate({
                    index,
                    newVal: {
                      term: objectSet.term,
                      title: event.target.value
                    }
                  })
                }}
                fullWidth
              />
              <Box sx={{ alignSelf: 'flex-end', flexShrink: 0 }}>
                {index === objectSets.length - 1 ? (
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
