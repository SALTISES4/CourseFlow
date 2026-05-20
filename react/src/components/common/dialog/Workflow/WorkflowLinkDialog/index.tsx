import { searchLibrary } from '@cf/api/gen'
import {
  selectGraphByUuid,
  selectNodeByUuid
} from '@cf/features/graph/state/selectors/canonical.selectors'
import { linkNodeWorkflow } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { ELibraryObject } from '@cf/HTTP/XMLHTTP/types/entity'
import { formatLibraryObjects } from '@cf/utility/marshalling/libraryCards'
import {
  buildLibrarySearchRequestBody,
  transformLibrarySearchResponseToLegacy
} from '@cf/utility/marshalling/librarySearch'
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
  workflowData: ELibraryObject[] | null
  filteredWorkflows: ReturnType<typeof formatLibraryObjects> | null
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
  const filteredResults =
    filteredWorkflows ?? formatLibraryObjects(workflowData ?? [])

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

    const linked = workflowData?.find((w) => w.uuid === selected)
    void dispatch(
      linkNodeWorkflow({
        graphUuid,
        nodeUuid: payload.uuid,
        workflowUuid: selected,
        linkedWorkflow: linked
          ? { uuid: linked.uuid, title: linked.title }
          : { uuid: selected, title: '' }
      })
    )

    onClose()
  }, [dispatch, graphUuid, onClose, payload, selected, workflowData])

  const onSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
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

          const filtered: typeof workflowData = fuse
            .search(value)
            .map((result) => result.item)

          draft.filteredWorkflows = formatLibraryObjects(filtered)
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
            filters: { contentType: 'workflow' }
          }) as never,
          throwOnError: true
        })
        if (cancelled) {
          return
        }
        const legacy = transformLibrarySearchResponseToLegacy(data)
        setState(
          produce((draft) => {
            draft.workflowData = legacy.dataPackage.items
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
          {!loading && !loadError && workflowData !== null && (
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
