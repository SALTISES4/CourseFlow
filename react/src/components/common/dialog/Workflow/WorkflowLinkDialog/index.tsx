import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { GridWrap } from '@cf/mui/helper'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/Utility.class'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import { StyledDialog } from '@cfComponents/dialog/styles'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { debounce } from '@mui/material/utils'
import { getLinkedWorkflowMenuQuery } from '@XMLHTTP/API/workflowObjects/workflow'
import { LinkedWorkflowMenuQueryResp } from '@XMLHTTP/types/query'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useEffect, useState } from 'react'

type StateType = {
  selected: number | null
  workflowData: LinkedWorkflowMenuQueryResp | null
}

function NodeLinkWorkflowDialog() {
  const { payload, show, onClose } = useDialog(DialogMode.NODE_LINK_WORKFLOW)
  const [state, setState] = useState<StateType>({
    selected: null,
    workflowData: null
  })

  const onDialogClose = useCallback(() => {
    onClose()
    setState({
      selected: null,
      workflowData: null
    })
  }, [onClose])

  const onWorkflowSelect = useCallback((id: number) => {
    return () => {
      setState(
        produce((draft) => {
          draft.selected = id
        })
      )
    }
  }, [])

  const onSubmit = useCallback(() => {
    console.log('submitted with', state.selected)
  }, [state.selected])

  const onSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    console.log('search changed to', value)
  }, [])

  useEffect(() => {
    if (state.workflowData === null && payload?.id) {
      getLinkedWorkflowMenuQuery(payload.id, (response) => {
        setState(
          produce((draft) => {
            draft.workflowData = response
          })
        )
      })
    }
  }, [state.workflowData, payload])

  if (state.workflowData === null) {
    return null
  }

  const { allPublished, currentProject } = state.workflowData.dataPackage

  const workflowsFavorites = allPublished.sections.reduce((acc, curr) => {
    return [...acc, ...curr.objects]
  }, [])

  const workflowsProject = currentProject.sections.reduce((acc, curr) => {
    return [...acc, ...curr.objects]
  }, [])

  const cards = formatLibraryObjects([
    ...workflowsFavorites,
    ...workflowsProject
  ])

  return (
    <StyledDialog open={show} fullWidth maxWidth="lg" onClose={onDialogClose}>
      <DialogTitle>{_t('Select a workflow')}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ px: 6 }}>
          <TextField
            variant="standard"
            label="Search"
            fullWidth
            onChange={debounce(onSearchChange, 400)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <GridWrap sx={{ mt: 4 }}>
            {cards.map((item) => (
              <WorkflowCardWrapper
                key={`workflow_${item.id}`}
                {...item}
                isSelected={item.id === state.selected}
                onClick={onWorkflowSelect(item.id)}
              />
            ))}
          </GridWrap>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onDialogClose}>
          {_t('Cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={!state.selected}
          onClick={onSubmit}
        >
          {_t('Link to node')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default NodeLinkWorkflowDialog
