import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { ELibraryObject } from '@cf/HTTP/XMLHTTP/types/entity'
import { GridWrap } from '@cf/mui/helper'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import { _t } from '@cf/utility/Utility.class'
import { PropsType as ResultType } from '@cfComponents/cards/WorkflowCardDumb'
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
import Fuse from 'fuse.js'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useEffect, useState } from 'react'

type StateType = {
  selected: number | null
  workflowData: ReturnType<typeof formatLibraryObjects> | null
  filteredWorkflows: ReturnType<typeof formatLibraryObjects> | null
}

function NodeLinkWorkflowDialog() {
  const { payload, show, onClose } = useDialog(DialogMode.NODE_LINK_WORKFLOW)
  const [state, setState] = useState<StateType>({
    selected: null,
    workflowData: null,
    filteredWorkflows: null
  })

  const { workflowData, filteredWorkflows } = state
  const filteredResults = filteredWorkflows ?? workflowData

  const onDialogClose = useCallback(() => {
    onClose()
    setState({
      selected: null,
      workflowData: null,
      filteredWorkflows: null
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

  const onSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim()

      if (value === '') {
        return setState(
          produce((draft) => {
            draft.filteredWorkflows = null
          })
        )
      }

      setState(
        produce((draft) => {
          const fuse = new Fuse(workflowData, {
            keys: ['title']
          })

          const filtered: typeof workflowData = fuse
            .search(value)
            .map((result) => result.item)

          draft.filteredWorkflows = filtered
        })
      )
    },
    [workflowData]
  )

  useEffect(() => {
    if (workflowData === null && payload?.id) {
      getLinkedWorkflowMenuQuery(payload.id, (response) => {
        setState(
          produce((draft) => {
            const { allPublished, currentProject } = response.dataPackage
            const workflowsFavorites: ELibraryObject[] =
              allPublished.sections.reduce((acc, curr) => {
                return [...acc, ...curr.objects]
              }, [])
            const workflowsProject: ELibraryObject[] =
              currentProject.sections.reduce((acc, curr) => {
                return [...acc, ...curr.objects]
              }, [])

            draft.workflowData = formatLibraryObjects([
              ...workflowsFavorites,
              ...workflowsProject
            ])
          })
        )
      })
    }
  }, [workflowData, payload])

  if (workflowData === null) {
    return null
  }

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
            {filteredResults.map((item) => (
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
