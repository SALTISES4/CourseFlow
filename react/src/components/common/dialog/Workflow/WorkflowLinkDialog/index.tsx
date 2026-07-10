import {
  LibraryContentTypeIn,
  LibraryItemOut,
  searchLibrary
} from '@cf/api/gen'
import {
  selectGraphByUuid,
  selectNodeByUuid
} from '@cf/features/graph/state/selectors/canonical.selectors'
import { linkNodeWorkflow } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import { buildLibrarySearchRequestBody } from '@cf/utility/marshalling/librarySearch'
import { _t } from '@cf/utility/Utility.class'
import WorkflowCardWrapper from '@cfComponents/cards/WorkflowCardWrapper'
import { StyledDialog } from '@cfComponents/dialog/styles'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { GridWrap } from '@cfMUI/helper'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { debounce } from '@mui/material/utils'
import Fuse from 'fuse.js'
import { produce } from 'immer'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type StateType = {
  selected: string | null
  workflowData: LibraryItemOut[] | null
  filteredWorkflows: LibraryItemOut[]
  loading: boolean
  loadError: boolean
}

function NodeLinkWorkflowDialog() {
  const dispatch = useDispatch()
  const { payload, show, onClose } = useDialog(DialogMode.NODE_LINK_WORKFLOW)
  const nodeSelector = useMemo(
    () => (payload?.uuid ? selectNodeByUuid(payload.uuid) : () => null),
    [payload?.uuid]
  )
  const node = useSelector(nodeSelector)
  const graphUuid = payload?.graphUuid ?? node?.graphUuid ?? ''
  const graphSelector = useMemo(
    () => (graphUuid ? selectGraphByUuid(graphUuid) : () => undefined),
    [graphUuid]
  )
  const graph = useSelector(graphSelector)
  const parentWorkflowType = graph?.workflowType

  const [state, setState] = useState<StateType>({
    selected: null,
    workflowData: null,
    filteredWorkflows: null,
    loading: false,
    loadError: false
  })

  const { selected, workflowData, filteredWorkflows, loading, loadError } =
    state
  const filteredResults = formatLibraryObjects(
    filteredWorkflows ?? workflowData
  )

  const onDialogClose = useCallback(() => {
    onClose()
    setState({
      selected: null,
      workflowData: null,
      filteredWorkflows: null,
      loading: false,
      loadError: false
    })
  }, [onClose])

  const onWorkflowSelect = useCallback((uuid: string) => {
    return () => {
      setState(
        produce((draft) => {
          draft.selected = uuid
        })
      )
    }
  }, [])

  const onSubmit = useCallback(() => {
    if (!payload?.uuid || !selected || !graphUuid) {
      return
    }

    // const linked = workflowData?.find((w) => w.uuid === selected)

    // TODO: implement
    console.log('TODO: linkNodeWorkflow submit', {
      uuid: payload?.uuid,
      workflowData
    })

    // dispatch(
    //   linkNodeWorkflow({
    //     graphUuid,
    //     nodeUuid: payload.uuid,
    //     workflowUuid: selected,
    //     linkedWorkflow: linked
    //       ? { uuid: linked.uuid, title: linked.title }
    //       : { uuid: selected, title: '' }
    //   })
    // )

    onClose()
  }, [graphUuid, payload?.uuid, selected, workflowData, onClose])

  const onSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      console.log('search changed to', e.target.value.trim())
      const value = e.target.value.trim()

      if (value === '' || !workflowData) {
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

          draft.filteredWorkflows = fuse
            .search(value)
            .map((result) => result.item)
        })
      )
    },
    [workflowData]
  )

  useEffect(() => {
    if (!show || workflowData !== null || !payload?.uuid) {
      return
    }

    let cancelled = false
    setState(
      produce((draft) => {
        draft.loading = true
        draft.loadError = false
      })
    )

    void (async () => {
      try {
        const { data } = await searchLibrary({
          body: buildLibrarySearchRequestBody({
            pagination: { page: 0, resultsPerPage: 100 },
            filters: { contentType: LibraryContentTypeIn.WORKFLOW }
          }) as never,
          throwOnError: true
        })
        if (cancelled) {
          return
        }
        setState(
          produce((draft) => {
            console.log('setting data to', data.items)
            draft.workflowData = data.items
            draft.loading = false
          })
        )
      } catch {
        if (!cancelled) {
          setState(
            produce((draft) => {
              draft.loading = false
              draft.loadError = true
            })
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [show, workflowData, payload?.uuid])

  return (
    <StyledDialog open={show} fullWidth maxWidth="lg" onClose={onDialogClose}>
      <DialogTitle>{_t('Select a workflow')}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ px: 6 }}>
          <TextField
            variant="standard"
            label="Search"
            fullWidth
            disabled={loading || loadError || workflowData === null}
            onChange={debounce(onSearchChange, 400)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          {loading && <Loader />}
          {loadError && (
            <Box sx={{ py: 4 }}>{_t('Could not load workflows.')}</Box>
          )}
          {!loading && !loadError && filteredResults && (
            <GridWrap sx={{ mt: 4 }}>
              {filteredResults.map((item) => (
                <WorkflowCardWrapper
                  key={`workflow_${item.uuid}`}
                  {...item}
                  isSelected={item.uuid === state.selected}
                  onClick={onWorkflowSelect(item.uuid)}
                />
              ))}
            </GridWrap>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onDialogClose}>
          {_t('Cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={!state.selected || !graphUuid}
          onClick={onSubmit}
        >
          {parentWorkflowType === 'program'
            ? _t('Link course')
            : parentWorkflowType === 'course'
              ? _t('Link activity')
              : _t('Link to node')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default NodeLinkWorkflowDialog
